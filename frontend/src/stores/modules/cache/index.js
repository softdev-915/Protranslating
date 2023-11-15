/* eslint-disable no-shadow */
import moment from 'moment';

const state = {
  cachedData: {},
};

const getters = {
  cachedData: (storeState) => storeState.cachedData,
};

const mutations = {
  setCache: (storeState, payload) => {
    storeState.cachedData[payload.name] = {
      date: moment(),
      data: payload.data,
    };
  },
  invalidateCache: (storeState, payload) => {
    if (storeState.cachedData[payload]) {
      delete storeState.cachedData[payload];
    }
  },
};

const actions = {
  setCache: ({ commit }, payload) => {
    commit('setCache', payload);
  },
  invalidateCache: ({ commit }, payload) => {
    commit('invalidateCache', payload);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
  namespaced: true,
};
