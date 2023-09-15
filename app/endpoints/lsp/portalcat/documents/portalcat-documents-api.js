const _ = require('lodash');
const Promise = require('bluebird');
const archiver = require('archiver');
const SchemaAwareApi = require('../../../schema-aware-api');
const { validObjectId, areObjectIdsEqual } = require('../../../../utils/schema');
const { RestError, fileContentDisposition } = require('../../../../components/api-response');
const FileStorageFacade = require('../../../../components/file-storage');
const CloudStorage = require('../../../../components/cloud-storage');

class PortalCatDocumentApi extends SchemaAwareApi {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = options.configuration;
  }

  async findActionFile(pipelineId, actionId, fileId) {
    let pipeline;

    if (validObjectId(pipelineId)) {
      pipeline = await this.schema.PortalcatPipeline.findById(pipelineId);
    } else {
      throw new RestError(400, { message: 'Invalid ObjectID' });
    }
    if (_.isNil(pipeline)) {
      throw new RestError(404, { message: 'Pipeline not found' });
    }

    const action = _.get(pipeline, 'currentActions', []).find(currentAction => areObjectIdsEqual(currentAction._id, actionId));
    const file = _.get(action, 'downloads', []).find(download => areObjectIdsEqual(download.fileId, fileId));
    const company = _.get(pipeline, 'companyId');
    const request = _.get(pipeline, 'requestId');
    const fileStorageFacade = new FileStorageFacade(this.lspId, this.configuration, this.logger);
    const fileStorage = fileStorageFacade.pipelineActionFile({
      pipeline, request, company, action, file,
    }, true);

    fileStorage.filename = _.get(file, 'fileName', '');
    return fileStorage;
  }

  async serveActionsFilesZip(res, pipelineId) {
    const pipeline = await this.schema.PortalcatPipeline.findById(pipelineId);
    if (_.isNil(pipeline)) {
      throw new RestError(404, { message: `Pipeline with ID ${pipelineId} was not found` });
    }
    const archiveZip = archiver('zip');
    const cloudStorage = new CloudStorage(this.configuration);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', fileContentDisposition('actions-files.zip'));
    archiveZip.pipe(res);
    await Promise.each(pipeline.currentActions, async (action) => {
      const actionFile = _.last(action.downloads);
      if (_.isNil(actionFile)) {
        return;
      }
      try {
        const actionFileInfo =
          await this.findActionFile(pipelineId, action._id, actionFile.fileId);
        const cloudFile = await cloudStorage.gcsGetFile(actionFileInfo.path);
        const cloudFileReadStream = cloudFile.createReadStream();
        archiveZip.append(cloudFileReadStream, { name: actionFile.fileName });
      } catch (err) {
        this.logger.error(`Exporting action file with ID ${actionFile.fileId} failed: ${err.message}`);
      }
    });
    archiveZip.finalize();
  }
}

module.exports = PortalCatDocumentApi;
