const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const cronParser = require('cron-parser');
const CsvBuilder = require('csv-builder');
const CloudStorage = require('../cloud-storage');
const configuration = require('../configuration');
const {
  FIELD_FUNCTION_COUNT,
  FIELD_FUNCTION_CONCAT,
  FILTER_TYPE_GROUP,
  FILTER_TYPE_RULE,
  FILTER_RULE_OPERATOR_EQUALS,
  FILTER_RULE_OPERATOR_DOES_NOT_EQUAL,
  FILTER_RULE_OPERATOR_CONTAINS,
  FILTER_RULE_OPERATOR_DOES_NOT_CONTAIN,
  FILTER_RULE_OPERATOR_BEGINS_WITH,
  FILTER_RULE_OPERATOR_ENDS_WITH,
  FILTER_RULE_OPERATOR_EXISTS,
  FILTER_RULE_OPERATOR_DOES_NOT_EXISTS,
  FILTER_RULE_OPERATOR_LOWER_THAN,
  FILTER_RULE_OPERATOR_LOWER_THAN_OR_EQUAL,
  FILTER_RULE_OPERATOR_GREATER_THAN,
  FILTER_RULE_OPERATOR_GREATER_THAN_OR_EQUAL,
  FILTER_RULE_VALUE_TYPE_FIELD,
  ORDER_BY_SORT_ASC,
  ORDER_BY_SORT_DESC,
  getFieldDataText,
  getResultFilePath,
  getFieldPathText,
} = require('../../utils/custom-query');
const { RANGES, getDatesByRange } = require('../../utils/date');
const { hasUserAccessToSchema, cursorMapAsyncHelper } = require('../../utils/schema');
const { getPipelineToFilterRestrictedRecords } = require('../../utils/schema/aggregation-helper');
const logger = require('../log/logger');

const env = configuration.environment;
const ENTITY_TO_FIELD_CONNECTOR = ' ';
const REF_TO_ENTITY_CONNECTOR = ' → ';
const BATCH_SIZE = 10;

class CustomQueryRunner {
  constructor(schema, lsp) {
    this.schema = schema;
    this.lsp = lsp;
    this.cloudStorage = new CloudStorage(configuration);
    this.logger = logger;
  }

  /**
   * @private
   */
  getCurrentDateTime({ mock = {} }) {
    const realNow = new Date();

    if (env.NODE_ENV === 'PROD') {
      return realNow;
    }
    return _.isDate(mock.currentDateOnNextRun) ? mock.currentDateOnNextRun : realNow;
  }

  /**
   * @private
   */
  async getCustomQueriesToRun(reportCache) {
    const cachedMs = reportCache * 6e4;
    const pipeline = [{
      $lookup: {
        from: 'customQueries',
        localField: 'customQueryId',
        foreignField: '_id',
        as: 'customQuery',
      },
    }, {
      $unwind: '$customQuery',
    }, {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    }, {
      $unwind: '$user',
    }, {
      $match: {
        $and: [
          {
            'customQuery.lspId': this.lsp._id,
            deleted: false,
            'customQuery.deleted': false,
            'user.deleted': false,
          },
          {
            $or: [{
              scheduledAt: { $exists: true, $ne: '' },
            }, {
              isRunForced: { $eq: true },
            }],
          },
          {
            $or: [{
              'customQuery.isExecuting': false,
            }, {
              'customQuery.isExecuting': true,
              'customQuery.lastExecutionStartedAt': {
                $lt: moment().add(-env.CQ_MAX_EXECUTION_MINUTES, 'minutes').toDate(),
              },
            }, {
              'customQuery.isExecuting': { $exists: false },
            }],
          },
        ],
      },
    }];
    const cursor = await this.schema.CustomQueryPreference.aggregate(pipeline)
      .cursor({ batchSize: BATCH_SIZE });
    const idListToRemoveMock = [];
    const idListToRemoveForcedRun = [];
    let customQueries = await cursorMapAsyncHelper(cursor, (preference) => {
      const { customQuery = {}, user = {} } = preference;
      if (!_.isEmpty(customQuery.mock)) {
        idListToRemoveMock.push(customQuery._id);
      }
      if (preference.isRunForced) {
        idListToRemoveForcedRun.push(preference._id);
      }
      const noAccessToEntities = customQuery.entities.some(({ name }) => !hasUserAccessToSchema(name, user, ['READ_ALL', 'READ_OWN']));
      if (noAccessToEntities) {
        return null;
      }
      const now = this.getCurrentDateTime({ mock: customQuery.mock });
      if (_.isDate(preference.lastRunAt) && preference.lastRunAt >= (now - cachedMs)) {
        return null;
      }
      const interval = cronParser.parseExpression(preference.scheduledAt, {
        currentDate: new Date(now - 6e4),
        utc: true,
      });
      const dateLaunch = moment(interval.next().toISOString());

      if (!preference.isRunForced && !dateLaunch.isSame(now, 'minute')) {
        return null;
      }
      return {
        ...customQuery,
        ...{
          preference: _.omit(preference, ['customQuery', 'user']),
          user,
        },
      };
    });
    const promises = [];

    if (!_.isEmpty(idListToRemoveMock)) {
      promises.push(this.schema.CustomQuery.updateMany({
        _id: { $in: idListToRemoveMock },
      }, {
        $unset: { mock: true },
      }));
    }
    if (!_.isEmpty(idListToRemoveForcedRun)) {
      promises.push(this.schema.CustomQueryPreference.updateMany({
        _id: { $in: idListToRemoveForcedRun },
      }, {
        $unset: { isRunForced: true },
      }));
    }
    customQueries = customQueries.filter((customQuery) => !_.isNull(customQuery));
    if (!_.isEmpty(customQueries)) {
      const executingIdList = customQueries.map(({ _id }) => _id);

      promises.push(this.schema.CustomQuery.updateMany({
        _id: { $in: executingIdList },
      }, {
        $set: { isExecuting: true, lastExecutionStartedAt: new Date() },
      }));
    }
    await Promise.all(promises);
    return customQueries;
  }

  getRefFromPrefix(refFrom) {
    if (_.isEmpty(refFrom)) {
      return '';
    }
    refFrom = refFrom.replace(/\[\]/g, '').replace(/\./g, ENTITY_TO_FIELD_CONNECTOR);
    return `${refFrom}${REF_TO_ENTITY_CONNECTOR}`;
  }

  /**
   * @private
   */
  async getEntitiesPipeline({ entities = [], user = {} }) {
    let pipeline = [];
    let entityPath;
    await Promise.each(entities, async ({ name = '', refFrom = '' }, i) => {
      if (_.isEmpty(pipeline)) {
        entityPath = name;
        const newRoot = {};

        newRoot[name] = '$$ROOT';
        pipeline.push({
          $replaceRoot: { newRoot },
        });
      } else {
        let lastRefEntity = refFrom.split('.')[0];
        let localField = refFrom.replace(/\[\]/g, '');
        let foreignField = '_id';
        entities.slice(1, i).reverse().forEach((prevEntity) => {
          if (prevEntity.name === lastRefEntity) {
            [lastRefEntity] = prevEntity.refFrom.split('.');
            localField = `${this.getRefFromPrefix(prevEntity.refFrom)}${localField}`;
          }
        });
        entityPath = `${this.getRefFromPrefix(refFrom)}${name}`;
        if (lastRefEntity !== entities[0].name) {
          const path = refFrom.replace(/\[\]/g, '');
          foreignField = path.split('.').slice(1).join('.');
          lastRefEntity = name;
          localField = `${entities[0].name}._id`;
        }
        pipeline.push({
          $lookup: {
            from: _.get(this, `schema.${name}.collection.name`, ''),
            localField,
            foreignField,
            as: entityPath,
          },
        });
        pipeline.push({
          $unwind: { path: `$${entityPath}`, preserveNullAndEmptyArrays: true },
        });
      }
      const filterPipeline = await getPipelineToFilterRestrictedRecords(name, user, entityPath);
      const notExistsCond = {};

      notExistsCond[entityPath] = { $exists: false };
      _.get(filterPipeline, '0.$match.$or', []).push(notExistsCond);
      pipeline = pipeline.concat(filterPipeline);
    });
    return pipeline;
  }

  getUnwindPipeline(fields) {
    const fieldsToUnwind = fields
      .map(({ field = {} }) => {
        let path = this.getRefFromPrefix(field.refFrom);
        const parts = field.path.split('[]').map((pathPart) => {
          path += pathPart;
          return path;
        });

        parts.pop();
        return parts;
      })
      .filter((field) => !_.isEmpty(field));
    return _.uniq(_.flatten(fieldsToUnwind)).map((field) => ({
      $unwind: { path: `$${field}`, preserveNullAndEmptyArrays: true },
    }));
  }

  getFilterRuleDateRangeCondition(operator, dateFrom, dateTo) {
    const condition = {};

    switch (operator) {
      case FILTER_RULE_OPERATOR_EQUALS:
        condition.$gte = dateFrom;
        condition.$lte = dateTo;
        break;
      case FILTER_RULE_OPERATOR_DOES_NOT_EQUAL:
        condition.$or = [{ $lte: dateFrom }, { $gte: dateTo }];
        break;
      case FILTER_RULE_OPERATOR_LOWER_THAN:
        condition.$lt = dateFrom;
        break;
      case FILTER_RULE_OPERATOR_LOWER_THAN_OR_EQUAL:
        condition.$lte = dateFrom;
        break;
      case FILTER_RULE_OPERATOR_GREATER_THAN:
        condition.$gt = dateTo;
        break;
      case FILTER_RULE_OPERATOR_GREATER_THAN_OR_EQUAL:
        condition.$gte = dateTo;
        break;
      default:
        throw new Error(`Operator ${operator} not supported for the date range`);
    }
    return condition;
  }

  getFilterRuleComplexOperatorCondition(operator, value) {
    const condition = {};

    switch (operator) {
      case FILTER_RULE_OPERATOR_DOES_NOT_CONTAIN:
        condition.$regex = `^((?!${value}).)*$`;
        break;
      case FILTER_RULE_OPERATOR_BEGINS_WITH:
        condition.$regex = `^${value}.*$`;
        break;
      case FILTER_RULE_OPERATOR_ENDS_WITH:
        condition.$regex = `^.*${value}$`;
        break;
      case FILTER_RULE_OPERATOR_EXISTS:
        condition.$exists = true;
        break;
      case FILTER_RULE_OPERATOR_DOES_NOT_EXISTS:
        condition.$exists = false;
        break;
      default:
        throw new Error(`No such operator "${operator}" allowed for custom query filter rule`);
    }
    return condition;
  }

  /**
   * @private
   */
  getFilterRulePipeline({
    refFrom = '', field = '', operator = '', value = {},
  }, isBeforeUnwind) {
    let result = {};
    const simpleOperators = _.invert({
      regex: FILTER_RULE_OPERATOR_CONTAINS,
      lt: FILTER_RULE_OPERATOR_LOWER_THAN,
      lte: FILTER_RULE_OPERATOR_LOWER_THAN_OR_EQUAL,
      gt: FILTER_RULE_OPERATOR_GREATER_THAN,
      gte: FILTER_RULE_OPERATOR_GREATER_THAN_OR_EQUAL,
    });
    const valueOperators = _.invert({
      eq: FILTER_RULE_OPERATOR_EQUALS,
      ne: FILTER_RULE_OPERATOR_DOES_NOT_EQUAL,
    });
    const arrayOperators = _.invert({
      in: FILTER_RULE_OPERATOR_EQUALS,
      nin: FILTER_RULE_OPERATOR_DOES_NOT_EQUAL,
    });
    const useArrayOperators = isBeforeUnwind && _.get(value, 'value.path', '').includes('[]');

    Object.assign(simpleOperators, useArrayOperators ? arrayOperators : valueOperators);
    const compareField = `${this.getRefFromPrefix(refFrom)}${field.replace(/\[\]/g, '')}`;

    if (value.type === FILTER_RULE_VALUE_TYPE_FIELD) {
      const comparisonValueRefFrom = _.get(value, 'value.refFrom', '');
      const comparisonValuePath = _.get(value, 'value.path', '').replace(/\[\]/g, '');
      const expr = {};

      expr[`$${simpleOperators[operator]}`] = [
        `$${compareField}`,
        `$${this.getRefFromPrefix(comparisonValueRefFrom)}${comparisonValuePath}`,
      ];
      result = { $expr: expr };
    } else {
      const dateRegexStr = '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.000Z';
      const dateRangeRegex = new RegExp(`^${dateRegexStr},${dateRegexStr}$`);
      let values;

      if (Array.isArray(value.value)) {
        values = value.value;
      } else if (_.isString(value.value) && !dateRangeRegex.test(value.value)) {
        values = value.value.split(',');
      } else {
        values = [value.value];
      }
      const conditions = values.map((fieldValue) => {
        let valueCondition = {};

        if (_.isNil(simpleOperators[operator])) {
          valueCondition = this.getFilterRuleComplexOperatorCondition(operator, fieldValue);
        } else if (dateRangeRegex.test(fieldValue)) {
          const [dateFrom, dateTo] = fieldValue.split(',').map((date) => new Date(date));

          valueCondition = this.getFilterRuleDateRangeCondition(operator, dateFrom, dateTo);
        } else if (RANGES.includes(fieldValue)) {
          const [dateFrom, dateTo] = getDatesByRange(fieldValue);

          valueCondition = this.getFilterRuleDateRangeCondition(operator, dateFrom, dateTo);
        } else {
          valueCondition[`$${simpleOperators[operator]}`] = fieldValue;
        }
        let fullCondition = {};

        if (!useArrayOperators) {
          fullCondition[compareField] = valueCondition;
        } else {
          _.get(value, 'value.path', '').split('[]').reverse().forEach((pathPart) => {
            pathPart = _.trim(pathPart, '.');
            if (!_.isEmpty(fullCondition)) {
              const elemMatch = { $elemMatch: fullCondition };

              fullCondition = {};
              fullCondition[pathPart] = elemMatch;
            } else if (_.isEmpty(pathPart)) {
              fullCondition = valueCondition;
            } else {
              fullCondition[pathPart] = valueCondition;
            }
          });
        }
        return fullCondition;
      });

      if (conditions.length === 1) {
        result = conditions[0];
      } else {
        const oppositeComparisons = [
          FILTER_RULE_OPERATOR_DOES_NOT_EQUAL, FILTER_RULE_OPERATOR_DOES_NOT_CONTAIN,
        ];
        const logicCondition = oppositeComparisons.includes(operator) ? '$and' : '$or';

        result[logicCondition] = conditions;
      }
    }
    return result;
  }

  /**
   * @private
   */
  getFilterGroupPipeline({ logicalOperator = '', children = [] }, isBeforeUnwind) {
    const conditions = [];

    children.forEach(({ type = '', query = {} }) => {
      switch (type) {
        case FILTER_TYPE_GROUP:
          conditions.push(this.getFilterGroupPipeline(query, isBeforeUnwind));
          break;
        case FILTER_TYPE_RULE:
          conditions.push(this.getFilterRulePipeline(query, isBeforeUnwind));
          break;
        default:
          throw new Error(`No such type "${type}" for custom query filter`);
      }
    });
    const result = {};

    result[`$${logicalOperator}`] = conditions;
    return result;
  }

  /**
   * @private
   */
  getFilterPipeline({ query = {} }, isBeforeUnwind) {
    return { $match: this.getFilterGroupPipeline(query, isBeforeUnwind) };
  }

  /**
   * @private
   */
  getGroupByPipeline({ fields = [], groupBy = [] }) {
    const id = {};
    const project = { _id: false };

    groupBy.forEach(({ refFrom, path }) => {
      const fullPath = `${this.getRefFromPrefix(refFrom)}${path}`.replace(/\[\]/g, '');

      id[fullPath.replace(/\./g, ENTITY_TO_FIELD_CONNECTOR)] = `$${fullPath}`;
    });
    const group = { _id: id };

    fields.forEach((fieldRow) => {
      const { function: aggregationFunction = '' } = fieldRow;
      const { field = {} } = fieldRow;
      const path = `${this.getRefFromPrefix(field.refFrom)}${field.path.replace(/\[\]/g, '')}`;
      const validOutputFieldName = path.replace(/\./g, ENTITY_TO_FIELD_CONNECTOR);
      const outputFieldName = getFieldDataText(fieldRow, true)
        .replace(/\./g, ENTITY_TO_FIELD_CONNECTOR);

      if (_.isEmpty(aggregationFunction)) {
        project[outputFieldName] = { $ifNull: [`$_id.${validOutputFieldName}`, ''] };
      } else {
        const aggregation = {};

        switch (aggregationFunction) {
          case FIELD_FUNCTION_COUNT:
            aggregation.$sum = 1;
            break;
          case FIELD_FUNCTION_CONCAT:
            aggregation.$addToSet = `$${path}`;
            break;
          default:
            aggregation[`$${aggregationFunction}`] = `$${path}`;
        }
        group[validOutputFieldName] = aggregation;
        project[outputFieldName] = { $ifNull: [`$${validOutputFieldName}`, ''] };
      }
    });
    return [{ $group: group }, { $project: project }];
  }

  /**
   * @private
   */
  getFieldsPipeline(fields) {
    const project = {};

    fields.forEach(({ field = {}, alias = '' }) => {
      const path = `${this.getRefFromPrefix(field.refFrom)}${field.path.replace(/\[\]/g, '')}`;
      const outputFieldName = !_.isEmpty(alias)
        ? alias
        : path.replace(/\./g, ENTITY_TO_FIELD_CONNECTOR);

      project[outputFieldName] = { $ifNull: [`$${path}`, ''] };
    });
    return { $project: project };
  }

  /**
   * @private
   */
  getOrderByPipeline(orderBy, isResultSorting) {
    const sort = {};
    const sortAliases = _.invert({ 1: ORDER_BY_SORT_ASC, '-1': ORDER_BY_SORT_DESC });

    orderBy.forEach(({ fieldData = {}, sort: sortOption = '' }) => {
      let field;
      const isFieldForResultSorting = !_.isEmpty(fieldData.function) || !_.isEmpty(fieldData.alias);

      if (isResultSorting && isFieldForResultSorting) {
        field = getFieldDataText(fieldData, true).replace(/\./g, ENTITY_TO_FIELD_CONNECTOR);
      } else if (!isResultSorting && !isFieldForResultSorting) {
        field = getFieldPathText(_.get(fieldData, 'field', {}));
      }
      if (!_.isEmpty(field)) {
        sort[field.replace(/\[\]/g, '')] = +sortAliases[sortOption];
      }
    });
    return !_.isEmpty(sort) ? { $sort: sort } : {};
  }

  generateEmptyResult(fields) {
    const result = {};

    fields.forEach(({ field = {}, alias = '' }) => {
      const path = field.path.replace(/\[\]/g, '').replace(/\./g, ENTITY_TO_FIELD_CONNECTOR);
      const outputFieldName = !_.isEmpty(alias)
        ? alias
        : `${this.getRefFromPrefix(field.refFrom)}${path}`;

      result[outputFieldName] = '';
    });
    return result;
  }

  /**
   * @private
   */
  async runCustomQuery(customQuery) {
    let pipeline = [];
    const entitiesPipeline = await this.getEntitiesPipeline(customQuery);
    pipeline = pipeline.concat(entitiesPipeline);
    const { fields = [] } = customQuery;
    const filterPipelineBeforeUnwind = !_.isEmpty(customQuery.filter)
      ? this.getFilterPipeline(customQuery.filter, true)
      : null;

    if (!_.isEmpty(filterPipelineBeforeUnwind)) {
      pipeline.push(filterPipelineBeforeUnwind);
    }
    pipeline = pipeline.concat(this.getUnwindPipeline(fields));
    const filterPipelineAfterUnwind = !_.isEmpty(customQuery.filter)
      ? this.getFilterPipeline(customQuery.filter, false)
      : null;

    if (!_.isEmpty(filterPipelineAfterUnwind)) {
      pipeline.push(filterPipelineAfterUnwind);
    }
    const { orderBy = [] } = customQuery;
    const hasAggregation = fields.some(({ function: aggregation }) => !_.isEmpty(aggregation));

    if (_.isEmpty(customQuery.groupBy) && !hasAggregation) {
      const sortInnerFields = this.getOrderByPipeline(orderBy, false);

      if (!_.isEmpty(sortInnerFields)) {
        pipeline.push(sortInnerFields);
      }
      pipeline.push(this.getFieldsPipeline(fields));
    } else {
      pipeline = pipeline.concat(this.getGroupByPipeline(customQuery));
    }
    const sortOuterFields = this.getOrderByPipeline(orderBy, true);

    if (!_.isEmpty(sortOuterFields)) {
      pipeline.push(sortOuterFields);
    }
    const baseEntityName = _.get(customQuery, 'entities.0.name', '');
    const baseSchema = _.get(this, `schema.${baseEntityName}Secondary`, {});
    return baseSchema.aggregate(pipeline)
      .option({ allowDiskUse: true, maxTimeMS: env.CQ_MAX_EXECUTION_MINUTES * 6e4 })
      .cursor({ batchSize: BATCH_SIZE });
  }

  /**
   * @private
   */
  async updateLastRun({ _id = '', user = {}, lastRunAt }) {
    const customQueryUpdate = this.schema.CustomQuery.updateOne({ _id }, {
      $set: { lastRunBy: user.email, lastRunAt, isExecuting: false },
    });
    const preferenceUpdate = this.schema.CustomQueryPreference.updateOne({
      customQueryId: _id,
      userId: user._id,
    }, {
      $set: { lastRunAt },
    });

    await Promise.all([customQueryUpdate, preferenceUpdate]);
  }

  transformResultDates(result) {
    Object.entries(result).forEach(([key, value]) => {
      if (_.isDate(value)) {
        result[key] = value.toISOString();
      } else if (Array.isArray(value)) {
        value.forEach((item, i) => {
          if (_.isDate(item)) {
            result[key][i] = item.toISOString();
          }
        });
      }
    });
    return result;
  }

  async saveResult({
    name, user = {}, lastRunAt, fields = [],
  }, cursor) {
    const result = [];

    await cursorMapAsyncHelper(cursor, (data) => result.push(this.transformResultDates(data)));
    if (_.isEmpty(result)) {
      const emptyResult = this.generateEmptyResult(fields);

      result.push(emptyResult);
    }
    const readStream = new CsvBuilder({
      headers: Object.keys(result[0]),
    }).createReadStream(result);
    const path = getResultFilePath(name, user._id, lastRunAt);

    await this.cloudStorage.gcsUploadDataViaStream(readStream, path);
    this.logger.info(`Custom query report is saved at path ${path}`);
  }

  async run(flags = {}) {
    const mock = _.get(flags, 'mock', false);
    const mockReportCache = _.get(flags, 'mockReportCache', 0);
    const reportCache = mock && !_.isNil(mockReportCache) ? mockReportCache : _.get(this, 'lsp.customQuerySettings.reportCache', 0);
    const customQueriesToRun = await this.getCustomQueriesToRun(reportCache);

    await Promise.map(customQueriesToRun, async (customQuery) => {
      try {
        this.logger.info(`Custom query ${customQuery.name} run: query started`);
        const cursor = await this.runCustomQuery(customQuery);
        this.logger.info(`Custom query ${customQuery.name} run: query finished`);
        customQuery.lastRunAt = this.getCurrentDateTime(customQuery);
        await this.saveResult(customQuery, cursor);
        this.logger.info(`Custom query ${customQuery.name} run: results uploaded`);
      } finally {
        await this.updateLastRun(customQuery);
        this.logger.info(`Custom query ${customQuery.name} run: last run time updated`);
      }
    });
    return customQueriesToRun;
  }
}

module.exports = CustomQueryRunner;
