const _ = require('lodash');
const apiResponse = require('../../../../components/api-response');
const SchemaAwareAPI = require('../../../schema-aware-api');

const RestError = apiResponse.RestError;
class EpoDisclaimerAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = {
      lspId: this.lspId,
      epoId: _.get(filters, 'epoId', null),
      countries: _.get(filters, 'countries', []),
      translationOnly: _.get(filters, 'translationOnly', false),
    };
    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  async list(filters) {
    this.logger.debug(
      `User ${this.user.email} retrieved the epo disclaimer list`,
    );
    const query = this._getQueryFilters(filters);
    const disclaimersMap = {};
    let disclaimerAll;
    try {
      const disclaimers = await this.schema.IpEpoDisclaimer.find({
        countries: { $in: query.countries },
      });
      const disclaimerAllQuery = {
        countries: 'ALL',
        $or: [
          { translationOnly: query.translationOnly },
          { translationAndFiling: !query.translationOnly },
        ],
      };
      disclaimerAll = await this.schema.IpEpoDisclaimer.find(disclaimerAllQuery);
      const queryCountries = query.countries;
      const exactDisclaimers = disclaimers.filter(disclaimer =>
        disclaimer.countries.every(country => queryCountries.includes(country)),
      );
      _.forEach(exactDisclaimers, (exactDisclaimer) => {
        const disclaimerCountries = _.get(disclaimersMap, exactDisclaimer.filingLanguage, {
          countries: [],
        }).countries;
        if (disclaimerCountries.length < exactDisclaimer.countries.length) {
          disclaimersMap[exactDisclaimer.filingLanguage] = exactDisclaimer;
        }
      });
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing epo disclaimer aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    const disclaimersFiltered = _.defaultTo(disclaimerAll, []).concat(_.values(disclaimersMap));
    return {
      list: disclaimersFiltered,
      total: disclaimersFiltered.length,
    };
  }
}

module.exports = EpoDisclaimerAPI;
