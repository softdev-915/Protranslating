const _ = require('lodash');
const Promise = require('bluebird');
const { Types: { ObjectId } } = require('mongoose');
const moment = require('moment');
const { multiply } = require('../../utils/bigjs');
const { provideTransaction } = require('../../components/database/mongo/utils');
const BillCreator = require('./bill-creator');

const FLAT_RATE_ACCOUNTING_DEPARTMENT_ID = 2050;
const TAX_ID_FORMS = ['1099 Eligible', 'W-9'];
const ELIGIBLE_TAX_FORM = '1099 Eligible';
const PROVIDER_TASK_APPROVED_STATUS = 'approved';
const SCHEDULER_TYPE = 'flat-rate-bill';
class FlatRateBillCreator extends BillCreator {
  async buildBillSchema(items, startDate, endDate) {
    const providerBillingInformation = _.get(this.provider, 'vendorDetails.billingInformation');
    if (!_.isNil(providerBillingInformation)) {
      const requestsIdNoList = this.buildRequestsIdNoListFromItems(items);
      let serviceDetails = [];
      let index = 1;
      await Promise.map(items, async (i) => {
        const ability = await this.schema.Ability.findOneWithDeleted({
          name: i.task.ability,
          lspId: this.lspId,
        });
        const abilityExpenseAccount = await this.getAbilityExpenseAccount(_.get(ability, '_id'));
        const providerTaskServiceDetails = _.map(
          i.providerTask.billDetails,
          billDetail => this.getServiceDetail(billDetail, abilityExpenseAccount, i),
        );
        serviceDetails = serviceDetails.concat(providerTaskServiceDetails);
        if (_.isNil(serviceDetails.find(s => s.taskDescription === 'Flat Rate')) && index === items.length) {
          serviceDetails.push(this.getFlatRateServiceDetail(i));
        }
        index++;
      });
      const taxForms = _.get(providerBillingInformation, 'taxForm', []);
      const taxFormsInDb = await this.schema.TaxForm.find({
        _id: { $in: taxForms },
      }, 'name');
      return {
        date: this.mockableMoment.getDateObject().toDate(),
        billStartDate: startDate.toDate(),
        billEndDate: endDate.toDate(),
        dueDate: this.mockableMoment.getDateObject().add(providerBillingInformation.billingTerms.days, 'd').toDate(),
        totalAmount: providerBillingInformation.flatRateAmount,
        glPostingDate: endDate.toDate(),
        lspId: this.lspId,
        siConnector: {
          isMocked: requestsIdNoList.some(r => r.isMocked) && !this.isProd,
          isSynced: false,
          error: null,
        },
        requests: requestsIdNoList,
        vendor: _.get(this, 'provider._id'),
        providerTasksIdList: this.buildProviderTaskIdsFromItems(items),
        billOnHold: providerBillingInformation.billOnHold,
        serviceDetails,
        hasTaxIdForms: taxFormsInDb.some(t => TAX_ID_FORMS.includes(t.name)),
        has1099EligibleForm: taxFormsInDb.some(t => ELIGIBLE_TAX_FORM.includes(t.name)),
        schedulerType: SCHEDULER_TYPE,
      };
    }
    this.logger.debug(`Cannot create bills for vendor ${this.provider._id} because it does not have billing information`);
  }

  getTaskPeriod(taskApprovedAtDate) {
    let period = '';
    const billPeriodStartDate = moment(this.lsp.vendorPaymentPeriodStartDate).utc().startOf('day');
    const paymentFrequencyDays = this.provider.vendorDetails.billingInformation
      .paymentFrequency;
    if (_.isNil(paymentFrequencyDays)) {
      return '';
    }
    const billPeriodEndDate = moment(this.lsp.vendorPaymentPeriodStartDate).add(paymentFrequencyDays - 1, 'd').utc().endOf('day');
    let isTaskBetweenPeriod = false;
    const endMark = 100;
    let i = 0;
    while (!isTaskBetweenPeriod && i < endMark) {
      i++;
      isTaskBetweenPeriod = taskApprovedAtDate.isSameOrBefore(billPeriodEndDate) &&
        taskApprovedAtDate.isSameOrAfter(billPeriodStartDate);
      period = `${billPeriodStartDate.format('YYYY-MM-DD')} - ${billPeriodEndDate.format('YYYY-MM-DD')}`;
      if (!isTaskBetweenPeriod) {
        billPeriodStartDate.add(paymentFrequencyDays, 'd');
        billPeriodEndDate.add(paymentFrequencyDays, 'd');
      }
    }
    return period;
  }

  getServiceDetail(billDetail, abilityExpenseAccount, item) {
    const taskAmount = multiply(_.toNumber(billDetail.unitPrice), _.toNumber(billDetail.quantity));
    return {
      expenseAccountNo: _.get(abilityExpenseAccount, 'expenseAccount.number', ''),
      taskAmount,
      taskDescription: `${_.get(item, 'request.no')} ${item.task.ability} ${item.langCombination} ${billDetail.quantity} ${_.get(billDetail.translationUnit, 'name', '')} ${_.get(billDetail.breakdown, 'name', '')} at ${billDetail.unitPrice} rate`,
      referenceNumber: item.request.referenceNumber,
      recipient: item.request.recipient,
      accountingDepartmentId: item.request.internalDepartment.accountingDepartmentId,
    };
  }

  getFlatRateServiceDetail() {
    const lastItemExpenseAccountNo = this.provider.vendorDetails.billingInformation.fixedCost ? '50701' : '50700';
    return {
      expenseAccountNo: lastItemExpenseAccountNo,
      taskAmount: this.provider.vendorDetails.billingInformation.flatRateAmount,
      taskDescription: 'Flat Rate',
      referenceNumber: '',
      recipient: '',
      accountingDepartmentId: FLAT_RATE_ACCOUNTING_DEPARTMENT_ID,
    };
  }

  async fetchVendorRequestsWithApprovedTasks() {
    const requestsWithApprovedTasks = await this.schema.Request.find({
      lspId: this.lsp._id,
      'workflows.tasks.providerTasks.status': 'approved',
      'workflows.tasks.providerTasks.billed': false,
      'workflows.tasks.providerTasks.provider._id': _.get(this.provider, '_id'),
      'internalDepartment._id': { $exists: true },
      createdAt: {
        $gte: this.lsp.vendorPaymentPeriodStartDate,
      },
    }).lean();
    this.providerRequestsAndTasks = await this.buildApprovedTasksInfo(requestsWithApprovedTasks);
    return this.providerRequestsAndTasks;
  }

  async buildApprovedTasksInfo(requestsWithApprovedTasks) {
    const approvedTasks = [];
    await Promise.map(requestsWithApprovedTasks, async (request) => {
      // Schedule the next processing iteration
      await new Promise(resolve => setTimeout(resolve, 0));
      const internalDepartmentId = _.get(request, 'internalDepartment._id');
      request.internalDepartment = await this.schema.InternalDepartment.findOneWithDeleted({
        _id: new ObjectId(internalDepartmentId),
      });
      request.workflows.forEach((workflow) => {
        const langCombination = `${_.get(workflow, 'srcLang.name', '')} - ${_.get(workflow, 'tgtLang.name', '')}`;
        workflow.tasks.forEach((task) => {
          task.providerTasks.forEach((providerTask) => {
            if (_.isNil(_.get(providerTask, 'provider._id'))) return;
            if (_.get(providerTask, 'billed', false)) return;
            if (_.get(providerTask, 'provider._id', '').toString() === this.provider.id &&
                providerTask.status === PROVIDER_TASK_APPROVED_STATUS) {
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
    this.logger.debug(`BillFlatRateScheduler: Returning ${approvedTasks.length} approved tasks for provider ${this.provider.id}`);
    return approvedTasks;
  }

  async validateAndStampCreationErrors() {
    let missingFieldsMessage = '';
    const failedProviderTasks = [];
    let billCreationError = '';
    await Promise.mapSeries((this.providerRequestsAndTasks), async (item) => {
      const ability = await this.schema.Ability.findOneWithDeleted({
        name: item.task.ability,
        lspId: this.lspId,
      });
      const abilityExpenseAccount = await this.getAbilityExpenseAccount(_.get(ability, '_id'));
      const expenseAccount = _.get(abilityExpenseAccount, 'expenseAccount', {});
      const isMissingExpenseAccount = _.isEmpty(_.get(expenseAccount, 'number', ''));
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
        const departmentInactiveMessage = `Internal department ${internalDepartmentName} is inactive`;
        if (_.isEmpty(missingFieldsMessage)) {
          missingFieldsMessage = departmentInactiveMessage;
        } else {
          missingFieldsMessage = `${missingFieldsMessage} and ${departmentInactiveMessage}`;
        }
      }
      if (!isMissingExpenseAccount && !isDepartmentDeleted) {
        billCreationError = '';
      } else {
        const taskApprovedAtDate = moment(item.providerTask.approvedAt);
        const period = this.getTaskPeriod(taskApprovedAtDate);
        billCreationError = `
            The bill for the period ${period} for provider "${this.provider.firstName} ${this.provider.lastName}"
            could not be created because the "${item.task.ability}" task
            with ID ${_.get(item, 'providerTask._id', '').toString()} in request ${_.get(item, 'request._id', '').toString()} is missing the following mandatory fields: ${missingFieldsMessage}`;
        failedProviderTasks.push(_.get(item, 'providerTask._id', '').toString());
      }
      await this.updateProviderTaskErrors(item, billCreationError);
    });
    return failedProviderTasks;
  }

  async createBills() {
    const failedProviderTasks = await this.validateAndStampCreationErrors();
    if (!_.isEmpty(failedProviderTasks)) return Promise.resolve([]);
    const bills = [];
    const currentDate = this.mockableMoment.getDateObject().startOf('day');
    const billPeriodStartDate = moment(this.lsp.vendorPaymentPeriodStartDate).utc().startOf('day');
    const paymentFrequencyDays = this.provider.vendorDetails.billingInformation
      .paymentFrequency;
    const billPeriodEndDate = moment(this.lsp.vendorPaymentPeriodStartDate).utc().endOf('day');
    billPeriodEndDate.add(paymentFrequencyDays - 1, 'days');
    let billProviderTasks = [];
    let providerRequestsAndTasks = _.clone(this.providerRequestsAndTasks);
    const processBillPeriod = async (startDate, endDate) => {
      this.logger.debug(`BillFlatRateScheduler: Processing bill period for provider ${this.provider.id}`);
      await Promise.map(providerRequestsAndTasks, (item) => {
        const taskApprovedAt = moment(item.providerTask.approvedAt);
        const isTaskBetweenPeriod = taskApprovedAt.isSameOrBefore(endDate) &&
          taskApprovedAt.isSameOrAfter(startDate);
        const hasPeriodEnded = currentDate.isAfter(endDate);
        if (isTaskBetweenPeriod && hasPeriodEnded) {
          billProviderTasks.push(item);
        }
      });
      providerRequestsAndTasks = _.difference(providerRequestsAndTasks, billProviderTasks);
      if (!_.isEmpty(billProviderTasks)) {
        const newBill = await this.buildBillSchema(billProviderTasks,
          moment(startDate), moment(endDate));
        bills.push(newBill);
      }
      billProviderTasks = [];
      startDate = moment(endDate);
      endDate.add(paymentFrequencyDays, 'days');
      if (endDate.isSameOrAfter(currentDate) || endDate.isSame(startDate)) {
        return;
      }
      return processBillPeriod(startDate, endDate);
    };
    await processBillPeriod(billPeriodStartDate, billPeriodEndDate);
    this.logger.debug(`BillFlatRateScheduler: Finished processing bill period for provider ${this.provider.id}`);
    const createdBills = [];
    await provideTransaction(async (session) => {
      await Promise.mapSeries((bills), async (bill) => {
        await this.checkForDuplicates(bill);
        const newBill = this.schema.Bill(bill);
        await newBill.save({ session });
        await this.updateRequests(newBill, session);
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
    return createdBills;
  }
}

module.exports = FlatRateBillCreator;
