const initialState = {
  portalCatQueryParams: {
    workflowId: '',
    taskId: '',
  },
};

const getters = {
  portalCatQueryParams(state) {
    return state.portalCatQueryParams;
  },
};

const mutations = {
  setPortalCatQueryParams: (state, params) => {
    state.portalCatQueryParams = params;
  },
};

const actions = {
  setPortalCatQueryParams: ({ commit }, payload) => {
    commit('setPortalCatQueryParams', payload);
  },
};

export default {
  state: initialState,
  getters,
  mutations,
  actions,
  namespaced: true,
};
