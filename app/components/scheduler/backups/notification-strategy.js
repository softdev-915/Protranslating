const mongoConnection = require('../../database/mongo');
const BaseStrategy = require('./base-strategy');

const DEFAULT_COLLECTION = 'notifications';

class NotificationBackupStrategy extends BaseStrategy {
  constructor(schedulerName, lspId) {
    super(schedulerName, lspId);
    this.collection = mongoConnection.mongoose.connection.db.collection(DEFAULT_COLLECTION);
  }

  async getPossibleBackupList(beforeThisMonth) {
    const aggregationParams = [
      { $match: { lspId: this.lspId, createdAt: { $lt: beforeThisMonth } } },
      {
        $group: {
          _id: {
            year: {
              $year: '$createdAt',
            },
            month: {
              $month: '$createdAt',
            },
          },
        },
      },
    ];
    const possibleBackups = await this.collection.aggregate(aggregationParams).toArray();
    return possibleBackups.map(b => b._id);
  }
}

module.exports = NotificationBackupStrategy;
