const apiResponse = require('../../../../components/api-response');
const SchemaAwareAPI = require('../../../schema-aware-api');

const RestError = apiResponse.RestError;

class EpoCountryAPI extends SchemaAwareAPI {
  async list() {
    this.logger.debug(
      `User ${this.user.email} retrieved the wipo countries list`,
    );
    let list = [];

    try {
      list = await this.schema.IpEpoCountry.find({}).lean().exec();
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing epo countries aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list: list,
      total: list.length,
    };
  }
}

module.exports = EpoCountryAPI;
