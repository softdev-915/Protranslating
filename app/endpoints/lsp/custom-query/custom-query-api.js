const mongoose = require('mongoose');
const _ = require('lodash');
const Promise = require('bluebird');
const SchemaAwareAPI = require('../../schema-aware-api');
const { getRoles, hasRole } = require('../../../utils/roles');
const { validObjectId, hasUserAccessToSchema, areObjectIdsEqual } = require('../../../utils/schema');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const {
  getEntitiesText,
  getFieldsText,
  getFilterText,
  getGroupByText,
  getOrderByText,
  getResultFilePath,
} = require('../../../utils/custom-query');
const { CsvExport } = require('../../../utils/csvExporter');
const configuration = require('../../../components/configuration');
const CloudStorage = require('../../../components/cloud-storage');

const addMissingPropertiesForResponse = (customQueries) => customQueries.map((customQuery) => {
  const { entities = [] } = customQuery;

  customQuery.entitiesText = getEntitiesText(entities);
  const { fields = [] } = customQuery;

  customQuery.fieldsText = getFieldsText(fields);
  const { filter = {} } = customQuery;

  customQuery.filterText = getFilterText(filter);
  const { groupBy = [] } = customQuery;

  customQuery.groupByText = getGroupByText(groupBy);
  const { orderBy = [] } = customQuery;

  customQuery.orderByText = getOrderByText(orderBy);
  return customQuery;
});

class CustomQueryAPI extends SchemaAwareAPI {
  truncateForbiddenEntities(customQueries) {
    const { user = {} } = this;
    return customQueries.map((customQuery) => {
      const { entities = [] } = customQuery;
      const notAllowedEntities = entities
        .map(({ name }) => name)
        .filter((name) => !hasUserAccessToSchema(name, user, ['READ_ALL', 'READ_OWN']));

      if (!_.isEmpty(notAllowedEntities)) {
        customQuery.entities = [];
        customQuery.fields = [];
        customQuery.filter = {};
        customQuery.groupBy = [];
        customQuery.orderBy = [];
        customQuery.notAllowedEntities = notAllowedEntities;
      }
      return customQuery;
    });
  }

  /**
   * @private
   */
  getListPipelineOptions({ _id, paginationParams = {} }) {
    const query = { lspId: this.lspId };

    if (!hasRole('CUSTOM-QUERY_READ_ALL', getRoles(this.user))) {
      query.createdBy = _.get(this, 'user.email', '');
    }
    if (!_.isEmpty(_id)) {
      query._id = new mongoose.Types.ObjectId(_id);
    }
    Object.assign(query, paginationParams);
    const pipelineOptions = { filters: query };

    if (query.__tz) {
      pipelineOptions.utcOffsetInMinutes = query.__tz;
    }
    return pipelineOptions;
  }

  async list(filters) {
    const pipelineOptions = this.getListPipelineOptions(filters);
    const { user = {} } = this;
    let findCustomQueries;
    if (_.isEmpty(filters._id)) {
      findCustomQueries = this.schema.CustomQuery.gridAggregation().exec(pipelineOptions);
    } else {
      findCustomQueries = this.schema.CustomQuery.findWithDeleted(pipelineOptions.filters);
    }
    const findPreferences = this.schema.CustomQueryPreference.find({
      userId: user._id, lspId: this.lspId,
    });
    const [customQueries, preferences] = await Promise.all([findCustomQueries, findPreferences]);
    let list = customQueries.map((customQuery) => {
      const preference = preferences.find(({ customQueryId }) => areObjectIdsEqual(customQueryId, customQuery._id));
      const lastRunAt = _.get(preference, 'lastRunAt');

      if (_.isDate(lastRunAt)) {
        customQuery.myLastRunAt = lastRunAt;
      }
      return customQuery;
    });

    list = this.truncateForbiddenEntities(list);
    return { list: addMissingPropertiesForResponse(list), total: list.length };
  }

  async isExist(customQueryId) {
    if (!validObjectId(customQueryId)) {
      return false;
    }
    const count = await this.schema.CustomQuery.countWithDeleted({
      _id: customQueryId,
      lspId: _.get(this, 'lspId', ''),
    });
    return count === 1;
  }

  async save(data) {
    let customQuery;
    const lspId = _.get(this, 'lspId', '');

    data.lspId = lspId;
    const _id = _.get(data, '_id', '');

    if (_id === '') {
      customQuery = new this.schema.CustomQuery();
    } else {
      const query = { _id, lspId };

      if (!hasRole('CUSTOM-QUERY_UPDATE_ALL', getRoles(this.user))) {
        query.createdBy = _.get(this, 'user.email', '');
      }
      customQuery = await this.schema.CustomQuery.findOneWithDeleted(query);
      const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
        entityName: 'customQuery',
      });
      await concurrencyReadDateChecker.failIfOldEntity(customQuery);
    }
    const excludedFields = ['lastRunAt', 'lastRunBy'];

    if (configuration.environment.IS_PROD) {
      excludedFields.push('mock');
    }
    customQuery.safeAssign(_.omit(data, excludedFields));
    try {
      const updatedCustomQuery = await customQuery.save(data);
      return updatedCustomQuery;
    } catch (error) {
      throw new Error(_.get(error, 'message', ''));
    }
  }

  async export(filters) {
    const { paginationParams = {} } = filters;
    const query = { lspId: this.lspId, ...paginationParams };
    const { list = [] } = await this.list(filters);
    const schema = _.get(this, 'schema.CustomQuery');
    const csvExporter = new CsvExport(list, {
      schema,
      lspId: this.lspId,
      configuration,
      logger: this.logger,
      filters: { query },
    });
    return csvExporter.export();
  }

  async getLastResultFileUrl({ _id, name }) {
    const userId = _.get(this, 'user._id');
    const preference = await this.schema.CustomQueryPreference.findOne({
      customQueryId: _id, userId,
    });
    const lastRunAt = _.get(preference, 'lastRunAt');

    if (!_.isDate(lastRunAt)) {
      return '';
    }
    const filePath = getResultFilePath(name, userId, lastRunAt);
    return new CloudStorage(configuration).gcsGetFileDownloadUrl(filePath);
  }
}

module.exports = CustomQueryAPI;
