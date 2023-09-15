const _ = require('lodash');
const { Types: { ObjectId } } = require('mongoose');
const FlatRateBillCreator = require('../../bill-creator/flat-rate-bill-creator');
const BillScheduler = require('../../scheduler/bill-scheduler');
const getenv = require('getenv');

class BillFlatRateScheduler extends BillScheduler {
  constructor(user, flags) {
    super(user, flags);
    this.name = 'BillFlatRateScheduler';
  }

  async createBills(vendorId) {
    let createdBills;
    this.lsp = await this.getLsp();
    this.logger.debug(this.getLogMessage('Running scheduler'));
    const mockVendorPaymentPeriodStartDate = _.get(this.flags, 'mockVendorPaymentPeriodStartDate');
    if (getenv('NODE_ENV') !== 'PROD' && !_.isNil(mockVendorPaymentPeriodStartDate)) {
      this.lsp.vendorPaymentPeriodStartDate = mockVendorPaymentPeriodStartDate;
    }
    const query = {
      type: 'Vendor',
      'vendorDetails.billingInformation.flatRate': true,
      'vendorDetails.billingInformation.hasMonthlyBill': false,
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
      const flatRateBillCreator = new FlatRateBillCreator(
        this.schema,
        this.lsp,
        provider,
        this.flags,
      );
      this.logger.debug(this.getLogMessage(`Looking for approved tasks for vendor ${provider.id}`));
      const providerRequestsAndTasks =
        await flatRateBillCreator.fetchVendorRequestsWithApprovedTasks();
      if (_.isEmpty(providerRequestsAndTasks)) {
        this.logger.debug(this.getLogMessage(`No approved tasks for vendor ${provider.id}`));
        return;
      }
      this.logger.debug(this.getLogMessage(`${providerRequestsAndTasks.length} Approved tasks for vendor ${provider.id}`));
      this.logger.debug(this.getLogMessage(`Starting creating bills for vendor ${provider.id}`));
      createdBills = await flatRateBillCreator.createBills();
      this.logger.debug(this.getLogMessage(`Finished creating bills for vendor ${provider.id}`));
      await this.updateVendorBalances(createdBills);
      if (!_.isEmpty(createdBills)) {
        this.billsToBeSynced.push(...createdBills.map(bill => bill._id));
      }
    });
    return createdBills || [];
  }
}

module.exports = BillFlatRateScheduler;
