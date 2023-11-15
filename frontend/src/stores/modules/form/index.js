/* eslint-disable no-shadow */
import _ from 'lodash';

const getKeyFromURLPath = (path) => path.split('/')[1];
const getURLPathLevel = (path) => {
  const pathParts = path.split('/');
  // when splitting by '/' an empty string will be added as first element
  // we don't want to count that
  let level = pathParts.length - 1;
  if (pathParts[pathParts.length - 1] === 'detail') {
    // if the last part is /detail, we don't have to count that.
    level--;
  }
  return level;
};

const state = {
  formData: {},
  reverseKeyIdIndex: {},
};

const getters = {
  formState(state) {
    return (key, id) => {
      if (id) {
        return _.get(state.formData, `${key}.${id}`);
      }
      return _.get(state.formData, key);
    };
  },
};

const mutations = {
  saveFormState: (state, {
    key, id, path, data,
  }) => {
    _.set(state.formData, `${key}.${id}`, { data, path });
    state.reverseKeyIdIndex[path] = { key, id };
  },
  clearFormState: (state, { path }) => {
    if (path) {
      const urlKey = getKeyFromURLPath(path);
      _.unset(state.formData, `${urlKey}.${path}`);
    }
  },
  clearObsoleteFormState: (state, { path }) => {
    if (path) {
      // If a path is given, we will count the url parts to determine
      // the breadcrum items length (a.k.a level).
      // After knowing what in what level is the breadcrum, drop all the saved
      // form data with a higher level.
      // For example if we navigate from "/users/<userId>/users/<otherUserId>/languages"
      // to "/users/<userId>" using the breadcrumb, we have to delete
      // all the forms states that are now obsolete, in this case any change made in
      // "/users/<userId>/users/<otherUserId>" (user edition).
      const urlLevel = getURLPathLevel(path);
      const urlKey = getKeyFromURLPath(path);
      const formDatasForKey = _.get(state.formData, urlKey);
      _.keys(formDatasForKey).forEach((fk) => {
        const form = state.formData[urlKey][fk];
        const level = getURLPathLevel(form.path);
        if (level > urlLevel) {
          _.unset(state.formData, `${urlKey}.${fk}`);
        }
      });
    }
  },
  clearFormFamilyState: (state, { key }) => {
    _.keys(state.formData[key]).forEach((k) => {
      if (state.formData[key][k].path) {
        _.unset(state.reverseKeyIdIndex, state.formData[key][k].path);
      }
    });
    _.unset(state.formData, key);
  },
};

const actions = {
  saveFormState: ({ commit }, payload) => {
    commit('saveFormState', payload);
  },
  clearFormState: ({ commit }, payload) => {
    commit('clearFormState', payload);
  },
  clearObsoleteFormState: ({ commit }, payload) => {
    commit('clearObsoleteFormState', payload);
  },
  clearFormFamilyState: ({ commit }, payload) => {
    commit('clearFormFamilyState', payload);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
  namespaced: true,
};
