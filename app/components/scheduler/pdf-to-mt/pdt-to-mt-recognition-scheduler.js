const _ = require('lodash');
const RecognitionRunner = require('../../gvision/recognition-runner');
const PdfToMtBaseScheduler = require('./pdf-to-mt-scheduler');

class RequestTextRecognitionScheduler extends PdfToMtBaseScheduler {
  async run(job, done) {
    this.currentJob = job;
    const lsp = await this.getLsp();
    try {
      this.logger.info(this.getLogMessage(`${lsp.name} started`));
      const runner = new RecognitionRunner(this.schema, lsp);
      await runner.runAll();
    } catch (error) {
      this.logger.error(this.getLogMessage(`Error ${JSON.stringify(error)}`));
    }
    this.logger.info(this.getLogMessage(`${lsp.name} ended`));
    if (_.isFunction(done)) {
      done();
    }
  }
}

module.exports = RequestTextRecognitionScheduler;
