import LocalStorageRate from './localStorageRate';

const localStorageRate = new LocalStorageRate();
const _state = {
  ratesClipboard: localStorageRate.getRates(),
};

const getters = {
  ratesClipboard: (storeState) => storeState.ratesClipboard,
};

const mutations = {
  copyRates: (storeState, payload) => {
    localStorageRate.save(payload);
    storeState.ratesClipboard = payload;
  },
};

const actions = {
  copyRates: ({ commit }, payload) => {
    commit('copyRates', payload);
  },
};

export default {
  state: _state,
  getters,
  mutations,
  actions,
  namespaced: true,
};
