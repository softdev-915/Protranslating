const SchemaAwareAPI = require('../../../schema-aware-api');
const { RestError } = require('../../../../components/api-response');

class CatConfigAPI extends SchemaAwareAPI {
  async retrieve() {
    const basicCatConfig = await this.schema.BasicCatConfig.findOne({
      lspId: this.lspId,
      user: this.user._id,
    });
    if (!basicCatConfig) {
      throw new RestError(404, { message: 'No basic cat tool config for this user' });
    }
    return basicCatConfig;
  }

  async createOrEdit(config) {
    let basicCatConfig = await this.schema.BasicCatConfig.findOne({
      lspId: this.lspId,
      user: this.user._id,
    });
    if (!basicCatConfig) {
      basicCatConfig = new this.schema.BasicCatConfig(config);
    } else {
      Object.assign(basicCatConfig, config);
    }
    await basicCatConfig.save();
    return basicCatConfig;
  }
}

module.exports = CatConfigAPI;
