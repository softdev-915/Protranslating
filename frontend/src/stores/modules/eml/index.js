const _state = {
  emlUpload: null,
};

const getters = {
  emlUpload: (storeState) => storeState.emlUpload,
};

const mutations = {
  setEmlUpload: (storeState, payload) => {
    storeState.emlUpload = payload;
  },
};

const actions = {
  setEmlUpload: ({ commit }, payload) => {
    commit('setEmlUpload', payload);
  },
};

export default {
  state: _state,
  getters,
  mutations,
  actions,
  namespaced: true,
};
