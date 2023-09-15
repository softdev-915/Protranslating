const _ = require('lodash');
const uuid = require('uuid');
const DocumentRetentionPolicyApplier = require('../../document-retention');
const logger = require('../../log/logger');

class DocumentRetentionScheduler {
  constructor(schedulerName, configuration, additionalOptions, schema) {
    this.additionalOptions = additionalOptions;
    this.schedulerName = schedulerName;
    this.logger = logger;
    this.configuration = configuration;
    this.schema = schema;
  }

  run(job, done) {
    const lspId = _.get(job, 'attrs.data.lspId');

    if (!lspId) {
      this.logger.error('Error running document-retention job: No lspId defined');
      throw new Error('Error running document-retention job: No lspId defined');
    }
    const runId = uuid.v4();
    const metadata = {
      runId,
      schedulerName: this.schedulerName,
    };
    this.logger.debug(`Document retention policy job from lsp: ${lspId} started.`, metadata);
    const documentRetention = new DocumentRetentionPolicyApplier(
      this.logger,
      this.configuration,
      this.schema,
      this.additionalOptions,
      lspId,
      metadata,
      _.get(job, 'attrs.data.params.flags', {}),
    );

    documentRetention.run(job)
      .then(() => {
        this.logger.debug('Document retention policy job done.', metadata);
        done();
      })
      .catch((err) => {
        done(err);
      });
  }
}

module.exports = DocumentRetentionScheduler;
