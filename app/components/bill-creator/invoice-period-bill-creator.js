const _ = require('lodash');
const Promise = require('bluebird');
const { Types: { ObjectId } } = require('mongoose');
const moment = require('moment');
const { sum, minus } = require('../../utils/bigjs');
const { provideTransaction } = require('../../components/database/mongo/utils');
const BillCreator = require('./bill-creator');

const formatDate = (date, format = 'YYYY-MM-DD') => moment(date).format(format);
const PROVIDER_TASK_APPROVED_STATUS = 'approved';
const TAX_ID_FORMS = ['1099 Eligible', 'W-9'];
const ELIGIBLE_TAX_FORM = '1099 Eligible';
const SCHEDULER_TYPE = 'invoice-period-bill';
class InvoicePeriodBillCreator extends BillCreator {
  getAdjustmentServiceDetail(item, abilityExpenseAccount, totalAmount) {
    const difference = minus(item.providerTask.minCharge, totalAmount);
    return {
      expenseAccountNo: _.get(abilityExpenseAccount, 'expenseAccount.number', ''),
      taskAmount: difference,
      taskDescription: `${item.request.no} ${item.task.ability} ${item.langCombination} Minimum charge adjustment`,
      referenceNumber: item.request.referenceNumber,
      recipient: item.request.recipient,
      accountingDepartmentId: item.request.internalDepartment.accountingDepartmentId,
    };
  }

  async fetchVendorRequestsWithApprovedTasks() {
    const requestsWithApprovedTasks = await this.schema.Request.find({
      lspId: this.lsp._id,
      'workflows.tasks.providerTasks.status': 'approved',
      'workflows.tasks.providerTasks.billed': false,
      'workflows.tasks.providerTasks.provider._id': _.get(this.provider, '_id'),
      'internalDepartment._id': { $exists: true },
    }).lean();
    this.providerRequestsAndTasks = await this.buildApprovedTasksInfo(requestsWithApprovedTasks);
    return this.providerRequestsAndTasks;
  }

  async buildApprovedTasksInfo(requestsWithApprovedTasks) {
    const approvedTasks = [];
    await Promise.map(requestsWithApprovedTasks, async (request) => {
      this.logger.debug(`BillInvoicePeriodScheduler: Getting approved tasks from request ${_.get(request, '_id')}`);
      const internalDepartmentId = _.get(request, 'internalDepartment._id');
      request.internalDepartment = await this.schema.InternalDepartment.findOneWithDeleted({
        _id: new ObjectId(internalDepartmentId),
      });
      const companyDepRel = await this.schema.CompanyDepartmentRelationship.findOneWithDeleted({
        company: _.get(request, 'company._id'),
        internalDepartment: _.get(request, 'internalDepartment._id'),
        acceptInvoicePerPeriod: true,
      });
      if (_.isNil(companyDepRel)) {
        this.logger.debug(`BillInvoicePeriodScheduler: Company dep relationship for company ${_.get(request, 'company._id')} and department ${_.get(request, 'internalDepartment._id')} was not found for provider ${this.provider._id.toString()}`);
        return;
      }
      const lastClosedPeriodDate = this.mockableMoment.getDateObject().set('date', companyDepRel.billCreationDay).startOf('day');
      if (this.mockableMoment.getDateObject().date() < companyDepRel.billCreationDay) {
        lastClosedPeriodDate.add(-1, 'month');
      }
      this.logger.debug(`BillInvoicePeriodScheduler: Company dep rel id is ${companyDepRel.id}. Last closed period date is ${lastClosedPeriodDate} for provider ${this.provider._id}`);
      request.workflows.forEach((workflow) => {
        const langCombination = `${_.get(workflow, 'srcLang.name', '')} - ${_.get(workflow, 'tgtLang.name', '')}`;
        workflow.tasks.forEach((task) => {
          task.providerTasks.forEach((providerTask) => {
            if (_.get(providerTask, 'billed', false)) return;
            this.logger.debug(`BillInvoicePeriodScheduler: Processing provider task id ${providerTask._id} for provider ${_.get(this.provider, '_id', '').toString()}`);
            const shouldGenerateBillForProviderTask = _.get(providerTask, 'provider._id', '').toString() === this.provider.id
              && providerTask.status === PROVIDER_TASK_APPROVED_STATUS
              && lastClosedPeriodDate.isAfter(providerTask.approvedAt);
            if (shouldGenerateBillForProviderTask) {
              approvedTasks.push({
                request,
                workflow,
                task,
                providerTask,
                langCombination,
                companyDepRel,
              });
            }
          });
        });
      });
    }, { concurrency: 1 });
    this.logger.debug(`BillInvoicePeriodScheduler: Found ${approvedTasks.length} for provider ${this.provider.id}`);
    return approvedTasks;
  }

  async validateAndStampCreationErrors(providerTasks) {
    let missingFieldsMessage = '';
    const failedProviderTasks = [];
    let billCreationError = '';
    await Promise.mapSeries((Object.keys(providerTasks)), async (taskKey) => {
      const monthTasks = providerTasks[taskKey];
      if (_.isEmpty(monthTasks)) return;
      await Promise.map(monthTasks, async (item) => {
        const ability = await this.schema.Ability.findOneWithDeleted({
          name: item.task.ability,
          lspId: this.lspId,
        });
        const abilityExpenseAccount = await this.getAbilityExpenseAccount(_.get(ability, '_id'));
        const expenseAccount = _.get(abilityExpenseAccount, 'expenseAccount', {});
        const isMissingExpenseAccount = _.isNil(abilityExpenseAccount);
        const abilityName = _.get(ability, 'name', '');
        if (isMissingExpenseAccount) {
          missingFieldsMessage = `Missing Expense account for ${abilityName}`;
        } else if (_.get(abilityExpenseAccount, 'deleted', '')) {
          missingFieldsMessage = `Missing Expense account number ${expenseAccount.number} - ${expenseAccount.costType} for ${abilityName}`;
        } else {
          missingFieldsMessage = '';
        }
        const internalDepartmentName = _.get(item.request, 'internalDepartment.name', '');
        const isDepartmentDeleted = item.request.internalDepartment.deleted;
        if (isDepartmentDeleted) {
          const departmentInactiveMessage = `Missing ${internalDepartmentName}`;
          if (_.isEmpty(missingFieldsMessage)) {
            missingFieldsMessage = departmentInactiveMessage;
          } else {
            missingFieldsMessage = `${missingFieldsMessage} and ${departmentInactiveMessage}`;
          }
          missingFieldsMessage = missingFieldsMessage.concat(` with Accounting Department ID = ${item.request.internalDepartment.accountingDepartmentId}`);
        }
        if (!isMissingExpenseAccount && !isDepartmentDeleted) {
          billCreationError = '';
        } else {
          const taskApprovedAtDate = moment(item.providerTask.approvedAt);
          const period = this.getTaskPeriod(taskApprovedAtDate, _.get(item, 'companyDepRel.billCreationDay'));
          billCreationError = `
            The bill for the period ${period} for provider "${this.provider.firstName} ${this.provider.lastName}"
            could not be created because "${item.task.ability}" task
            with ID ${_.get(item, 'providerTask._id', '').toString()} in request ${_.get(item, 'request._id', '').toString()} is missing the following mandatory fields: ${missingFieldsMessage}`;
          failedProviderTasks.push(_.get(item, 'providerTask._id', '').toString());
        }
        await this.updateProviderTaskErrors(item, billCreationError);
      });
    });
    return failedProviderTasks;
  }

  async buildBillSchema(items, endDate) {
    const requestsIdNoList = this.buildRequestsIdNoListFromItems(items);
    let serviceDetails = [];
    this.logger.debug(`invoice-periodic-bill-creator: Building bill from provider tasks for vendor ${_.get(this, 'provider.id')}`);
    await Promise.map(items, async (item) => {
      const ability = await this.schema.Ability.findOneWithDeleted({
        name: item.task.ability,
        lspId: this.lspId,
      });
      const abilityExpenseAccount = await this.getAbilityExpenseAccount(_.get(ability, '_id'));
      const providerTaskServiceDetails = _.map(
        item.providerTask.billDetails,
        billDetail => this.getServiceDetail(billDetail, abilityExpenseAccount, item),
      );
      serviceDetails = serviceDetails.concat(providerTaskServiceDetails);
      const totalAmount = _.reduce(
        providerTaskServiceDetails,
        (amount, billItem) => sum(amount, billItem.taskAmount),
        0,
      );
      if (_.toNumber(item.providerTask.minCharge) > _.toNumber(totalAmount)) {
        serviceDetails.push(
          this.getAdjustmentServiceDetail(item, abilityExpenseAccount, totalAmount),
        );
      }
    }, { concurrency: 1 });
    const vendorBillingInformation = _.get(this.provider, 'vendorDetails.billingInformation');
    const taxForms = _.get(vendorBillingInformation, 'taxForm', []);
    const taxFormsInDb = await this.schema.TaxForm.find({
      _id: { $in: taxForms },
    }, 'name');
    const startDate = moment(endDate).subtract('1', 'months');
    const startDateClone2 = moment(endDate).subtract('1', 'months');
    this.logger.debug(`invoice-periodic-bill-creator: Succesfully created bill for vendor ${_.get(this, 'provider.id')}`);
    const glPostingDate = startDateClone2.endOf('month').toDate();
    return {
      date: this.mockableMoment.getDateObject().toDate(),
      billStartDate: startDate.toDate(),
      billEndDate: endDate.toDate(),
      dueDate: this.mockableMoment.getDateObject().add(vendorBillingInformation.billingTerms.days, 'd').toDate(),
      totalAmount: vendorBillingInformation.flatRateAmount,
      glPostingDate,
      lspId: this.lspId,
      requests: requestsIdNoList,
      siConnector: {
        isMocked: requestsIdNoList.some(r => r.isMocked) && !this.isProd,
        isSynced: false,
        error: null,
      },
      vendor: _.get(this, 'provider._id'),
      providerTasksIdList: this.buildProviderTaskIdsFromItems(items),
      billOnHold: vendorBillingInformation.billOnHold,
      serviceDetails,
      hasTaxIdForms: taxFormsInDb.some(t => TAX_ID_FORMS.includes(t.name)),
      has1099EligibleForm: taxFormsInDb.some(t => ELIGIBLE_TAX_FORM.includes(t.name)),
      schedulerType: SCHEDULER_TYPE,
    };
  }

  async buildBillFromProviderTasks(providerTasks, companyDepRelId, periodEndDate) {
    this.logger.debug(`invoice-periodic-bill-creator: buildBillFromProviderTasks for vendor ${_.get(this, 'provider.id')}`);
    const billCreationDate = moment(periodEndDate, 'YYYY-MM-DD').utc().startOf('day');
    this.logger.debug(`invoice-periodic-bill-creator: Building bill schema for vendor ${_.get(this, 'provider.id')}`);
    const newBill = await this.buildBillSchema(providerTasks, billCreationDate);
    this.logger.debug(`invoice-periodic-bill-creator: buildBillFromProviderTasks. Succesfully created bill for vendor ${_.get(this, 'provider.id')}`);
    return newBill;
  }

  buildTaskPeriods(tasks) {
    const tasksByPeriod = {};
    _.each(tasks, (t) => {
      const billCreationDay = t.companyDepRel.billCreationDay - 1;
      let periodStartDate;
      let periodEndDate;
      if (moment(t.providerTask.approvedAt).date() <= billCreationDay) {
        periodStartDate = moment(t.providerTask.approvedAt).subtract(1, 'months').startOf('month').add(billCreationDay, 'days');
        periodEndDate = moment(t.providerTask.approvedAt).startOf('month').add(billCreationDay - 1, 'days');
      } else {
        periodStartDate = moment(t.providerTask.approvedAt).startOf('month').add(billCreationDay, 'days');
        periodEndDate = moment(t.providerTask.approvedAt).endOf('month').add(billCreationDay, 'days').endOf('day');
      }
      const periodKey = `${formatDate(periodStartDate)}:${formatDate(periodEndDate)}`;
      const taskApprovedAtDate = moment(formatDate(t.providerTask.approvedAt), 'YYYY-MM-DD');
      if (taskApprovedAtDate.isSameOrAfter(periodStartDate) &&
        taskApprovedAtDate.isSameOrBefore(periodEndDate)) {
        if (!_.has(tasksByPeriod, periodKey)) {
          tasksByPeriod[periodKey] = [t];
        } else {
          tasksByPeriod[periodKey].push(t);
        }
      }
    });
    return tasksByPeriod;
  }

  async buildBillsFromTasks(tasksByPeriod, companyDepRelId) {
    const billsToCreate = [];
    await Promise.map(Object.keys(tasksByPeriod), async (taskPeriod) => {
      const billTasks = tasksByPeriod[taskPeriod];
      this.logger.debug(`invoice-periodic-bill-creator: Found ${tasksByPeriod.length} tasks for period ${taskPeriod} for vendor ${_.get(this, 'provider.id')}`);
      const periodEndDate = taskPeriod.split(':')[1];
      this.logger.debug(`invoice-periodic-bill-creator: Building bill for ${_.get(this, 'provider.id')}. Bill period: ${taskPeriod}`);
      if (!_.isEmpty(billTasks)) {
        this.logger.debug(`invoice-periodic-bill-creator: Adding bill for ${_.get(this, 'provider.id')}. Bill period: ${taskPeriod}`);
        const bill = await this.buildBillFromProviderTasks(billTasks, companyDepRelId,
          periodEndDate);
        this.logger.debug(`invoice-periodic-bill-creator: Pushing bill for ${_.get(this, 'provider.id')}`);
        billsToCreate.push(bill);
      }
    });
    return billsToCreate;
  }

  async createDbBills(billsToCreate) {
    const createdBills = [];
    if (!_.isEmpty(billsToCreate)) {
      await provideTransaction(async (session) => {
        await Promise.mapSeries((billsToCreate), async (bill) => {
          // Schedule the next processing iteration
          await new Promise(resolve => setTimeout(resolve, 0));
          await this.checkForDuplicates(bill);
          const newBill = this.schema.Bill(bill);
          this.logger.debug(`invoice-periodic-bill-creator: Calling bill.save() for provider ${_.get(this, 'provider.id')}`);
          await newBill.save({ session });
          this.logger.debug(`invoice-periodic-bill-creator: Successfully updated balances for vendor ${_.get(this, 'provider.id')}`);
          await this.updateRequests(newBill, session);
          this.logger.debug(`invoice-periodic-bill-creator: Accumulating created bills for vendor ${_.get(this, 'provider.id')}`);
          createdBills.push(newBill);
        });
        await this.updateVendorBalances(createdBills, session);
      }).catch((err) => {
        this.logger.debug(`Error creating bills for vendor ${this.provider._id}`);
        if (_.get(err, 'errmsg', '').match(this.duplicatedBillErrorMessage)) {
          throw err;
        }
        throw err;
      });
    }
    return createdBills;
  }

  async createBills() {
    this.logger.debug(`invoice-periodic-bill-creator: creating bills for vendor ${_.get(this, 'provider.id')}`);
    let billsToCreate = [];
    this.logger.debug(`invoice-periodic-bill-creator: Grouping provider tasks by month and company department for vendor ${_.get(this, 'provider.id')}`);
    const providerTasksByCompanyDeptRelationShip = _.groupBy(this.providerRequestsAndTasks,
      (t => _.get(t, 'companyDepRel.id')));
    const failedProviderTasks = await this.validateAndStampCreationErrors(
      providerTasksByCompanyDeptRelationShip);
    if (!_.isEmpty(failedProviderTasks)) {
      this.logger.debug(`invoice-periodic-bill-creator: Found errors before creating bills for vendor ${_.get(this, 'provider.id')}`);
      return [];
    }
    if (!_.isEmpty(providerTasksByCompanyDeptRelationShip)) {
      this.logger.debug(`invoice-periodic-bill-creator: Found ${providerTasksByCompanyDeptRelationShip.length} tasks grouped by company department relation ship id`);
      await Promise.map(Object.keys(providerTasksByCompanyDeptRelationShip),
        async (companyDepRelId) => {
          const tasks = providerTasksByCompanyDeptRelationShip[companyDepRelId];
          const tasksByPeriod = this.buildTaskPeriods(tasks);
          this.logger.debug(`invoice-periodic-bill-creator: Found ${tasksByPeriod.length} tasks from different periods for vendor ${_.get(this, 'provider.id')}`);
          const billsToBeCreated = await this.buildBillsFromTasks(tasksByPeriod, companyDepRelId);
          billsToCreate = billsToCreate.concat(billsToBeCreated);
        });
      this.logger.debug(`invoice-periodic-bill-creator: Stamping ${billsToCreate.length} bills into db for provider ${_.get(this, 'provider.id')}`);
      const createdBills = await this.createDbBills(billsToCreate);
      this.logger.debug(`invoice-periodic-bill-creator: Succesfully created ${createdBills.length} bills for vendor ${_.get(this, 'provider.id')}`);
      return createdBills;
    }
  }
}

module.exports = InvoicePeriodBillCreator;
