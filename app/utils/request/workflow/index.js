const _ = require('lodash');

const forEachProviderTask = (request, callback) => {
  const workflows = _.get(request, 'workflows', []);
  _.forEach(workflows, (w, wi) => {
    const tasks = _.get(w, 'tasks', []);
    _.forEach(tasks, (t, ti) => {
      const providerTasks = _.get(t, 'providerTasks', []);
      _.forEach(providerTasks, (pt, pti) => {
        callback({
          request,
          workflow: w,
          workflowIndex: wi,
          task: t,
          taskIndex: ti,
          providerTask: pt,
          providerTaskIndex: pti,
        });
      });
    });
  });
};

const mapWorkflowsToTasks = (workflows = [], taskCondition) => workflows.reduce((res, workflow) => {
  _.get(workflow, 'tasks', []).forEach((task) => {
    if (
      (typeof taskCondition === 'string' && task.ability === taskCondition) ||
      (_.isRegExp(taskCondition) && taskCondition.test(task.ability))
    ) {
      if (_.isNil(res[workflow._id])) {
        res[workflow._id] = [];
      }
      res[workflow._id].push(task._id);
    }
  });
  return res;
}, {});

module.exports = { forEachProviderTask, mapWorkflowsToTasks };
