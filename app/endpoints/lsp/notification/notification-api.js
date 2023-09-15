const _ = require('lodash');
const moment = require('moment');
const { ObjectId } = require('mongoose').Types;
const { RestError } = require('../../../components/api-response');
const BackupScheduler = require('../../../components/scheduler/backups');
const { searchFactory } = require('../../../utils/pagination');
const { exportFactory } = require('../../../utils/pagination');
const SchemaAwareAPI = require('../../schema-aware-api');
const CloudStorage = require('../../../components/cloud-storage');
const configuration = require('../../../components/configuration');
const { CsvExport } = require('../../../utils/csvExporter');
const ApplicationCrypto = require('../../../components/crypto');
const { createNotificationRecord } = require('../../../components/audit/audit-mocks');
const { monthPeriodQuery } = require('../../../utils/backup');

const { CRYPTO_KEY_PATH } = configuration.environment;
const emailConnStringPassRegex = /:(?!\/)(.*)(?=@)/;
const getEmailConnectionPasswordMaskedString = (emailConnString) => {
  const passwordMatch = emailConnString.match(emailConnStringPassRegex);
  let emailConnPassHidden = '';

  if (!_.isNil(passwordMatch)) {
    const password = passwordMatch[1] || '';

    if (!_.isEmpty(password)) {
      emailConnPassHidden = _.replace(emailConnString, password, '***');
    }
  }
  if (!_.isEmpty(emailConnPassHidden)) {
    return emailConnPassHidden;
  }
  return emailConnString;
};

const getEmailConnectionStringPipeline = () => ([
  {
    $lookup: {
      from: 'lsp',
      foreignField: '_id',
      localField: 'lspId',
      as: 'lsp',
    },
  },
  {
    $addFields: {
      emailConnectionString: { $arrayElemAt: ['$lsp.emailConnectionString', 0] },
    },
  },
  {
    $project: {
      lsp: 0,
    },
  },
]);

class NotificationApi extends SchemaAwareAPI {
  /**
   * @param {Object} logger
   * @param {Object} options optional object.
   * @param {Object} options.configuration configuration.
   * @param {Object} options.user user that is user api.
   */
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
    this.backupScheduler = new BackupScheduler('backup-notifications-monthly', this.configuration);
    this.cloudStorage = new CloudStorage(configuration, logger);
    this.cryptoFactory = new ApplicationCrypto(CRYPTO_KEY_PATH);
    this.pastMonth = moment().utc().startOf('month').subtract(1, 'month');
    this.attribute = 'createdAt';
  }

  getQueryFilters(filters) {
    let query = { lspId: this.lspId };
    query = { ...query, ..._.get(filters, 'paginationParams', {}) };
    const pipeline = [
      {
        $addFields: {
          emailContent: '$email.content',
        },
      },
      {
        $addFields: {
          emailContent: {
            $arrayElemAt: ['$emailContent', 0],
          },
        },
      },
      {
        $addFields: {
          emailAttachment: '$email.attachment',
        },
      },
      {
        $addFields: {
          emailAttachment: {
            $arrayElemAt: ['$emailAttachment.name', 1],
          },
        },
      },
      {
        $addFields: {
          scheduledAt: { $ifNull: ['$scheduledAt', '$createdAt'] },
          emailBody: '$emailContent.data',
          emailAttachment: '$emailAttachment',
          emailSubject: '$email.subject',
          emailList: {
            $reduce: {
              input: '$email.to',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$email.to', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this.email'] },
                  else: { $concat: ['$$value', ', ', '$$this.email'] },
                },
              },
            },
          },
        },
      },
    ];
    const emailConnStringPipeline = getEmailConnectionStringPipeline();
    const extraQueryParams = ['emailSubject', 'emailAttachment', 'emailBody', 'emailList'];
    return {
      query,
      pipeline: _.concat(pipeline, emailConnStringPipeline),
      extraQueryParams,
    };
  }

  async notificationList(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the notifications list`);
    const queryFilters = this.getQueryFilters(filters);
    const list = await searchFactory({
      model: this.schema.Notification,
      filters: queryFilters.query,
      extraPipelines: queryFilters.pipeline,
      extraQueryParams: queryFilters.extraQueryParams,
      utcOffsetInMinutes: filters.__tz,
    });

    _.forEach(list, (listItem) => {
      if (!_.isEmpty(listItem.emailConnectionString)) {
        const decryptedString = this.cryptoFactory.decrypt(listItem.emailConnectionString);
        const emailConnectionMaskedString = getEmailConnectionPasswordMaskedString(decryptedString);

        _.set(listItem, 'emailConnectionString', emailConnectionMaskedString);
      }
    });
    return {
      list,
      total: list.length,
    };
  }

  async notificationExport(filters) {
    this.logger.debug(`User ${this.user.email} retrieved a notification list export file`);
    const queryFilters = this.getQueryFilters(filters);
    const cursor = await exportFactory(
      this.schema.Notification,
      queryFilters.query,
      queryFilters.pipeline,
      queryFilters.extraQueryParams,
      filters.__tz,
    );
    const csvExporter = new CsvExport(cursor, {
      schema: this.schema.Notification,
      lspId: this.lspId,
      configuration: this.configuration,
      logger: this.logger,
      filters: queryFilters,
    });
    return csvExporter.export();
  }

  async notificationDetail(_id) {
    this.logger.debug(`User ${this.user.email} retrieved a notification`);
    const pipeline = _.concat({
      $match: { $expr: { $eq: ['$_id', new ObjectId(_id)] } },
    }, getEmailConnectionStringPipeline());
    const notificationAggregationResult = await this.schema.Notification.aggregate(pipeline);

    if (_.isNil(notificationAggregationResult)) {
      throw new RestError(404, { message: `Notification ${_id} not found` });
    }
    const notification = notificationAggregationResult[0] || {};
    const emailConnString = _.get(notification, 'emailConnectionString', '');
    const decryptedString = this.cryptoFactory.decrypt(emailConnString);
    const emailConnStringPasswordMasked = getEmailConnectionPasswordMaskedString(decryptedString);

    notification.emailConnectionString = emailConnStringPasswordMasked;
    return notification;
  }

  async getNotificationBackupInfo() {
    const { lspId } = this;
    try {
      const backups = await this.backupScheduler.listCloudBackups({ lspId });
      const groupedBackups = _.groupBy(backups, 'year');
      return _.mapValues(groupedBackups, (months) => months.map((m) => m.month));
    } catch (e) {
      this.logger.error(`Error reading backup info: ${e}`);
      throw new RestError(500, e);
    }
  }

  async restoreFrom(config) {
    const { lspId } = this;
    const { fromYear, fromMonth } = config;
    const fromDate = moment().utc()
      .set('year', fromYear)
      .set('month', fromMonth);

    try {
      return this.backupScheduler.restoreFrom(fromDate, lspId);
    } catch (e) {
      const message = _.get(e, 'message', e);
      const errorMessage = `Error restoring backup: ${message}`;
      this.logger.error(errorMessage);
      throw new RestError(503, { message: errorMessage, stack: e.stack });
    }
  }

  async createPastMonthFakeRecord() {
    const { Notification } = this.schema;
    const midPastMonthDate = this.pastMonth.clone().add(14, 'days').toDate();
    const mockRecord = createNotificationRecord(midPastMonthDate);
    if (mockRecord.lspId !== this.lspId) {
      mockRecord.lspId = this.lspId;
    }
    const { insertedIds } = await Notification.collection.insert(mockRecord);
    const insertedId = insertedIds[0];
    if (_.isNil(insertedId)) {
      throw new RestError(503, { message: 'Failed to insert a fake notification record' });
    }
    const insertedFakeRecord = await Notification.findOne({ _id: insertedId });
    if (_.isNil(insertedFakeRecord)) {
      throw new RestError(503, { message: 'Failed to find inserted fake notification record' });
    }
    this.logger.debug('Succesfully inserted a fake notification record');
  }

  async restorePastMonth() {
    const { lspId, attribute, pastMonth } = this;
    const { Notification } = this.schema;
    const restoreResults = await this.backupScheduler.restoreFrom(pastMonth.clone(), lspId);
    const restoreSummary = restoreResults.map((r) => `${r.folder} was ${r.desc}`);
    this.logger.debug(`Restore summary: ${restoreSummary.join(', ')}`);
    const query = monthPeriodQuery({ date: pastMonth.clone(), attribute, lspId });
    const restoredRecordsCount = await Notification.countDocuments(query);
    return restoredRecordsCount;
  }

  async testRestoreAndBackup() {
    const {
      lspId, attribute, pastMonth, backupScheduler,
    } = this;

    try {
      const countQuery = monthPeriodQuery({ date: pastMonth.clone(), attribute, lspId });
      const pastMonthRecords = await this.schema.Notification.countDocuments(countQuery);
      this.logger.debug(`There are ${pastMonthRecords} past month records in notification db`);
      if (!pastMonthRecords) {
        const cloudBackups = await backupScheduler.listCloudBackups({ lspId });
        this.logger.debug(`There are ${cloudBackups.length} backup archives in the cloud`);
        if (_.isEmpty(cloudBackups)) {
          await this.createPastMonthFakeRecord();
        } else {
          const restoredRecordsCount = await this.restorePastMonth();
          this.logger.debug('Succesfully restored past month backup into the database');
          if (!restoredRecordsCount) {
            await this.createPastMonthFakeRecord();
          }
        }
      }
      await backupScheduler.removePastMonthBackup({ lspId });
      await backupScheduler.run({ attrs: { data: { lspId } } }, (e) => {
        if (e) throw e;
      });
      const restoredRecords = await this.restorePastMonth();
      this.logger.debug(`There are ${restoredRecords} records in the db after restore`);
      if (!restoredRecords) throw new Error('Was unable to restore after the backup');
      return 'Successfully tested restore and backup for notification db';
    } catch (e) {
      const message = _.get(e, 'message', e);
      const errorMessage = `Error in testRestoreAndBackup(): ${message}`;
      this.logger.error(errorMessage);
      throw new RestError(503, { message: errorMessage, stack: e.stack });
    }
  }
}

module.exports = NotificationApi;
