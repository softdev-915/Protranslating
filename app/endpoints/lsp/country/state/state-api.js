const apiResponse = require('../../../../components/api-response');
const SchemaAwareAPI = require('../../../schema-aware-api');

const RestError = apiResponse.RestError;

class StateApi extends SchemaAwareAPI {
  /**
   * @param {Object} logger
   * @param {Object} options optional object.
   * @param {Object} options.configuration configuration.
   * @param {Object} options.user user that is user api.
   */

  /**
   * Returns the state's list
   * @param {Object} user making this request.
   */
  async stateList(countryId) {
    this.logger.debug(`User ${this.user.email} retrieved the state list`);
    const countryInDb = await this.schema.Country.findOne({
      _id: countryId,
    });
    if (!countryInDb) {
      throw new RestError(404, { message: 'Country does not exist' });
    }
    const list = await this.schema.State.find({
      country: countryInDb._id,
    }).sort({ name: 1 });
    return list;
  }
}

module.exports = StateApi;
