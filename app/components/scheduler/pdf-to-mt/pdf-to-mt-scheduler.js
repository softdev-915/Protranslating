const _ = require('lodash');
const logger = require('../../log/scheduler-logger');

class PdfToMtBaseScheduler {
  constructor(schema) {
    this.currentJob = '';
    this.logger = logger;
    this.schema = schema;
  }

  getLogMessage(message) {
    const name = _.get(this.currentJob, 'attrs.data.nameWithoutLsp', 'pdf-to-mt-deleting');
    return `Running ${name} job: ${message}`;
  }

  async getLsp() {
    const lspId = _.get(this, 'currentJob.attrs.data.lspId');
    if (_.isNil(lspId)) {
      const message = this.getLogMessage('No lspId defined');
      this.logger.error(message);
      throw new Error(message);
    }
    const lsp = await this.schema.Lsp.findById(lspId, '_id name autoTranslateSettings');
    if (_.isNil(lsp)) {
      const message = this.getLogMessage(`No LSP with id ${lspId} found`);
      this.logger.error(message);
      throw new Error(message);
    }
    return lsp;
  }
}

module.exports = PdfToMtBaseScheduler;
