const _ = require('lodash');
const apiResponse = require('../../../../components/api-response');
const SchemaAwareAPI = require('../../../schema-aware-api');

const RestError = apiResponse.RestError;

class WipoAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = {
      lspId: this.lspId,
    };

    if (!_.isNil(filters.pctReference)) {
      query.pctReference = filters.pctReference;
    }
    if (!_.isNil(filters.patentPublicationNumber)) {
      query.patentPublicationNumber = filters.patentPublicationNumber;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the wipo list`);
    let list = [];
    const query = this._getQueryFilters(filters);

    if (!_.isNil(filters.pctReference)) {
      list = [
        await this.schema.Wipo.findOne({
          pctReference: filters.pctReference,
        }).lean(),
      ];
    } else if (!_.isNil(filters.patentPublicationNumber)) {
      list = [
        await this.schema.Wipo.findOne({
          patentPublicationNumber: filters.patentPublicationNumber,
        }).lean(),
      ];
    } else {
      try {
        list = await this.schema.Wipo.gridAggregation().exec({
          filters: query,
          utcOffsetInMinutes: filters.__tz,
        });
      } catch (err) {
        const message = err.message || err;
        this.logger.error(`Error performing wipo aggregation. Error: ${message}`);
        throw new RestError(500, { message: err, stack: err.stack });
      }
    }
    return {
      list: list,
      total: list.length,
    };
  }
  async findByPatentNumber(patentNumber) {
    this.logger.debug(`User ${this.user.email} retrieved the wipo with patent number ${patentNumber}`);
    try {
      const wipo = await this.schema.Wipo.findOneWithDeleted({
        patentPublicationNumber: patentNumber,
      }).lean();
      return wipo;
    } catch (err) {
      this.logger.error(`Error retrieving Wipo with patent number ${patentNumber}. Error: ${err}`);
      throw new RestError(500, { message: err.message, stack: err.stack });
    }
  }
  getTemplate(translationOnly) {
    const templateName = translationOnly ? '[#20] BIGIP_PCT_TranslationOnly' : '[#21] BIGIP_PCT_TranslationAndFiling';
    return this.schema.Template.findOne({ name: templateName, lspId: this.lspId });
  }
}

module.exports = WipoAPI;
