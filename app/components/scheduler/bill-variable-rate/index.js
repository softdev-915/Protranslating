const VariableRateBillCreator = require('../../bill-creator/variable-rate-bill-creator');
const BillScheduler = require('../bill-scheduler');

class BillVariableRateScheduler extends BillScheduler {
  constructor(user, flags) {
    super(user, flags);
    this.name = 'BillVariableRateScheduler';
  }

  async createBills(providerId) {
    this.lsp = await this.getLsp();
    this.billsToBeSynced = [];
    this.logger.debug(this.getLogMessage('Running scheduler: Looking for approved tasks'));
    const variableRateBillCreator = new VariableRateBillCreator(this.schema, this.lsp, null, this.flags);
    const createdBills = await variableRateBillCreator.createBills(providerId);
    if (createdBills.length > 0) {
      this.logger.debug(this.getLogMessage(`Successfuly Created ${createdBills.length} for provider ${providerId}`));
      this.billsToBeSynced = createdBills;
    } else {
      this.logger.debug(this.getLogMessage(`Could not create bills for provider ${providerId}`));
    }
    return createdBills;
  }
}

module.exports = BillVariableRateScheduler;
