const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment');
const { Types: { ObjectId } } = require('mongoose');
const logger = require('../log/logger');
const configuration = require('../configuration');
const { convertToObjectId } = require('../../utils/schema');
const { multiply } = require('../../utils/bigjs');
const MockableMoment = require('../moment');

class BillCreator {
  constructor(schema, lsp, provider, flags = {}) {
    this.schema = schema;
    this.lsp = lsp;
    this.lspId = lsp._id;
    this.logger = logger;
    this.provider = provider;
    this.providerRequestsAndTasks = null;
    this.environmentName = configuration.environment.NODE_ENV;
    this.flags = flags;
    this.mockableMoment = new MockableMoment(this.flags.mockServerTime);
    this.duplicatedBillErrorMessage = 'Error: Failed to create a bill. The combination of requestId, workflowId, taskId and providerTaskId already exists in a bill';
  }

  async updateVendorBalances(createdBills, session) {
    const { BILLS_TO_PROCESS_NUMBER_FOR_VENDOR_BALANCE_UPDATE } = configuration.environment;
    const processedVendors = [];
    await Promise.map(
      createdBills,
      async (bill) => {
        if (processedVendors.includes(bill.vendor.toString())) {
          return;
        }
        this.logger.debug(`Updating vendor ${bill.vendor} balances after creating ${createdBills.length} bills`);
        processedVendors.push(bill.vendor.toString());
        await this.schema.User.lockDocument({ _id: bill.vendor }, session);
        await this.schema.User.consolidateVendorBalance(bill.vendor, session);
        this.logger.debug(`Finished updating vendor ${bill.vendor} balances`);
      },
      { concurrency: BILLS_TO_PROCESS_NUMBER_FOR_VENDOR_BALANCE_UPDATE },
    );
  }

  async updateRequests({
    _id, vendor, no, providerTasksIdList,
  }, session) {
    try {
      if (_.isEmpty(providerTasksIdList)) {
        throw new Error('Bill provider tasks were not set');
      }
      const updateOperations = providerTasksIdList.map((providerTaskData) => {
        const arrayFilters = [
          { 'workflow._id': providerTaskData.workflowId },
          { 'task._id': providerTaskData.taskId },
          { 'providerTask._id': providerTaskData.providerTaskId },
        ];
        return {
          updateOne: {
            filter: {
              _id: providerTaskData.requestId,
              lspId: this.lspId,
            },
            update: {
              $set: {
                'workflows.$[workflow].tasks.$[task].providerTasks.$[providerTask].billCreationError': '',
                'workflows.$[workflow].tasks.$[task].providerTasks.$[providerTask].billed': true,
              },
              $push: {
                bills: { _id, no },
              },
            },
            session,
            upsert: false,
            arrayFilters,
          },
        };
      });
      return await this.schema.Request.bulkWrite(updateOperations, { session });
    } catch (err) {
      this.logger.debug(`Failed to update related bill requests ${err} from provider ${vendor}`);
      throw err;
    }
  }

  async getAbilityExpenseAccount(abilityId, provider = this.provider) {
    const costType = _.get(provider, 'vendorDetails.billingInformation.fixedCost');
    if (_.isNil(costType)) {
      this.logger.debug(`Warning: Vendor ${provider._id} does not have billing information. Variable cost type will be used`);
    }
    const abilityExpenseAccounts = await this.schema.AbilityExpenseAccount.findWithDeleted({
      ability: new ObjectId(abilityId),
      lspId: this.lspId,
    }).populate({
      path: 'expenseAccount',
      match: { costType: costType ? 'Fixed' : 'Variable' },
      select: 'number costType',
    });
    const abilityExpenseAccount = _.find(
      abilityExpenseAccounts,
      (abilityExpenseAccountItem) => !_.isNil(abilityExpenseAccountItem.expenseAccount),
    );
    return abilityExpenseAccount;
  }

  async updateProviderTaskErrors(item, billCreationError) {
    const update = {
      $set: {
        'workflows.$[].tasks.$[].providerTasks.$[providerTask].billCreationError': billCreationError.trim(),
      },
    };
    const arrayFilters = [{
      'providerTask._id': _.get(item, 'providerTask._id', item._id),
      'providerTask.provider._id': new ObjectId(item.providerTask.provider._id),
    }];
    return this.schema.Request.updateOne({ _id: item.request._id }, update, { arrayFilters });
  }

  getTaskPeriod(taskApprovedAtDate, billCreationDay) {
    const billPeriodStartDate = moment(taskApprovedAtDate).date(billCreationDay).utc().startOf('day');
    const billPeriodEndDate = moment(taskApprovedAtDate)
      .date(billCreationDay)
      .subtract(1, 'd')
      .utc()
      .endOf('day');
    if (moment(taskApprovedAtDate).date() < _.toNumber(billCreationDay)) {
      billPeriodStartDate.subtract(1, 'month');
    } else {
      billPeriodEndDate.add(1, 'month');
    }
    return `${billPeriodStartDate.format('YYYY-MM-DD')} - ${billPeriodEndDate.format('YYYY-MM-DD')}`;
  }

  getServiceDetail(billDetail, abilityExpenseAccount, item) {
    const taskAmount = multiply(_.toNumber(billDetail.unitPrice), _.toNumber(billDetail.quantity));
    return {
      expenseAccountNo: _.get(abilityExpenseAccount, 'expenseAccount.number', ''),
      taskAmount,
      taskDescription: `${item.request.no} ${item.task.ability} ${item.langCombination} ${billDetail.quantity} ${_.get(billDetail.translationUnit, 'name', '')} ${_.get(billDetail.breakdown, 'name', '')} at ${billDetail.unitPrice} rate`,
      referenceNumber: item.request.referenceNumber,
      recipient: item.request.recipient,
      accountingDepartmentId: item.request.internalDepartment.accountingDepartmentId,
    };
  }

  buildRequestsIdNoListFromItems(items) {
    return _.uniqBy(items.map((i) => ({
      _id: _.get(i, 'request._id'),
      no: _.get(i, 'request.no'),
      isMocked: _.get(i, 'request.isMocked', false) && this.environmentName !== 'PROD',
    })), (i) => i.no);
  }

  buildProviderTaskIdsFromItems(items) {
    return items.map((i) => ({
      requestId: i.request._id,
      workflowId: i.workflow._id,
      taskId: i.task._id,
      providerTaskId: i.providerTask._id,
    }));
  }

  async checkForDuplicates(bill) {
    const providerTasksIdList = _.get(bill, 'providerTasksIdList', []);
    if (_.isEmpty(providerTasksIdList)) return;
    const queryDuplicates = providerTasksIdList.map((pt) => ({
      requestId: convertToObjectId(pt.requestId),
      workflowId: convertToObjectId(pt.workflowId),
      taskId: convertToObjectId(pt.taskId),
      providerTaskId: convertToObjectId(pt.providerTaskId),
    }));
    const duplicatedBills = await this.schema.Bill.find({
      providerTasksIdList: { $in: queryDuplicates },
    }, { _id: 1 }).lean();
    if (duplicatedBills && duplicatedBills.length > 0) {
      throw new Error(this.duplicatedBillErrorMessage);
    }
  }
}

module.exports = BillCreator;
