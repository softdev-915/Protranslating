const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const { validObjectId } = require('../../../utils/schema');

const { RestError } = apiResponse;

class MtProviderAPI extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
  }

  _getQueryFilters(filters) {
    return { lspId: this.lspId, ..._.get(filters, 'paginationParams', {}) };
  }

  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the mt engines list`);
    let list = [];
    const query = this._getQueryFilters(filters);

    try {
      list = await this.schema.MtProvider.gridAggregation().exec({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error performing mt provider aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }

    return { list, total: list.length };
  }

  async mtProviderDetail(_id) {
    if (!validObjectId(_id)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const mtProvider = await this.schema.MtProvider.findOneWithDeleted({ _id, lspId: this.lspId });
    if (_.isNil(mtProvider)) {
      const message = `MT provider record with _id ${_id} was not found`;

      this.logger.info(message);
      throw new RestError(404, { message });
    }
    return mtProvider;
  }
}

module.exports = MtProviderAPI;
