const _ = require('lodash');
const mongoose = require('mongoose');
const SchemaAwareAPI = require('../../schema-aware-api');
const { RestError } = require('../../../components/api-response');

class PiiApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.logger = logger;
  }

  async retrieveValue({ collection, entityId, path }) {
    const fieldName = path.split('.').pop();
    try {
      const query = {
        _id: new mongoose.Types.ObjectId(entityId),
      };
      if (collection !== 'lsp') {
        Object.assign(query, { lsp: this.lspId });
      }
      collection = _.capitalize(collection);
      const projection = { [path]: 1, _id: 0 };
      const response = await this.schema[collection]
        .findOneWithDeleted(query).select(projection);
      return _.get(response, path);
    } catch (error) {
      this.logger.error(`Error retrieving value for ${fieldName}. Error: ${error.message}`);
      throw new RestError(500, { message: 'Error requesting rates of vendor', stack: error.stack });
    }
  }
}

module.exports = PiiApi;
