// eslint-disable-next-line global-require

const _ = require('lodash');
const mongoose = require('mongoose');
const SchemaAwareAPI = require('../../schema-aware-api');
const { validObjectId } = require('../../../utils/schema/index');

const { ObjectId } = mongoose.Types;

class CompanyExcludedProvidersApi extends SchemaAwareAPI {
  /**
   * @param {Object} logger
   * @param {Object} options optional object.
   * @param {Object} options.configuration configuration.
   * @param {Object} options.user user that is user api.
   */
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
  }

  async excludedProvidersList(companyId) {
    const company = _.get(this.user, 'company', null);
    let excludedProvidersList = [];
    if (validObjectId(companyId)) {
      const companyFilterId = _.defaultTo(companyId, _.get(company, '_id'));
      if (_.isNil(companyFilterId)) {
        return { list: [], total: 0 };
      }
      const query = { lspId: this.lspId, _id: new ObjectId(companyId) };
      const projection = { excludedProviders: 1 };
      const companyInDb = await this.schema.Company
        .findOneWithDeleted(query, projection).lean();
      const { excludedProviders } = _.pick(companyInDb, ['excludedProviders']);
      if (!_.isNull(excludedProviders) && !_.isUndefined(excludedProviders)) {
        excludedProvidersList = excludedProviders;
      }
    }
    return {
      list: excludedProvidersList,
      total: excludedProvidersList.length,
    };
  }
}

module.exports = CompanyExcludedProvidersApi;
