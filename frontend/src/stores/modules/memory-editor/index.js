import Vue from 'vue';
import _ from 'lodash';
import * as mutationTypes from './types';
import TranslationMemoryService from '../../../services/translation-memory-service';
import CompanyService from '../../../services/company-service';
import { errorNotification } from '../../../utils/notifications';

const SEGMENT_STATUS_UNCONFIRMED = 'UNCONFIRMED';
const translationMemoryService = new TranslationMemoryService();
const companyService = new CompanyService();
const initialState = () => ({
  isLoading: false,
  isSegmentCreationInProgress: false,
  isSegmentDeletionInProgress: false,
  company: null,
  tmInfo: null,
  segments: [],
  segmentsById: {},
  searchedSegments: null,
  _activeSegmentsArray: [],
  segmentToCreate: null,
  isSegmentLoadingById: {},
});

const mutations = {
  [mutationTypes.MEMORY_EDITOR_RESET](state) {
    const newState = initialState();
    Object.keys(newState).forEach((key) => {
      state[key] = newState[key];
    });
  },
  [mutationTypes.MEMORY_EDITOR_SET_IS_LOADING](state, isLoading) {
    state.isLoading = isLoading;
  },
  [mutationTypes.MEMORY_EDITOR_SET_TM_INFO](state, tmInfo) {
    state.tmInfo = tmInfo;
  },
  [mutationTypes.MEMORY_EDITOR_SET_COMPANY](state, company) {
    state.company = company;
  },
  [mutationTypes.MEMORY_EDITOR_SET_ACTIVE_SEGMENTS_ARRAY](state, activeSegments) {
    state._activeSegmentsArray = activeSegments;
  },
  [mutationTypes.MEMORY_EDITOR_SET_SEGMENTS](state, segments) {
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
  [mutationTypes.MEMORY_EDITOR_SET_SEARCHED_SEGMENTS](state, segments) {
    if (_.isNil(segments)) {
      state.searchedSegments = null;
    } else {
      state.searchedSegments = segments.map(segment => segment.originalId);
    }
  },
  [mutationTypes.MEMORY_EDITOR_APPEND_SEGMENT](state, segment) {
    const segmentIds = state.segments.concat(segment.originalId);
    state.segments = segmentIds;
    Vue.set(state.segmentsById, segment.originalId, segment);
  },
  [mutationTypes.MEMORY_EDITOR_SET_SEGMENT_TO_CREATE](state, segment) {
    const originalId = _.get(segment, 'originalId');
    Vue.set(state.segmentsById, originalId, segment);
    state.segmentToCreate = originalId;
  },
  [mutationTypes.MEMORY_EDITOR_SET_IS_SEGMENT_CREATION_IN_PROGRESS](state, isInProgress) {
    state.isSegmentCreationInProgress = isInProgress;
  },
  [mutationTypes.MEMORY_EDITOR_SET_IS_SEGMENT_DELETION_IN_PROGRESS](state, isInProgress) {
    state.isSegmentDeletionInProgress = isInProgress;
  },
  [mutationTypes.MEMORY_EDITOR_SET_SEGMENT](state, newSegment) {
    Vue.set(state.segmentsById, newSegment.originalId, newSegment);
  },
  [mutationTypes.MEMORY_EDITOR_SET_SEGMENT_IS_LOADING](state, { originalId, isLoading }) {
    Vue.set(state.isSegmentLoadingById, originalId, isLoading);
  },
};

const actions = {
  async initMemoryEditor(
    { commit, dispatch },
    { companyId, srcLang, tgtLang }) {
    commit(mutationTypes.MEMORY_EDITOR_SET_IS_LOADING, true);
    const tmInfo = await dispatch('fetchTmInfo', { companyId, srcLang, tgtLang });
    const companyResponse = await companyService.retrievePublicInfo(companyId);
    const company = _.get(companyResponse, 'data.company');
    commit(mutationTypes.MEMORY_EDITOR_SET_COMPANY, company);
    commit(mutationTypes.MEMORY_EDITOR_SET_IS_LOADING, false);
    await dispatch('fetchSegments', { companyId, tmId: tmInfo._id });
  },
  async fetchTmInfo({ commit }, { companyId, srcLang, tgtLang }) {
    const tmResponse = await companyService.retrievePcSettingsResources(
      companyId,
      { type: 'tm', srcLang, tgtLang },
    );
    const tmInfo = _.get(tmResponse, 'data.list[0]');
    commit(mutationTypes.MEMORY_EDITOR_SET_TM_INFO, tmInfo);
    return tmInfo;
  },
  async fetchSegments({ commit }, { companyId, tmId }) {
    commit(mutationTypes.MEMORY_EDITOR_SET_IS_LOADING, true);
    const response = await translationMemoryService.getSegments(companyId, tmId);
    commit(mutationTypes.MEMORY_EDITOR_SET_SEGMENTS, _.get(response, 'data.segments', []));
    commit(mutationTypes.MEMORY_EDITOR_SET_IS_LOADING, false);
  },
  async createSegment({ commit, state, dispatch }, { companyId, tmId, body }) {
    commit(mutationTypes.MEMORY_EDITOR_SET_IS_SEGMENT_CREATION_IN_PROGRESS, true);
    try {
      const response = await translationMemoryService.createSegment({ companyId, tmId, body });
      const newSegment = _.get(response, 'data.segment');
      commit(mutationTypes.MEMORY_EDITOR_APPEND_SEGMENT, newSegment);
      const srcLang = _.get(state, 'tmInfo.srcLang.isoCode', '');
      const tgtLang = _.get(state, 'tmInfo.tgtLang.isoCode', '');
      dispatch('fetchTmInfo', { companyId, srcLang, tgtLang });
      return newSegment;
    } finally {
      commit(mutationTypes.MEMORY_EDITOR_SET_IS_SEGMENT_CREATION_IN_PROGRESS, false);
    }
  },
  addSegment({ commit, state }, newSegment) {
    const existingSegment = state.segmentToCreate;
    if (!_.isNil(existingSegment)) {
      return;
    }
    commit(mutationTypes.MEMORY_EDITOR_SET_SEGMENT_TO_CREATE, newSegment);
  },
  updateSegment({ commit, getters }, newSegment) {
    const newSegmentClone = _.clone(newSegment);
    const status = _.get(newSegmentClone, 'status');
    const oldStatus = _.get(getters.segmentById(newSegmentClone.originalId), 'status');
    if (status === oldStatus) {
      _.set(newSegmentClone, 'status', SEGMENT_STATUS_UNCONFIRMED);
    }
    commit(mutationTypes.MEMORY_EDITOR_SET_SEGMENT, newSegmentClone);
    return newSegmentClone;
  },
  async saveTmSegment(
    { commit, dispatch },
    { companyId, tmId, originalId, segment }
  ) {
    commit(mutationTypes.MEMORY_EDITOR_SET_SEGMENT_IS_LOADING, { originalId, isLoading: true });
    let response;
    let tmSegment;
    try {
      response = await translationMemoryService.updateSegment({
        companyId,
        tmId,
        originalId,
        body: segment,
      });
      tmSegment = _.get(response, 'data.tmSegment');
    } catch (e) {
      const message = _.get(e, 'status.message', e.message);
      dispatch('notifications/pushNotification', errorNotification(message), { root: true });
    }
    commit(mutationTypes.MEMORY_EDITOR_SET_SEGMENT_IS_LOADING, { originalId, isLoading: false });
    return tmSegment;
  },
  async deleteSegment({ commit, state, getters, dispatch }, { companyId, tmId, originalId }) {
    commit(mutationTypes.MEMORY_EDITOR_SET_IS_SEGMENT_DELETION_IN_PROGRESS, true);
    try {
      await translationMemoryService.deleteSegment({
        companyId,
        tmId,
        originalId,
      });
      const newSegments = state.segments.reduce((segments, id) => {
        if (id !== originalId) {
          const segment = getters.segmentById(id);
          return segments.concat(segment);
        }
        return segments;
      }, []);
      commit(mutationTypes.MEMORY_EDITOR_SET_SEGMENTS, newSegments);
      if (!_.isNil(state.searchedSegments)) {
        const newSearchedSegments = state.searchedSegments.reduce((segments, id) => {
          if (id !== originalId) {
            const segment = getters.segmentById(id);
            return segments.concat(segment);
          }
          return segments;
        }, []);
        commit(mutationTypes.MEMORY_EDITOR_SET_SEARCHED_SEGMENTS, newSearchedSegments);
      }
      const srcLang = _.get(state, 'tmInfo.srcLang.isoCode', '');
      const tgtLang = _.get(state, 'tmInfo.tgtLang.isoCode', '');
      dispatch('fetchTmInfo', { companyId, srcLang, tgtLang });
    } finally {
      commit(mutationTypes.MEMORY_EDITOR_SET_IS_SEGMENT_DELETION_IN_PROGRESS, false);
    }
  },
  async searchSegments({ commit, dispatch }, { companyId, tmId, params }) {
    commit(mutationTypes.MEMORY_EDITOR_SET_IS_LOADING, true);
    try {
      const response = await translationMemoryService.searchSegments({
        companyId,
        tmId,
        params,
      });
      commit(mutationTypes.MEMORY_EDITOR_SET_SEARCHED_SEGMENTS, _.get(response, 'data.segments', []));
    } catch (err) {
      const message = _.get(err, 'status.message', err.message);
      dispatch('notifications/pushNotification', errorNotification(message), { root: true });
    }
    commit(mutationTypes.MEMORY_EDITOR_SET_IS_LOADING, false);
  },
  async replaceSegmentsContent({ commit, dispatch }, { companyId, tmId, params, scope }) {
    commit(mutationTypes.MEMORY_EDITOR_SET_IS_LOADING, true);
    try {
      const response = await translationMemoryService.replaceSegmentsContent({
        companyId,
        tmId,
        body: { params, scope },
      });
      const segments = _.get(response, 'data.segments', []);
      segments.forEach((segment) => {
        commit(mutationTypes.MEMORY_EDITOR_SET_SEGMENT, segment);
      });
      commit(mutationTypes.MEMORY_EDITOR_SET_SEARCHED_SEGMENTS, segments);
    } catch (err) {
      const message = _.get(err, 'status.message', err.message);
      dispatch('notifications/pushNotification', errorNotification(message), { root: true });
    }
    commit(mutationTypes.MEMORY_EDITOR_SET_IS_LOADING, false);
  },
};

const getters = {
  segmentById: state => id => state.segmentsById[id],
  seachedSegmentById: state => id => state.seachedSegmentsById[id],
  isSegmentLoadingById: state => id => state.isSegmentLoadingById[id],
};

export default {
  state: initialState,
  mutations,
  actions,
  getters,
  namespaced: true,
};
