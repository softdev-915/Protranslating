import _ from 'lodash';
import Vue from 'vue';
import * as pcMutations from './types';
import PortalCatService from '../../../services/portalcat-service';
import { findEntity, hasChangedSegmentContent, areAllQaIssuesIgnored } from '../../../components/home/portalcat/helpers';
import RequestService from '../../../services/request-service';
import WorkflowService from '../../../services/workflow-service';
import { errorNotification } from '../../../utils/notifications';
import { CancellablePoller } from '../../../services/cancellable-poller';
import MtModelService from '../../../services/mt-model-service';
import MtEngineService from '../../../services/mt-engine-service';
import CompanyService from '../../../services/company-service';
import { hasRole } from '../../../utils/user';

const sortSuggestions = (suggestions = [], mtThreshold = 0) => {
  suggestions.sort((a, b) => {
    const { origin: originA } = a;
    const { origin: originB } = b;
    const scoreA = _.defaultTo(_.get(a, 'tmMatchInfo.score'), 0);
    const scoreB = _.defaultTo(_.get(b, 'tmMatchInfo.score'), 0);
    if (originA === 'TM' && originB === 'MT') {
      return scoreA < mtThreshold ? 1 : -1;
    }
    if (originA === 'MT' && originB === 'TM') {
      return scoreB < mtThreshold ? -1 : 1;
    }
    return scoreB - scoreA;
  });
};
const findActiveModel = (mtModels, settings) => {
  const {
    sourceLanguage = null,
    targetLanguage = null,
    industry = '',
    client = null,
  } = settings;
  const languageModels = mtModels.filter(model => (
    _.get(model, 'sourceLanguage.isoCode') === sourceLanguage
    && _.get(model, 'targetLanguage.isoCode') === targetLanguage
  ));
  const clientModels = languageModels.filter(model =>
    _.get(model, 'client._id', null) === client);
  if (clientModels.length > 0) return clientModels[0];
  const industryModels = languageModels.filter(model =>
    _.get(model, 'industry', '') === industry
    && _.get(model, 'client._id', null) === null
  );
  if (industryModels.length > 0) return industryModels[0];
  const generalModels = languageModels.filter(model =>
    _.get(model, 'isGeneral', false) === true
  );
  if (generalModels.length > 0) return generalModels[0];
  return null;
};
let suggestionsPoller;
const PIPELINE_STATUS_ERROR = 'failed';
const PIPELINE_STATUS_IN_PROGRESS = 'running';
const SEGMENT_STATUS_UNCONFIRMED = 'UNCONFIRMED';
const SEGMENTS_FILTER_QA = 'qa';
const SUGGESTIONS_POLLER_INTERVAL = 10000;
const SUGGESTIONS_THRESHOLD = 50;
const portalCatService = new PortalCatService();
const requestService = new RequestService();
const workflowService = new WorkflowService();
const mtModelService = new MtModelService();
const mtEngineService = new MtEngineService();
const companyService = new CompanyService();
const initialState = () => ({
  isLoading: false,
  isPipelinesLoading: false,
  isQaReportLoading: false,
  request: null,
  workflow: null,
  task: null,
  documents: [],
  activeDocument: null,
  documentsById: {},
  pipelinesById: {},
  pipelines: [],
  pipelinesErrors: {},
  isPipelineInProgress: false,
  isActionFilesModalOpened: false,
  activeDownloads: [],
  segments: [],
  segmentsById: {},
  searchedSegments: [],
  taskConfig: null,
  suggestions: null,
  suggestionsAreLoading: false,
  resourcesSearchParams: null,
  confirmDialogOptions: {
    handler: null,
    message: '',
    title: '',
    cancelText: null,
    payload: null,
  },
  pickedResource: null,
  isSegmentLoadingById: {},
  progressIsLoading: false,
  requestProgress: null,
  segmentHistoryId: '',
  repetitions: [],
  repetitionsById: {},
  segmentsWithQaIssues: new Set(),
  suggestionsModel: null,
  mtEngine: null,
  selectedSegments: [],
});

const mutations = {
  [pcMutations.PORTALCAT_RESET](state) {
    const newState = initialState();
    Object.keys(newState).forEach((key) => {
      state[key] = newState[key];
    });
  },
  [pcMutations.PORTALCAT_SET_IS_LOADING](state, isLoading) {
    state.isLoading = isLoading;
  },
  [pcMutations.PORTALCAT_SET_QA_REPORT_IS_LOADING](state, isLoading) {
    state.isQaReportLoading = isLoading;
  },
  [pcMutations.PORTALCAT_STORE_REQUEST](state, request) {
    state.request = request;
  },
  [pcMutations.PORTALCAT_STORE_WORKFLOW](state, workflow) {
    state.workflow = workflow;
  },
  [pcMutations.PORTALCAT_STORE_TASK](state, task) {
    state.task = task;
  },
  [pcMutations.PORTALCAT_SET_ACTIVE_DOCUMENT](state, documentId) {
    state.activeDocument = documentId;
  },
  [pcMutations.PORTALCAT_STORE_DOCUMENTS](state, documents = []) {
    const documentsById = {};
    state.documents = documents.map((document) => {
      documentsById[document._id] = document;
      return document._id;
    });
    state.documentsById = documentsById;
  },
  [pcMutations.PORTALCAT_STORE_PIPELINES](state, pipelines) {
    const pipelinesIds = [];
    let pipelinesById = {};
    _.forEach(pipelines, (pipeline) => {
      pipelinesIds.push(pipeline._id);
      pipelinesById = { ...pipelinesById, [pipeline._id]: pipeline };
    });
    state.pipelines = pipelinesIds;
    state.pipelinesById = pipelinesById;
  },
  [pcMutations.PORTALCAT_SET_ACTION_FILES_MODAL_OPENED](state, isOpened) {
    state.isActionFilesModalOpened = isOpened;
  },
  [pcMutations.PORTALCAT_SET_ACTIVE_DOWNLOADS](state, downloads) {
    state.activeDownloads = downloads;
  },
  [pcMutations.PORTALCAT_SET_SEGMENTS](state, segments) {
    const segmentIds = [];
    let segmentsById = {};
    _.forEach(segments, (segment) => {
      segmentIds.push(segment.originalId);
      segmentsById = {
        ...segmentsById,
        [segment.originalId]: segment,
      };
    });
    state.segments = segmentIds;
    state.segmentsById = segmentsById;
  },
  [pcMutations.PORTALCAT_SET_SEARCHED_SEGMENTS](state, segmentsByFileId) {
    state.searchedSegments = Object.keys(segmentsByFileId).reduce((res, fileId) => {
      res[fileId] = new Set(segmentsByFileId[fileId].map(segment => segment.originalId));
      return res;
    }, {});
  },
  [pcMutations.PORTALCAT_REMOVE_SEGMENT_FROM_SEARCHED_SEGMENTS](state, segmentId) {
    const searchedSegments = _.cloneDeep(state.searchedSegments);
    if (_.isEmpty(searchedSegments)) {
      return;
    }
    const foundPair = Object.entries(searchedSegments).find(pair => pair[1].has(segmentId));
    if (!foundPair) {
      return;
    }
    const [fileId] = foundPair;
    const segmentIdsSet = searchedSegments[fileId];
    segmentIdsSet.delete(segmentId);
    Vue.set(state, 'searchedSegments', searchedSegments);
  },
  [pcMutations.PORTALCAT_SET_PIPELINE_STATUS](state, { id, status }) {
    Vue.set(state.pipelinesById[id], 'status', status);
  },
  [pcMutations.PORTALCAT_SET_PIPELINE_IS_IN_PROGRESS](state, isInProgress) {
    state.isPipelineInProgress = isInProgress;
  },
  [pcMutations.PORTALCAT_SET_PIPELINE_IS_LOADING](state, isLoading) {
    state.isPipelinesLoading = isLoading;
  },
  [pcMutations.PORTALCAT_SET_TASK_CONFIG](state, config) {
    state.taskConfig = config;
  },
  [pcMutations.PORTALCAT_STORE_PIPELINES_ERRORS](state, errors) {
    state.pipelinesErrors = errors;
  },
  [pcMutations.PORTALCAT_SET_SUGGESTIONS](state, suggestions) {
    state.suggestions = suggestions;
  },
  [pcMutations.PORTALCAT_SET_SUGGESTIONS_ARE_LOADING](state, areLoading) {
    state.suggestionsAreLoading = areLoading;
  },
  [pcMutations.PORTALCAT_SET_RESOURCES_SEARCH_PARAMS](state, params) {
    state.resourcesSearchParams = params;
  },
  [pcMutations.PORTALCAT_SET_SEGMENT](state, newSegment) {
    Vue.set(state.segmentsById, newSegment.originalId, newSegment);
  },
  [pcMutations.PORTALCAT_PATCH_SEGMENT](state, { originalId, data }) {
    _.keys(data).forEach((key) => {
      const segment = _.get(state, `segmentsById.${originalId}`, {});
      Vue.set(segment, key, data[key]);
      const repetition = _.get(state, `repetitionsById.${originalId}.fileSegment`, {});
      Vue.set(repetition, key, data[key]);
    });
  },
  [pcMutations.PORTALCAT_SET_CONFIRM_DIALOG_OPTIONS](state, options) {
    state.confirmDialogOptions = options;
  },
  [pcMutations.PORTALCAT_SET_PICKED_RESOURCE](state, resource) {
    state.pickedResource = _.clone(resource);
  },
  [pcMutations.PORTALCAT_SET_SEGMENT_IS_LOADING](state, { originalId, isLoading }) {
    Vue.set(state.isSegmentLoadingById, originalId, isLoading);
  },
  [pcMutations.PORTALCAT_SET_PROGRESS_IS_LOADING](state, isLoading) {
    state.progressIsLoading = isLoading;
  },
  [pcMutations.PORTALCAT_SET_REQUEST_PROGRESS](state, progress) {
    state.requestProgress = progress;
  },
  [pcMutations.PORTALCAT_SET_SEGMENT_HISTORY_ID](state, segmentId) {
    state.segmentHistoryId = segmentId;
  },
  [pcMutations.PORTALCAT_SET_REPETITION](state, repetition) {
    Vue.set(state.repetitionsById[repetition.originalId], 'fileSegment', repetition);
  },
  [pcMutations.PORTALCAT_SET_REPETITIONS](state, repetitions) {
    const repetitionsIds = [];
    let repetitionsById = {};
    _.forEach(repetitions, (repetition) => {
      const originalId = _.get(repetition, 'fileSegment.originalId');
      repetitionsIds.push(originalId);
      repetitionsById = {
        ...repetitionsById,
        [originalId]: repetition,
      };
    });
    state.repetitions = repetitionsIds;
    state.repetitionsById = repetitionsById;
  },
  [pcMutations.PORTALCAT_SET_SEGMENTS_WITH_QA_ISSUES](state, segments = []) {
    const segmentIds = [];
    for (const segment of segments) {
      const segmentId = _.get(segment, 'originalId', segment);
      segmentIds.push(segmentId);
    }
    state.segmentsWithQaIssues = new Set(segmentIds);
  },
  [pcMutations.PORTALCAT_SET_SUGGESTIONS_MODEL](state, suggestionsModel) {
    state.suggestionsModel = suggestionsModel;
  },
  [pcMutations.PORTALCAT_SET_SUGGESTIONS_ENGINE](state, mtEngine) {
    state.mtEngine = mtEngine;
  },
  [pcMutations.PORTALCAT_SET_SELECTED_SEGMENTS](state, selectedSegments) {
    state.selectedSegments = selectedSegments;
  },
};

const actions = {
  async initPortalCat({ commit, dispatch }, { requestId, workflowId, taskId }) {
    commit(pcMutations.PORTALCAT_RESET);
    commit(pcMutations.PORTALCAT_SET_IS_LOADING, true);
    const requestResponse = await requestService.get(requestId);
    const request = _.get(requestResponse, 'data.request', null);
    commit(pcMutations.PORTALCAT_STORE_REQUEST, request);
    const workflowResponse = await workflowService.list(
      requestId,
      { workflowIds: [workflowId] },
      { withCATData: false }
    );
    const workflow = _.get(workflowResponse, 'data.workflows[0]', null);
    commit(pcMutations.PORTALCAT_STORE_WORKFLOW, workflow);
    const task = findEntity(workflow, 'tasks', taskId, 'Task is not found');
    commit(pcMutations.PORTALCAT_STORE_TASK, task);
    try {
      await dispatch('initTaskConfig', { requestId, workflowId, taskId });
      await dispatch('fetchRepetitions', { requestId, tgtLang: _.get(workflow, 'tgtLang.isoCode'), shouldUseLoader: false });
      await dispatch('fetchRequestProgress', requestId);
      await dispatch('fetchPipelines', { requestId, workflowId });
      await dispatch('fetchMtModels', { workflow, request });
      await dispatch('fetchMtEngine', { workflow, request });
    } catch (err) {
      commit(pcMutations.PORTALCAT_SET_IS_LOADING, false);
      throw err;
    }
  },
  async fetchSegmentsWithQaIssues({ commit }, { requestId, workflowId, fileId }) {
    commit(pcMutations.PORTALCAT_SET_QA_REPORT_IS_LOADING, true);
    const response = await portalCatService.getFileSegments(requestId, {
      workflowId, fileId, filter: SEGMENTS_FILTER_QA,
    });
    const segments = _.get(response, 'data.segments', []);
    commit(pcMutations.PORTALCAT_SET_SEGMENTS_WITH_QA_ISSUES, segments);
    commit(pcMutations.PORTALCAT_SET_QA_REPORT_IS_LOADING, false);
  },
  async fetchPipelines({ commit, state }, { requestId, workflowId, fileId }) {
    commit(pcMutations.PORTALCAT_SET_IS_LOADING, true);
    try {
      const pipelinesResponse = await portalCatService.getPipelines({
        requestId, workflowId, fileId,
      });
      const pipelines = _.get(pipelinesResponse, 'data.pipelines', []);
      if (!_.isNil(fileId)) {
        commit(pcMutations.PORTALCAT_STORE_PIPELINES, pipelines);
      }
      const pipelinesErrors = {};
      let isPipelineInProgress;
      pipelines.forEach((pipeline) => {
        const status = _.get(pipeline, 'status', '');
        isPipelineInProgress = !_.isNil(isPipelineInProgress) &&
          status === PIPELINE_STATUS_IN_PROGRESS;
        const type = _.get(pipeline, 'type', '');
        const message = _.get(pipeline, 'message', '');
        if (status === PIPELINE_STATUS_ERROR) {
          pipelinesErrors[type] = { message };
        }
      });
      commit(pcMutations.PORTALCAT_STORE_PIPELINES_ERRORS, pipelinesErrors);
      commit(pcMutations.PORTALCAT_SET_PIPELINE_IS_IN_PROGRESS, isPipelineInProgress);
      if (_.isNil(fileId)) {
        const files = new Map();
        pipelines.forEach((pipeline) => {
          const _id = _.get(pipeline, 'fileId', '');
          const file = {
            _id,
            name: _.get(pipeline, 'fileName', ''),
          };
          files.set(_id, file);
        });
        const filesArray = Array.from(files.values());
        const cachedActiveDocumentId = _.get(state, 'taskConfig.activeDocument', null);
        const activeDocument = files.get(cachedActiveDocumentId);
        let activeDocumentId;
        if (!_.isNil(activeDocument)) {
          activeDocumentId = cachedActiveDocumentId;
        } else {
          activeDocumentId = _.get(_.nth(filesArray, 0), '_id', null);
        }
        commit(pcMutations.PORTALCAT_STORE_DOCUMENTS, filesArray);
        commit(pcMutations.PORTALCAT_SET_ACTIVE_DOCUMENT, activeDocumentId);
      }
      return pipelines;
    } finally {
      commit(pcMutations.PORTALCAT_SET_IS_LOADING, false);
    }
  },
  setActiveDocument({ commit }, documentId) {
    commit(pcMutations.PORTALCAT_SET_ACTIVE_DOCUMENT, documentId);
  },
  async fetchFileSegments({ commit }, { requestId, workflowId, fileId }) {
    commit(pcMutations.PORTALCAT_SET_IS_LOADING, true);
    commit(pcMutations.PORTALCAT_SET_SEGMENTS, []);
    const segmentsResponse =
      await portalCatService.getFileSegments(requestId, { workflowId, fileId });
    const segments = _.get(segmentsResponse, 'data.segments', []);
    commit(pcMutations.PORTALCAT_SET_SEGMENTS, segments);
    commit(pcMutations.PORTALCAT_SET_IS_LOADING, false);
  },
  async fetchFileSegmentById(
    { commit, getters, dispatch },
    { requestId, workflowId, fileId, segmentId },
  ) {
    commit(pcMutations.PORTALCAT_SET_SEGMENT_IS_LOADING, {
      originalId: segmentId,
      isLoading: true,
    });
    try {
      const response = await portalCatService.getFileSegmentById(requestId, {
        workflowId,
        fileId,
        segmentId,
      });
      const segment = _.get(response, 'data.segment');
      commit(pcMutations.PORTALCAT_SET_SEGMENT, segment);
      const repetition = getters.repetitionById(segmentId);
      if (!_.isNil(repetition)) {
        commit(pcMutations.PORTALCAT_SET_REPETITION, {
          ...repetition,
          ...segment,
        });
      }
    } catch (err) {
      const message = _.get(err, 'status.message', err.message);
      dispatch('notifications/pushNotification', errorNotification(`Error fetching file segment: ${message}`), { root: true });
    }
    commit(pcMutations.PORTALCAT_SET_SEGMENT_IS_LOADING, {
      originalId: segmentId,
      isLoading: false,
    });
  },
  removeSegmentFromSearchedSegments({ commit }, segmentId) {
    commit(pcMutations.PORTALCAT_REMOVE_SEGMENT_FROM_SEARCHED_SEGMENTS, segmentId);
  },
  async fetchPipelineStatus({ commit }, { requestId, pipelineId }) {
    const statusResponse = await portalCatService.getPipelineStatus({ requestId, pipelineId });
    const { status } = _.get(statusResponse, 'data.statuses[0]');
    commit(pcMutations.PORTALCAT_SET_PIPELINE_STATUS, {
      id: pipelineId,
      status,
    });
    commit(
      pcMutations.PORTALCAT_SET_PIPELINE_IS_IN_PROGRESS,
      status === PIPELINE_STATUS_IN_PROGRESS
    );
  },
  async runPipelines({ commit, dispatch }, { scope, requestId, workflowId, pipelineId }) {
    commit(pcMutations.PORTALCAT_SET_PIPELINE_IS_LOADING, true);
    const params = { scope, pipelineId, workflowId };
    try {
      await portalCatService.runPipelines(requestId, params);
      commit(pcMutations.PORTALCAT_SET_PIPELINE_STATUS, {
        id: pipelineId,
        status: PIPELINE_STATUS_IN_PROGRESS,
      });
      commit(
        pcMutations.PORTALCAT_SET_PIPELINE_IS_IN_PROGRESS,
        true
      );
    } catch (e) {
      dispatch(
        'notifications/pushNotification',
        errorNotification(`Error while running pipeline ${pipelineId}: ${_.get(e, 'status.message', e)}`),
        { root: true },
      );
    }
    commit(pcMutations.PORTALCAT_SET_PIPELINE_IS_LOADING, false);
  },
  async stopPipelines({ commit, dispatch }, { scope, requestId, workflowId, pipelineId }) {
    commit(pcMutations.PORTALCAT_SET_PIPELINE_IS_LOADING, true);
    const params = { scope, pipelineId, workflowId };
    try {
      await portalCatService.stopPipelines(requestId, params);
      await dispatch('fetchPipelineStatus', { requestId, pipelineId });
    } catch (e) {
      dispatch(
        'notifications/pushNotification',
        errorNotification(`Error while stopping pipeline ${pipelineId}: ${_.get(e, 'status.message', '')}`),
        { root: true },
      );
    }
    commit(pcMutations.PORTALCAT_SET_PIPELINE_IS_LOADING, false);
  },
  async initTaskConfig({ commit }, params) {
    const response = await portalCatService.getConfig(params).catch(() => {});
    commit(pcMutations.PORTALCAT_SET_TASK_CONFIG, _.get(response, 'data.config'));
  },
  setTaskConfig({ state, commit }, config) {
    const newConfig = Object.assign({}, state.taskConfig, config);
    commit(pcMutations.PORTALCAT_SET_TASK_CONFIG, newConfig);
  },
  saveTaskConfig({ state }) {
    const requestId = _.get(state, 'request._id');
    const workflowId = _.get(state, 'workflow._id');
    const taskId = _.get(state, 'task._id');
    if (_.isNil(requestId) || _.isNil(workflowId) || _.isNil(taskId)) {
      return;
    }
    const body = {
      requestId,
      workflowId,
      taskId,
      config: {
        ...state.taskConfig,
        widgets: state.taskConfig.widgets.map(widget => _.omit(widget, ['component'])),
      },
    };
    return portalCatService.saveConfig(body);
  },
  async joinFileSegments({ commit, dispatch }, { requestId, workflowId, fileId, segmentsIds }) {
    commit(pcMutations.PORTALCAT_SET_IS_LOADING, true);
    let response;
    try {
      response = await portalCatService.joinFileSegments(
        requestId,
        { workflowId, fileId, segmentsIds },
      );
      await dispatch('fetchFileSegments', { requestId, workflowId, fileId });
    } catch (e) {
      const message = _.get(e, 'status.message', e.message);
      dispatch('notifications/pushNotification', errorNotification(message), { root: true });
    }
    commit(pcMutations.PORTALCAT_SET_IS_LOADING, false);
    return _.get(response, 'data.fileSegment');
  },
  async splitFileSegment(
    { commit, dispatch },
    { requestId, workflowId, fileId, segmentId, position }
  ) {
    commit(pcMutations.PORTALCAT_SET_IS_LOADING, true);
    let response;
    try {
      response = await portalCatService.splitFileSegment(
        requestId,
        { workflowId, fileId, segmentId, position },
      );
      await dispatch('fetchFileSegments', { requestId, workflowId, fileId });
    } catch (e) {
      const message = _.get(e, 'status.message', e.message);
      dispatch('notifications/pushNotification', errorNotification(message), { root: true });
    }
    commit(pcMutations.PORTALCAT_SET_IS_LOADING, false);
    return _.get(response, 'data.fileSegments');
  },
  async searchSuggestions(
    { commit, getters, dispatch, state },
    { activeSegments, requestId, workflowId, fileId }
  ) {
    if (!_.isNil(suggestionsPoller)) {
      suggestionsPoller.cancel();
    }
    if (_.isEmpty(activeSegments) || activeSegments.length > 1) {
      commit(pcMutations.PORTALCAT_SET_SUGGESTIONS, []);
      commit(pcMutations.PORTALCAT_SET_SUGGESTIONS_ARE_LOADING, false);
      return;
    }
    commit(pcMutations.PORTALCAT_SET_SUGGESTIONS_ARE_LOADING, true);
    let segment = getters.segmentById(_.first(activeSegments));
    if (_.isNil(segment)) {
      segment = getters.repetitionById(_.first(activeSegments));
    }
    const { source: { text }, originalId: segmentId } = segment;
    if (_.isEmpty(text)) {
      commit(pcMutations.PORTALCAT_SET_SUGGESTIONS, []);
      commit(pcMutations.PORTALCAT_SET_SUGGESTIONS_ARE_LOADING, false);
      return;
    }
    suggestionsPoller =
      new CancellablePoller(
        portalCatService.searchSuggestions
          .bind(portalCatService, requestId, {
            workflowId,
            text,
            segmentId,
            fileId,
            threshold: SUGGESTIONS_THRESHOLD,
          }),
        SUGGESTIONS_POLLER_INTERVAL,
      );
    suggestionsPoller.start((suggestions = [], error, poller) => {
      if (!poller.cancelled) {
        poller.cancel();
        if (!_.isNil(error)) {
          const message = _.get(error, 'status.message');
          dispatch('notifications/pushNotification', errorNotification(message), { root: true });
          return;
        }
        sortSuggestions(suggestions, _.get(state, 'request.company.pcSettings.mtThreshold'));
        commit(pcMutations.PORTALCAT_SET_SUGGESTIONS, suggestions);
        commit(pcMutations.PORTALCAT_SET_SUGGESTIONS_ARE_LOADING, false);
      }
    });
  },
  async updateFileSegmentLocked(
    { commit, dispatch },
    { requestId, workflowId, fileId, originalId, isLocked }
  ) {
    commit(pcMutations.PORTALCAT_SET_IS_LOADING, true);
    try {
      const response = await portalCatService.updateFileSegmentLocked(
        requestId,
        { workflowId, fileId, originalId, isLocked }
      );
      const fileSegment = _.get(response, 'data.fileSegment');
      dispatch('updateFileSegment', fileSegment);
    } catch (err) {
      const message = _.get(err, 'status.message', err.message);
      dispatch('notifications/pushNotification', errorNotification(message), { root: true });
    }
    commit(pcMutations.PORTALCAT_SET_IS_LOADING, false);
  },
  async updateFileSegmentQaIssues(
    { commit, dispatch },
    { requestId, workflowId, taskId, fileId, originalId, qaIssues }
  ) {
    commit(pcMutations.PORTALCAT_SET_SEGMENT_IS_LOADING, {
      originalId,
      isLoading: true,
    });
    try {
      const response = await portalCatService.updateFileSegmentQaIssues(
        requestId,
        { workflowId, taskId, fileId, originalId, qaIssues }
      );
      const fileSegment = _.get(response, 'data.fileSegment');
      dispatch('updateFileSegment', fileSegment);
    } catch (err) {
      const message = _.get(err, 'status.message', err.message);
      dispatch('notifications/pushNotification', errorNotification(message), { root: true });
    }
    commit(pcMutations.PORTALCAT_SET_SEGMENT_IS_LOADING, {
      originalId,
      isLoading: false,
    });
  },
  updateFileSegment({ commit, getters, dispatch }, newSegment) {
    const newSegmentClone = _.clone(newSegment);
    let oldSegment = getters.segmentById(newSegmentClone.originalId);
    if (_.isNil(oldSegment)) {
      oldSegment = getters.repetitionById(newSegmentClone.originalId);
    }
    if (hasChangedSegmentContent(oldSegment, newSegmentClone)) {
      _.set(newSegmentClone, 'status', SEGMENT_STATUS_UNCONFIRMED);
    }
    commit(pcMutations.PORTALCAT_SET_SEGMENT, newSegmentClone);
    dispatch('updateQaIssues', newSegmentClone);
    const repetition = getters.repetitionById(newSegmentClone.originalId);
    if (!_.isNil(repetition)) {
      commit(pcMutations.PORTALCAT_SET_REPETITION, {
        ...repetition,
        ...newSegmentClone,
      });
    }
    return newSegmentClone;
  },
  async saveFileSegment(
    { commit, dispatch, state, getters },
    { requestId, workflowId, fileId, originalId, segment, repetitionsStrategy }
  ) {
    commit(pcMutations.PORTALCAT_SET_SEGMENT_IS_LOADING, { originalId, isLoading: true });
    let response;
    let fileSegment;
    try {
      response = await portalCatService.updateFileSegment(requestId, {
        workflowId,
        fileId,
        taskId: _.get(state, 'task._id', ''),
        originalId,
        segment,
        repetitionsStrategy,
      });
      fileSegment = _.get(response, 'data.fileSegment');
      commit(pcMutations.PORTALCAT_PATCH_SEGMENT, {
        originalId,
        data: { locked: fileSegment.locked, qaIssues: fileSegment.qaIssues },
      });
      dispatch('updateQaIssues', fileSegment);
    } catch (err) {
      const errorCode = _.get(err, 'status.code');
      if (errorCode === 409) {
        throw err;
      }
      const oldSegment = _.get(err, 'status.data.fileSegment');
      if (!_.isNil(oldSegment)) {
        commit(pcMutations.PORTALCAT_SET_SEGMENT, oldSegment);
        commit(pcMutations.PORTALCAT_SET_REPETITION, oldSegment);
      }
      const message = _.get(err, 'status.message', err.message);
      dispatch('notifications/pushNotification', errorNotification(message), { root: true });
    } finally {
      commit(pcMutations.PORTALCAT_SET_SEGMENT_IS_LOADING, { originalId, isLoading: false });
      const repetitions = getters.segmentRepetitionsById(segment.originalId);
      if (!_.isNil(repetitions)) {
        repetitions.forEach(
          rep => dispatch(
            'fetchFileSegmentById',
            { requestId, workflowId, fileId: rep.fileId, segmentId: rep.originalId }
          )
        );
      }
    }
    return fileSegment;
  },
  updateQaIssues({ commit, getters, state }, fileSegment) {
    const qaIssues = _.get(fileSegment, 'qaIssues');
    const originalId = _.get(fileSegment, 'originalId');
    commit(pcMutations.PORTALCAT_SET_SEGMENT, {
      ...getters.segmentById(originalId),
      qaIssues: _.get(fileSegment, 'qaIssues'),
    });
    const shouldRemoveFromQaIssues = (_.isNil(qaIssues) || areAllQaIssuesIgnored(qaIssues)) &&
      state.segmentsWithQaIssues.has(originalId);
    if (shouldRemoveFromQaIssues) {
      state.segmentsWithQaIssues.delete(originalId);
    } else if (!areAllQaIssuesIgnored(qaIssues)) {
      state.segmentsWithQaIssues.add(originalId);
    }
    commit(pcMutations.PORTALCAT_SET_SEGMENTS_WITH_QA_ISSUES, state.segmentsWithQaIssues);
  },
  async searchSegments({ commit, dispatch }, { requestId, workflowId, params }) {
    commit(pcMutations.PORTALCAT_SET_IS_LOADING, true);
    try {
      const response = await portalCatService.searchFileSegments(
        requestId,
        { workflowId, params },
      );
      commit(pcMutations.PORTALCAT_SET_SEARCHED_SEGMENTS, _.get(response, 'data.fileSegments', []));
    } catch (err) {
      const message = _.get(err, 'status.message', err.message);
      dispatch('notifications/pushNotification', errorNotification(message), { root: true });
    }
    commit(pcMutations.PORTALCAT_SET_IS_LOADING, false);
  },
  async replaceSegmentsContent(
    { commit, getters, dispatch },
    { requestId, workflowId, params, scope, fileId },
  ) {
    commit(pcMutations.PORTALCAT_SET_IS_LOADING, true);
    let segments = [];
    try {
      const response = await portalCatService.replaceFileSegmentsContent(
        requestId,
        {
          workflowId,
          body: { params, scope, fileId },
        },
      );
      segments = _.get(response, 'data.fileSegments', []);
      if (_.isEmpty(segments)) {
        dispatch('fetchFileSegments', { requestId, workflowId, fileId });
      }
      segments.forEach((segment) => {
        commit(pcMutations.PORTALCAT_SET_SEGMENT, segment);
        const repetition = getters.repetitionById(segment.originalId);
        if (!_.isNil(repetition)) {
          commit(pcMutations.PORTALCAT_SET_REPETITION, {
            ...repetition,
            ...segment,
          });
        }
      });
      if (!_.isEmpty(segments)) {
        commit(pcMutations.PORTALCAT_SET_SEARCHED_SEGMENTS, { [fileId]: segments });
      }
    } finally {
      commit(pcMutations.PORTALCAT_SET_IS_LOADING, false);
    }
    return segments;
  },
  async fetchRequestProgress({ commit, state }, requestId) {
    commit(pcMutations.PORTALCAT_SET_PROGRESS_IS_LOADING, true);
    try {
      const response = await portalCatService.getRequestProgress(requestId);
      const srcLang = _.get(state.workflow, 'srcLang.isoCode', '');
      const tgtLang = _.get(state.workflow, 'tgtLang.isoCode', '');
      const progress = _.get(response, `data.requestProgress.progressByLangPairs.${srcLang}_${tgtLang}`);
      commit(pcMutations.PORTALCAT_SET_REQUEST_PROGRESS, progress);
    } finally {
      commit(pcMutations.PORTALCAT_SET_PROGRESS_IS_LOADING, false);
    }
  },
  async fetchRepetitions({ commit, dispatch }, { requestId, tgtLang, shouldUseLoader = true }) {
    if (shouldUseLoader) {
      commit(pcMutations.PORTALCAT_SET_IS_LOADING, true);
    }
    try {
      const response = await portalCatService.getSegmentsRepetitions(requestId, tgtLang);
      const repetitions = _.get(response, 'data.repetitions', []);
      commit(pcMutations.PORTALCAT_SET_REPETITIONS, repetitions);
    } catch (err) {
      const message = _.get(err, 'status.message', err.message);
      dispatch('notifications/pushNotification', errorNotification(`Error fetching repetitions: ${message}`), { root: true });
    }
    if (shouldUseLoader) {
      commit(pcMutations.PORTALCAT_SET_IS_LOADING, false);
    }
  },
  async fetchMtModels({ commit }, { workflow, request }) {
    const languageCombinations = _.get(request, 'company.mtSettings.languageCombinations', []);
    const portalMtCombination = languageCombinations.find(combination =>
      combination.tgtLang === _.get(workflow, 'tgtLang.isoCode', null)
      && combination.srcLang === _.get(workflow, 'srcLang.isoCode', null)
      && combination.isPortalMt);
    if (_.isNil(portalMtCombination)) {
      return;
    }
    const companyResponse = await companyService.retrieveIndustry(request.company._id);
    const settings = {
      sourceLanguage: _.get(workflow, 'srcLang.isoCode'),
      targetLanguage: _.get(workflow, 'tgtLang.isoCode'),
      client: _.get(request, 'company._id', null),
      industry: _.get(companyResponse, 'data.industry', ''),
    };
    const filter = { deletedText: 'false', isProductionReadyText: 'true' };
    const modelsResponse = await mtModelService.retrieve({ filter });
    const mtModels = _.get(modelsResponse, 'data.list', []);
    const suggestionsModel = findActiveModel(mtModels, settings);
    if (!_.isNil(suggestionsModel)) {
      commit(pcMutations.PORTALCAT_SET_SUGGESTIONS_MODEL, suggestionsModel);
    }
  },
  async fetchMtEngine({ commit, rootGetters }, { workflow, request }) {
    const userLogged = rootGetters['app/userLogged'];
    if (!hasRole(userLogged, 'MT-ENGINES_READ_ALL')) {
      return;
    }
    const companyCombinations = _.get(request, 'company.mtSettings.languageCombinations', []);
    const workflowCompanyCombination = companyCombinations.find(combination =>
      combination.tgtLang === _.get(workflow, 'tgtLang.isoCode', null)
      && combination.srcLang === _.get(workflow, 'srcLang.isoCode', null)
    );
    if (_.isNil(workflowCompanyCombination)) return;
    const response = await mtEngineService.get(workflowCompanyCombination.mtEngine);
    const mtEngine = _.get(response, 'data.mtEngine');
    if (!_.isNil(mtEngine)) {
      commit(pcMutations.PORTALCAT_SET_SUGGESTIONS_ENGINE, mtEngine);
    }
  },
  setSelectedSegments({ commit }, selectedSegments) {
    commit(pcMutations.PORTALCAT_SET_SELECTED_SEGMENTS, selectedSegments);
  },
};

const getters = {
  documentById: state => id => state.documentsById[id],
  pipelineById: state => id => state.pipelinesById[id],
  segmentById: state => id => state.segmentsById[id],
  repetitionById: state => id => _.get(state, `repetitionsById[${id}].fileSegment`),
  segmentRepetitionsById: state => id => _.get(state, `repetitionsById[${id}].repetitions`),
  pipelineErrorByType: state => type => state.pipelinesErrors[type],
  isSegmentLoadingById: state => id => state.isSegmentLoadingById[id],
  useMt: state => _.get(state, 'workflow.useMt'),
};

export default {
  state: initialState,
  mutations,
  getters,
  actions,
  namespaced: true,
};
