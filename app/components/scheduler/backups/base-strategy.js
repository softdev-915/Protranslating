const moment = require('moment');
const logger = require('../../log/logger');

class BaseStrategy {
  constructor(schedulerName, lspId) {
    this.schedulerName = schedulerName;
    this.lspId = lspId;
    this.logger = logger;
  }

  async getPeriodsToBackup(availableBackups) {
    const beforeThisMonth = moment().utc()
      .startOf('month')
      .subtract(1, 'day')
      .endOf('day')
      .toDate();
    const possibleBackups = await this.getPossibleBackupList(beforeThisMonth);
    // Possible Backups are in DB
    // Available Backups are in GCS
    return possibleBackups
      .filter((b) => !availableBackups.some(
        (a) => a.month.toString() === b.month.toString()
          && a.year.toString() === b.year.toString(),
      ));
  }
}

module.exports = BaseStrategy;
