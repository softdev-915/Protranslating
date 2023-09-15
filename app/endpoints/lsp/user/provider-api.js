const { Types: { ObjectId } } = global.mongoose || require('mongoose');
const _ = require('lodash');
const { RestError } = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const { providerSelect } = require('../../../utils/schema');
const CompanyExcludedProvidersAPI = require('../company-excluded-providers/company-excluded-providers-api');
const { addNameQuery } = require('./user-api-helper');

const addCompanyQuery = function (query, value) {
  if (value) {
    if (query.$or) {
      query.$or.push({ $and: [{ type: 'Contact' }, { company: new ObjectId(value) }] });
    } else {
      query.$or = [
        {
          $and: [
            { type: 'Contact' }, { company: new ObjectId(value) },
          ],
        },
        { type: { $ne: 'Contact' } },
      ];
    }
  }
};

const addIdQuery = function (query, value) {
  query._id = new ObjectId(value);
};

const FILTER_MAPPING = [
  { filterKey: 'ability', queryKey: 'abilities' },
  {
    filterKey: 'language',
    queryKey(query, value) {
      query.languageCombinations = value;
    },
  },
  { filterKey: 'catTool', queryKey: 'catTools' },
  { filterKey: 'inactive', queryKey: 'inactive' },
  { filterKey: 'terminated', queryKey: 'terminated' },
  {
    filterKey: 'isSynced',
    queryKey(query, value) {
      query['siConnector.isSynced'] = (value === 'true');
    },
  },
  {
    filterKey: 'type',
    queryKey(query, value) {
      const types = value.trim().split(',');

      if (types.length) {
        // if more than one type we need to check if the or condition has already been used
        const queryTypes = types.map((t) => ({ type: t }));

        query.$or = queryTypes;
      } else {
        query.type = value;
      }
    },
  },
  {
    filterKey: 'company',
    queryKey: addCompanyQuery,
  },
  {
    filterKey: 'schedulingCompany',
    queryKey: addCompanyQuery,
  },
  {
    filterKey: '_id',
    queryKey: addIdQuery,
  },
  {
    filterKey: 'competenceLevels',
    queryKey(query, values) {
      const competenceLevelIdList = values.map((cl) => new ObjectId(cl));
      query.$or = [
        {
          $and: [{ 'vendorDetails.competenceLevels': { $exists: false } }, { type: 'Contact' }],
        },
        {
          $and: [
            { 'vendorDetails.competenceLevels': { $exists: true } }, { 'vendorDetails.competenceLevels': { $in: competenceLevelIdList } },
          ],
        },
        {
          $and: [
            { 'staffDetails.competenceLevels': { $exists: true } }, { 'staffDetails.competenceLevels': { $in: competenceLevelIdList } },
          ],
        },
      ];
    },
  },
];

class ProviderAPI extends SchemaAwareAPI {
  /**
   * @param {Object} logger
   * @param {Object} options
   * @param {Object} options.configuration
   */
  constructor(logger, options) {
    super(logger, options);
    this.logger = logger;
    this.configuration = _.get(options, 'configuration');
    this.mock = _.get(options, 'mock', false);
    this.projectionFactory = providerSelect;
    this.postProcessResults = (u) => ({
      _id: u._id,
      firstName: u.firstName,
      middleName: u.middleName,
      lastName: u.lastName,
      type: u.type,
      deleted: _.get(u, 'deleted', false),
      terminated: _.get(u, 'terminated', false),
      escalated: _.get(u, 'vendorDetails.escalated', false),
      providerConfirmed: u.providerConfirmed,
      email: u.email,
      flatRate: _.get(u, 'vendorDetails.billingInformation.flatRate', false),
    });
  }

  /**
   * Retrieves a list of user with minimal data to show in a selector.
   * @param {Object} filter to be applied to users.
   * @returns {Object} with a list and total properties.
   */
  async providerList(filter) {
    this.logger.debug(`User ${this.user.email} retrieved its user lists`);
    const { lspId } = this;
    let query = {
      lsp: lspId,
    };

    if (!_.isNil(filter.ability) && !_.isEmpty(filter.ability)) {
      const abilityName = filter.ability.trim();
      const abilityInDb = await this.schema.Ability.findOneWithDeleted({
        lspId,
        name: abilityName,
      });
      if (_.isNil(abilityInDb)) {
        throw new RestError(400, { message: `Failed to get providers. Reason: no ability with lspId ${lspId} and name ${abilityName}` });
      }
      const { languageCombination = false, competenceLevelRequired = false } = abilityInDb;
      if ((languageCombination && _.isEmpty(filter.language))
      || (competenceLevelRequired && _.isEmpty(filter.competenceLevels))) {
        return {
          list: [],
          total: 0,
        };
      }
    }
    if (filter.company && filter.excludedProvidersAreExcluded) {
      const companyId = filter.company;
      const excludedProvidersAPI = new CompanyExcludedProvidersAPI(this.logger, {
        configuration: this.configuration,
        user: this.user,
      });
      this.excludedProviders = await excludedProvidersAPI
        .excludedProvidersList(companyId);
      const excludedProvidersIds = this.excludedProviders.list.map((p) => p.user.userId);
      const excludedProvidersNames = this.excludedProviders.list.map((p) => p.user.name);
      const removeExcludedProviders = { _id: { $nin: excludedProvidersIds } };
      Object.assign(query, removeExcludedProviders);
      const isFilterIdExcluded = _.some(
        excludedProvidersIds,
        (objId) => objId.toString() === filter._id,
      );
      const isFilterNameExcluded = _.some(
        excludedProvidersNames,
        (name) => name === filter.name,
      );
      const isProviderExcluded = isFilterIdExcluded || isFilterNameExcluded;
      if (isProviderExcluded) {
        filter._id = undefined;
        Object.assign(query, { _id: undefined });
      }
    }
    addNameQuery(filter, query);
    FILTER_MAPPING.forEach((mapping) => {
      const filterValue = filter[mapping.filterKey];

      if (filterValue || typeof filterValue === 'boolean') {
        if (typeof mapping.queryKey === 'function') {
          mapping.queryKey(query, filterValue);
        } else {
          query[mapping.queryKey] = filterValue;
        }
      }
    });
    let users;

    if (this.preProcessQuery) {
      query = await this.preProcessQuery(query, filter);
    }
    const sort = { firstName: 1, lastName: 1 };

    try {
      users = await this.schema.User.findWithDeleted(query)
        .select(this.projectionFactory())
        .sort(sort)
        .limit(filter.limit)
        .skip(filter.skip);
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error querying for providers. Error: ${message}`);
      throw new RestError(500, { message: 'Error retrieving providers', stack: err.stack });
    }
    if (this.processDBResponse) {
      users = await this.processDBResponse(users, filter, sort);
    }
    const usersResponse = users.map(this.postProcessResults);
    return {
      list: usersResponse,
      total: usersResponse.length,
    };
  }
}

module.exports = ProviderAPI;
