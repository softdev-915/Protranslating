const apiResponse = require('../../../../components/api-response');
const SchemaAwareAPI = require('../../../schema-aware-api');

const RestError = apiResponse.RestError;

class WipoCountryAPI extends SchemaAwareAPI {
  /**
   * Returns the wipo countries list
   * @param {Object} wipoFilters to filter the wipo countries returned.
   * @param {String} wipoFilters.id the wipo's id to filter.
   */
  async list() {
    this.logger.debug(
      `User ${this.user.email} retrieved the wipo countries list`,
    );
    let list = [];

    try {
      list = await this.schema.IpWipoCountry.find({}).lean().exec();
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing wipo countries aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list: list,
      total: list.length,
    };
  }
}

module.exports = WipoCountryAPI;
