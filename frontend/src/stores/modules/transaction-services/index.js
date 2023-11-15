import LocalStorageService from './localStorageService';

const localStorageService = new LocalStorageService();
const _state = {
  serviceClipboard: localStorageService.getServices(),
};

const getters = {
  serviceClipboard: (storeState) => storeState.serviceClipboard,
};

const mutations = {
  copyServices: (storeState, payload) => {
    storeState.serviceClipboard = payload;
  },
};

const actions = {
  copyServices: ({ commit }, payload) => {
    localStorageService.save(payload);
    commit('copyServices', payload);
  },
};

export default {
  state: _state,
  getters,
  mutations,
  actions,
  namespaced: true,
};
