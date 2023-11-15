import { getCookie, removeCookie } from 'tiny-cookie';
import _isEmpty from 'lodash/isEmpty';
import GroupService from '../../../services/group-service';
import RoleService from '../../../services/role-service';
import LocalStorageAuth from './local-storage-auth';

const groupService = new GroupService();
const roleService = new RoleService();
const localStorageAuth = new LocalStorageAuth();
const state = {
  groups: [],
  roles: [],
  csrfToken: localStorageAuth.getCSRFToken(),
};

const getters = {
  groups: (storeState) => storeState.groups,
  roles: (storeState) => storeState.roles,
  csrfToken: (storeState) => (!_isEmpty(storeState.csrfToken) ? storeState.csrfToken : getCookie('csrf-token-holder')),
};

const mutations = {
  setGroups: (storeState, payload) => {
    storeState.groups = payload;
  },
  setRoles: (storeState, payload) => {
    storeState.roles = payload;
  },
  setCsrfToken: (storeState, payload) => {
    localStorageAuth.saveCSRFToken(payload);
    storeState.csrfToken = payload;
  },
  removeCsrfToken: (storeState) => {
    removeCookie('csrf-token-holder');
    localStorageAuth.deleteCSRFToken();
    storeState.csrfToken = null;
  },
};

const actions = {
  retrieveGroups: ({ commit }) => (
    groupService.retrieve().then((response) => {
      commit('setGroups', response.data.list);
    })
      .catch((err) => err)
  ),
  retrieveRoles: ({ commit }) => (
    roleService.retrieve().then((response) => {
      commit('setRoles', response.data.roles);
    })
      .catch((err) => err)
  ),
};

export default {
  state,
  getters,
  mutations,
  actions,
  namespaced: true,
};
