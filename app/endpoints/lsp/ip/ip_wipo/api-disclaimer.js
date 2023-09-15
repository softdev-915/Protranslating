const _ = require('lodash');
const apiResponse = require('../../../../components/api-response');
const SchemaAwareAPI = require('../../../schema-aware-api');

const RestError = apiResponse.RestError;

class IPDisclaimerAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = {
      lspId: this.lspId,
    };
    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }
  /**
   * Returns the wipo disclaimer list
   * @param {Object} wipoFilters to filter the wipo disclaimers returned.
   * @param {String} wipoFilters.id the wipo's id to filter.
   */
  async list() {
    this.logger.debug(
      `User ${this.user.email} retrieved the ip disclaimer list`,
    );
    let list = [];

    try {
      list = await this.schema.IpWipoDisclaimer.find({}).exec();
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing ip disclaimer aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list: list,
      total: list.length,
    };
  }
}

module.exports = IPDisclaimerAPI;
