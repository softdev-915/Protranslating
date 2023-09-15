const _ = require('lodash');
const { validObjectId } = require('../../../utils/schema');
const { getUserFromSession } = require('../../../utils/request');
const { sendResponse } = require('../../../components/api-response');
const { getRoles, hasRole } = require('../../../utils/roles');
const configuration = require('../../../components/configuration');
const PortalCatApi = require('./portalcat-api');
const RequestApi = require('../request/request-api');
const WorkflowApi = require('../request/workflow/workflow-api');
const UserAPI = require('../user/user-api');

module.exports = {
  async getPipelinesStatus(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const pipelineId = _.get(req, 'swagger.params.pipelineId.value');
    const fileIds = _.get(req, 'swagger.params.fileIds.value');
    const types = _.get(req, 'swagger.params.types.value');
    const srcLangs = _.get(req, 'swagger.params.srcLangs.value');
    const tgtLangs = _.get(req, 'swagger.params.tgtLangs.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const statuses = await api.getPipelinesStatus(
      { requestId, pipelineId, fileIds, types, srcLangs, tgtLangs },
    );
    return sendResponse(res, 200, { statuses });
  },

  async stopPipelines(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const body = _.get(req, 'swagger.params.data.value');
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const response = await api.manipulatePipelines(Object.assign(body, { operationType: 'stop', requestId }));
    return sendResponse(res, response.status, response.data);
  },

  async runPipelines(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const body = _.get(req, 'swagger.params.data.value');
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const response = await api.manipulatePipelines(Object.assign(body, { requestId }));
    return sendResponse(res, response.status, response.data);
  },

  async getFileSegments(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const fileId = _.get(req, 'swagger.params.fileId.value');
    const filter = _.get(req, 'swagger.params.filter.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const segments = await api.getFileSegments({ requestId, workflowId, fileId, filter });
    return sendResponse(res, 200, { segments });
  },

  async getFileSegmentById(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const fileId = _.get(req, 'swagger.params.fileId.value');
    const segmentId = _.get(req, 'swagger.params.segmentId.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const segment = await api.getFileSegmentById({ requestId, workflowId, fileId, segmentId });
    return sendResponse(res, 200, { segment });
  },

  async assignFileSegmentsToUser(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const body = _.get(req, 'swagger.params.data.value');
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const segments = await api.assignFileSegmentsToUser({ requestId, ...body });
    return sendResponse(res, 200, { segments });
  },

  async getFileSegmentMt(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const segmentId = _.get(req, 'swagger.params.segmentId.value');
    const fileId = _.get(req, 'swagger.params.fileId.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const fileSegment = await api.getFileSegmentMt({ requestId, workflowId, fileId, segmentId });
    return sendResponse(res, 200, { fileSegment });
  },

  async updateFileSegment(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const segmentId = _.get(req, 'swagger.params.segmentId.value');
    const body = _.get(req, 'swagger.params.data.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const fileSegment = await api.updateFileSegment({ requestId, segmentId, body });
    return sendResponse(res, 200, { fileSegment });
  },

  async updateFileSegmentLocked(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const fileId = _.get(req, 'swagger.params.fileId.value');
    const segmentId = _.get(req, 'swagger.params.segmentId.value');
    const body = _.get(req, 'swagger.params.data.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const fileSegment = await api.updateFileSegmentLocked({
      requestId, workflowId, fileId, segmentId, body,
    });
    return sendResponse(res, 200, { fileSegment });
  },

  async updateFileSegmentQaIssues(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const taskId = _.get(req, 'swagger.params.taskId.value');
    const fileId = _.get(req, 'swagger.params.fileId.value');
    const segmentId = _.get(req, 'swagger.params.segmentId.value');
    const body = _.get(req, 'swagger.params.data.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const fileSegment = await api.updateFileSegmentQaIssues({
      requestId, workflowId, taskId, fileId, segmentId, body,
    });
    return sendResponse(res, 200, { fileSegment });
  },

  async searchFileSegments(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const body = _.get(req, 'swagger.params.data.value');
    const tzOffset = _.get(req.headers, 'lms-tz', '0');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const fileSegments = await api.searchFileSegments({
      requestId,
      workflowId,
      body,
      tzOffset,
    });
    return sendResponse(res, 200, { fileSegments });
  },

  async replaceFileSegmentsContent(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const body = _.get(req, 'swagger.params.data.value');
    const tzOffset = _.get(req.headers, 'lms-tz', '0');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const fileSegments = await api.replaceFileSegmentsContent({
      requestId,
      workflowId,
      body,
      tzOffset,
    });
    return sendResponse(res, 200, { fileSegments });
  },

  async getSupportedFiles(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const filesList = await api.getSupportedFiles(requestId, workflowId);
    return sendResponse(res, 200, { filesList });
  },

  async getPipelines(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const fileId = _.get(req, 'swagger.params.fileId.value');
    const type = _.get(req, 'swagger.params.type.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const pipelines = await api.getPipelines({ requestId, workflowId, type, fileId });
    return sendResponse(res, 200, { pipelines });
  },

  async getPipelineActionConfig(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const pipelineId = _.get(req, 'swagger.params.pipelineId.value');
    const actionId = _.get(req, 'swagger.params.actionId.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const config = await api.getPipelineActionConfig(requestId, pipelineId, actionId);
    return sendResponse(res, 200, config);
  },

  async updatePipelineActionConfig(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const pipelineId = _.get(req, 'swagger.params.pipelineId.value');
    const actionId = _.get(req, 'swagger.params.actionId.value');
    const body = _.get(req, 'swagger.params.data.value');
    const mockLockingFailed = _.get(req, 'headers[lms-mocklockingfailed]', 'false') === 'true';
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const config = await api.updatePipelineActionConfig(
      requestId, pipelineId, actionId, body.config, mockLockingFailed,
    );
    return sendResponse(res, 200, config);
  },

  async joinFileSegments(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const body = _.get(req, 'swagger.params.data.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const fileSegment = await api.joinFileSegments({ requestId, ...body });
    return sendResponse(res, 200, { fileSegment });
  },

  async splitFileSegments(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const body = _.get(req, 'swagger.params.data.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const fileSegments = await api.splitFileSegments({ requestId, ...body });
    return sendResponse(res, 200, { fileSegments });
  },

  async searchTm(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const searchIn = _.get(req, 'swagger.params.searchIn.value');
    const text = _.get(req, 'swagger.params.text.value');
    const threshold = _.get(req, 'swagger.params.threshold.value');
    const isConcordanceSearch = _.get(req, 'swagger.params.isConcordanceSearch.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const tmSegments = await api.searchTm({
      requestId, workflowId, searchIn, text, threshold, isConcordanceSearch,
    });
    return sendResponse(res, 200, { tmSegments });
  },

  async searchTb(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const searchIn = _.get(req, 'swagger.params.searchIn.value');
    const text = _.get(req, 'swagger.params.text.value');
    const threshold = _.get(req, 'swagger.params.threshold.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const tbEntries = await api.searchTb({ requestId, workflowId, searchIn, text, threshold });
    return sendResponse(res, 200, { tbEntries });
  },

  async performRequestAnalysis(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const api = new PortalCatApi(
      req.$logger,
      { sessionID, user, configuration },
      requestApi,
    );
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const lockedSegments = _.get(req, 'swagger.params.data.value');
    const response = await api.performRequestAnalysis(requestId, lockedSegments);
    return sendResponse(res, 200, response.data);
  },

  async getRequestAnalysisStatus(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const status = await api.getRequestAnalysisStatus(requestId);
    return sendResponse(res, 200, status);
  },

  async getRequestAnalysis(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const withFuzzyMatches = _.get(req, 'swagger.params.withFuzzyMatches.value');
    let requestAnalysis = await api.getRequestAnalysis({ requestId, withFuzzyMatches });
    const userRoles = getRoles(user);
    const canReadAll = hasRole('STATISTICS_READ_ALL', userRoles);
    const canReadCompany = hasRole('STATISTICS_READ_COMPANY', userRoles);
    const canReadOwn = hasRole('STATISTICS_READ_OWN', userRoles);

    if (!canReadAll) {
      const userId = user._id;
      const userCompanyId = _.get(user, 'company._id');
      const filterByUserId = ra => ra.userId === userId;
      const filterByCompanyId = ra => ra.companyId === userCompanyId;
      if (canReadCompany && canReadOwn) {
        requestAnalysis = requestAnalysis.filter(ra => filterByCompanyId(ra) || filterByUserId(ra));
      } else if (canReadCompany) {
        requestAnalysis = requestAnalysis.filter(filterByCompanyId);
      } else if (canReadOwn) {
        requestAnalysis = requestAnalysis.filter(filterByUserId);
      }
    }

    const providerIds = requestAnalysis.map(({ userId }) => userId).filter(validObjectId);
    const userApi = new UserAPI(req.$logger, { configuration });
    const users = await userApi.findByIds(providerIds);
    const providers = users.map(({ _id, firstName, lastName }) => ({ _id: _id.toString(), userName: `${firstName} ${lastName}` }));
    requestAnalysis.forEach((ra) => {
      const provider = providers.find(p => p._id === ra.userId);
      ra.userName = _.get(provider, 'userName', ra.userId === 'system' ? 'All' : ra.userId);
    });
    return sendResponse(res, 200, { requestAnalysis });
  },

  async getRequestProgress(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const requestProgress = await api.getRequestProgress(requestId);
    return sendResponse(res, 200, { requestProgress });
  },

  async getTaskProgress(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const taskId = _.get(req, 'swagger.params.taskId.value');
    const taskProgress = await api.getTaskProgress({ requestId, workflowId, taskId });
    return sendResponse(res, 200, { taskProgress });
  },

  async getFileSegmentHistory(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const segmentId = _.get(req, 'swagger.params.segmentId.value');
    const fileId = _.get(req, 'swagger.params.fileId.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const fileSegments =
      await api.getFileSegmentHistory({ requestId, workflowId, fileId, segmentId });
    return sendResponse(res, 200, { fileSegments });
  },

  async getRequestRepetitions(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const tgtLang = _.get(req, 'swagger.params.tgtLang.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const repetitions = await api.getRequestRepetitions({ requestId, tgtLang });
    return sendResponse(res, 200, { repetitions });
  },

  async getRequestQaIssues(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const qaIssues = await api.getRequestQaIssues(requestId);
    return sendResponse(res, 200, { qaIssues });
  },

  async getFinalFilesListByRequest(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const finalFilesList = await api.getFinalFilesListByRequest(requestId);
    return sendResponse(res, 200, finalFilesList);
  },

  async getFinalFilesZipByRequest(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const finalFiles = await api.getFinalFilesZipByRequest(requestId);
    res.setHeader('Content-Type', finalFiles.headers['content-type']);
    res.setHeader('Content-Disposition', finalFiles.headers['content-disposition']);
    finalFiles.data.pipe(res);
  },

  async getFinalFilesListByRequestLanguageCombination(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const srcLang = _.get(req, 'swagger.params.srcLang.value');
    const tgtLang = _.get(req, 'swagger.params.tgtLang.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const finalFilesList = await api.getFinalFilesListByRequestLanguageCombination({
      requestId,
      srcLang,
      tgtLang,
    });
    return sendResponse(res, 200, finalFilesList);
  },

  async getFinalFilesZipByRequestLanguageCombination(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const { requestId, srcLang, tgtLang } = _.get(req, 'swagger.params');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    const finalFiles = await api.getFinalFilesZipByRequestLanguageCombination({
      requestId: requestId.value,
      srcLang: srcLang.value,
      tgtLang: tgtLang.value,
    });
    res.setHeader('Content-Type', finalFiles.headers['content-type']);
    res.setHeader('Content-Disposition', finalFiles.headers['content-disposition']);
    finalFiles.data.pipe(res);
  },

  async confirmAllSegments(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const fileId = _.get(req, 'swagger.params.fileId.value');
    const status = _.get(req, 'swagger.params.status.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    await api.confirmAllSegments({ requestId, workflowId, fileId, status });
    return sendResponse(res, 200);
  },

  async ignoreAllIssues(req, res) {
    const { sessionID } = req;
    const user = getUserFromSession(req);
    const requestId = _.get(req, 'swagger.params.requestId.value');
    const workflowId = _.get(req, 'swagger.params.workflowId.value');
    const fileId = _.get(req, 'swagger.params.fileId.value');
    const requestApi = new RequestApi({ log: req.$logger, user, configuration });
    const workflowApi = new WorkflowApi({ logger: req.$logger, user, configuration, requestApi });
    const api = new PortalCatApi(
      req.$logger, { sessionID, user, configuration }, requestApi, workflowApi,
    );
    await api.ignoreAllIssues({ requestId, workflowId, fileId });
    return sendResponse(res, 200);
  },
};
