const _ = require('lodash');
const { URL } = require('url');
const Promise = require('bluebird');
const { isValidObjectId } = require('mongoose');
const AxiosBasedApi = require('../../../axios-based-api');
const { buildPcSearchBody } = require('../portalcat-helpers');

const UPDATE_SEGMENT_ALLOWED_FIELDS = [
  'userId',
  'source',
  'target',
  'status',
];
const REPLACE_SEGMENT_SCOPE_ONE = 'one';

class TranslationMemoryApi extends AxiosBasedApi {
  constructor({ logger, user, configuration, sessionID }) {
    const headers = {
      'x-session-id': sessionID,
    };
    const { PC_BASE_URL } = configuration.environment;
    super(logger, Object.assign({ user, configuration }, { baseUrl: PC_BASE_URL, headers }));
  }

  async getSegments({ companyId, tmId }) {
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/tm/${tmId}/segments`;
    const response = await this.get(url);
    return _.get(response, 'data.tmSegments', []);
  }

  async getSegmentHistory({ companyId, tmId, originalId }) {
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/tm/${tmId}/segment/${originalId}/history`;
    const response = await this.get(url);
    const segments = _.get(response, 'data.tmSegments', []);
    await Promise.map(
      segments,
      segment => this._populateUsers(segment, ['createdBy']),
    );
    return segments;
  }

  async getSegmentDetails({ companyId, tmId, originalId }) {
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/tm/${tmId}/segment/${originalId}/info`;
    const response = await this.get(url);
    const segmentInfo = _.get(response, 'data.tmSegmentInfo', []);
    await this._populateUsers(segmentInfo, ['createdBy', 'updatedBy']);
    return segmentInfo;
  }

  deleteSegment({ companyId, tmId, originalId }) {
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/tm/${tmId}/segment/${originalId}`;
    const body = { userId: this.user._id };
    return this.delete(url, body);
  }

  async createSegment({ companyId, tmId, body }) {
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/tm/${tmId}/segments`;
    body.userId = this.user._id;
    const response = await this.post(url, body);
    return _.get(response, 'data.tmSegment');
  }

  async updateSegment({ companyId, tmId, originalId, body }) {
    body.userId = this.user._id;
    const sanitizedBody = _.pick(body, UPDATE_SEGMENT_ALLOWED_FIELDS);
    const endpoint = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/tm/${tmId}/segment/${originalId}`;
    const response = await this.put(endpoint, sanitizedBody);
    return _.get(response, 'data.tmSegment');
  }

  async searchSegmentsSimple({ companyId, tmId, params }) {
    const { text, lang, threshold } = params;
    const endpoint = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/tm/${tmId}/segments/search`;
    const url = new URL(endpoint, this.baseUrl);
    if (!_.isNil(text)) {
      url.searchParams.append('text', text);
    }
    if (!_.isNil(lang)) {
      url.searchParams.append('lang', lang);
    }
    if (!_.isNil(threshold)) {
      url.searchParams.append('threshold', threshold);
    }
    const finalUrl = url.pathname + url.search;
    const response = await this.get(finalUrl);
    return _.get(response, 'data.tmSearchResults', []);
  }

  async searchSegmentsFull({ companyId, tmId, body, tzOffset }) {
    const searchParams = _.get(body, 'params', {});
    const requestIds = _.get(searchParams, 'requestIds', []);
    let requestBody = {
      ...buildPcSearchBody(searchParams, tzOffset),
      requestIds: _.isEmpty(requestIds) ? null : requestIds,
    };
    requestBody = _.omitBy(requestBody, _.isNil);
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/tm/${tmId}/segments/search`;
    const response = await this.post(url, requestBody);
    return _.get(response, 'data.tmSegments', []);
  }

  async replaceSegmentsContent({ companyId, tmId, body, tzOffset }) {
    const scope = _.get(body, 'scope', REPLACE_SEGMENT_SCOPE_ONE);
    const params = _.get(body, 'params', {});
    const targetText = _.get(params, 'targetText', '');
    const replaceWith = _.get(params, 'replaceWith', '');
    const isCaseSensitive = _.get(params, 'isCaseSensitive', false);
    let replaceOriginalIds = _.get(params, 'replaceOriginalIds', []);
    if (scope === REPLACE_SEGMENT_SCOPE_ONE) {
      if (_.isEmpty(replaceOriginalIds)) {
        const searchedSegments = await this.searchSegmentsFull({ companyId, tmId, body, tzOffset });
        const firstSegment = _.first(searchedSegments);
        if (!_.isNil(firstSegment)) {
          replaceOriginalIds = [firstSegment.originalId];
        }
      }
    } else {
      const searchedSegments = await this.searchSegmentsFull({ companyId, tmId, body, tzOffset });
      replaceOriginalIds = searchedSegments.map(segment => segment.originalId);
    }
    let requestBody = {
      userId: this.user._id,
      targetText: _.isEmpty(targetText.trim()) ? null : targetText,
      matchCase: isCaseSensitive,
      replaceWithText: _.isEmpty(replaceWith.trim()) ? null : replaceWith,
      replaceOriginalIds,
    };
    requestBody = _.omitBy(requestBody, _.isNil);
    const url = `/api/portalcat/lsp/${this.lspId}/company/${companyId}/tm/${tmId}/segments/search/replace`;
    const response = await this.post(url, requestBody);
    return _.get(response, 'data.tmSegments', []);
  }

  deleteTm({
    lspId = this.lspId, companyId, tmId, retentionStartDate, keepActiveTmSegments = true,
  }) {
    const endpoint = `/api/portalcat/lsp/${lspId}/company/${companyId}/tm/${tmId}`;
    const url = new URL(endpoint, this.baseUrl);
    if (!_.isNil(retentionStartDate)) {
      url.searchParams.append('retentionStartDate', retentionStartDate);
    }
    url.searchParams.append('keepActiveTmSegments', keepActiveTmSegments);
    const finalUrl = url.pathname + url.search;
    return this.delete(finalUrl);
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
}

module.exports = TranslationMemoryApi;
