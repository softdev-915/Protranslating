import _ from 'lodash';
import moment from 'moment';

const extractRequestId = (o) => _.get(o, 'response.__original__.headers.map["x-request-id"][0]');
const isSameNotification = (o) => {
  const requestId = extractRequestId(o);
  if (requestId) {
    return (n) => requestId === extractRequestId(n);
  } if (o._id) {
    return (n) => o._id === n._id;
  }
  return (n) => n.title === o.title && n.message === o.message;
};
const findIndex = (n, func) => {
  const len = n.length;
  for (let i = 0; i < len; i++) {
    if (func(n[i])) {
      return i;
    }
  }
  return -1;
};

const _state = {
  notifications: [],
};

const getters = {
  notifications: (storeState) => storeState.notifications,
};

const mutations = {
  pushNotification: (storeState, payload) => {
    // avoid the global event handler to remove the notification
    // on arrival
    setTimeout(() => {
      storeState.notifications.push(payload);
    }, 0);
  },
  deleteNotification: (storeState, payload) => {
    const toRemoveIndex = findIndex(storeState.notifications, isSameNotification(payload));
    if (toRemoveIndex >= 0) {
      storeState.notifications.splice(toRemoveIndex, 1);
    }
  },
  clearNotifications: (storeState) => {
    storeState.notifications = [];
  },
  clearScopedNotifications: (storeState) => {
    const notificationsClone = storeState.notifications.slice(0);
    for (let i = 0; i < notificationsClone.length; i++) {
      if (!notificationsClone[i].ttl && !notificationsClone[i].sticky
          && !notificationsClone[i]._id) {
        notificationsClone.splice(i, 1);
      }
    }
    storeState.notifications = notificationsClone;
  },
};

const actions = {
  pushNotification: ({ commit, state }, payload) => {
    const existingIndex = findIndex(state.notifications, isSameNotification(payload));
    if (existingIndex === -1) {
      if (payload.dismissible === undefined) {
        payload.dismissible = true;
      }
      payload.createdAt = moment();
      commit('pushNotification', payload);
    }
  },
  deleteNotification: ({ commit }, payload) => {
    commit('deleteNotification', payload);
  },
  clearNotifications: ({ commit }) => {
    commit('clearNotifications');
  },
  clearScopedNotifications: ({ commit }) => {
    commit('clearScopedNotifications');
  },
};

export default {
  state: _state,
  getters,
  mutations,
  actions,
  namespaced: true,
};
