const _ = require('lodash');
const moment = require('moment');
const OCRDeletingRunner = require('../../gvision/ocr-deleting-runner');
const PdfToMtBaseScheduler = require('./pdf-to-mt-scheduler');

class RequestOCRDeletingScheduler extends PdfToMtBaseScheduler {
  async run(job, done) {
    this.currentJob = job;
    const lsp = await this.getLsp();
    try {
      this.logger.info(this.getLogMessage(`${lsp.name} started`));
      const runner = new OCRDeletingRunner(this.schema, lsp);
      const currentDate = moment().toDate();
      await runner.runAll(currentDate);
    } catch (error) {
      this.logger.error(this.getLogMessage(`Error ${JSON.stringify(error)}`));
    }
    this.logger.info(this.getLogMessage(`${lsp.name} ended`));
    if (_.isFunction(done)) {
      done();
    }
  }
}

module.exports = RequestOCRDeletingScheduler;
