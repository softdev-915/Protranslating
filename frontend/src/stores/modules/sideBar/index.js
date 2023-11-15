/* eslint-disable no-shadow */
const state = {
  collapsed: false,
  collapsedAfterAnimation: false,
};

const getters = {
  isCollapsed: (storeState) => storeState.collapsed,
  isCollapsedAfterAnimation: (storeState) => storeState.collapsedAfterAnimation,
};

const mutations = {
  setCollapsed: (storeState, payload) => {
    storeState.collapsed = payload;
  },
  setCollapsedAfterAnimation: (storeState, payload) => {
    storeState.collapsedAfterAnimation = payload;
  },
};

const actions = {
  setCollapsed: ({ commit }, payload) => {
    commit('setCollapsed', payload);
  },
  toggleCollapse: ({ commit, state }) => {
    commit('setCollapsed', !state.collapsed);
  },
  setCollapsedAfterAnimation: ({ commit }, payload) => {
    commit('setCollapsedAfterAnimation', payload);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
  namespaced: true,
};
