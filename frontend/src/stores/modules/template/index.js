import _ from 'lodash';
import BrowserStorage from '../../../utils/browser-storage';

const TEMPLATE = 'template';
const browserStorage = new BrowserStorage('template');
const getInitialTemplate = function () {
  let initialTemplate = browserStorage.findInCache(TEMPLATE);
  if (!_.isNil(initialTemplate)) {
    try {
      initialTemplate = JSON.parse(initialTemplate);
    } catch (e) {
      // ignore error and assign null
      initialTemplate = null;
    }
  }
  return initialTemplate;
};

const _state = {
  templateClipboard: getInitialTemplate(),
};

const getters = {
  templateClipboard: (storeState) => storeState.templateClipboard,
};

const mutations = {
  setTemplateClipboard: (storeState, payload) => {
    storeState.templateClipboard = payload;
  },
};

const actions = {
  copyTemplateContent: ({ commit }, payload) => {
    browserStorage.saveInCache(TEMPLATE, JSON.stringify(payload));
    commit('setTemplateClipboard', payload);
  },
};

export default {
  state: _state,
  getters,
  mutations,
  actions,
  namespaced: true,
};
