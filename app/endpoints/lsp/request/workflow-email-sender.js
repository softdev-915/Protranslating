const mongoose = require('mongoose');
const Promise = require('bluebird');
const _ = require('lodash');
const ServerURLFactory = require('../../../components/application/server-url-factory');
const requestAPIHelper = require('./request-api-helper');

const { Types: { ObjectId } } = mongoose;

class WorkflowEmailSender {
  constructor(lsp, schema, configuration, sendProviderTaskEmail) {
    this.lsp = lsp;
    this.schema = schema;
    const serverURLFactory = new ServerURLFactory(configuration);

    this.path = serverURLFactory.buildServerURL();
    if (_.isFunction(sendProviderTaskEmail)) {
      this.sendProviderTaskEmail = sendProviderTaskEmail;
    }
    this._providersCache = {};
  }

  sendEmails(request, emailTriggers) {
    const requestDocuments = requestAPIHelper.getRequestDocuments(
      request.languageCombinations,
    );
    const emailContext = { ...request, documentNames: requestDocuments.map((d) => (`${d.name}`)).join(', ') };

    Object.keys(emailContext).forEach((field) => {
      if (_.isNil(emailContext[field])) {
        emailContext[field] = '';
      }
    });
    // FIXME populate all providers in advance when retrieving the request
    // and avoid this nasty _ensureAllProviders function.
    // the problem is the following
    // await workflowTaskUpdater.applyUpdate(request);
    // the workflowtask updater is not validating the provider and it is not
    // populating its content so it reaches here as an objectID eventhough it
    // was populater originally
    return this._ensureAllProviders(emailTriggers)
      .then(() => {
        const emailPromises = [];

        emailTriggers.forEach((trigger) => {
          if (trigger.modifiedProviderTask.provider) {
            let { provider } = trigger.modifiedProviderTask;

            // if provider is an objectId or string, lookup the provider in the "cache"
            if (_.get(provider, '_id')) {
              provider = this._lookupProvider(trigger.modifiedProviderTask.provider._id);
            } else {
            // if no email available skip this trigger;
              return;
            }
            const providerTask = { ...trigger.modifiedProviderTask, provider };
            const workflow = _.get(trigger, 'workflow');

            if (_.isEmpty(provider.email)) {
              return;
            }
            const emailPromise = this.sendProviderTaskEmail(emailContext, provider, {
              _id: trigger.task._id,
              units: trigger.modifiedProviderTask.quantity.map((q) => (`${q.amount} ${q.units}`)).join(', '),
              ability: trigger.task.ability,
              languagePair: `${_.get(workflow, 'srcLang.name', null)} - ${_.get(workflow, 'tgtLang.name', '')}`,
              description: trigger.task.description,
              providerTask,
            }, this.lsp.name);

            emailPromises.push(emailPromise);
          }
        });
        return Promise.all(emailPromises);
      });
  }

  _lookupProvider(provider) {
    const providerId = _.get(provider, '_id', provider).toString();
    return this._providersCache[providerId];
  }

  _lookupEmailInProviderCache(provider) {
    if (provider instanceof ObjectId) {
      const cachedProvider = this._providersCache[provider.toString()];

      if (cachedProvider) {
        return cachedProvider.email;
      }
    }
    return provider.email;
  }

  async _ensureAllProviders(emailTriggers) {
    return Promise.map(emailTriggers, async (trigger) => {
      const provider = _.get(trigger, 'modifiedProviderTask.provider', '');

      if (!_.isEmpty(provider)) {
        const dbProvider = await this.schema.User.findOneWithDeleted({
          lsp: this.lsp._id,
          _id: provider._id,
        }).lean();

        if (!_.isNil(dbProvider)) {
          this._providersCache[provider._id] = dbProvider;
          trigger.modifiedProviderTask.provider = dbProvider;
        }
      }
    });
  }
}

module.exports = WorkflowEmailSender;
