const _ = require('lodash');
const TranslationRunner = require('../../gvision/translation-runner');
const PdfToMtBaseScheduler = require('./pdf-to-mt-scheduler');

class RequestTextTranslationScheduler extends PdfToMtBaseScheduler {
  async run(job, done) {
    this.currentJob = job;
    const lsp = await this.getLsp();
    try {
      this.logger.info(this.getLogMessage(`${lsp.name} started`));
      const runner = new TranslationRunner(this.schema, lsp);
      await runner.runAll();
    } catch (error) {
      this.logger.error(this.getLogMessage(`Error ${JSON.stringify(error.message)}`));
    }
    this.logger.info(this.getLogMessage(`${lsp.name} ended`));
    if (_.isFunction(done)) {
      done();
    }
  }
}

module.exports = RequestTextTranslationScheduler;
