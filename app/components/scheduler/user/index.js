const _ = require('lodash');
const logger = require('../../log/logger');
const { models: mongooseSchema } = require('../../database/mongo');

class InactivateUserScheduler {
  constructor(schedulerName, configuration, additionalOptions) {
    this.schedulerName = schedulerName;
    this.additionalOptions = additionalOptions;
    this.logger = logger;
    this.configuration = configuration;
    this.schema = mongooseSchema;
  }

  run(job, done) {
    this.logger.debug('About to inactivate users based on lastLoginAt date');
    const lspId = _.get(job, 'attrs.data.lspId');

    this.schema.User.inactivateUsers(
      this.additionalOptions.inactivePeriod,
      this.additionalOptions.mock,

      lspId,
    )
      .then(() => {
        this.logger.debug('Inactivate-user scheduler finished');
        done();
      })
      .catch((err) => {
        this.logger.warn(`Error running inactivate-user scheduler: ${err}`);
        done(err);
      });
  }
}

module.exports = InactivateUserScheduler;
