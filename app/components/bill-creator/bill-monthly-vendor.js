const _ = require('lodash');
const Promise = require('bluebird');
const { Types: { ObjectId } } = require('mongoose');
const moment = require('moment');
const { sum, minus } = require('../../utils/bigjs');
const { formatDate } = require('../../utils/date');
const { provideTransaction } = require('../database/mongo/utils');
const BillCreator = require('./bill-creator');

const PROVIDER_TASK_APPROVED_STATUS = 'approved';
const TAX_ID_FORMS = ['1099 Eligible', 'W-9'];
const ELIGIBLE_TAX_FORM = '1099 Eligible';
const HALF_MONTH_DAY = 14;
const SCHEDULER_TYPE = 'bill-monthly-vendor';

class BillMonthlyVendorCreator extends BillCreator {
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
      request.workflows.forEach((workflow) => {
        const langCombination = `${_.get(workflow, 'srcLang.name', '')} - ${_.get(workflow, 'tgtLang.name', '')}`;
        workflow.tasks.forEach((task) => {
          task.providerTasks.forEach((providerTask) => {
            if (_.get(providerTask, 'billed', false)) return;
            this.logger.debug(`BillInvoicePeriodScheduler: Processing provider task id ${providerTask._id} for provider ${_.get(this.provider, '_id', '').toString()}`);
            const shouldGenerateBillForProviderTask = _.get(providerTask, 'provider._id', '').toString() === this.provider.id
              && providerTask.status === PROVIDER_TASK_APPROVED_STATUS
              && this.isTaskApprovedBeforeClosedPeriod(providerTask.approvedAt);
            if (shouldGenerateBillForProviderTask) {
              approvedTasks.push({
                request,
                workflow,
                task,
                providerTask,
                langCombination,
              });
            }
          });
        });
      });
    }, { concurrency: 1 });
    this.logger.debug(`BillInvoicePeriodScheduler: Found ${approvedTasks.length} for provider ${this.provider.id}`);
    return approvedTasks;
  }

  isTaskApprovedBeforeClosedPeriod(providerTaskApprovedAt) {
    const billCreationDay = _.get(this, 'provider.vendorDetails.billingInformation.billCreationDay');
    if (_.isNil(billCreationDay)) {
      this.logger.debug(`BillInvoicePeriodScheduler: Bill creation day was not set at vendor profile for provider ${this.provider._id}`);
      throw new Error('Bill creation day was not set at vendor profile');
    }
    const lastClosedPeriodDate = this.mockableMoment.getDateObject().set('date', billCreationDay).startOf('day');
    if (this.mockableMoment.getDateObject().date() < billCreationDay) {
      lastClosedPeriodDate.add(-1, 'month');
    }
    this.logger.debug(`BillInvoicePeriodScheduler: Last closed period date is ${lastClosedPeriodDate} for provider ${this.provider._id}`);
    return lastClosedPeriodDate.isSameOrAfter(providerTaskApprovedAt);
  }

  async validateAndStampCreationErrors() {
    let missingFieldsMessage = '';
    const failedProviderTasks = [];
    let billCreationError = '';
    if (_.isEmpty(this.providerRequestsAndTasks)) return;
    await Promise.map(this.providerRequestsAndTasks, async (item) => {
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
        const period = this.getTaskPeriod(
          taskApprovedAtDate,
          this.provider.vendorDetails.billingInformation.billCreationDay,
        );
        billCreationError = `
          The bill for the period ${period} for provider "${this.provider.firstName} ${this.provider.lastName}"
          could not be created because "${item.task.ability}" task
          with ID ${_.get(item, 'providerTask._id', '').toString()} in request ${_.get(item, 'request._id', '').toString()} is missing the following mandatory fields: ${missingFieldsMessage}`;
        failedProviderTasks.push(_.get(item, 'providerTask._id', '').toString());
      }
      await this.updateProviderTaskErrors(item, billCreationError);
    });
    return failedProviderTasks;
  }

  async buildBillSchema(items, endDate) {
    const requestsIdNoList = this.buildRequestsIdNoListFromItems(items);
    let serviceDetails = [];
    this.logger.debug(`monthly-bill-vendor-creator: Building bill from provider tasks for vendor ${_.get(this, 'provider.id')}`);
    await Promise.map(items, async (item) => {
      const ability = await this.schema.Ability.findOneWithDeleted({
        name: item.task.ability,
        lspId: this.lspId,
      });
      const abilityExpenseAccount = await this.getAbilityExpenseAccount(_.get(ability, '_id'));
      const providerTaskServiceDetails = _.map(
        item.providerTask.billDetails,
        (billDetail) => this.getServiceDetail(billDetail, abilityExpenseAccount, item),
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
    this.logger.debug(`monthly-bill-vendor-creator: Succesfully created bill for vendor ${_.get(this, 'provider.id')}`);
    const glPostingDate = this.getGlPostingDate(endDate);
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
        isMocked: requestsIdNoList.some((r) => r.isMocked) && !this.isProd,
        isSynced: false,
        error: null,
      },
      vendor: _.get(this, 'provider._id'),
      providerTasksIdList: this.buildProviderTaskIdsFromItems(items),
      billOnHold: vendorBillingInformation.billOnHold,
      serviceDetails,
      hasTaxIdForms: taxFormsInDb.some((t) => TAX_ID_FORMS.includes(t.name)),
      has1099EligibleForm: taxFormsInDb.some((t) => ELIGIBLE_TAX_FORM.includes(t.name)),
      schedulerType: SCHEDULER_TYPE,
    };
  }

  getGlPostingDate(endDate) {
    if (this.provider.vendorDetails.billingInformation.billCreationDay <= HALF_MONTH_DAY) {
      return moment(endDate).subtract('1', 'months').endOf('month').toDate();
    }
    return moment(endDate).endOf('month').toDate();
  }

  async buildBillFromProviderTasks(providerTasks, periodEndDate) {
    this.logger.debug(`monthly-bill-vendor-creator: buildBillFromProviderTasks for vendor ${_.get(this, 'provider.id')}`);
    const billCreationDate = moment(periodEndDate, 'YYYY-MM-DD').utc().startOf('day');
    this.logger.debug(`monthly-bill-vendor-creator: Building bill schema for vendor ${_.get(this, 'provider.id')}`);
    const newBill = await this.buildBillSchema(providerTasks, billCreationDate);
    this.logger.debug(`monthly-bill-vendor-creator: buildBillFromProviderTasks. Succesfully created bill for vendor ${_.get(this, 'provider.id')}`);
    return newBill;
  }

  buildTaskPeriods(tasks) {
    const tasksByPeriod = {};
    _.each(tasks, (t) => {
      const billCreationDay = this.provider.vendorDetails.billingInformation.billCreationDay - 1;
      let billPeriodStartDate;
      let billPeriodEndDate;
      const vendorPeriodStartDate = moment(this.lsp.vendorPaymentPeriodStartDate).utc().startOf('day');
      if (moment(t.providerTask.approvedAt).date() <= billCreationDay) {
        billPeriodStartDate = moment(t.providerTask.approvedAt).subtract(1, 'months').startOf('month').add(billCreationDay, 'days');
        billPeriodEndDate = moment(t.providerTask.approvedAt).startOf('month').add(billCreationDay - 1, 'days');
      } else {
        billPeriodStartDate = moment(t.providerTask.approvedAt).startOf('month').add(billCreationDay, 'days');
        billPeriodEndDate = moment(t.providerTask.approvedAt).endOf('month').add(billCreationDay, 'days').endOf('day');
      }
      const periodKey = `${formatDate(billPeriodStartDate)}:${formatDate(billPeriodEndDate)}`;
      const taskApprovedAtDate = moment(formatDate(t.providerTask.approvedAt), 'YYYY-MM-DD');
      if (taskApprovedAtDate.isSameOrAfter(billPeriodStartDate)
        && taskApprovedAtDate.isSameOrBefore(billPeriodEndDate)
        && taskApprovedAtDate.isSameOrAfter(vendorPeriodStartDate)
      ) {
        if (!_.has(tasksByPeriod, periodKey)) {
          tasksByPeriod[periodKey] = [t];
        } else {
          tasksByPeriod[periodKey].push(t);
        }
      }
    });
    return tasksByPeriod;
  }

  async buildBillsFromTasks(tasksByPeriod) {
    const billsToCreate = [];
    await Promise.map(Object.keys(tasksByPeriod), async (taskPeriod) => {
      const billTasks = tasksByPeriod[taskPeriod];
      this.logger.debug(`monthly-bill-vendor-creator: Found ${tasksByPeriod.length} tasks for period ${taskPeriod} for vendor ${_.get(this, 'provider.id')}`);
      const periodEndDate = taskPeriod.split(':')[1];
      this.logger.debug(`monthly-bill-vendor-creator: Building bill for ${_.get(this, 'provider.id')}. Bill period: ${taskPeriod}`);
      if (!_.isEmpty(billTasks)) {
        this.logger.debug(`monthly-bill-vendor-creator: Adding bill for ${_.get(this, 'provider.id')}. Bill period: ${taskPeriod}`);
        const bill = await this.buildBillFromProviderTasks(billTasks, periodEndDate);
        this.logger.debug(`monthly-bill-vendor-creator: Pushing bill for ${_.get(this, 'provider.id')}`);
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
          await new Promise((resolve) => setTimeout(resolve, 0));
          await this.checkForDuplicates(bill);
          const newBill = this.schema.Bill(bill);
          this.logger.debug(`monthly-bill-vendor-creator: Calling bill.save() for provider ${_.get(this, 'provider.id')}`);
          await newBill.save({ session });
          this.logger.debug(`monthly-bill-vendor-creator: Successfully updated balances for vendor ${_.get(this, 'provider.id')}`);
          await this.updateRequests(newBill, session);
          this.logger.debug(`monthly-bill-vendor-creator: Accumulating created bills for vendor ${_.get(this, 'provider.id')}`);
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
    this.logger.debug(`monthly-bill-vendor-creator: creating bills for vendor ${_.get(this, 'provider.id')}`);
    let billsToCreate = [];
    this.logger.debug(`monthly-bill-vendor-creator: Grouping provider tasks by month and company department for vendor ${_.get(this, 'provider.id')}`);
    const failedProviderTasks = await this.validateAndStampCreationErrors();
    if (!_.isEmpty(failedProviderTasks)) {
      this.logger.debug(`monthly-bill-vendor-creator: Found errors before creating bills for vendor ${_.get(this, 'provider.id')}`);
      return [];
    }
    if (!_.isEmpty(this.providerRequestsAndTasks)) {
      this.logger.debug(`monthly-bill-vendor-creator: Found ${this.providerRequestsAndTasks.length} tasks grouped by company department relation ship id`);
      const tasks = this.providerRequestsAndTasks;
      const tasksByPeriod = this.buildTaskPeriods(tasks);
      this.logger.debug(`monthly-bill-vendor-creator: Found ${tasksByPeriod.length} tasks from different periods for vendor ${_.get(this, 'provider.id')}`);
      const billsToBeCreated = await this.buildBillsFromTasks(tasksByPeriod);
      billsToCreate = billsToCreate.concat(billsToBeCreated);
      this.logger.debug(`monthly-bill-vendor-creator: Stamping ${billsToCreate.length} bills into db for provider ${_.get(this, 'provider.id')}`);
      const createdBills = await this.createDbBills(billsToCreate);
      this.logger.debug(`monthly-bill-vendor-creator: Succesfully created ${createdBills.length} bills for vendor ${_.get(this, 'provider.id')}`);
      return createdBills;
    }
  }
}

module.exports = BillMonthlyVendorCreator;
