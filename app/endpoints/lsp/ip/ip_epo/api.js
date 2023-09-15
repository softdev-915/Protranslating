const _ = require('lodash');
const apiResponse = require('../../../../components/api-response');
const SchemaAwareAPI = require('../../../schema-aware-api');

const RestError = apiResponse.RestError;

class EpoAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = {
      lspId: this.lspId,
    };

    if (filters && filters.pctReference) {
      query.pctReference = filters.pctReference;
    }
    if (filters && filters.patentPublicationNumber) {
      query.patentPublicationNumber = filters.patentPublicationNumber;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the epo list`);
    let list = [];
    const query = this._getQueryFilters(filters);

    if (filters.pctReference) {
      list = [
        await this.schema.Epo.findOne({
          pctReference: filters.pctReference,
        }).lean(),
      ];
    } else if (filters.patentPublicationNumber) {
      list = [
        await this.schema.Epo.findOne({
          patentPublicationNumber: filters.patentPublicationNumber,
        }).lean(),
      ];
    } else {
      try {
        list = await this.schema.Epo.gridAggregation().exec({
          filters: query,
          utcOffsetInMinutes: filters.__tz,
        });
      } catch (err) {
        const message = err.message || err;
        this.logger.error(`Error performing epo aggregation. Error: ${message}`);
        throw new RestError(500, { message: err, stack: err.stack });
      }
    }
    return {
      list: list,
      total: list.length,
    };
  }
  async findByPatentNumber(patentNumber) {
    this.logger.debug(`User ${this.user.email} retrieved the epo with patent number ${patentNumber}`);
    const query = {};
    const isApplicationNumber = !_.isNaN(_.toNumber(patentNumber));
    const fieldName = isApplicationNumber ? 'patentApplicationNumber' : 'patentPublicationNumber';
    query[fieldName] = patentNumber;
    try {
      const epo = await this.schema.Epo.findOneWithDeleted(query);
      return epo;
    } catch (err) {
      this.logger.error(`Error retrieving Epo with patent number ${patentNumber}. Error: ${err}`);
      throw new RestError(500, { message: err.message, stack: err.stack });
    }
  }
  getTemplate(translationOnly) {
    const templateName = translationOnly ? '[#22] BIGIP_EP_TranslationOnly' : '[#23] BIGIP_EP_TranslationAndFiling';
    return this.schema.Template.findOne({ name: templateName, lspId: this.lspId });
  }
}

module.exports = EpoAPI;
