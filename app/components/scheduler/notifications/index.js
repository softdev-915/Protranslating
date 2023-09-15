const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const LoggerWrapper = require('../../log/logger-wrapper');
const notificationHandlerFactory = require('./notification-handler-factory');
const { models: mongooseSchema } = require('../../database/mongo');
const ApplicationCrypto = require('../../crypto');

class NotificationScheduler {
  constructor(schedulerName, configuration, options = {}, relatedSchemaName) {
    this.options = options;
    this.schedulerName = schedulerName;
    this.logger = new LoggerWrapper({ prefix: `Notification scheduler "${this.schedulerName}":` });
    this.configuration = configuration;
    this.notificationHandlerFactory = notificationHandlerFactory;
    this.schema = mongooseSchema;
    this.relatedSchemaHandlers = [];
    if (_.isString(relatedSchemaName)) {
      this.relatedSchema = this.schema[relatedSchemaName];
      this.relatedSchemaHandlers = Object.keys(this.relatedSchema.schema.statics);
    }
    this.lsp = null;
    const { CRYPTO_KEY_PATH } = configuration.environment;
    this.crypto = new ApplicationCrypto(CRYPTO_KEY_PATH);
  }

  async retrieveLsp(lspId) {
    if (_.isNil(this.lsp)) {
      this.lsp = await this.schema.Lsp.findOne({ _id: lspId });
    }

    return this.lsp;
  }

  shouldSendEmail(notificationDelay, updatedAt, flags) {
    this.logger.debug('checking if notification should be sent now.');
    const mockServerTime = _.get(flags, 'mockServerTime');
    const mock = _.get(flags, 'mock');
    this.logger.debug(`delay minutes ${notificationDelay} updatedAt ${updatedAt}`);
    if (!_.isNil(mockServerTime) && mock) {
      this.logger.debug(`using mockServerTime of ${mockServerTime}`);
      return moment(mockServerTime).add(notificationDelay, 'minutes').diff(moment()) <= 0;
    }

    return moment(updatedAt).add(notificationDelay, 'minutes').diff(moment()) <= 0;
  }

  async processNotifications(params) {
    const processedNotifications = [];
    const { notificationsFromDb, emailConfig, notificationDelay, lsp } = params;
    const notificationPromises = [];
    const test = _.get(emailConfig, 'test', false);
    const flags = _.get(emailConfig, 'flags', {});
    if (!test) {
      const lspEmailconnectionString = _.get(lsp, 'emailConnectionString');
      if (!_.isEmpty(lspEmailconnectionString)) {
        const emailConnectionString = this.crypto.decrypt(lspEmailconnectionString);
        Object.assign(emailConfig, { emailConnectionString });
      }
    }
    await Promise.mapSeries(notificationsFromDb, (notification) => {
      const n = notification.toObject();
      if (_.isEmpty(emailConfig.email) && !_.isEmpty(n.email)) {
        Object.assign(emailConfig, n.email);
      }
      const handler = this.notificationHandlerFactory(n, emailConfig, flags);
      if (this.shouldSendEmail(notificationDelay, n.updatedAt, flags)) {
        this.logger.debug(`sending notification at ${new Date()}.`);
        notificationPromises.push({
          notification: n,
          handle: () => handler.handle(),
        });
      }
    });
    if (notificationPromises.length) {
      const emailMapper = promiseFactory => promiseFactory.handle()
        .then(() => {
          processedNotifications.push(promiseFactory.notification);
        }).catch((err) => {
          const error = _.get(err, 'message', err);
          promiseFactory.notification.error = error;
          processedNotifications.push(promiseFactory.notification);
          this.logger.debug(`Error processing notification: ${error}`);
        });
      return Promise.map(notificationPromises, emailMapper, { concurrency: 10 }).then(() => {
        if (notificationPromises.length > 0) {
          return this.schema.Notification.setProcessed(processedNotifications)
            .then(() => {
              if (this.relatedSchemaHandlers.includes('handleNotificationResults')) {
                return this.relatedSchema.handleNotificationResults(notificationPromises);
              }
              return Promise.resolve();
            })
            .catch((err) => {
              this.logger.warn(`Error saving processed notifications: ${err}`);
            });
        }
      });
    }
  }

  run(job, cb = () => {}) {
    try {
      const emailConfig = job.attrs.data;
      let scheduler;
      let notificationDelay;
      const lspId = emailConfig.lspId;
      return this.retrieveLsp(lspId)
        .then(async (lsp) => {
          scheduler = await this.schema.Scheduler.findOne({ name: this.schedulerName, lspId }).select('options').lean();
          notificationDelay = _.get(scheduler, 'options.notificationDelay', 0);
          return this.schema.Notification.findUnprocessed(this.schedulerName, lspId)
            .then((notificationsFromDb) => {
              this.logger.debug(`Processing ${notificationsFromDb.length} notifications`);
              // eslint-disable-next-line max-len
              return this.processNotifications({ notificationsFromDb, emailConfig, notificationDelay, lsp });
            })
            .catch((err) => {
              this.logger.debug(`Error processing notifications ${err}`);
            })
            .finally(() => {
              cb();
            });
        });
    } catch (error) {
      this.logger.error(`Failed to process notifications with error ${error}`);
      cb(error);
    }
  }
}

module.exports = NotificationScheduler;
