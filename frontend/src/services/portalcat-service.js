import _ from 'lodash';
import Vue from 'vue';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import portalCatResource from '../resources/portalcat';

export default class PortalCatService {
  constructor(resource = portalCatResource) {
    this.resource = resource;
    this.endpointBuilder = lspAwareUrl;
  }

  getFileSegments(requestId, { workflowId, fileId, filter }) {
    const url = this.endpointBuilder(`portalcat/${requestId}/tfsh`);
    return resourceWrapper(Vue.http.get(url, { params: { workflowId, fileId, filter } }), false);
  }

  getFileSegmentById(requestId, { workflowId, fileId, segmentId }) {
    const url = this.endpointBuilder(`portalcat/${requestId}/tfsh/${segmentId}`);
    return resourceWrapper(Vue.http.get(url, { params: { workflowId, fileId } }), false);
  }

  getPipelineStatus({ requestId, pipelineId, fileIds, types, srcLangs, tgtLangs }) {
    const url = this.endpointBuilder(`portalcat/${requestId}/pipelines/status`);
    return resourceWrapper(
      Vue.http.get(url, { params: { pipelineId, fileIds, types, srcLangs, tgtLangs } }),
      false,
    );
  }

  getFiles({ requestId, workflowId }) {
    const url = this.endpointBuilder(`portalcat/${requestId}/${workflowId}/files`);
    return resourceWrapper(Vue.http.get(url), false);
  }

  getPipelines({ requestId, workflowId, fileId, type }) {
    return resourceWrapper(this.resource.get({ requestId, workflowId, fileId, type }), false);
  }

  getPipelineActionConfig({ requestId, pipelineId, actionId }) {
    const url = this.endpointBuilder(`portalcat/${requestId}/pipelines/${pipelineId}/action/${actionId}/config`);
    return resourceWrapper(Vue.http.get(url), false);
  }

  updatePipelineActionConfig({ requestId, pipelineId, actionId, config }) {
    const url = this.endpointBuilder(`portalcat/${requestId}/pipelines/${pipelineId}/action/${actionId}/config`);
    return resourceWrapper(Vue.http.put(url, { config }), false);
  }

  getActionFileUrl({ pipelineId, actionId, fileId }) {
    return this.endpointBuilder(`portalcat/documents/${pipelineId}/${actionId}/${fileId}`);
  }

  async getActionsFilesZip(pipelineId) {
    const url = this.endpointBuilder(`portalcat/documents/${pipelineId}/action-files`);
    const response = await Vue.resource(url, null, null, { responseType: 'blob' }).get();
    const contentType = response.headers.get('content-type');
    const disposition = response.headers.get('content-disposition');
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    const filename = matches[1].replace(/['"]/g, '');
    return { type: contentType, data: response.data, filename };
  }

  runPipelines(requestId, body) {
    const url = this.endpointBuilder(`portalcat/${requestId}/pipelines/run`);
    return resourceWrapper(Vue.http.post(url, body), false);
  }

  stopPipelines(requestId, body) {
    const url = this.endpointBuilder(`portalcat/${requestId}/pipelines/stop`);
    return resourceWrapper(Vue.http.post(url, body), false);
  }

  saveConfig(body) {
    const url = this.endpointBuilder('portalcat/config');
    return resourceWrapper(Vue.http.put(url, body), false);
  }

  saveDefaultConfig(body) {
    const url = this.endpointBuilder('portalcat/config/default');
    return resourceWrapper(Vue.http.put(url, body), false);
  }

  getConfig(params) {
    const url = this.endpointBuilder('portalcat/config');
    return resourceWrapper(Vue.http.get(url, { params }), false);
  }

  joinFileSegments(requestId, body) {
    const url = this.endpointBuilder(`portalcat/${requestId}/tfsh/join`);
    return resourceWrapper(Vue.http.post(url, body), false);
  }

  splitFileSegment(requestId, body) {
    const url = this.endpointBuilder(`portalcat/${requestId}/tfsh/split`);
    return resourceWrapper(Vue.http.post(url, body), false);
  }

  searchTm(requestId, params) {
    const url = this.endpointBuilder(`portalcat/${requestId}/tm/search`);
    return resourceWrapper(Vue.http.get(url, { params }), false);
  }

  searchTb(requestId, params) {
    const url = this.endpointBuilder(`portalcat/${requestId}/tb/search`);
    return resourceWrapper(Vue.http.get(url, { params }), false);
  }

  getMachineTranslation(requestId, segmentId, params) {
    const url = this.endpointBuilder(`portalcat/${requestId}/tfsh/${segmentId}/mt`);
    return resourceWrapper(Vue.http.get(url, { params }), false);
  }

  async searchSuggestions(requestId, { workflowId, fileId, segmentId, text, threshold }) {
    let results = [];
    await Promise.all([
      this.searchTm(requestId, { searchIn: 'source', text, workflowId, threshold })
        .then((response) => {
          results = results.concat(_.get(response, 'data.tmSegments', []));
        }),
      this.getMachineTranslation(requestId, segmentId, { fileId, workflowId })
        .then((response) => {
          const tmFileSegment = _.get(response, 'data.fileSegment');
          if (!_.isNil(tmFileSegment)) {
            results.push(tmFileSegment);
          }
        }).catch(() => {}),
    ]);
    return results;
  }

  updateFileSegment(
    requestId,
    { workflowId, fileId, taskId, originalId, segment, repetitionsStrategy },
  ) {
    const url = this.endpointBuilder(`portalcat/${requestId}/tfsh/${originalId}`);
    return resourceWrapper(
      Vue.http.put(url, { workflowId, fileId, taskId, segment, repetitionsStrategy }),
      false,
    );
  }

  updateFileSegmentLocked(
    requestId,
    { workflowId, fileId, originalId, isLocked },
  ) {
    const url = this.endpointBuilder(`portalcat/${requestId}/${workflowId}/${fileId}/tfsh/${originalId}/locked`);
    return resourceWrapper(
      Vue.http.patch(url, { locked: isLocked }),
      false,
    );
  }

  updateFileSegmentQaIssues(
    requestId,
    { workflowId, taskId, fileId, originalId, qaIssues },
  ) {
    const url = this.endpointBuilder(`portalcat/${requestId}/${workflowId}/${taskId}/${fileId}/tfsh/${originalId}/qaissues`);
    return resourceWrapper(
      Vue.http.patch(url, { qaIssues }),
      false,
    );
  }

  assignFileSegmentsToUser(requestId, {
    workflowId,
    fileId,
    segmentsIds,
    users,
  }) {
    const url = this.endpointBuilder(`portalcat/${requestId}/tfsh`);
    return resourceWrapper(Vue.http.put(url, {
      workflowId,
      fileId,
      segmentsIds,
      users,
    }), false);
  }

  getRequestAnalysisStatus(requestId) {
    const endpoint = `portalcat/${requestId}/statistics/status`;
    const url = this.endpointBuilder(endpoint);
    return resourceWrapper(Vue.http.get(url), false);
  }

  getRequestAnalysis(requestId, withFuzzyMatches) {
    let endpoint = `portalcat/${requestId}/statistics`;
    if (!_.isNil(withFuzzyMatches)) {
      endpoint += `?withFuzzyMatches=${withFuzzyMatches}`;
    }
    const url = this.endpointBuilder(endpoint);
    return resourceWrapper(Vue.http.get(url), false);
  }

  runCatImport(requestId, body) {
    const endpoint = `request/${requestId}/portalcat/import`;
    const url = this.endpointBuilder(endpoint);
    return resourceWrapper(Vue.http.post(url, body), true);
  }

  runRequestAnalysis(requestId, lockedSegments) {
    const endpoint = `portalcat/${requestId}/statistics`;
    const url = this.endpointBuilder(endpoint);
    return resourceWrapper(Vue.http.post(url, lockedSegments), false);
  }

  searchFileSegments(requestId, { workflowId, params }) {
    const url = this.endpointBuilder(`portalcat/${requestId}/tfsh/search`);
    return resourceWrapper(Vue.http.post(url, { params }, { params: { workflowId } }), false);
  }

  replaceFileSegmentsContent(requestId, { workflowId, body }) {
    const url = this.endpointBuilder(`portalcat/${requestId}/tfsh/search/replace`);
    return resourceWrapper(Vue.http.post(url, body, { params: { workflowId } }), false);
  }

  getRequestProgress(requestId) {
    const url = this.endpointBuilder(`portalcat/${requestId}/progress`);
    return resourceWrapper(Vue.http.get(url), false);
  }

  getTaskProgress({ requestId, workflowId, taskId }) {
    const url = this.endpointBuilder(`portalcat/${requestId}/${workflowId}/${taskId}/progress`);
    return resourceWrapper(Vue.http.get(url), false);
  }

  getFileSegmentHistory(requestId, { workflowId, fileId, originalId }) {
    const url = this.endpointBuilder(`portalcat/${requestId}/tfsh/${originalId}/history`);
    return resourceWrapper(Vue.http.get(url, { params: { workflowId, fileId } }), false);
  }

  getSegmentsRepetitions(requestId, tgtLang) {
    const url = this.endpointBuilder(`portalcat/${requestId}/repetitions`);
    return resourceWrapper(Vue.http.get(url, { params: { tgtLang } }), false);
  }

  getRequestQaIssues(requestId) {
    const url = this.endpointBuilder(`portalcat/${requestId}/qa-issues`);
    return resourceWrapper(Vue.http.get(url), false);
  }

  getFinalFilesListByRequest(requestId) {
    const url = this.endpointBuilder(`portalcat/${requestId}/final/info`);
    return resourceWrapper(Vue.http.get(url), false);
  }

  getFinalFilesListByRequestLanguageCombination({ requestId, srcLang, tgtLang }) {
    const url = this.endpointBuilder(`portalcat/${requestId}/sl/${srcLang}/tl/${tgtLang}/final/info`);
    return resourceWrapper(Vue.http.get(url), false);
  }

  confirmAllSegments(requestId, { workflowId, fileId, status }) {
    const url = this.endpointBuilder(`portalcat/${requestId}/${workflowId}/${fileId}/segments/confirm`);
    return resourceWrapper(Vue.http.get(url, { params: { status } }), false);
  }

  ignoreAllIssues(requestId, { workflowId, fileId }) {
    const url = this.endpointBuilder(`portalcat/${requestId}/${workflowId}/${fileId}/segments/ignore`);
    return resourceWrapper(Vue.http.get(url), false);
  }
}
