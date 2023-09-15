const apiResponse = require('../../../../components/api-response');
const SchemaAwareAPI = require('../../../schema-aware-api');

const RestError = apiResponse.RestError;

class NodbCountryAPI extends SchemaAwareAPI {
  /**
   * Returns the nodb countries list
   * @param {Object} nodbFilters to filter the nodb countries returned.
   * @param {String} nodbFilters.id the nodb's id to filter.
   */
  async list() {
    this.logger.debug(
      `User ${this.user.email} retrieved the nodb countries list`,
    );
    let list = [];

    try {
      list = await this.schema.IpNodbCountry.find({}).lean().exec();
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing nodb countries aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list: list,
      total: list.length,
    };
  }
}

module.exports = NodbCountryAPI;
