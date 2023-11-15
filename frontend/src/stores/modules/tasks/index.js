import _ from 'lodash';
import TaskService from '../../../services/task-service';

const taskService = new TaskService(undefined, {
  headers: {
    'lms-poll': 'true',
  },
});

const _findTaskChangedForProvider = (request, userId, cb) => {
  if (request && request.workflows && request.workflows.length) {
    return request.workflows.some((w) => {
      if (w.tasks && w.tasks.length) {
        return w.tasks.some((t) => {
          if (t.providerTasks && t.providerTasks.length) {
            return t.providerTasks.some((providerTask) => {
              if (providerTask.provider) {
                const providerId = _.get(providerTask, 'provider._id', providerTask.provider);
                if (providerId === userId) {
                  return cb(w, t, providerTask);
                }
              }
              return false;
            });
          }
          return false;
        });
      }
      return false;
    });
  }
};
const _findTaskById = (_id) => (t) => _.get(t, '_id') === _id;
const _findTaskInArr = (arr, _id) => {
  if (Array.isArray(arr)) {
    return arr.find(_findTaskById(_id));
  }
  return null;
};

const _shouldUpdateTasks = (state, request, providerTask) => {
  let taskFound = false;
  const keys = Object.keys(state.tasks);
  const keysLen = keys.length;
  for (let i = 0; i < keysLen; i++) {
    const arr = _.get(state.tasks, keys[i], []);
    const task = _findTaskInArr(arr, providerTask._id);
    if (task) {
      if (task.status !== providerTask.status) {
        // task has different status, it should refresh the task list
        return true;
      }
      taskFound = true;
      break;
    }
  }
  // if the task was found but the status did not change, we don't need to refresh
  // the task list
  return !taskFound;
};

const _checkTaskChangedInRequest = (userId, state, request) => {
  if (userId) {
    const onProviderTask = (w, t, pt) => _shouldUpdateTasks(state, request, pt);
    return _findTaskChangedForProvider(request, userId, onProviderTask);
  }
  return false;
};
const emptyTasks = () => ([]);
const storeState = {
  tasks: emptyTasks(),
  loadingTasks: false,
  intervalId: null,
};

const getters = {
  tasks: (state) => state.tasks,
  pendingTasks: (state) => _.get(state, 'tasks', []),
  loadingTasks: (state) => state.loadingTasks,
  intervalId: (state) => state.intervalId,
};

const mutations = {
  setTasks: (state, payload) => {
    state.tasks = payload;
  },
  setLoadingTasks: (state, payload) => {
    state.loadingTasks = payload;
  },
  setIntervalId: (state, payload) => {
    state.intervalId = payload;
  },
};

const actions = {
  updateTasks: ({ commit }, tasks) => {
    commit('setTasks', tasks);
  },
  retrieveTasks: ({ commit, rootState }) => {
    commit('setLoadingTasks', true);
    const userId = _.get(rootState, 'app.userLogged._id');
    if (userId) {
      try {
        return taskService.retrieveUserTasks(userId, 'pending').then((res) => {
          const tasks = _.get(res, 'data', emptyTasks());
          commit('setTasks', tasks);
        }).finally(() => {
          commit('setLoadingTasks', false);
        });
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return null;
  },
  onRequestUpdate: ({ state, dispatch, rootState }, request) => {
    // Check if the request changed any user task. If it did, then refresh the user's task
    const userId = _.get(rootState, 'app.userLogged._id');
    if (_checkTaskChangedInRequest(userId, state, request)) {
      dispatch('retrieveTasks', state.userId);
    }
  },
  startTaskPolling: ({ commit, dispatch, state }, intevalTime) => {
    if (state.intervalId) {
      clearInterval(state.intervalId);
      commit('setIntervalId', null);
    }
    const newInterval = setInterval(() => {
      dispatch('retrieveTasks');
    }, intevalTime);
    commit('setIntervalId', newInterval);
  },
  clearTaskPolling: ({ commit, state }) => {
    clearInterval(state.intervalId);
    commit('setIntervalId', null);
  },
};

export default {
  state: storeState,
  getters,
  mutations,
  actions,
  namespaced: true,
};
