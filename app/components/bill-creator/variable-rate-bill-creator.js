const _ = require('lodash');
const { Types: { ObjectId } } = require('mongoose');
const moment = require('moment');
const { multiply, sum, minus } = require('../../utils/bigjs');
const { provideTransaction } = require('../database/mongo/utils');
const BillCreator = require('./bill-creator');
const configuration = require('../configuration');

const TAX_ID_FORMS = ['1099 Eligible', 'W-9'];
const ELIGIBLE_TAX_FORM = '1099 Eligible';
const PROVIDER_TASK_APPROVED_STATUS = 'approved';
const env = configuration.environment;
const SCHEDULER_TYPE = 'variable-rate-bill';

class VariableRateBillCreator extends BillCreator {
  getAdjustmentServiceDetail({
    request, workflow, task, providerTask,
  }, abilityExpenseAccount, totalAmount) {
    const difference = minus(providerTask.minCharge, totalAmount);
    return {
      expenseAccountNo: _.get(abilityExpenseAccount, 'expenseAccount.number', ''),
      taskAmount: difference,
      taskDescription: `${request.no} ${task.ability} ${workflow.langCombination} Minimum charge adjustment`,
      referenceNumber: request.referenceNumber,
      recipient: request.recipient,
      accountingDepartmentId: _.get(request, 'internalDepartment.accountingDepartmentId'),
    };
  }

  getDueDate(vendorBillingInformation) {
    const mockBillDueDate = _.get(this.flags, 'mockBillDueDate');
    if (env.NODE_ENV !== 'PROD' && !_.isNil(mockBillDueDate)) {
      return moment.utc(mockBillDueDate);
    }
    return moment.utc().add(_.get(vendorBillingInformation, 'billingTerms.days'), 'd');
  }

  async fetchVendorTasks(providerId) {
    const matchStage = {
      lspId: this.lspId,
      'workflows.tasks.providerTasks.status': PROVIDER_TASK_APPROVED_STATUS,
      'workflows.tasks.providerTasks.billed': false,
    };
    let providerMatchStage = { 'workflows.tasks.providerTasks.provider': { $ne: null } };
    const providerPreLookupMatchStage = {
      'workflows.tasks.providerTasks.status': PROVIDER_TASK_APPROVED_STATUS,
      'workflows.tasks.providerTasks.billed': false,
    };
    if (!_.isNil(providerId)) {
      providerMatchStage = { 'workflows.tasks.providerTasks.provider._id': new ObjectId(providerId) };
      Object.assign(matchStage, providerMatchStage);
    }
    Object.assign(providerPreLookupMatchStage, providerMatchStage);
    return this.schema.Request.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: 'internalDepartments',
          localField: 'internalDepartment._id',
          foreignField: '_id',
          as: 'internalDepartment',
        },
      },
      {
        $lookup: {
          from: 'companyDepartmentRelationShips',
          localField: 'company._id',
          foreignField: '_id',
          as: 'companyDepartmentRelation',
        },
      },
      {
        $project: {
          request: {
            _id: '$_id',
            isMocked: '$isMocked',
            no: '$no',
            recipient: '$recipient',
            internalDepartment: { $first: '$internalDepartment' },
          },
          'workflows._id': 1,
          'workflows.tasks': 1,
          'workflows.srcLang': 1,
          'workflows.tgtLang': 1,
          companyDepartmentRelationObj: { $first: '$companyDepartmentRelation' },
        },
      },
      {
        $match: {
          $or: [{
            'companyDepartmentRelationObj.acceptInvoicePerPeriod': false,
          }, {
            companyDepartmentRelationObj: { $eq: null },
          }],
        },
      },
      {
        $project: {
          request: 1,
          'workflows._id': 1,
          'workflows.tasks': 1,
          'workflows.srcLang': 1,
          'workflows.tgtLang': 1,
        },
      },
      {
        $unwind: '$workflows',
      },
      {
        $unwind: '$workflows.tasks',
      },
      {
        $unwind: '$workflows.tasks.providerTasks',
      },
      {
        $match: providerPreLookupMatchStage,
      },
      {
        $lookup: {
          from: 'users',
          let: {
            vendorId: '$workflows.tasks.providerTasks.provider._id',
          },
          pipeline: [
            { $match: { $expr: { $eq: ['$$vendorId', '$_id'] } } },
            {
              $project: {
                _id: 1,
                vendorDetails: 1,
                firstName: 1,
                lastName: 1,
                type: 1,
              },
            },
          ],
          as: 'provider',
        },
      },
      {
        $unwind: '$provider',
      },
      {
        $match: {
          'provider.type': 'Vendor',
          $and: [
            { 'provider.vendorDetails.billingInformation.flatRate': { $ne: true } },
            { 'provider.vendorDetails.billingInformation.hasMonthlyBill': { $ne: true } },
          ],
        },
      },
      {
        $project: {
          request: 1,
          workflow: {
            _id: '$workflows._id',
            langCombination: { $concat: ['$workflows.srcLang.name', ' - ', '$workflows.tgtLang.name'] },
          },
          task: {
            _id: '$workflows.tasks._id',
            ability: '$workflows.tasks.ability',
          },
          providerTask: {
            _id: '$workflows.tasks.providerTasks._id',
            provider: '$provider',
            billed: '$workflows.tasks.providerTasks.billed',
            status: '$workflows.tasks.providerTasks.status',
            billDetails: '$workflows.tasks.providerTasks.billDetails',
            minCharge: '$workflows.tasks.providerTasks.minCharge',
          },
        },
      },
    ]).cursor({ batchSize: env.BILL_PROVIDER_TASKS_BATCH_SIZE });
  }

  async validateAndStampCreationErrors({ request, task, providerTask }) {
    let missingFieldsMessage = '';
    let billCreationError = '';
    const ability = await this.schema.Ability.findOneWithDeleted({
      name: task.ability,
      lspId: this.lspId,
    });
    const abilityExpenseAccount = await this.getAbilityExpenseAccount(
      _.get(ability, '_id'),
      providerTask.provider,
    );
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
    const internalDepartmentName = _.get(request, 'internalDepartment.name');
    const isDepartmentDeleted = _.get(request, 'internalDepartment.deleted');
    if (isDepartmentDeleted || _.isNil(request.internalDepartment)) {
      const departmentInactiveMessage = `Internal department ${internalDepartmentName} is inactive`;
      if (_.isEmpty(missingFieldsMessage)) {
        missingFieldsMessage = departmentInactiveMessage;
      } else {
        missingFieldsMessage = `${missingFieldsMessage} and ${departmentInactiveMessage}`;
      }
    }
    if (!isMissingExpenseAccount && !isDepartmentDeleted) {
      this.logger.debug(`No errors found in tasks for vendor ${providerTask.provider._id}`);
      billCreationError = '';
    } else {
      billCreationError = `
        The bill for provider "${providerTask.provider.firstName} ${providerTask.provider.lastName}"
        could not be created because the "${task.ability}" task with ID:
        ${providerTask._id.toString()} in request ${request._id.toString()}
        is missing the following mandatory fields: ${missingFieldsMessage}`;
      this.logger.debug(billCreationError);
    }
    const update = {
      $set: {
        'workflows.$[].tasks.$[].providerTasks.$[providerTask].billCreationError': billCreationError.trim(),
      },
    };
    const arrayFilters = [{
      'providerTask._id': providerTask._id,
      'providerTask.provider._id': providerTask.provider._id,
    }];
    await this.schema.Request.updateOne({ _id: request._id }, update, { arrayFilters });
    return billCreationError;
  }

  async buildBillSchema(vendorTask) {
    const {
      request, workflow, task, providerTask,
    } = vendorTask;
    const requestsIdNoList = this.buildRequestsIdNoListFromItems([vendorTask]);
    let serviceDetails = [];
    const ability = await this.schema.Ability.findOneWithDeleted({
      name: task.ability,
      lspId: this.lspId,
    }, { _id: 1 });
    const abilityExpenseAccount = await this.getAbilityExpenseAccount(
      _.get(ability, '_id'),
      providerTask.provider,
    );
    const providerTaskServiceDetails = _.map(
      providerTask.billDetails,
      (billDetail) => this.getServiceDetail(billDetail, abilityExpenseAccount, vendorTask),
    );
    serviceDetails = serviceDetails.concat(providerTaskServiceDetails);
    const totalAmount = _.reduce(
      serviceDetails,
      (amount, lineItem) => sum(amount, lineItem.taskAmount),
      0,
    );
    if (_.toNumber(providerTask.minCharge) > _.toNumber(totalAmount)) {
      serviceDetails.push(this.getAdjustmentServiceDetail(
        vendorTask,
        abilityExpenseAccount,

        totalAmount,

        workflow,
      ));
    }
    const vendorBillingInformation = _.get(providerTask.provider, 'vendorDetails.billingInformation', {});
    const taxForms = _.get(vendorBillingInformation, 'taxForm', []);
    const taxFormsInDb = await this.schema.TaxForm.find({
      _id: { $in: taxForms },
    }, 'name');
    const billingTermInDb = await this.schema.BillingTerm.findOneWithDeleted({
      _id: _.get(vendorBillingInformation, 'billingTerms'),
    }).lean();
    const glPostingDate = moment(providerTask.approvedAt).utc().toDate();
    return {
      date: glPostingDate,
      billStartDate: moment.utc().toDate(),
      billEndDate: moment.utc().toDate(),
      dueDate: this.getDueDate({ billingTerms: billingTermInDb }).toDate(),
      totalAmount: vendorBillingInformation.flatRateAmount,
      glPostingDate,
      lspId: this.lspId,
      requests: requestsIdNoList,
      vendor: providerTask.provider._id,
      siConnector: {
        isMocked: _.get(request, 'isMocked', false) && this.environmentName !== 'PROD',
        isSynced: false,
        error: null,
      },
      providerTasksIdList: this.buildProviderTaskIdsFromItems([vendorTask]),
      billOnHold: vendorBillingInformation.billOnHold,
      serviceDetails,
      hasTaxIdForms: taxFormsInDb.some((t) => TAX_ID_FORMS.includes(t.name)),
      has1099EligibleForm: taxFormsInDb.some((t) => ELIGIBLE_TAX_FORM.includes(t.name)),
      schedulerType: SCHEDULER_TYPE,
    };
  }

  getServiceDetail(billDetail, abilityExpenseAccount, { request, workflow, task }) {
    const taskAmount = multiply(_.toNumber(_.get(billDetail, 'unitPrice')), _.toNumber(_.get(billDetail, 'quantity')));
    return {
      expenseAccountNo: _.get(abilityExpenseAccount, 'expenseAccount.number', ''),
      taskAmount,
      taskDescription: `${request.no} ${task.ability} ${workflow.langCombination} ${billDetail.quantity} ${_.get(billDetail.translationUnit, 'name', '')} ${_.get(billDetail, 'breakdown.name', '')} at ${_.get(billDetail, 'unitPrice')} rate`,
      referenceNumber: request.referenceNumber,
      recipient: request.recipient,
      accountingDepartmentId: _.get(request, 'internalDepartment.accountingDepartmentId'),
    };
  }

  async createBills(providerIdFilter) {
    const tasksCursor = await this.fetchVendorTasks(providerIdFilter);
    const createdBills = [];
    await tasksCursor.eachAsync(async (vendorTask) => {
      // Schedule the next processing iteration
      await new Promise((resolve) => setTimeout(resolve, 0));
      const { _id: providerId } = vendorTask.providerTask.provider;
      const { _id: providerTaskId } = vendorTask.providerTask;
      const billCreationError = await this.validateAndStampCreationErrors(vendorTask);
      if (!_.isEmpty(billCreationError)) {
        this.logger.debug(billCreationError);
      } else {
        this.logger.debug(`Starting transaction for creating bills for vendor ${providerId}`);
        try {
          const bill = await this.buildBillSchema(vendorTask);
          await this.checkForDuplicates(bill);
          await provideTransaction(async (session) => {
            this.logger.debug(`Creating bill for providerTask ${providerTaskId} for vendor ${providerId}`);
            const newBill = this.schema.Bill(bill);
            await newBill.save({ session });
            this.logger.debug(`Updating bill requests for _id ${newBill._id}`);
            await this.updateRequests(newBill, session);
            this.logger.debug(`Updating vendor ${providerId} balance`);
            await this.updateVendorBalances([newBill], session);
            createdBills.push(newBill._id);
          });
        } catch (err) {
          this.logger.debug(`Error creating bills for vendor: ${err}`);
          if (!_.isNil(providerIdFilter)) {
            throw err;
          }
        }
      }
    });
    return createdBills;
  }
}

module.exports = VariableRateBillCreator;
