const mongoose = require('mongoose');
const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');
const ActivityAPI = require('./activity-api');
const ActivityDocumentAPI = require('./document/activity-document-api');
const CloudStorage = require('../../../components/cloud-storage');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');

const { sendResponse, streamFile, RestError } = apiResponse;

module.exports = {
  async activityExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new ActivityAPI(req.$logger, { user, configuration, mock: req.flags.mock });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'activityExport', req });
    const file = await paginableApiDecorator.list(filters);

    streamFile(res, file);
  },
  async activityList(req, res) {
    const activityFilters = {};
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const activityAPI = new ActivityAPI(req.$logger, { user, configuration, mock: req.flags.mock });
    const activityId = _.get(req, 'swagger.params.activityId.value');

    // Set filter params
    activityFilters.__tz = _.get(req.headers, 'lms-tz', '0');
    activityFilters.attributes = _.get(req, 'swagger.params.attributes.value');
    activityFilters.deleted = _.get(req, 'swagger.params.withDeleted.value');
    activityFilters.lspId = lspId;
    if (activityId) {
      activityFilters._id = activityId;
    }

    // Make request
    const paginableApiDecorator = new PaginableAPIDecorator(activityAPI, req, { listMethod: 'activityList' });
    const activities = await paginableApiDecorator.list(activityFilters);

    if (activityId) {
      if (activities && activities.list.length) {
        return sendResponse(res, 200, {
          activity: activities.list[0],
        });
      }
      throw new RestError(404, { message: `Activity ${activityId} does not exist` });
    } else {
      return sendResponse(res, 200, activities);
    }
  },
  async activityCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const activityAPI = new ActivityAPI(req.$logger, { user, configuration, mock: req.flags.mock });
    const activity = _.get(req, 'swagger.params.data.value');
    const activityCreated = await activityAPI.create(activity);

    return sendResponse(res, 200, { activity: activityCreated });
  },
  async activityUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const activityAPI = new ActivityAPI(req.$logger, { user, configuration, mock: req.flags.mock });
    const activity = _.get(req, 'swagger.params.data.value');
    const activityId = _.get(req, 'swagger.params.activityId.value');

    activity._id = activityId;
    const updatedActivity = await activityAPI.update(activity);

    return sendResponse(res, 200, { activity: updatedActivity });
  },
  async sendQuote(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const activityAPI = new ActivityAPI(req.$logger, { user, configuration, mock: req.flags.mock });
    const activityId = _.get(req, 'swagger.params.activityId.value');

    try {
      const updatedActivity = await activityAPI.sendQuote(activityId);

      return sendResponse(res, 200, { activity: updatedActivity });
    } catch (err) {
      req.$logger.error(err);
      throw new RestError(404, { message: 'Failed to send quote', stack: `${err.stack}` });
    }
  },
  async serveFile(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const activityId = _.get(req, 'swagger.params.activityId.value');
    const documentId = _.get(req, 'swagger.params.documentId.value');
    const activityDocumentAPI = new ActivityDocumentAPI(user, configuration, req.$logger);
    const file = await activityDocumentAPI
      .buildActivityFeedbackDocumentFilePath(activityId, documentId);

    res.setHeader('Content-Disposition', apiResponse.fileContentDisposition(file.name));
    const cloudStorage = new CloudStorage(configuration);

    try {
      const cloudFile = await cloudStorage.gcsGetFile(file.path);

      return cloudFile.createReadStream().pipe(res);
    } catch (error) {
      if (_.isNil(activityId)) {
        throw new RestError(404, { message: 'The file does not exist' });
      }
      activityDocumentAPI.renameFeedbackFile(activityId, documentId)
        .then(async (renamedFilePath) => {
          const cloudFile = await cloudStorage.gcsGetFile(renamedFilePath);

          return cloudFile.createReadStream().pipe(res);
        }).catch(() => {
          throw new RestError(404, { message: 'The file does not exist' });
        });
    }
  },
  async serveEmailActivityFile(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const activityId = _.get(req, 'swagger.params.activityId.value');
    const documentId = _.get(req, 'swagger.params.documentId.value');
    const documentName = _.get(req, 'swagger.params.filename.value');
    const cloudStorage = new CloudStorage(configuration);
    const activityDocumentApi = new ActivityDocumentAPI(user, configuration, req.$logger);
    const file = await activityDocumentApi.buildActivityEmailFilePath(
      activityId,
      documentId,
      documentName,
    );

    try {
      const cloudFile = await cloudStorage.gcsGetFile(file.path);
      const filenameSplitted = _.split(cloudFile.name, '/');

      res.setHeader('Content-Disposition', apiResponse.fileContentDisposition(filenameSplitted[filenameSplitted.length - 1]));
      cloudFile.createReadStream().pipe(res);
    } catch (error) {
      if (_.isNil(activityId)) {
        throw new RestError(404, { message: 'The file does not exist', stack: error.stack });
      }
      activityDocumentApi.renameEmailFile(activityId, documentId).then(async (renamedFilePath) => {
        const cloudFile = await cloudStorage.gcsGetFile(renamedFilePath);
        const filenameSplitted = _.split(cloudFile.name, '/');

        res.setHeader('Content-Disposition', apiResponse.fileContentDisposition(filenameSplitted[filenameSplitted.length - 1]));
        cloudFile.createReadStream().pipe(res);
      }).catch((err) => {
        throw new RestError(404, { message: 'The file does not exist', stack: err.stack });
      });
    }
  },
  async serveFilesZip(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const activityId = _.get(req, 'swagger.params.activityId.value');
    const documentIds = _.get(req, 'swagger.params.documentIds.value');
    const activityAPI = new ActivityAPI(
      req.$logger,
      {
        user, configuration, lspId, mock: req.flags.mock,
      },
    );

    _.each(documentIds, (docId) => {
      if (!mongoose.isValidObjectId(docId)) {
        throw new RestError(400, { message: `document id ${docId} is not valid' ` });
      }
    });
    try {
      await activityAPI.zipFilesStream(user, activityId, documentIds, res);
    } catch (e) {
      const message = e.message || e;

      req.$logger.error(`Error serving zip file. Error: ${message}`);
      throw new RestError(500, { message: 'Error building zip file', stack: e.stack });
    }
  },
  async sendInvoiceEmail(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const activityId = _.get(req, 'swagger.params.activityId.value');
    const activityAPI = new ActivityAPI(
      req.$logger,
      {
        user, configuration, lspId, mock: req.flags.mock,
      },
    );

    try {
      const activity = await activityAPI.sendInvoiceEmail(activityId);
      return sendResponse(res, 200, { activity });
    } catch (e) {
      const message = e.message || e;

      req.$logger.error(`Error sending email notification. Error: ${message}`);
      throw new RestError(500, { message: 'Error sending email notification', stack: e.stack });
    }
  },
};
