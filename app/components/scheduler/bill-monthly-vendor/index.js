const _ = require('lodash');
const { Types: { ObjectId } } = require('mongoose');
const BillMonthlyVendor = require('../../bill-creator/bill-monthly-vendor');
const BillScheduler = require('../bill-scheduler');
const configuration = require('../../configuration');

const { NODE_ENV } = configuration.environment;

class BillMonthlyVendorScheduler extends BillScheduler {
  constructor(user, flags) {
    super(user, flags);
    this.name = 'BillMonthlyVendorScheduler';
  }

  async createBills(vendorId) {
    let createdBills;
    this.lsp = await this.getLsp();
    this.billsToBeSynced = [];
    this.logger.debug(this.getLogMessage('Running scheduler'));
    const mockVendorPaymentPeriodStartDate = _.get(this.flags, 'mockVendorPaymentPeriodStartDate');
    if (NODE_ENV !== 'PROD' && !_.isNil(mockVendorPaymentPeriodStartDate)) {
      this.lsp.vendorPaymentPeriodStartDate = mockVendorPaymentPeriodStartDate;
    }
    const query = {
      type: 'Vendor',
      'vendorDetails.billingInformation.flatRate': { $ne: true },
      'vendorDetails.billingInformation.hasMonthlyBill': { $eq: true },
      'vendorDetails.billingInformation.billCreationDay': { $ne: null },
    };
    const vendorIdToProcess = _.isNil(this.currentVendorId) ? vendorId : this.currentVendorId;
    if (!_.isNil(vendorIdToProcess)) {
      query._id = new ObjectId(vendorIdToProcess);
    }
    const providersCursor = this.schema.User.findWithDeleted(query)
      .populate('vendorDetails.billingInformation.billingTerms')
      .cursor({
        batchSize: 10,
      });
    await providersCursor.eachAsync(async (provider) => {
      const billMonthlyVendor = new BillMonthlyVendor(
        this.schema,
        this.lsp,
        provider,
        this.flags,
      );
      this.logger.debug(this.getLogMessage(`Looking for approved tasks for vendor ${provider.id}`));
      const providerRequestsAndTasks = await billMonthlyVendor.fetchVendorRequestsWithApprovedTasks();
      if (_.isEmpty(providerRequestsAndTasks)) {
        this.logger.debug(this.getLogMessage(`No approved tasks for vendor ${provider.id}`));
        return;
      }
      this.logger.debug(this.getLogMessage(`${providerRequestsAndTasks.length} Approved tasks for vendor ${provider.id}`));
      this.logger.debug(this.getLogMessage(`Starting creating bills for vendor ${provider.id}`));
      createdBills = await billMonthlyVendor.createBills();
      this.logger.debug(this.getLogMessage(`Finished creating bills for vendor ${provider.id}`));
      await this.updateVendorBalances(createdBills);
      this.logger.debug(this.getLogMessage(`Finished updating vendor ${provider.id} balances`));
      if (!_.isEmpty(createdBills)) {
        this.logger.debug(this.getLogMessage(`Successfuly created ${createdBills.length} bills for vendor ${provider.id}`));
        this.billsToBeSynced.push(...createdBills.map(bill => bill._id));
      }
    });
    return createdBills || [];
  }
}

module.exports = BillMonthlyVendorScheduler;
