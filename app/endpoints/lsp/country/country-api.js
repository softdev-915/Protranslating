const SchemaAwareAPI = require('../../schema-aware-api');

class CountryApi extends SchemaAwareAPI {
  /**
   * @param {Object} logger
   * @param {Object} options optional object.
   * @param {Object} options.configuration configuration.
   * @param {Object} options.user user that is user api.
   */

  /**
   * Returns the country's list
   * @param {Object} user making this request.
   */
  async countryList() {
    this.logger.debug(`User ${this.user.email} retrieved the country list`);
    const list = await this.schema.Country.find().sort({ name: 1 });
    return list;
  }
}

module.exports = CountryApi;
