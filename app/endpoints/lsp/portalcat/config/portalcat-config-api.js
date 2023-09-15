const _ = require('lodash');
const SchemaAwareApi = require('../../../schema-aware-api');
const { RestError } = require('../../../../components/api-response');

class PortalCatConfigApi extends SchemaAwareApi {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = options.configuration;
  }

  saveConfig({ requestId, workflowId, taskId, config }) {
    const lspId = this.lspId;
    const userId = this.user._id;
    return this.schema.PortalcatConfig.findOneAndUpdate(
      { requestId, workflowId, taskId, lspId, userId },
      { config },
      { upsert: true, new: true },
    );
  }

  async saveDefaultConfig({ config }) {
    const updatedUser = await this.schema.User.findOneAndUpdate(
      { _id: this.user._id },
      { portalCatDefaultConfig: config },
      { new: true },
    );
    return updatedUser.portalCatDefaultConfig;
  }

  async getConfig({ requestId, workflowId, taskId }) {
    const lspId = this.lspId;
    const userId = this.user._id;
    const fullConfig = await this.schema.PortalcatConfig.findOne(
      { requestId, workflowId, taskId, lspId, userId },
    );
    if (_.isNil(fullConfig)) {
      throw new RestError(404, {
        message: 'Config not found',
      });
    }
    return fullConfig.config;
  }
}

module.exports = PortalCatConfigApi;
