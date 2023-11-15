// import Vue from 'vue';

const state = {
  counter: 0,
  info: null,
};

const getters = {
  counter: (storeState) => storeState.counter,
  info: (storeState) => storeState.info,
  doubleCounter: (storeState) => storeState.counter * 2,
};

const mutations = {
  loadInfo: (storeState, payload) => {
    storeState.info = payload;
  },
  incrementCounter: (storeState, payload) => {
    storeState.counter += payload;
  },
};

const actions = {
  incrementCounter: ({ commit }, payload) => {
    commit('incrementCounter', payload);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
  namespaced: true,
};
