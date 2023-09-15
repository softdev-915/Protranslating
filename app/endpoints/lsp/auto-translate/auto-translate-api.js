const _ = require('lodash');
const moment = require('moment');
const SchemaAwareAPI = require('../../schema-aware-api');
const { RestError } = require('../../../components/api-response');
const RecognitionRunner = require('../../../components/gvision/recognition-runner');
const TranslationRunner = require('../../../components/gvision/translation-runner');
const OCRDeletingRunner = require('../../../components/gvision/ocr-deleting-runner');

const schedulerRunnersFactory = {
  'auto-pdf-to-mt-text-recognition': (schema, lsp, flags) => new RecognitionRunner(schema, lsp, flags),
  'auto-pdf-to-mt-text-translation': (schema, lsp, flags) => new TranslationRunner(schema, lsp, flags),
  'auto-pdf-to-mt-text-deleting': (schema, lsp, flags) => new OCRDeletingRunner(schema, lsp, flags),
};

class AutoTranslateApi extends SchemaAwareAPI {
  async addSuccessfulExecution(lspId, schedulerName) {
    await this.schema.Scheduler.findOneAndUpdate({ name: schedulerName, lspId }, {
      $push: {
        executionHistory: { $each: [{ executed: new Date(), status: 'success' }, { executed: new Date(), status: 'running' }], $position: 0, $slice: 24 },
      },
    }, { runValidators: true, new: true });
  }

  async runScheduler(lspId, { entityId, schedulerName }) {
    const apiFactory = schedulerRunnersFactory[schedulerName];
    if (!apiFactory) {
      this.logger.error(`No translation scheduler with name ${schedulerName} found`);
      throw new RestError(500, { message: `No translation scheduler with name ${schedulerName} found` });
    }
    const lsp = await this.schema.Lsp.findOne({ _id: lspId });
    const scheduler = await this.schema.Scheduler.findOneWithDeleted({
      name: schedulerName,
      lspId,
    });
    if (scheduler.deleted) {
      throw new RestError(503, { message: 'Scheduler is inactive and can\'t be run' });
    }
    const api = apiFactory(this.schema, lsp, this.flags);
    if (schedulerName === 'auto-pdf-to-mt-text-deleting') {
      const mockServerDate = _.get(this, 'flags.mockServerTime', null);
      const date = mockServerDate ? moment(mockServerDate, 'YYYY-MM-DDThh:mm:ss') : moment();
      await api.runAll(date.toDate());
      await this.addSuccessfulExecution(lspId, schedulerName);
      return;
    }
    const request = await this.schema.Request.findOne({ _id: entityId, lspId }).lean();
    if (!request) {
      this.logger.error(`No request found for id ${entityId} running ${schedulerName} scheduler.`);
      throw new RestError(500, { message: `No request found for id ${entityId} running ${schedulerName} scheduler.` });
    }
    if (request.workflowType !== 'Auto Scan PDF to MT Text') {
      this.logger.error(`Request ${entityId} does not have workflowType 'Auto Scan PDF to MT Text'`);
      throw new RestError(500, { message: `Request ${entityId} does not have workflowType 'Auto Scan PDF to MT Text'` });
    }
    await api.processOneRequest(request);
    await this.addSuccessfulExecution(lspId, schedulerName);
  }
}

module.exports = AutoTranslateApi;
