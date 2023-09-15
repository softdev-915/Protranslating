/* eslint-disable no-useless-escape */
const mongoose = require('mongoose');
const _ = require('lodash');
const { flatten } = require('flat');
const moment = require('moment-timezone');
const isRegExpSafe = require('safe-regex');
const { validObjectId } = require('../schema');
const { buildISODateQuery } = require('../../components/database/mongo/query/date');
const { transformExportData } = require('../csvExporter/csv-exporter-helper');

const DEFAULT_INITIAL_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MONGO_EXCLUDED_PROPS = ['_v', '__v'];
const MONGO_DATETIME_MASK = '%Y-%m-%d %H:%M';
const MAX_LIMIT = 100;
const MIN_LIMIT = 10;
const DATE_RANGES = [
  'today',
  'tomorrow',
  'yesterday',
  'twoDaysFromNow',
  'threeDaysFromNow',
  'fourDaysFromNow',
  'previousThirtyDays',
  'nextThirtyDays',
  'lastYear',
  'thisYear',
  'yearToDate',
];
const REGEXP_SPECIAL_CHARS = /\(|\)|\[|\]|\\|\.|\^|\$|\||\?|\+/g;
const MONGO_OPERATORS_MAP = {
  '=': 'eq', '>': 'gt', '>=': 'gte', '<': 'lt', '<=': 'lte',
};
const SCHEMA_FIELD_DATE = 'Date';
const SCHEMA_FIELD_ARRAY = 'Array';
const SCHEMA_FIELD_NUMBER = 'Number';
const getProperLimit = (filters) => {
  const limit = _.get(filters, 'paginationParams.limit', MIN_LIMIT);
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, limit));
};
const streamQueryDecorator = (queryObj) => queryObj.cursor({ batchSize: 10 });
const buildSearchQuery = (filters) => {
  let searchTerm = filters.q;
  const matchLiteralPhrase = searchTerm.includes('"');
  const isOneWord = !searchTerm.includes(' ');

  if (isOneWord && !matchLiteralPhrase) {
    searchTerm = `"${searchTerm}"`;
  }
  if (matchLiteralPhrase) {
    searchTerm = searchTerm.replace(/"/g, '\"');
  }
  delete filters.q;
  filters.$text = {
    $search: searchTerm,
    $caseSensitive: false,
  };
  return filters;
};
const buildSortQuery = (filters) => {
  if (!_.isString(filters.sort)) {
    return;
  }
  const descendingSort = filters.sort.includes('-');
  const sortMode = descendingSort ? -1 : 1;
  const sortProperty = descendingSort ? filters.sort.slice(1) : filters.sort;

  filters.sort = { [sortProperty]: sortMode };
};
const buildFilterQueryObj = (filters) => {
  let filtersQuery = {};

  try {
    if (_.isString(filters)) {
      filtersQuery = JSON.parse(filters);
    } else if (_.isObject(filters)) {
      filtersQuery = filters;
    }
  } catch (e) {
    filtersQuery = {};
  }
  return filtersQuery;
};
const _isDateFilterApplied = (rawQuery, key) => {
  const dateRangeApplied = _.get(rawQuery, key);
  if (_.isNil(dateRangeApplied)) {
    return false;
  }
  const knownDatePresetApplied = DATE_RANGES.includes(dateRangeApplied);

  try {
    const offset = _.get(rawQuery, '__tz');
    const knownDateRangeApplied = buildISODateQuery(dateRangeApplied, offset, true);

    if (knownDatePresetApplied || knownDateRangeApplied) {
      return knownDateRangeApplied;
    }
    // eslint-disable-next-line no-empty
  } catch (error) {}
  return false;
};
const isTimeStamp = (key) => ['createdAt', 'updatedAt', 'restoredAt', 'deletedAt', 'lastSyncDate'].includes(key);
const getAggregateStrategy = (model) => {
  if (_.isFunction(model.aggregateWithDeleted)) {
    return model.aggregateWithDeleted.bind(model);
  }
  return model.aggregate.bind(model);
};

/**
 * Transforms search query parameters according to the type
 * by default(`convertToObjectId === false`) converts all string values to safe regular expressions
 * if `convertToObjectId` is true will convert to ObjectId if possible
 * @param {Object} filtersQuery Object containing query filters
 * @param {Boolean} convertToObjectId Whenever should convert to ObjectId if possible
 * @returns {Object} Transformed query filters object
 */
const transformSearchTerms = (rawQuery, aditionalParams, modelPropsTypes, convertToObjectId = false) => {
  const filtersQuery = _.pick(rawQuery, aditionalParams);
  const filterKeys = Object.keys(filtersQuery);
  if (_.isEmpty(filterKeys)) return {};
  filterKeys.forEach((key) => {
    if (convertToObjectId && validObjectId(filtersQuery[key])) {
      const id = filtersQuery[key];
      filtersQuery[key] = new mongoose.Types.ObjectId(id);
      return;
    }
    const dateRegexStr = '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\+\\d{2}:\\d{2}';
    const dateRegex = new RegExp(`^${dateRegexStr}$`);
    const dateRangeRegex = new RegExp(`^${dateRegexStr},${dateRegexStr}$`);
    if (
      _.get(modelPropsTypes, key) === 'Date'
      || isTimeStamp(key)
      || dateRegex.test(filtersQuery[key])
      || dateRangeRegex.test(filtersQuery[key])
    ) {
      const dateFilterApplied = _isDateFilterApplied(rawQuery, key);
      if (dateFilterApplied) {
        filtersQuery[key] = dateFilterApplied;
        return;
      }
    }
    const filterOperators = _.isString(filtersQuery[key])
      ? filtersQuery[key].match(/^>=|=|<=|>|</)
      : [];
    const operator = _.get(filterOperators, 0);
    if (!_.isEmpty(operator)) {
      filtersQuery[key] = filtersQuery[key].replace(operator, '');
    }
    if (_.isString(_.get(filtersQuery, 'key'))) {
      filtersQuery[key] = filtersQuery[key].trim();
    }
    const isNumeric = /^[\d\.]+$/.test(filtersQuery[key]);
    const operatorFound = MONGO_OPERATORS_MAP[operator];
    if (isNumeric && !_.isEmpty(operatorFound)) {
      filtersQuery[key] = {
        [`$${operatorFound}`]: +filtersQuery[key],
      };
    }
    if (!_.isString(filtersQuery[key])) return;
    const searchTerm = filtersQuery[key]
      .replace(REGEXP_SPECIAL_CHARS, '\\$&')
      .replace(/\s/g, '.*');
    const reg = `.*${searchTerm}.*`;
    if (isRegExpSafe(reg)) {
      filtersQuery[key] = new RegExp(reg, 'i');
    }
  });
  return filtersQuery;
};

const buildPaginationQuery = (filters) => {
  // note 0 will cast as false
  if (filters.page && filters.limit) {
    if (isNaN(filters.page) || isNaN(filters.limit)) {
      filters.page = DEFAULT_INITIAL_PAGE;
      filters.limit = DEFAULT_PAGE_SIZE;
    }
    filters.skip = (filters.page * filters.limit) - filters.limit;
  }
  return filters;
};

const extractQuery = (filters) => {
  const keysToExclude = ['q', 'sort', 'page', 'limit', 'filter'];

  if (filters) {
    if (filters.q) {
      filters = buildSearchQuery(filters);
    }
    keysToExclude.forEach((k) => {
      delete filters[k];
    });
    return filters;
  }
  return {};
};

const extractPath = (schema, parent) => {
  let propName;
  const extracted = {
    modelPropsTypes: {},
    modelStringProps: [],
    modelNonStringProps: [],
  };

  schema.eachPath((name, path) => {
    if (MONGO_EXCLUDED_PROPS.includes(name)) return;
    propName = parent ? `${parent}.${name}` : name;
    if (path.schema && (path.instance === 'Array' || path.instance === 'Embedded')) {
      extracted.modelPropsTypes[propName] = path.instance;
      extracted.modelNonStringProps.push(propName);
      const newlyExtracted = extractPath(path.schema, propName);

      extracted.modelStringProps = extracted.modelStringProps.concat(newlyExtracted.modelStringProps);
      extracted.modelNonStringProps = extracted.modelNonStringProps.concat(newlyExtracted.modelNonStringProps);
      Object.assign(extracted.modelPropsTypes, newlyExtracted.modelPropsTypes);
    } else if (path.instance === 'Mixed') {
      let type;
      _.forEach(path.options.type, (value, key) => {
        propName = `${name}.${key}`;
        if (!_.isNil(value.name)) {
          type = value.name;
        } else if (!_.isNil(value.type) && !_.isNil(value.type.name)) {
          type = value.type.name;
        }
        extracted.modelPropsTypes[propName] = type;
        if (type === 'String') {
          extracted.modelStringProps.push(propName);
        } else {
          extracted.modelNonStringProps.push(propName);
        }
      });
    } else if (path.instance !== 'Array' && path.instance !== 'Mixed') {
      extracted.modelPropsTypes[propName] = path.instance;
      if (path.instance === 'String') {
        extracted.modelStringProps.push(propName);
      } else {
        extracted.modelNonStringProps.push(propName);
      }
    }
  });
  return extracted;
};
const filterProps = (propArr) => propArr.filter((p) => !p.includes('.'));
const extractAndFilterPath = (schema) => {
  const extracted = extractPath(schema);
  const modelStringProps = filterProps(extracted.modelStringProps);
  const modelNonStringProps = filterProps(extracted.modelNonStringProps);
  return {
    modelPropsTypes: extracted.modelPropsTypes,
    modelStringProps,
    modelNonStringProps,
  };
};

const countFactory = (model, filters, extraPipelines, extraQueryParams = [], utcOffsetInMinutes = '0', schemaDef, collation = {}, beforeMatchPipeline = [], useStream = false) => {
  const projectPipeline = _.clone(extraPipelines.find((p) => _.has(p, '$project')));

  if (!_.isNil(projectPipeline)) {
    _.remove(extraPipelines, (p) => p.$project);
  }
  const filtersClone = _.cloneDeep(filters);
  const apiQuery = extractQuery(filtersClone);
  const aggregateOptions = { allowDiskUse: true };
  // Existing properties (String / Other Type)
  const rawQuery = buildFilterQueryObj(filters.filter);
  let modelPropsTypes = {};
  let modelStringProps = [];
  let modelNonStringProps = [];
  const nestedModelPropsTypes = {};
  let isMongooseModel = false;

  if (model.schema) {
    isMongooseModel = true;
    const extracted = extractAndFilterPath(model.schema, schemaDef);

    modelStringProps = extracted.modelStringProps;
    modelNonStringProps = extracted.modelNonStringProps;
    modelPropsTypes = extracted.modelPropsTypes;
    if (schemaDef) {
      Object.keys(schemaDef).forEach((key) => {
        const { outField } = schemaDef[key];

        nestedModelPropsTypes[outField] = modelPropsTypes[key];
      });
    }
  } else {
    // Use schemaDef
    const flatSchema = flatten(schemaDef);
    const schemaKeys = _.keys(flatSchema);

    schemaKeys.forEach((name) => {
      if (MONGO_EXCLUDED_PROPS.includes(name)) return;
      modelPropsTypes[name] = flatSchema[name];
      if (flatSchema[name] === 'String') {
        modelStringProps.push(name);
      } else {
        modelNonStringProps.push(name);
      }
    });
  }
  // const queryFilter =
  // These are the query params that need to be excluded in the first match
  // Don't exist as model props
  // const queryExtraParams = _.difference(_.keys(rawQuery), _.keys(modelPropsTypes));
  // Query to execute in the first match
  // Exist as model props
  const queryParamsExistingInModel = _.intersection(
    _.keys(rawQuery),
    _.keys(modelPropsTypes).concat(_.keys(nestedModelPropsTypes)),
  );
  const initialQueryStringParams = _.intersection(queryParamsExistingInModel, modelStringProps);
  const initialQueryNonStringParams = _.difference(queryParamsExistingInModel, modelStringProps);
  let pipelines = [];
  // Initial Match
  const initialQuery = transformSearchTerms(rawQuery, initialQueryStringParams, null, false);

  if (!_.isEmpty(beforeMatchPipeline)) {
    pipelines = pipelines.concat(beforeMatchPipeline);
  }
  // if (!_.isEmpty({ 'a': 1 })) = {};
  // In case of empty object we should get them anyways
  // If api query contains an added field ($addFields), $match should go after
  pipelines.push({ $match: { ...initialQuery, ...apiQuery } });
  // TODO: add forced part of the query like LSPID and another messed up parameters
  // Sort configuration
  // Execute extra pipelines sent as additional parameter
  if (extraPipelines && _.isArray(extraPipelines) && extraPipelines.length > 0) {
    pipelines = pipelines.concat(extraPipelines);
  }

  // Apply Transformations to non string params
  // Use $addFields to override parameters
  const addFieldsPipes = [{ $addFields: {} }];

  // This attributes potencially needs transformations
  modelNonStringProps.forEach((param) => {
    const isNestedProperty = param.indexOf('.') !== -1;
    const properParam = isNestedProperty && isMongooseModel ? schemaDef[param] : { inField: `$${param}`, outField: param };

    switch (modelPropsTypes[param]) {
      case 'Date': {
        // If date range selected
        const dateFilterApplied = _isDateFilterApplied(rawQuery, param);

        if (dateFilterApplied) {
          return true;
        }
        // __tz utc offset in minutes, i.e. -180
        // https://stackoverflow.com/questions/34914737/mongodb-aggregate-convert-date-to-another-timezone
        const diffMinutes = parseInt(rawQuery.__tz, 10);
        const diffMinutesFlag = parseInt(utcOffsetInMinutes, 10);

        if (!isNaN(diffMinutes)) {
          // If the url query parameter exists, use it
          addFieldsPipes[0].$addFields[properParam.outField] = { $add: [properParam.inField, diffMinutes * 60 * 1000] };
        } else if (!isNaN(diffMinutesFlag)) {
          // otherwise, check for the header
        }
        addFieldsPipes[0].$addFields[properParam.outField] = { $add: [properParam.inField, diffMinutesFlag * 60 * 1000] };
        const extraTransformation = { $addFields: {} };

        // Apply mask
        extraTransformation.$addFields[properParam.outField] = { $dateToString: { format: MONGO_DATETIME_MASK, date: `${properParam.inField}` } };
        addFieldsPipes.push(extraTransformation);
        break;
      }
      case 'Number': {
        addFieldsPipes[0].$addFields[properParam.outField] = { $substr: [`${properParam.inField}`, 0, -1] };
        break;
      }
      default:
        break;
    }
  });

  // $addFields specification must have at least one field
  if (_.keys(addFieldsPipes[0].$addFields).length === 0) {
    // delete addFieldsPipes[0]
    addFieldsPipes.shift();
  }

  // add pipeline in case extra transformations like date conversion exists
  if (addFieldsPipes.length > 0) {
    pipelines = pipelines.concat(addFieldsPipes);
  }

  // Apply mask
  const aditionalParams = _.keys(_.pick(rawQuery, extraQueryParams));
  const nonStringParamsQuery = transformSearchTerms(
    rawQuery,
    initialQueryNonStringParams.concat(aditionalParams),

    null,

    true,
  );

  // Avoid overriding already transformed query
  Object.keys(nonStringParamsQuery).forEach((key) => {
    if (_.get(rawQuery, key)) {
      _.unset(rawQuery, key);
    }
  });
  let additionalParamsQuery;

  if (Object.keys(rawQuery).length > 0) {
    additionalParamsQuery = transformSearchTerms(rawQuery, aditionalParams, null, false);
  }
  const afterTransformationsQuery = _.extend({}, nonStringParamsQuery, additionalParamsQuery);

  // Prevent pushing and aditional {} match
  if (_.keys(afterTransformationsQuery).length > 0) {
    pipelines.push({ $match: afterTransformationsQuery });
  }
  pipelines.push({
    $group: {
      _id: '$_id',
      count: { $sum: 1 },
    },
  }, {
    $project: {
      count: 1,
    },
  });

  // Return the aggregation
  const aggregateStrategy = getAggregateStrategy(model);

  if (model.schema) {
    if (useStream) {
      // stream query
      return streamQueryDecorator(
        aggregateStrategy(pipelines).option(aggregateOptions).collation(collation),
      );
    }
    // mongoose
    return aggregateStrategy(pipelines).option(aggregateOptions).collation(collation);
  }
  // native
  return aggregateStrategy(pipelines, aggregateOptions).collation(collation);
};

/**
 * @param {*} model
 * @param {*} filters
 * @param {*} extraPipelines
 * @param {*} extraQueryParams
 * @param {*} utcOffsetInMinutes
 * @param {*} collation
 * @param {*} beforeMatchPipeline
 * @param {*} useStream
 */
const searchFactory = ({
  model,
  filters = {},
  extraPipelines = [],
  extraQueryParams = [],
  utcOffsetInMinutes = '0',
  collation = {},
  beforeMatchPipeline = [],
  postProcessPipeline = [],
  useStream = false,
  shouldProcessNestedProps = false,
}) => {
  const projectPipeline = _.clone(extraPipelines.find((p) => _.has(p, '$project')));

  if (!_.isNil(projectPipeline)) {
    _.remove(extraPipelines, (p) => p.$project);
  }
  const replaceRootPipeline = _.clone(extraPipelines.find((p) => _.has(p, '$replaceRoot')));
  if (!_.isNil(replaceRootPipeline)) {
    _.remove(extraPipelines, (p) => p.$replaceRoot);
  }
  const filtersClone = _.cloneDeep(filters);
  const apiQuery = extractQuery(filtersClone);
  const rawQuery = buildFilterQueryObj(filters.filter);
  const {
    modelStringProps,
    modelNonStringProps,
    modelPropsTypes,
  } = extractPath(model.schema);
  const queryParamsExistingInModel = _.intersection(_.keys(rawQuery), _.keys(modelPropsTypes));
  const initialQueryStringParams = _.intersection(queryParamsExistingInModel, modelStringProps);
  const initialQueryNonStringParams = _.difference(queryParamsExistingInModel, modelStringProps);
  let pipelines = [];
  const initialQuery = transformSearchTerms(rawQuery, initialQueryStringParams, modelPropsTypes);

  if (!_.isEmpty(beforeMatchPipeline)) {
    pipelines = pipelines.concat(beforeMatchPipeline);
  }
  const extraPipelinesMatch = _.cloneDeep(_.get(extraPipelines, '0.$match', {}));

  pipelines.push({ $match: { ...initialQuery, ...apiQuery, ...extraPipelinesMatch } });
  buildSortQuery(filters);
  const sortKey = _.defaultTo(_.keys(filters.sort)[0], '');
  let sorted = false;
  const sortKeyInModel = _.get(modelPropsTypes, sortKey);

  if (!_.isEmpty(sortKeyInModel) && _.isString(sortKeyInModel)) {
    pipelines.push({ $sort: filters.sort });
    sorted = true;
  }
  if (_.isArray(extraPipelines) && !_.isEmpty(extraPipelines)) {
    if (!_.isEmpty(extraPipelinesMatch)) {
      extraPipelines.splice(0, 1);
    }
    pipelines = pipelines.concat(extraPipelines);
  }
  const nonStringFlatProps = modelNonStringProps.filter((p) => !p.includes('.'));
  const addFieldProps = shouldProcessNestedProps ? modelNonStringProps : nonStringFlatProps;
  const datesToConvert = addFieldProps.filter((param) => modelPropsTypes[param] === SCHEMA_FIELD_DATE
    && !_isDateFilterApplied(rawQuery, param)
    && !param.split('.').some((pathPart) => modelPropsTypes[pathPart] === SCHEMA_FIELD_ARRAY));
  const availableTimeZones = moment.tz.names();
  const isTzDatabaseFormat = availableTimeZones.includes(rawQuery.__tz);
  datesToConvert.forEach((param) => {
    pipelines.push({
      $addFields: {
        [param]: {
          $cond: {
            if: {
              $eq: [{ $type: `$${param}` }, 'date'],
            },
            then: {
              $dateToString: {
                format: MONGO_DATETIME_MASK,
                date: `$${param}`,
                timezone: isTzDatabaseFormat
                  ? rawQuery.__tz
                  : moment().utcOffset(_.defaultTo(+rawQuery.__tz, +utcOffsetInMinutes)).format('Z'),
              },
            },
            else: `$${param}`,
          },
        },
      },
    });
  });
  const numberAddFields = {};
  addFieldProps.forEach((param) => {
    if (modelPropsTypes[param] === SCHEMA_FIELD_NUMBER) {
      numberAddFields[param] = {
        $substr: [`$${param}`, 0, -1],
      };
    }
  });
  if (!_.isEmpty(numberAddFields)) {
    pipelines.push({
      $addFields: numberAddFields,
    });
  }
  const aditionalParams = _.keys(_.pick(rawQuery, extraQueryParams));
  const nonStringParamsQuery = transformSearchTerms(rawQuery, initialQueryNonStringParams.concat(aditionalParams), modelPropsTypes, true);

  Object.keys(nonStringParamsQuery).forEach((key) => {
    if (_.get(rawQuery, key)) {
      _.unset(rawQuery, key);
    }
  });
  let additionalParamsQuery;

  if (!_.isEmpty(rawQuery)) {
    additionalParamsQuery = transformSearchTerms(rawQuery, aditionalParams, modelPropsTypes, false);
  }
  const afterTransformationsQuery = _.extend({}, nonStringParamsQuery, additionalParamsQuery);

  if (!_.isEmpty(afterTransformationsQuery)) {
    pipelines.push({ $match: afterTransformationsQuery });
  }
  if (!sorted && filters.sort) {
    filters.sort = _.isEmpty(filters.sort) ? { createdAt: -1 } : filters.sort;
    pipelines.push({ $sort: filters.sort });
  }
  const paginationQuery = buildPaginationQuery(filters);

  if (!_.isNil(projectPipeline)) {
    pipelines.push(projectPipeline);
  }
  if (!_.isEmpty(replaceRootPipeline)) {
    pipelines.push(replaceRootPipeline);
  }
  if (!_.isEmpty(postProcessPipeline)) {
    pipelines.push(postProcessPipeline);
  }
  if (filters.page) {
    pipelines.push({ $skip: paginationQuery.skip ?? 0 });
  }
  if (filters.limit) {
    pipelines.push({ $limit: paginationQuery.limit ?? 10 });
  }

  const aggregateOptions = { allowDiskUse: true };
  const aggregateStrategy = getAggregateStrategy(model);
  const cursorObj = aggregateStrategy(pipelines).option(aggregateOptions).collation(collation);
  return useStream ? streamQueryDecorator(cursorObj) : cursorObj;
};

/**
 * @param {*} model
 * @param {*} filters
 * @param {*} extraPipelines
 * @param {*} extraQueryParams
 * @param {*} utcOffsetInMinutes
 * @param {*} schemaDef
 */
const exportFactory = (model, filters, extraPipelines, extraQueryParams = [], utcOffsetInMinutes = '0', beforeMatchPipeline = [], shouldProcessNestedProps = false) => searchFactory({
  model,
  filters: _.omit(filters, ['page', 'limit']),
  extraPipelines,
  extraQueryParams,
  utcOffsetInMinutes,
  beforeMatchPipeline,
  useStream: true,
  shouldProcessNestedProps,
}).map(transformExportData);

module.exports = {
  getProperLimit,
  searchFactory,
  countFactory,
  exportFactory,
  buildFilterQueryObj,
  buildPaginationQuery,
};
