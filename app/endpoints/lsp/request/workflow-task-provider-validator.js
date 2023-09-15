/* eslint-disable global-require */
const _ = require('lodash');
const Promise = require('bluebird');

const { Types: { ObjectId } } = global.mongoose || require('mongoose');
const { properAccountFactory } = require('../../../utils/account');
const { RestError } = require('../../../components/api-response');
const { areObjectIdsEqual } = require('../../../utils/schema');

const _getProviderTask = (originalWorkflows, workflowId, taskId, providerTaskId) => {
  if (originalWorkflows) {
    const originalWorkflow = originalWorkflows
      .find(w => w._id.toString() === workflowId.toString());
    if (originalWorkflow && originalWorkflow.tasks) {
      const originalTask = originalWorkflow.tasks.find(t =>
        !_.isNil(t._id) && t._id.toString() === taskId);
      if (originalTask && originalTask.providerTasks) {
        const originalPT = originalTask.providerTasks
          .find(pt => pt._id.toString() === providerTaskId.toString());
        return originalPT;
      }
    }
  }
  return null;
};

class WorkflowTaskProviderValidator {
  constructor(user, schema) {
    this.user = user;
    this.schema = schema;
    this.lspId = user.lsp;
    this.selectProperAccount = properAccountFactory(this.lspId);
  }

  _hasProviderRateAbility(dbProvider, ability) {
    const vendorRates = _.get(dbProvider, 'vendorDetails.rates');
    const providerRates = _.get(dbProvider, 'staffDetails.rates', vendorRates);
    if (providerRates) {
      return providerRates.some(rate => _.get(rate, 'ability.name', ability));
    }
    return false;
  }

  async _validateWorkflowTasks(workflow, originalWorkflows) {
    const providersToValidate = [];
    if (!_.isEmpty(workflow.tasks)) {
      await Promise.map(workflow.tasks, t => Promise.map(t.providerTasks, (pt) => {
        const originalPT = _getProviderTask(originalWorkflows, workflow._id, t._id, pt._id);
        if (_.get(pt, 'provider._id')) {
          providersToValidate.push({
            ability: t.ability,
            provider: _.get(pt, 'provider._id'),
            originalProvider: _.get(originalPT, 'provider._id'),
          });
        }
      }));
    }
    if (providersToValidate.length) {
      const allProviders = _.uniqWith(providersToValidate.map(p => p.provider),
        (a, b) => areObjectIdsEqual(a, b)).map(p => new ObjectId(p));
      const dbProviders = await this.schema.User.findWithDeleted({
        _id: { $in: allProviders },
        lsp: this.lspId,
      });
      if (dbProviders.length !== allProviders.length) {
        throw new RestError(400, { message: 'Not all providers were found' });
      }
      providersToValidate.forEach(({ ability, provider, originalProvider }) => {
        const dbProvider = dbProviders.find(p => p._id.toString() === provider.toString());
        const providerAbility = dbProvider.abilities.find(ab => ab === ability);
        const providerRateAbility = this._hasProviderRateAbility(dbProvider, ability);
        if (!providerAbility && !providerRateAbility) {
          throw new RestError(400, { message: `Provider ${dbProvider.firstName} ${dbProvider.lastName} doesn't have the ability "${ability}"` });
        }
        const isSameProvider = originalProvider ?
          dbProvider._id.toString() === originalProvider._id.toString() : false;
        // terminated users are allowed only if they
        // were previously assigned (before they became terminated)
        if (dbProvider.terminated && !isSameProvider) {
          throw new RestError(400, { message: `Provider ${dbProvider.firstName} ${dbProvider.lastName} is terminated` });
        }
      });
    }
  }
  async validateWorkflowTasks(workflows, originalWorkflows) {
    const workflowsArray = _.castArray(workflows);
    await Promise.map(workflowsArray, workflow =>
      this._validateWorkflowTasks(workflow, originalWorkflows));
  }
}

module.exports = WorkflowTaskProviderValidator;
