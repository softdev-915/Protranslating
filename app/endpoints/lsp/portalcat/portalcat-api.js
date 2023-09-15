const _ = require('lodash');
const path = require('path');
const { URL } = require('url');
const Promise = require('bluebird');
const { Types: { ObjectId }, isValidObjectId } = require('mongoose');
const AxiosBasedApi = require('../../axios-based-api');
const { RestError } = require('../../../components/api-response');
const PortalCatSettingsApi = require('../portalcat-settings/portalcat-settings-api');
const { areObjectIdsEqual, extractChildArray } = require('../../../utils/schema');
const { getRequestDocuments, getLanguageCombinationByDocumentId } = require('../request/request-api-helper');
const { findWorkflowsByLangs } = require('../request/workflow-helpers');
const { buildPcSearchBody } = require('./portalcat-helpers');
const TranslationMemoryApi = require('./translation-memory/translation-memory-api');
const { getRoles, hasRole } = require('../../../utils/roles');

const PIPELINE_OPERATION_FILE_SCOPE = 'file';
const PIPELINE_OPERATION_TASK_SCOPE = 'task';
const PIPELINE_OPERATION_REQUEST_SCOPE = 'request';
const RESOURCE_TYPE_TM = 'tm';
const RESOURCE_TYPE_TB = 'tb';
const PORTALCAT_PIPELINE_TYPE_IMPORT = 'import';
const PORTALCAT_PIPELINE_TYPE_MT = 'mt';
const PORTALCAT_PIPELINE_TYPE_QA = 'qa';
const PORTALCAT_PIPELINE_TYPE_LOCKING = 'locking';
const PORTALCAT_PIPELINE_STATUS_SUCCEEDED = 'succeeded';
const PORTALCAT_PIPELINE_STATUS_FAILED = 'failed';
const PORTALCAT_PIPELINE_STATUS_STOPPED = 'stopped';
const LOCKING_PIPELINE_FAILED_MESSAGE = 'Failed to apply locking configuration.';
const PIPELINE_STATUS_CHECK_INTERVAL = 5000;
const PIPELINE_STATUS_CHECK_RETRIES = 100;
const SEARCH_IN_SOURCE = 'source';
const UPDATE_SEGMENT_ALLOWED_FIELDS = [
  'note',
  'position',
  'source',
  'target',
  'status',
  'qaIssues',
  'isAutoSuggestion',
];
const UPDATE_SEGMENT_QA_ISSUES_ALLOWED_FIELDS = ['locQualityIssueEnabled'];
const PIPELINE_OPERATION_TYPE_ANALYZE = 'analyze';
const PIPELINE_OPERATION_TYPE_RUN = 'run';
const PIPELINE_OPERATION_TYPE_STOP = 'stop';
const PIPELINE_OPERATION_TYPE_CREATE = 'create';
const REPLACE_SEGMENT_CONTENT_SCOPE_ALL = 'all';
const FILE_SEGMENT_STATUS_CONFIRMED_BY_TRANSLATOR = 'CONFIRMED_BY_TRANSLATOR';
const FILE_SEGMENT_STATUS_CONFIRMED_BY_EDITOR = 'CONFIRMED_BY_EDITOR';
const FILE_SEGMENT_STATUS_CONFIRMED_BY_QA_EDITOR = 'CONFIRMED_BY_QA_EDITOR';
const FILE_SEGMENT_STATUS_UNCONFIRMED = 'UNCONFIRMED';
const TASK_ABILITY_TRANSLATION = 'Translation';
const TASK_ABILITY_EDITING = 'Editing';
const TASK_ABILITY_PEMT = 'PEMT';
const TASK_ABILITY_QA = 'QA';
const FILE_SEGMENT_TOTAL_WORD_COUNT = 'TotalWordCount';
const TRANSLATION_ALLOWED_FILE_SEGMENT_STATUSES = [
  FILE_SEGMENT_STATUS_UNCONFIRMED,
  FILE_SEGMENT_STATUS_CONFIRMED_BY_TRANSLATOR,
];
const EDITING_ALLOWED_FILE_SEGMENT_STATUSES = TRANSLATION_ALLOWED_FILE_SEGMENT_STATUSES.concat(FILE_SEGMENT_STATUS_CONFIRMED_BY_EDITOR);
const QA_ALLOWED_FILE_SEGMENT_STATUSES = EDITING_ALLOWED_FILE_SEGMENT_STATUSES.concat(FILE_SEGMENT_STATUS_CONFIRMED_BY_QA_EDITOR);
const abilityToAssignedToMap = {
  Translation: 'assignedToTranslator',
  Editing: 'assignedToEditor',
  PEMT: 'assignedToEditor',
  QA: 'assignedToQaEditor',
};

function calculateFileProgress({ fileSegments = [], taskAbility, numWordsTotal }) {
  const progress = {
    translationProgress: 0,
    editingProgress: 0,
    qaProgress: 0,
  };
  fileSegments.forEach((segment) => {
    const { customProperties = [] } = segment;
    const { value: segmentTotalWords = 0 } = customProperties.find((property) => property.name === FILE_SEGMENT_TOTAL_WORD_COUNT);
    switch (segment.status) {
      case FILE_SEGMENT_STATUS_CONFIRMED_BY_TRANSLATOR:
        progress.translationProgress += +segmentTotalWords;
        break;
      case FILE_SEGMENT_STATUS_CONFIRMED_BY_EDITOR:
        progress.translationProgress += +segmentTotalWords;
        progress.editingProgress += +segmentTotalWords;
        break;
      case FILE_SEGMENT_STATUS_CONFIRMED_BY_QA_EDITOR:
        progress.translationProgress += +segmentTotalWords;
        progress.editingProgress += +segmentTotalWords;
        progress.qaProgress += +segmentTotalWords;
        break;
      default: break;
    }
  });
  Object.keys(progress).forEach((key) => {
    progress[key] = Math.min(progress[key], numWordsTotal);
  });
  if (!_.isNil(taskAbility)) {
    switch (true) {
      case new RegExp(TASK_ABILITY_TRANSLATION, 'i').test(taskAbility):
        return _.pick(progress, 'translationProgress');
      case new RegExp(TASK_ABILITY_EDITING, 'i').test(taskAbility):
        return _.pick(progress, 'editingProgress');
      case new RegExp(TASK_ABILITY_PEMT, 'i').test(taskAbility):
        return _.pick(progress, 'editingProgress');
      case new RegExp(TASK_ABILITY_QA, 'i').test(taskAbility):
        return _.pick(progress, 'qaProgress');
      default: return {};
    }
  }
  return progress;
}

class PortalCatApi extends AxiosBasedApi {
  constructor(logger, { sessionID, user, configuration }, requestApi, workflowApi) {
    const { PC_BASE_URL } = configuration.environment;
    const headers = {
      'x-session-id': sessionID,
    };
    super(logger, {
      user, configuration, baseUrl: PC_BASE_URL, headers,
    });
    this.configuration = configuration;
    this.requestApi = requestApi;
    this.workflowApi = workflowApi;
    this.portalCatSettingsApi = new PortalCatSettingsApi({
      user, logger, configuration, sessionID,
    });
    this.translationMemoryApi = new TranslationMemoryApi({
      logger, user, configuration, sessionID,
    });
  }

  getVersion() {
    return this.get('/api/version');
  }

  async getPipelinesStatus({
    requestId, pipelineId, fileIds, types, srcLangs, tgtLangs,
  }) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id languageCombinations');
    const companyId = _.get(request, 'company._id', '');
    const query = {
      lspId: this.lspId, companyId, requestId, _id: pipelineId,
    };
    if (!_.isEmpty(types)) {
      query.type = { $in: types };
    }
    if (!_.isNil(fileIds)) {
      query.fileId = { $in: fileIds };
    } else if (_.isNil(pipelineId)) {
      const activeDocumentsIds = await this._extractSupportedFiles(request).map((document) => document._id);
      query.fileId = { $in: activeDocumentsIds };
    }
    if (!_.isNil(srcLangs)) {
      query.srcLang = { $in: srcLangs };
    }
    if (!_.isNil(tgtLangs)) {
      query.tgtLang = { $in: tgtLangs };
    }
    const pipelines = await this._findPipelines(_.omitBy(query, _.isNil));
    if (_.isEmpty(pipelines)) {
      throw new RestError(404, {
        message: 'Pipelines not found',
      });
    }
    const arePipelinesQAType = pipelines.every((pipeline) => pipeline.type === PORTALCAT_PIPELINE_TYPE_QA);
    const userRoles = getRoles(this.user);
    if (!hasRole('PIPELINE-RUN_UPDATE_ALL', userRoles) && !hasRole('PIPELINE_READ_ALL', userRoles) && !arePipelinesQAType) {
      throw new RestError(403, { message: 'User is not authorized' });
    }
    const statuses = pipelines.map((pipeline) => {
      const { status } = pipeline;
      const body = _.pick(pipeline, ['_id', 'status', 'srcLang', 'tgtLang', 'fileName', 'type', 'fileId']);
      if (status === PORTALCAT_PIPELINE_STATUS_FAILED) {
        body.message = pipeline.message;
      }
      return body;
    });
    return statuses;
  }

  async getFileSegments({
    requestId,
    request,
    workflowId,
    workflow,
    fileId,
    srcIsoCode,
    tgtIsoCode,
    limit = 3000,
    page,
    filter,
  }) {
    if (_.isNil(request)) {
      request = await this.requestApi.findOne(requestId.toString(), 'company._id');
    }
    requestId = request._id;
    const companyId = _.get(request, 'company._id', '');
    if (_.isNil(workflow) && !_.isNil(workflowId)) {
      [workflow] = await this.workflowApi.find(requestId, [workflowId], {
        withCATData: false,
      });
    }
    if (!_.isNil(workflow)) {
      ({
        srcLang: { isoCode: srcIsoCode } = {},
        tgtLang: { isoCode: tgtIsoCode } = {},
      } = workflow);
    }
    if (_.isNil(srcIsoCode) || _.isNil(tgtIsoCode)) {
      throw new RestError(400, { message: 'Error retrieving TFSH: missing source and/or target languages' });
    }
    const endpoint = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${request._id}/sl/${srcIsoCode}/tl/${tgtIsoCode}/file/${fileId}/segments`;
    const url = new URL(endpoint, this.baseUrl);
    url.searchParams.append('limit', limit);
    if (!_.isNil(page)) {
      url.searchParams.append('page', page);
    }
    if (!_.isNil(filter)) {
      url.searchParams.append('filter', filter);
    }
    const finalUrl = url.pathname + url.search;
    try {
      const response = await this.get(finalUrl);
      return _.get(response, 'data.fileSegments', []);
    } catch (err) {
      throw new RestError(err.code, { message: `Error retrieving TFSH: ${err.message}` });
    }
  }

  async getFileSegmentById({
    requestId, workflowId, fileId, segmentId,
  }) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id workflows');
    const workflow = this._findWorkflow(request, workflowId);
    const companyId = _.get(request, 'company._id', '');
    const {
      srcLang: { isoCode: srcIsoCode } = {},
      tgtLang: { isoCode: tgtIsoCode } = {},
    } = workflow;
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/sl/${srcIsoCode}/tl/${tgtIsoCode}/file/${fileId}/segment/${segmentId}`;
    const response = await this.get(url);
    return _.get(response, 'data.fileSegment', []);
  }

  async getFileSegmentMt({
    requestId, workflowId, fileId, segmentId,
  }) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id workflows');
    const companyId = _.get(request, 'company._id', '');
    const workflow = this._findWorkflow(request, workflowId);
    const {
      srcLang: { isoCode: srcIsoCode } = {},
      tgtLang: { isoCode: tgtIsoCode } = {},
      useMt,
    } = workflow;
    if (!useMt) {
      this.logger.info('User tried to fetch MT with disabled MT');
      return null;
    }
    const endpoint = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/sl/${srcIsoCode}/tl/${tgtIsoCode}/file/${fileId}/segment/${segmentId}/mt`;
    let response;
    try {
      response = await this.get(endpoint);
    } catch (err) {
      const message = _.get(err, 'status.message', err.message);
      throw new RestError(err.code, { message: `Error translating TFSH: ${message}` });
    }
    return _.get(response, 'data.fileSegment');
  }

  async getSupportedFiles(requestId, workflowId) {
    const request = await this.requestApi.findOne(requestId.toString(), 'languageCombinations workflows');
    const workflow = this._findWorkflow(request, workflowId);
    const supportedFiles = await this._extractSupportedFiles(request, workflow);
    return _.sortBy(supportedFiles, (file) => file.name);
  }

  async getPipelines({
    requestId, workflowId, fileId, type, filter = {},
  }) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id workflows languageCombinations');
    const query = {
      lspId: this.lspId,
      requestId,
      companyId: _.get(request, 'company._id', ''),
      fileId,
      type,
      workflowId,
      ...filter,
    };
    if (_.isNil(fileId)) {
      const supportedFiles = await this._extractSupportedFiles(request);
      const fileIds = supportedFiles.map((file) => file._id);
      query.fileId = { $in: fileIds };
    }
    let pipelines = await this._findPipelines(_.pickBy(query, _.identity));
    if (!this.user.has('PIPELINE_READ_ALL')) {
      pipelines = pipelines.map((pipeline) => _.pick(pipeline, ['_id', 'type', 'fileId', 'fileName']));
    }
    return pipelines;
  }

  async getPipelineActionConfig(requestId, pipelineId, actionId) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id');
    const companyId = _.get(request, 'company._id', '').toString();
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/pipeline/${pipelineId}/action/${actionId}/config`;
    const response = await this.get(url);
    return _.get(response, 'data');
  }

  async updatePipelineActionConfig(
    requestId,
    pipelineId,
    actionId,
    actionConfigYaml,
    mockLockingFailed,
  ) {
    const [pipeline] = await this._findPipelines({ _id: pipelineId });
    if (pipeline.type === PORTALCAT_PIPELINE_TYPE_LOCKING && mockLockingFailed) {
      throw new RestError(400, { message: LOCKING_PIPELINE_FAILED_MESSAGE });
    }
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id');
    const companyId = _.get(request, 'company._id', '').toString();
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/pipeline/${pipelineId}/action/${actionId}/config`;
    const body = { actionConfigYaml };
    const response = await this.put(url, body);
    return _.get(response, 'data');
  }

  async createPipelines({
    requestId, languageCombinationId, srcLangFilter, tgtLangFilter, fileId, types = [],
  }) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id languageCombinations workflows');
    const companyId = _.get(request, 'company._id', '').toString();
    const languageCombination = _.get(request, 'languageCombinations', [])
      .find((combination) => areObjectIdsEqual(combination._id, languageCombinationId));
    if (!_.isNil(fileId)) {
      const documents = _.get(languageCombination, 'documents', []);
      const document = documents.find((d) => areObjectIdsEqual(d._id, fileId));
      const isDocumentSupported = !_.isNil(document) && this.isFileAllowed(document)
        && (await this.isFileFormatSupported(document.name));
      if (!isDocumentSupported) {
        return Promise.resolve();
      }
    }
    await this.ensureTm({ languageCombination, companyId });
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/pipelines`;
    const operations = await Promise.map(types, (type) => this.buildPcOperation({
      operation: PIPELINE_OPERATION_TYPE_CREATE,
      type,
      languageCombinations: [languageCombination],
      srcLangFilter,
      tgtLangFilter,
      documentId: fileId,
    }));
    const body = {
      userId: _.get(this, 'user._id'),
      operations,
    };
    const response = await this.post(url, body);
    return response;
  }

  async manipulatePipelines({
    operationType = PIPELINE_OPERATION_TYPE_RUN,
    requestId,
    workflowId,
    scope,
    pipelineId,
  }) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id languageCombinations workflows');
    const companyId = _.get(request, 'company._id', '');
    const [pipeline] = await this._findPipelines({ _id: pipelineId });
    if (_.isNil(pipeline)) {
      throw new RestError(404, {
        message: 'Pipeline not found',
      });
    }
    const { type } = pipeline;
    const userRoles = getRoles(this.user);
    const isOperationTypeRunOrStop = (operationType === PIPELINE_OPERATION_TYPE_RUN
      || operationType === PIPELINE_OPERATION_TYPE_STOP);
    if (isOperationTypeRunOrStop
      && type !== PORTALCAT_PIPELINE_TYPE_QA
      && !hasRole('PIPELINE-RUN_UPDATE_ALL', userRoles)) {
      throw new RestError(403, { message: 'User is not authorized' });
    }
    let operation;
    if (scope === PIPELINE_OPERATION_FILE_SCOPE) {
      const { fileId, srcLang, tgtLang } = pipeline;
      await this.ensureTm({ srcLangs: [srcLang], tgtLangs: [tgtLang], companyId });
      operation = {
        operation: operationType,
        pipelines: [{
          fileId, srcLang, tgtLang, type, workflowId,
        }],
      };
    } else if (scope === PIPELINE_OPERATION_TASK_SCOPE) {
      const { fileId } = pipeline;
      const languageCombination = _.defaultTo(getLanguageCombinationByDocumentId(request, fileId), {});
      await this.ensureTm({ languageCombination, companyId });
      let { documents: langCombinationFiles = [] } = languageCombination;
      langCombinationFiles = await this.filterDocumentsByPcAllowance(langCombinationFiles);
      operation = {
        operation: operationType,
        pipelines: langCombinationFiles.map((file) => Object.assign(
          _.pick(pipeline, ['srcLang', 'tgtLang', 'type']),
          { fileId: file._id, workflowId },
        )),
      };
      const pipelinesToSync = await this.getPipelines({
        requestId,
        type,
        workflowId,
        filter: { _id: { $ne: pipeline._id } },
      });
      await this._syncCurrentActionConfigs(pipeline, pipelinesToSync);
    } else if (scope === PIPELINE_OPERATION_REQUEST_SCOPE) {
      const languageCombinations = _.get(request, 'languageCombinations', []);
      await Promise.map(
        languageCombinations,
        (languageCombination) => this.ensureTm({ languageCombination, companyId }),
      );
      operation = await this.buildPcOperation({
        operation: operationType,
        type,
        languageCombinations,
        request,
      });
      const pipelinesToSync = await this.getPipelines({ requestId, type, filter: { _id: { $ne: pipeline._id } } });
      await this._syncCurrentActionConfigs(pipeline, pipelinesToSync);
    }
    if ((type === PORTALCAT_PIPELINE_TYPE_IMPORT || type === PORTALCAT_PIPELINE_TYPE_LOCKING)
      && operationType === PIPELINE_OPERATION_TYPE_RUN) {
      await this.requestApi.markStatisticsGenerated(requestId.toString());
    }
    return this.performPipelinesOperations({ requestId, operations: [operation] });
  }

  async performRequestAnalysis(requestId, lockedSegments) {
    await this.schema.Request.updateOne(
      { _id: new ObjectId(requestId) },
      { $set: { 'pcSettings.lockedSegments': lockedSegments } },
      { upsert: true },
    );
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id languageCombinations');
    const languageCombinations = _.get(request, 'languageCombinations', []);
    const groupedLanguages = await this._groupLanguagesByCombinations(languageCombinations);
    await Promise.map(groupedLanguages, async (groupedLCs) => {
      groupedLCs.documents = await Promise.filter(groupedLCs.documents, async (document) => {
        const importPipelines = await this.getPipelines({ requestId, type: 'import', fileId: document._id });
        return !_.isEmpty(importPipelines);
      });
    });
    const filteredGroupedLanguages = groupedLanguages
      .filter(groupedLCs => !_.isEmpty(groupedLCs.documents));
    const analysisOperations = await Promise.mapSeries(filteredGroupedLanguages,
      async (groupedLCs) => {
        const analysisOperation = await this.buildPcOperation({
          languageCombinations: [groupedLCs],
          request,
          operation: PIPELINE_OPERATION_TYPE_ANALYZE,
          type: PORTALCAT_PIPELINE_TYPE_IMPORT,
        });
        return analysisOperation;
      });
    const response = await this.performPipelinesOperations({
      requestId,
      operations: analysisOperations,
    });
    await this.requestApi.markStatisticsGenerated(requestId.toString(), true);
    return response;
  }

  async _groupLanguagesByCombinations(languageCombinations) {
    const grouppedLCs = [];
    await Promise.map(languageCombinations, async ({ srcLangs, tgtLangs, documents }) => {
      const filteredDocuments = await this.filterDocumentsByPcAllowance(documents);
      srcLangs.forEach((srcLang) => {
        if (_.isEmpty(filteredDocuments)) {
          return;
        }
        tgtLangs.forEach((tgtLang) => {
          grouppedLCs.push({
            documents: filteredDocuments,
            srcLangs: [srcLang],
            tgtLangs: [tgtLang],
          });
        });
      });
    });
    return grouppedLCs;
  }

  async performPipelinesOperations({ requestId, operations = [] }) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id');
    const companyId = _.get(request, 'company._id', '');
    await this._prepareImportDependantOperations(requestId, companyId, operations);
    const body = {
      userId: _.get(this, 'user._id'),
      operations,
    };
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/pipelines`;
    return await this.post(url, body);
  }

  async getSupportedFileFormats() {
    const lsp = await this.schema.Lsp.findById(this.lspId).populate('pcSettings.supportedFileFormats');
    const supportedFileFormatsExtensions = _.get(lsp, 'pcSettings.supportedFileFormats', [])
      .map((fileFormat) => fileFormat.extensions.split(',').map((extension) => extension.trim()));
    return _.flatten(supportedFileFormatsExtensions);
  }

  async isFileFormatSupported(filename) {
    const supportedFileFormats = await this.getSupportedFileFormats();
    return supportedFileFormats.includes(path.extname(filename));
  }

  isFileAllowed(document) {
    const documentObj = _.isFunction(document.toObject) ? document.toObject() : document;
    return !_.get(documentObj, 'isInternal', false)
      && !_.get(documentObj, 'isReference', false)
      && !_.get(documentObj, 'deleted', false);
  }

  async joinFileSegments({
    requestId, fileId, workflowId, segmentsIds = [],
  }) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id workflows');
    const workflow = this._findWorkflow(request, workflowId);
    const companyId = _.get(request, 'company._id', '');
    const {
      srcLang: { isoCode: srcIsoCode } = {},
      tgtLang: { isoCode: tgtIsoCode } = {},
    } = workflow;
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/sl/${srcIsoCode}/tl/${tgtIsoCode}/file/${fileId}/segments/join`;
    const body = {
      userId: _.get(this, 'user._id'),
      originalIds: segmentsIds,
    };
    let response;
    try {
      response = await this.post(url, body);
      await this.requestApi.markStatisticsGenerated(requestId.toString());
    } catch (err) {
      throw new RestError(err.code, { message: `Error joining file segment: ${err.message}` });
    }
    return _.get(response, 'data.fileSegment', null);
  }

  async splitFileSegments({
    requestId, fileId, workflowId, segmentId, position,
  }) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id workflows');
    const workflow = this._findWorkflow(request, workflowId);
    const companyId = _.get(request, 'company._id', '');
    const {
      srcLang: { isoCode: srcIsoCode } = {},
      tgtLang: { isoCode: tgtIsoCode } = {},
    } = workflow;
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/sl/${srcIsoCode}/tl/${tgtIsoCode}/file/${fileId}/segments/split`;
    const body = {
      userId: _.get(this, 'user._id'),
      originalId: segmentId,
      position,
    };
    let response;
    try {
      response = await this.post(url, body);
      await this.requestApi.markStatisticsGenerated(requestId.toString());
    } catch (err) {
      throw new RestError(err.code, { message: `Error splitting file segment: ${err.message}` });
    }
    return _.get(response, 'data.fileSegments', null);
  }

  async _findPipelines(query) {
    const pipelines = await this.schema.PortalcatPipeline
      .find(query).sort({ fileName: 1 });
    return pipelines;
  }

  async searchTm({
    requestId, workflowId, searchIn, text, threshold, isConcordanceSearch,
  }) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id');
    const [{ srcLang, tgtLang }] = await this.workflowApi.find(requestId, [workflowId], {
      withCATData: false,
    });
    const companyId = _.get(request, 'company._id', '');
    let descriptor;
    try {
      descriptor = await this.portalCatSettingsApi.findDescriptor(RESOURCE_TYPE_TM, {
        lspId: this.lspId,
        companyId: new ObjectId(companyId),
        'srcLang.isoCode': srcLang.isoCode,
        'tgtLang.isoCode': tgtLang.isoCode,
      });
    } catch (err) {
      if (err.code !== 404) {
        const message = _.get(err, 'message', err);
        throw new RestError(_.get(err, 'code', 500), { message });
      }
    }
    let tmSegments = [];
    if (_.isNil(descriptor)) {
      return tmSegments;
    }
    let concordanceSearchResults = [];
    if (isConcordanceSearch) {
      concordanceSearchResults = await this.translationMemoryApi.searchSegmentsFull({
        companyId,
        tmId: descriptor._id,
        body: {
          params: {
            sourceText: searchIn === SEARCH_IN_SOURCE ? text : '',
            targetText: searchIn === SEARCH_IN_SOURCE ? '' : text,
          },
        },
      });
      concordanceSearchResults = _.sortBy(
        concordanceSearchResults,
        (result) => _.get(result, `${searchIn}.text.length`),
      );
    }
    const simpleSearchPromise = this.translationMemoryApi.searchSegmentsSimple({
      companyId,
      tmId: descriptor._id,
      params: {
        text,
        lang: searchIn === SEARCH_IN_SOURCE ? srcLang.isoCode : tgtLang.isoCode,
        threshold,
      },
    });
    const searchResults = _.uniqWith(
      _.flatten(
        await Promise.all([concordanceSearchResults, simpleSearchPromise]),
      ),
      (resultA, resultB) => {
        const segmentA = _.get(resultA, 'tmSegment', resultA);
        const segmentB = _.get(resultB, 'tmSegment', resultB);
        return _.isEqual(segmentA.originalId, segmentB.originalId);
      },
    );
    tmSegments = await Promise.mapSeries(searchResults, async (result) => {
      const tmSegment = _.get(result, 'tmSegment', result);
      const tmMatchInfo = _.get(result, 'tmMatchInfo', {});
      const company = await this.schema.Company
        .findOneWithDeleted({ _id: new ObjectId(tmSegment.companyId) }).select('name');
      return Object.assign(tmSegment, {
        company: {
          name: company.name,
        },
        tmMatchInfo,
      });
    });
    return tmSegments;
  }

  async searchTb({
    requestId, workflowId, searchIn, text, threshold,
  }) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id');
    const [{ srcLang, tgtLang }] = await this.workflowApi.find(requestId, [workflowId], {
      withCATData: false,
    });
    const companyId = _.get(request, 'company._id', '');
    let descriptor;
    try {
      descriptor = await this.portalCatSettingsApi.findDescriptor(RESOURCE_TYPE_TB, {
        lspId: this.lspId,
        companyId: new ObjectId(companyId),
        'srcLang.isoCode': srcLang.isoCode,
        'tgtLang.isoCode': tgtLang.isoCode,
      });
    } catch (err) {
      if (err.code !== 404) {
        const message = _.get(err, 'message', err);
        throw new RestError(_.get(err, 'code', 500), { message });
      }
    }
    let tbEntries = [];
    if (!_.isNil(descriptor)) {
      const endpoint = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/tb/${descriptor._id}/entries/search`;
      const url = new URL(endpoint, this.baseUrl);
      url.searchParams.append('text', text);
      url.searchParams.append('lang', searchIn === SEARCH_IN_SOURCE ? srcLang.isoCode : tgtLang.isoCode);
      if (!_.isNil(threshold)) {
        url.searchParams.append('threshold', threshold);
      }
      const finalUrl = url.pathname + url.search;
      const response = await this.get(finalUrl);
      tbEntries = await Promise.mapSeries(_.get(response, 'data.tbSearchResults', []), async (result) => {
        const tbEntry = _.get(result, 'tbEntry', {});
        const tbMatchInfo = _.get(result, 'tbMatchInfo', {});
        const company = await this.schema.Company
          .findOneWithDeleted({ _id: new ObjectId(tbEntry.companyId) }).select('name');
        return Object.assign(tbEntry, {
          company: {
            name: company.name,
          },
          tbMatchInfo,
        });
      });
    }
    return tbEntries;
  }

  _isSegmentAssigned(segment) {
    const userId = this.user._id;
    return areObjectIdsEqual(userId, _.get(segment, 'assignedToTranslator', ''))
      || areObjectIdsEqual(userId, _.get(segment, 'assignedToEditor', ''))
      || areObjectIdsEqual(userId, _.get(segment, 'assignedToQaEditor', ''));
  }

  _canUpdateSegment(segment, taskAbility) {
    const segmentStatus = _.get(segment, 'status', '');
    return this.user.has('SEGMENT_UPDATE_ALL') || (
      this.user.has('SEGMENT_UPDATE_OWN')
      && this._isSegmentAssigned(segment)
      && this._canUpdateSegmentBasedOnStatus(taskAbility, segmentStatus)
    );
  }

  _canUpdateSegmentBasedOnStatus(taskAbility, segmentStatus) {
    let allowedStatuses = [];
    if (taskAbility === TASK_ABILITY_TRANSLATION) {
      allowedStatuses = TRANSLATION_ALLOWED_FILE_SEGMENT_STATUSES;
    } else if (taskAbility === TASK_ABILITY_EDITING || taskAbility === TASK_ABILITY_PEMT) {
      allowedStatuses = EDITING_ALLOWED_FILE_SEGMENT_STATUSES;
    } else if (taskAbility === TASK_ABILITY_QA) {
      allowedStatuses = QA_ALLOWED_FILE_SEGMENT_STATUSES;
    }
    return allowedStatuses.includes(segmentStatus);
  }

  async updateFileSegment({ requestId, segmentId, body }) {
    const {
      workflowId, fileId, taskId, segment, repetitionsStrategy,
    } = body;
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id workflows');
    const workflow = this._findWorkflow(request, workflowId);
    const task = workflow.tasks.find((t) => areObjectIdsEqual(t._id, taskId));
    const taskAbility = _.get(task, 'ability', '');
    const {
      srcLang: { isoCode: srcIsoCode } = {},
      tgtLang: { isoCode: tgtIsoCode } = {},
    } = workflow;
    const companyId = _.get(request, 'company._id', '');
    const oldSegment = await this.getFileSegmentById({
      requestId, workflowId, fileId, segmentId,
    });
    if (!this._canUpdateSegment(oldSegment, taskAbility)) {
      throw new RestError(403, { message: 'User is not authorized for segment update' });
    }
    if (_.get(oldSegment, 'locked') && _.isNil(repetitionsStrategy)) {
      throw new RestError(403, { message: 'Segment is locked. Unlock it before updating', data: { fileSegment: oldSegment } });
    }
    if (!_.isEmpty(segment.qaIssues)) {
      segment.qaIssues = segment.qaIssues.map(
        (issue) => _.pick(issue, UPDATE_SEGMENT_QA_ISSUES_ALLOWED_FIELDS),
      );
    }
    const sanitizedSegment = _.pick(segment, UPDATE_SEGMENT_ALLOWED_FIELDS);
    const sanitizedBody = {
      ...sanitizedSegment,
      workflowId,
      taskId,
      userId: this.user._id,
      repsStrategy: repetitionsStrategy,
    };
    const updateEndpoint = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/sl/${srcIsoCode}/tl/${tgtIsoCode}/file/${fileId}/segment/${segmentId}`;
    const response = await this.put(updateEndpoint, sanitizedBody);
    if (
      _.get(segment, 'status') !== FILE_SEGMENT_STATUS_UNCONFIRMED
      && _.get(segment, 'status') !== _.get(oldSegment, 'status')
    ) {
      try {
        await this.upsertTmSegment(segment);
        await this.requestApi.markStatisticsGenerated(requestId.toString());
      } catch (err) {
        this.logger.error(`Error upserting TM segment: ${err}`);
      }
    }
    return _.get(response, 'data.fileSegment');
  }

  async updateFileSegmentLocked({
    requestId, workflowId, fileId, segmentId, body,
  }) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id workflows');
    const companyId = _.get(request, 'company._id', '');
    const workflow = this._findWorkflow(request, workflowId);
    const srcIsoCode = _.get(workflow, 'srcLang.isoCode');
    const tgtIsoCode = _.get(workflow, 'tgtLang.isoCode');
    const oldSegment = await this.getFileSegmentById({
      requestId, workflowId, fileId, segmentId,
    });
    const isSegmentAssignedToUser = this._isSegmentAssigned(oldSegment);
    const canUpdate = this.user.has('SEGMENT-LOCK_UPDATE_ALL')
      || (this.user.has('SEGMENT-LOCK_UPDATE_OWN') && isSegmentAssignedToUser);
    if (!canUpdate) {
      throw new RestError(403, { message: 'User is not authorized for segment update' });
    }
    const sanitizedBody = _.pick(body, ['locked']);
    sanitizedBody.userId = this.user._id;
    const updateEndpoint = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/sl/${srcIsoCode}/tl/${tgtIsoCode}/file/${fileId}/segment/${segmentId}`;
    const response = await this.put(updateEndpoint, sanitizedBody);
    await this.requestApi.markStatisticsGenerated(requestId.toString());
    return _.get(response, 'data.fileSegment');
  }

  async updateFileSegmentQaIssues({
    requestId, workflowId, taskId, fileId, segmentId, body,
  }) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id workflows');
    const companyId = _.get(request, 'company._id', '');
    const workflow = this._findWorkflow(request, workflowId);
    const srcIsoCode = _.get(workflow, 'srcLang.isoCode');
    const tgtIsoCode = _.get(workflow, 'tgtLang.isoCode');
    const task = workflow.tasks.find((t) => areObjectIdsEqual(t._id, taskId));
    const taskAbility = _.get(task, 'ability', '');
    const oldSegment = await this.getFileSegmentById({
      requestId, workflowId, fileId, segmentId,
    });
    const canUpdate = this._canUpdateSegment(oldSegment, taskAbility);
    if (!canUpdate) {
      throw new RestError(403, { message: 'User is not authorized for segment update' });
    }
    oldSegment.qaIssues = _.get(body, 'qaIssues');
    const sanitizedBody = _.pick(oldSegment, UPDATE_SEGMENT_ALLOWED_FIELDS);
    sanitizedBody.userId = this.user._id;
    const updateEndpoint = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/sl/${srcIsoCode}/tl/${tgtIsoCode}/file/${fileId}/segment/${segmentId}`;
    const response = await this.put(updateEndpoint, sanitizedBody);
    await this.requestApi.markStatisticsGenerated(requestId.toString());
    return _.get(response, 'data.fileSegment');
  }

  async upsertTmSegment(segment = {}) {
    const {
      companyId, source, target, status,
    } = segment;
    let tmDescriptor = await this.portalCatSettingsApi.findDescriptor(RESOURCE_TYPE_TM, {
      lspId: this.lspId,
      companyId: new ObjectId(companyId),
      'srcLang.isoCode': _.get(source, 'lang'),
      'tgtLang.isoCode': _.get(target, 'lang'),
    });
    if (_.isNil(tmDescriptor)) {
      [[tmDescriptor]] = await this.ensureTm({
        companyId,
        srcLangs: [_.get(source, 'lang')],
        tgtLangs: [_.get(target, 'lang')],
      });
    }
    const [{ tmSegment } = {}] = await this.translationMemoryApi.searchSegmentsSimple({
      companyId,
      tmId: tmDescriptor._id,
      params: {
        text: _.get(source, 'text'),
        lang: _.get(source, 'lang'),
        threshold: 100,
      },
    });
    if (_.isNil(tmSegment)) {
      await this.translationMemoryApi.createSegment({
        companyId,
        tmId: tmDescriptor._id,
        body: { source, target, status },
      });
    } else {
      await this.translationMemoryApi.updateSegment({
        companyId,
        tmId: tmDescriptor._id,
        originalId: _.get(tmSegment, 'originalId'),
        body: { source, target, status },
      });
    }
  }

  async searchFileSegments({
    requestId, workflowId, body, tzOffset,
  }) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id languageCombinations workflows');
    const workflow = this._findWorkflow(request, workflowId);
    const srcLang = _.get(workflow, 'srcLang.isoCode', '');
    const tgtLang = _.get(workflow, 'tgtLang.isoCode', '');
    if (_.isEmpty(srcLang) || _.isEmpty(tgtLang)) {
      throw new RestError(400, { message: 'Workflow is missing source and/or target languages' });
    }
    const supportedFiles = await this._extractSupportedFiles(request, workflow);
    const companyId = _.get(request, 'company._id', '');
    const searchParams = _.get(body, 'params', {});
    const requestBody = buildPcSearchBody(searchParams, tzOffset);
    const segmentsByFileId = {};
    await Promise.map(supportedFiles, async (file) => {
      const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/sl/${srcLang}/tl/${tgtLang}/file/${file._id}/segments/search`;
      const response = await this.post(url, requestBody);
      segmentsByFileId[file._id] = _.get(response, 'data.fileSegments', []);
    });
    return segmentsByFileId;
  }

  async replaceFileSegmentsContent({
    requestId, workflowId, body, tzOffset,
  }) {
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id languageCombinations workflows');
    const workflow = this._findWorkflow(request, workflowId);
    const srcLang = _.get(workflow, 'srcLang.isoCode', '');
    const tgtLang = _.get(workflow, 'tgtLang.isoCode', '');
    if (_.isEmpty(srcLang) || _.isEmpty(tgtLang)) {
      throw new RestError(400, { message: 'Workflow is missing source and/or target languages' });
    }
    const companyId = _.get(request, 'company._id', '');
    const fileId = _.get(body, 'fileId', '');
    const params = _.get(body, 'params', {});
    const scope = _.get(body, 'scope', {});
    const targetText = _.get(params, 'targetText', '');
    const replaceWithText = _.get(params, 'replaceWith', '');
    const isCaseSensitive = _.get(params, 'isCaseSensitive', false);
    const repsStrategy = _.get(params, 'repetitionsStrategy');
    const requestBody = {
      userId: this.user._id,
      targetText,
      matchCase: isCaseSensitive,
      replaceWithText,
      repsStrategy,
    };
    if (scope === REPLACE_SEGMENT_CONTENT_SCOPE_ALL) {
      const segmentsByFileId = await this.searchFileSegments({
        requestId, workflowId, body, tzOffset,
      });
      const segmentsToReplace = _.get(segmentsByFileId, fileId, []);
      if (_.isEmpty(segmentsToReplace)) {
        return [];
      }
      requestBody.replaceOriginalIds = segmentsToReplace.map((segment) => segment.originalId);
    } else {
      let replaceOriginalIds = _.get(params, 'replaceOriginalIds', []);
      if (_.isEmpty(replaceOriginalIds)) {
        const segmentsByFileId = await this.searchFileSegments({
          requestId, workflowId, body, tzOffset,
        });
        const firstSegment = _.get(segmentsByFileId, `[${fileId}][0]`);
        if (!_.isNil(firstSegment)) {
          replaceOriginalIds = [firstSegment.originalId];
        }
      }
      requestBody.replaceOriginalIds = replaceOriginalIds;
    }
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/sl/${srcLang}/tl/${tgtLang}/file/${fileId}/segments/search/replace`;
    const sanitizedBody = _.pickBy(requestBody, _.identity);
    const response = await this.post(url, sanitizedBody);
    await this.requestApi.markStatisticsGenerated(requestId.toString());
    return _.get(response, 'data.fileSegments', []);
  }

  async buildPcOperation({
    operation, type, languageCombinations = [],
    srcLangFilter, tgtLangFilter, documentId, request, workflowId,
  }) {
    function mapLangsToPipelines(tgtLangs, srcLangs, fileId) {
      const res = [];
      tgtLangs.forEach((tgtLang) => {
        srcLangs.forEach((srcLang) => {
          if (_.isNil(workflowId) && type === PORTALCAT_PIPELINE_TYPE_MT) {
            const workflows = findWorkflowsByLangs(request, srcLang, tgtLang);
            workflowId = _.get(_.last(workflows), '_id');
          }
          res.push({
            fileId,
            srcLang: srcLang.isoCode,
            tgtLang: tgtLang.isoCode,
            type,
            workflowId,
          });
        });
      });
      return res;
    }
    return {
      operation,
      pipelines: await Promise.reduce(languageCombinations, async (res, combination) => {
        let srcLangs = _.get(combination, 'srcLangs', []);
        let tgtLangs = _.get(combination, 'tgtLangs', []);
        if (!_.isNil(srcLangFilter)) {
          srcLangs = srcLangs.filter(({ isoCode }) => isoCode === srcLangFilter);
        }
        if (!_.isNil(tgtLangFilter)) {
          tgtLangs = tgtLangs.filter(({ isoCode }) => isoCode === tgtLangFilter);
        }
        if (!_.isNil(documentId) && languageCombinations.length === 1) {
          return res.concat(mapLangsToPipelines(tgtLangs, srcLangs, documentId));
        }
        let pipelinesForAllDocuments = [];
        let documents = _.get(combination, 'documents', []);
        documents = await this.filterDocumentsByPcAllowance(documents);
        documents.forEach((document) => {
          pipelinesForAllDocuments = pipelinesForAllDocuments.concat(mapLangsToPipelines(tgtLangs, srcLangs, document._id));
        });
        return res.concat(pipelinesForAllDocuments);
      }, []),
    };
  }

  filterDocumentsByPcAllowance(documents = []) {
    return Promise.filter(documents, (document) => this.isFileAllowed(document)
      && this.isFileFormatSupported(document.name));
  }

  _extractSupportedFiles(request, workflow) {
    let documents = [];
    const langProperties = ['name', 'isoCode'];
    const languageCombinations = _.get(request, 'languageCombinations', []);
    if (_.isNil(workflow)) {
      documents = getRequestDocuments(languageCombinations);
    } else {
      const workflowSrcLang = _.pick(_.get(workflow, 'srcLang', {}), langProperties);
      const workflowTgtLang = _.pick(_.get(workflow, 'tgtLang', {}), langProperties);
      const workflowLanguageCombinations = languageCombinations.filter((combination) => {
        const srcLangMatch = combination.srcLangs.find((srcLang) => _.isEqual(
          workflowSrcLang,
          _.pick(srcLang, langProperties),
        ));
        const tgtLangMatch = combination.tgtLangs.find((tgtLang) => _.isEqual(
          workflowTgtLang,
          _.pick(tgtLang, langProperties),
        ));
        return !_.isNil(srcLangMatch) && !_.isNil(tgtLangMatch);
      });
      documents = extractChildArray(workflowLanguageCombinations, 'documents');
    }
    return this.filterDocumentsByPcAllowance(documents);
  }

  ensureTm({
    languageCombination, srcLangs = [], tgtLangs = [], companyId,
  }) {
    if (!_.isNil(languageCombination)) {
      ({ srcLangs = [], tgtLangs = [] } = languageCombination);
    }
    return Promise.mapSeries(srcLangs, (srcLang) => Promise.mapSeries(tgtLangs, async (tgtLang) => {
      try {
        const descriptor = await this.portalCatSettingsApi.findDescriptor(RESOURCE_TYPE_TM, {
          lspId: this.lspId,
          companyId: new ObjectId(companyId),
          'srcLang.isoCode': _.get(srcLang, 'isoCode', srcLang),
          'tgtLang.isoCode': _.get(tgtLang, 'isoCode', tgtLang),
        });
        if (descriptor.deleted) {
          await descriptor.restore();
        }
        return descriptor;
      } catch (err) {
        if (err.code === 404) {
          const name = `TM_${companyId}_Default_${srcLang.isoCode}_${tgtLang.isoCode}`;
          return this.portalCatSettingsApi.createResourceDescriptor({
            type: RESOURCE_TYPE_TM,
            lspId: this.lspId,
            companyId,
            srcLang,
            tgtLang,
            name,
          });
        }
      }
    }));
  }

  _prepareImportDependantOperations(requestId, companyId, operations) {
    return Promise.mapSeries(
      operations,
      ({ operation, pipelines = [] }) => Promise.mapSeries(pipelines, (pipeline) => {
        const shouldWaitForImportCompletion = (operation === PIPELINE_OPERATION_TYPE_ANALYZE
            && pipeline.type === PORTALCAT_PIPELINE_TYPE_IMPORT)
          || (operation === PIPELINE_OPERATION_TYPE_RUN
            && pipeline.type === PORTALCAT_PIPELINE_TYPE_MT)
          || (operation === PIPELINE_OPERATION_TYPE_RUN
            && pipeline.type === PORTALCAT_PIPELINE_TYPE_QA)
          || (operation === PIPELINE_OPERATION_TYPE_RUN
            && pipeline.type === PORTALCAT_PIPELINE_TYPE_LOCKING);
        if (shouldWaitForImportCompletion) {
          return this.ensureImportCompleted({
            requestId,
            companyId,
            fileId: pipeline.fileId,
            srcLang: pipeline.srcLang,
            tgtLang: pipeline.tgtLang,
          });
        }
      }),
    );
  }

  async getPipelinesStatusRemote({
    requestId, companyId, pipelineIds = [], analysis = false,
  }) {
    const endpoint = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/pipelines/status`;
    const url = new URL(endpoint, this.baseUrl);
    url.searchParams.append('analysis', analysis.toString());
    pipelineIds.forEach((pipelineId) => url.searchParams.append('pipelineId', pipelineId));
    const finalUrl = url.pathname + url.search;
    const response = await this.get(finalUrl);
    return _.get(response, 'data');
  }

  async ensurePipelineCompleted(type, {
    requestId, companyId, fileId, srcLang, tgtLang,
  }) {
    let retries = PIPELINE_STATUS_CHECK_RETRIES;
    let retriesWhenStopped = PIPELINE_STATUS_CHECK_RETRIES / 5;
    const checkStatuses = async () => {
      const [pipeline] = await this._findPipelines({
        lspId: this.lspId,
        companyId: new ObjectId(companyId),
        requestId: new ObjectId(requestId),
        fileId: new ObjectId(fileId),
        srcLang,
        tgtLang,
        type,
      });
      if (_.isNil(pipeline)) {
        throw new Error('Pipeline not found');
      }
      const { status: pipelineStatus } = await this.getPipelinesStatusRemote({
        requestId,
        companyId,
        pipelineIds: [pipeline._id],
      });
      if (pipelineStatus === PORTALCAT_PIPELINE_STATUS_STOPPED && retriesWhenStopped-- > 0) {
        return new Promise((resolve) => {
          setTimeout(
            () => resolve(checkStatuses()),
            PIPELINE_STATUS_CHECK_INTERVAL,
          );
        });
      }
      const isImportDone = [
        PORTALCAT_PIPELINE_STATUS_SUCCEEDED,
        PORTALCAT_PIPELINE_STATUS_FAILED,
        PORTALCAT_PIPELINE_STATUS_STOPPED,
      ].some((status) => pipelineStatus === status);
      if (!isImportDone) {
        if (retries-- === 0) {
          throw new Error(`Pipeline ${pipeline._id} has not completed`);
        }
        await new Promise((resolve) => {
          setTimeout(
            () => resolve(checkStatuses()),
            PIPELINE_STATUS_CHECK_INTERVAL,
          );
        });
      }
    };
    await checkStatuses();
  }

  ensureImportCompleted(params) {
    return this.ensurePipelineCompleted(PORTALCAT_PIPELINE_TYPE_IMPORT, params);
  }

  ensureMtCompleted(params) {
    return this.ensurePipelineCompleted(PORTALCAT_PIPELINE_TYPE_MT, params);
  }

  async assignFileSegmentsToUser({
    requestId,
    request,
    workflowId,
    workflow,
    fileId,
    users,
    segmentsIds = [],
  }) {
    if (_.isNil(request)) {
      request = await this.requestApi.findOne(requestId.toString(), 'company._id');
    }
    const companyId = _.get(request, 'company._id', '');
    if (_.isNil(workflow)) {
      [workflow] = await this.workflowApi.find(requestId, [workflowId], {
        withCATData: false,
      });
    }
    const {
      srcLang: { isoCode: srcIsoCode } = {},
      tgtLang: { isoCode: tgtIsoCode } = {},
    } = workflow;
    const endpoint = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${request._id}/sl/${srcIsoCode}/tl/${tgtIsoCode}/file/${fileId}/segments`;
    const url = new URL(endpoint, this.baseUrl);
    const finalUrl = url.pathname + url.search;
    const body = {
      users,
      originalIds: segmentsIds,
    };
    let response;
    try {
      response = await this.put(finalUrl, body);
      await this.requestApi.markStatisticsGenerated(requestId.toString());
    } catch (err) {
      throw new RestError(err.code, { message: `Error assigning TFSH: ${err.message}` });
    }
    return _.get(response, 'data.fileSegments', []);
  }

  async getRequestAnalysis({ request, requestId, withFuzzyMatches }) {
    if (_.isNil(request)) {
      request = await this.requestApi.findOne(requestId, 'company._id');
    }
    requestId = request._id;
    const companyId = _.get(request, 'company._id', '');
    const pipelines = await this.getPipelines({ requestId, type: 'import' });
    if (_.isEmpty(pipelines)) {
      throw new RestError(404, {
        message: 'Pipelines not found',
      });
    }
    const pipelineIds = pipelines.map(({ _id }) => _id);
    const endpoint = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/statistics`;
    const url = new URL(endpoint, this.baseUrl);
    pipelineIds.forEach((pipelineId) => url.searchParams.append('pipelineId', pipelineId));
    if (!_.isNil(withFuzzyMatches)) {
      url.searchParams.append('withFuzzyMatches', withFuzzyMatches);
    }
    const finalUrl = url.pathname + url.search;
    const response = await this.get(finalUrl);
    return _.get(response, 'data.ras', []);
  }

  async getRequestAnalysisStatus(requestId) {
    const request = await this.requestApi.findOne(requestId, 'company._id languageCombinations');
    const companyId = _.get(request, 'company._id');
    const documents = getRequestDocuments(request.languageCombinations);
    const filteredDocuments = await this.filterDocumentsByPcAllowance(documents);
    const query = {
      lspId: this.lspId,
      companyId,
      requestId,
      type: 'import',
      fileId: {
        $in: filteredDocuments.map(({ _id }) => _id),
      },
    };
    const pipelines = await this._findPipelines(query);
    const pipelinesBySrcLang = _.groupBy(pipelines, (pl) => `${pl.srcLang}-${pl.tgtLang}`);
    return Promise.reduce(_.values(pipelinesBySrcLang), (response, pls) => {
      const pipelineIds = pls.map((pipeline) => pipeline._id);
      const params = {
        requestId, companyId, pipelineIds, analysis: true,
      };
      if (response.status === PORTALCAT_PIPELINE_STATUS_FAILED) {
        return response;
      }
      return this.getPipelinesStatusRemote(params);
    }, {});
  }

  async getRequestProgress(requestId) {
    const request = await this.requestApi.findOne(requestId, 'company._id languageCombinations');
    const requestAnalysis = await this.getRequestAnalysis({ request, withFuzzyMatches: true });
    const requestAnalysisTotal = requestAnalysis.filter((analysis) => analysis.userId === 'system');
    const statisticsByFiles = _.flatten(_.map(requestAnalysisTotal, 'statisticsByFile'));
    const progressByLangPairs = {};
    const requestProgress = {
      progressByLangPairs,
    };
    const allFilesMap = this._getAllFilesMap(request);
    await Promise.map(statisticsByFiles, async (statisticsByFile) => {
      const {
        srcLang, tgtLang, fileId, statistics,
      } = statisticsByFile;
      const fileInfo = allFilesMap[fileId];
      if (!this.isFileAllowed(fileInfo)) {
        return;
      }
      const langPair = `${srcLang}_${tgtLang}`;
      const numWordsTotal = _.get(statistics, 'totals.numWords');
      const fileSegments = await this.getFileSegments({
        requestId, fileId, srcIsoCode: srcLang, tgtIsoCode: tgtLang,
      });
      const progressByTask = calculateFileProgress({ fileSegments, numWordsTotal });
      const fileProgress = {
        numWordsTotal,
        ...progressByTask,
      };
      const progressByLangPair = {
        numWordsTotal: 0,
        ...progressByLangPairs[langPair],
        [fileId]: fileProgress,
      };
      progressByLangPair.numWordsTotal += numWordsTotal;
      Object.keys(progressByTask).forEach((key) => {
        const currentProgress = _.get(progressByLangPair, key, 0);
        progressByLangPair[key] = currentProgress + progressByTask[key];
      });
      progressByLangPairs[langPair] = progressByLangPair;
    });
    return requestProgress;
  }

  async getTaskProgress({
    request, workflow, task, requestId, workflowId, taskId,
  }) {
    if (_.isNil(request)) {
      request = await this.requestApi.findOne(requestId, 'company._id languageCombinations');
    }
    if (_.isNil(workflow)) {
      [workflow] = await this.workflowApi.find(requestId, [workflowId], {
        withCATData: false,
      });
    }
    const {
      srcLang: { isoCode: srcIsoCode } = {},
      tgtLang: { isoCode: tgtIsoCode } = {},
    } = workflow;
    if (_.isNil(srcIsoCode) || _.isNil(tgtIsoCode)) {
      throw new RestError(400, { message: 'Error getting task progress: workflow is missing source and/or target languages' });
    }
    if (_.isNil(task)) {
      task = workflow.tasks.find((t) => areObjectIdsEqual(t._id, taskId));
    }
    const taskAbility = _.get(task, 'ability', '');
    const providerTasks = _.get(task, 'providerTasks', []);
    const taskProgress = {
      srcLang: srcIsoCode,
      tgtLang: tgtIsoCode,
      taskAbility,
    };
    const supportedFiles = await this._extractSupportedFiles(request, workflow);
    await Promise.map(providerTasks, (providerTask) => {
      const { provider } = providerTask;
      if (_.isNil(provider)) {
        return;
      }
      return Promise.map(supportedFiles, async ({ _id: fileId }) => {
        const fileSegments = await this.getFileSegments({
          request, requestId, fileId, srcIsoCode, tgtIsoCode,
        });
        const assignedToFieldName = abilityToAssignedToMap[taskAbility];
        const assignedSegments = fileSegments.filter(
          (segment) => segment[assignedToFieldName] !== 'system' && areObjectIdsEqual(segment[assignedToFieldName], provider._id),
        );
        const assignedWordsTotal = assignedSegments.reduce((res, segment) => {
          const property = segment.customProperties
            .find(({ name }) => name === FILE_SEGMENT_TOTAL_WORD_COUNT);
          const segmentWordsTotal = _.get(property, 'value', 0);
          return res + Number.parseInt(segmentWordsTotal, 10);
        }, 0);
        const progressByTask = calculateFileProgress({
          fileSegments: assignedSegments, taskAbility, numWordsTotal: assignedWordsTotal,
        });
        const fileProgress = {
          assignedWordsTotal,
          ...progressByTask,
        };
        taskProgress[provider._id] = {
          assignedWordsTotal: 0,
          ...taskProgress[provider._id],
          [fileId]: fileProgress,
        };
        taskProgress[provider._id].assignedWordsTotal += assignedWordsTotal;
        Object.keys(progressByTask).forEach((key) => {
          const currentProgress = _.get(taskProgress[provider._id], key, 0);
          taskProgress[provider._id][key] = currentProgress + progressByTask[key];
        });
      });
    });
    return taskProgress;
  }

  async getFileSegmentHistory({
    requestId, workflowId, fileId, segmentId,
  }) {
    const request = await this.requestApi.findOne(requestId, 'company._id workflows');
    const companyId = _.get(request, 'company._id', '');
    const workflow = this._findWorkflow(request, workflowId);
    const {
      srcLang: { isoCode: srcIsoCode = '' } = {},
      tgtLang: { isoCode: tgtIsoCode = '' } = {},
    } = workflow;
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/sl/${srcIsoCode}/tl/${tgtIsoCode}/file/${fileId}/segment/${segmentId}/history`;
    const response = await this.get(url);
    const segments = _.get(response, 'data.fileSegments', []);
    await Promise.mapSeries(segments, (segment) => this._populateUsers(segment, ['createdBy']));
    await Promise.mapSeries(segments, (segment) => this._populateCompany(segment, ['companyId']));
    return segments;
  }

  async getTextSegmentation({
    srId, text, langCode, companyId,
  }) {
    let endpoint = `/api/portalcat/lsp/${this.lspId}/sr/${srId}/segment`;
    if (!_.isNil(companyId)) {
      endpoint = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/sr/${srId}/segment`;
    }
    const request = { text, langCode, encoding: 'UTF-8' };
    const response = await this.post(endpoint, request);
    return response;
  }

  async getRequestRepetitions({ requestId, tgtLang, limit = 1000 }) {
    const request = await this.requestApi.findOne(requestId, 'company._id');
    const companyId = _.get(request, 'company._id', '');
    const endpoint = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/repetitions`;
    const url = new URL(endpoint, this.baseUrl);
    if (!_.isNil(tgtLang)) {
      url.searchParams.append('tgtLang', tgtLang);
    }
    url.searchParams.append('limit', limit);
    const finalUrl = url.pathname + url.search;
    const response = await this.get(finalUrl);
    return _.get(response, 'data.repetitiveSegments', []);
  }

  async getSegmentRepetitions({
    requestId, workflowId, fileId, segmentId,
  }) {
    const request = await this.requestApi.findOne(requestId, 'company._id workflows');
    const companyId = _.get(request, 'company._id', '');
    const workflow = this._findWorkflow(request, workflowId);
    const {
      srcLang: { isoCode: srcIsoCode = '' } = {},
      tgtLang: { isoCode: tgtIsoCode = '' } = {},
    } = workflow;
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/sl/${srcIsoCode}/tl/${tgtIsoCode}/file/${fileId}/segment/${segmentId}/repetitions`;
    const response = await this.get(url);
    return _.get(response, 'data.repetitions', []);
  }

  async getRequestQaIssues(requestId) {
    const request = await this.requestApi.findOne(requestId, 'languageCombinations workflows company._id');
    const documents = getRequestDocuments(request.languageCombinations);
    const filteredDocuments = await this.filterDocumentsByPcAllowance(documents);
    const segmentsWithIssuesResult = [];
    try {
      await Promise.map(
        request.workflows,
        (workflow) => Promise.map(filteredDocuments, async (document) => {
          const segmentsWithIssues = await this.getFileSegments({
            request, workflow, fileId: document._id, filter: 'qa',
          });
          if (!_.isEmpty(segmentsWithIssues)) {
            segmentsWithIssuesResult.push({
              workflowId: workflow._id,
              fileId: document._id,
              segments: segmentsWithIssues.map((segment) => _.pick(segment, ['_id', 'originalId', 'qaIssues'])),
            });
          }
        }),
      );
    } catch (err) {
      const code = _.get(err, 'code', 500);
      const message = _.get(err, 'message', err);
      throw new RestError(code, { message: `Error getting request QA issues: ${message}` });
    }
    return segmentsWithIssuesResult;
  }

  async getFinalFilesListByRequest(requestId) {
    const request = await this.requestApi.findOne(requestId, 'company._id');
    const companyId = _.get(request, 'company._id', '');
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/export/info`;
    const response = await this.get(url);
    return _.get(response, 'data.fileNames', []);
  }

  async getFinalFilesZipByRequest(requestId) {
    const request = await this.requestApi.findOne(requestId, 'company._id');
    const companyId = _.get(request, 'company._id', '');
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/export`;
    const response = await this.get(url, { responseType: 'stream' });
    return response;
  }

  async getFinalFilesListByRequestLanguageCombination({ requestId, srcLang, tgtLang }) {
    const request = await this.requestApi.findOne(requestId, 'company._id');
    const companyId = _.get(request, 'company._id', '');
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/sl/${srcLang}/tl/${tgtLang}/export/info`;
    const response = await this.get(url);
    return _.get(response, 'data.fileNames', []);
  }

  async getFinalFilesZipByRequestLanguageCombination({ requestId, srcLang, tgtLang }) {
    const request = await this.requestApi.findOne(requestId, 'company._id');
    const companyId = _.get(request, 'company._id', '');
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/sl/${srcLang}/tl/${tgtLang}/export`;
    const response = await this.get(url, { responseType: 'stream' });
    return response;
  }

  deleteFile({
    lspId = this.lspId, companyId, requestId, srcLang, tgtLang, fileId,
  }) {
    const url = `/api/portalcat/lsp/${lspId}/company/${companyId}/request/${requestId}/sl/${srcLang}/tl/${tgtLang}/file/${fileId}`;
    return this.delete(url);
  }

  async confirmAllSegments({
    requestId, workflowId, fileId, status,
  }) {
    if (this.environmentName === 'PROD') {
      return;
    }
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id workflows');
    const workflow = this._findWorkflow(request, workflowId);
    const {
      srcLang: { isoCode: srcIsoCode } = {},
      tgtLang: { isoCode: tgtIsoCode } = {},
    } = workflow;
    const companyId = _.get(request, 'company._id', '');
    const segments = await this.getFileSegments({ request, workflow, fileId });
    await this.requestApi.markStatisticsGenerated(requestId.toString());
    return Promise.map(segments, (segment) => {
      segment.status = status;
      const sanitizedSegment = _.pick(segment, UPDATE_SEGMENT_ALLOWED_FIELDS);
      const body = {
        ...sanitizedSegment,
        userId: this.user._id,
        repsStrategy: 'SEGMENT_ONLY',
      };
      const updateEndpoint = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/sl/${srcIsoCode}/tl/${tgtIsoCode}/file/${fileId}/segment/${segment.originalId}`;
      return this.put(updateEndpoint, body);
    }, { concurrency: 10 });
  }

  async ignoreAllIssues({ requestId, workflowId, fileId }) {
    if (this.environmentName === 'PROD') {
      return;
    }
    const request = await this.requestApi.findOne(requestId.toString(), 'company._id workflows');
    const workflow = this._findWorkflow(request, workflowId);
    const {
      srcLang: { isoCode: srcIsoCode } = {},
      tgtLang: { isoCode: tgtIsoCode } = {},
    } = workflow;
    const companyId = _.get(request, 'company._id', '');
    const segments = await this.getFileSegments({ request, workflow, fileId });
    await this.requestApi.markStatisticsGenerated(requestId.toString());
    return Promise.map(segments, (segment) => {
      if (_.isEmpty(segment.qaIssues)) {
        return;
      }
      segment.qaIssues.forEach((issue) => {
        issue.locQualityIssueEnabled = 'no';
      });
      const sanitizedSegment = _.pick(segment, UPDATE_SEGMENT_ALLOWED_FIELDS);
      const body = {
        ...sanitizedSegment,
        userId: this.user._id,
        repsStrategy: 'SEGMENT_ONLY',
      };
      const updateEndpoint = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/request/${requestId}/sl/${srcIsoCode}/tl/${tgtIsoCode}/file/${fileId}/segment/${segment.originalId}`;
      return this.put(updateEndpoint, body);
    }, { concurrency: 10 });
  }

  _populateUsers(entity, fields) {
    return Promise.mapSeries(fields, async (field) => {
      const id = entity[field];
      if (!isValidObjectId(id)) {
        return;
      }
      const user = await this.schema.User.findById(id);
      if (_.isNil(user)) {
        return;
      }
      entity[field] = `${user.firstName} ${user.lastName}`;
    });
  }

  _populateCompany(entity, fields) {
    return Promise.mapSeries(fields, async (field) => {
      const id = entity[field];
      if (!isValidObjectId(id)) {
        return;
      }
      const company = await this.schema.Company.findById(id);
      if (_.isNil(company)) {
        return;
      }
      entity[field] = company.hierarchy;
    });
  }

  _getAllFilesMap(request) {
    return request.languageCombinations.reduce((res, combination) => {
      combination.documents.forEach((doc) => {
        res[doc._id] = doc;
      });
      return res;
    }, {});
  }

  _findWorkflow(request, workflowId) {
    const workflows = _.get(request, 'workflows', []);
    const workflow = workflows.find(({ _id }) => areObjectIdsEqual(_id, workflowId));
    if (_.isNil(workflow)) {
      throw new RestError(404, 'Workflow was not found');
    }
    return workflow;
  }

  async _syncCurrentActionConfigs(mainPipeline, pipelinesToSync) {
    if (_.isEmpty(mainPipeline.currentActions)) {
      return;
    }
    await Promise.map(pipelinesToSync, async (pipeline) => {
      pipeline.currentActions.forEach((action, index) => {
        const mainAction = mainPipeline.currentActions[index];
        if (_.isNil(mainAction) || mainAction.name !== action.name) {
          return;
        }
        if (!_.isEmpty(mainAction.config)) {
          action.config = mainAction.config;
        }
      });
      await pipeline.save();
    });
  }
}

module.exports = PortalCatApi;
