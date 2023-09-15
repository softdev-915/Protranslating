const mongoose = require('mongoose');
const Promise = require('bluebird');
const _ = require('lodash');
const { flatten } = require('flat');
const isRegExpSafe = require('safe-regex');
const { Transform } = require('stream');
const csvWriter = require('csv-write-stream');
const { pipeWithErrors } = require('../stream');
const { validObjectId } = require('../schema');
const { transformExportData } = require('../csvExporter/csv-exporter-helper');

const ID_KEY = '_id';
const csvStream = function (csvColumns) {
  const stream = new Transform({ objectMode: true });

  stream.readable = true;
  stream.writable = true;
  stream._transform = function (object, encoding, cb) {
    const csvObject = {};

    csvColumns.forEach((col) => {
      if (object) {
        // Nested prop like (documents.name)
        if (col.prop.match(/\./)) {
          // Check if some of the nested props is an array
          const allProps = col.prop.split('.');

          Object.keys(allProps).forEach((propIndex) => {
            const propContent = _.get(object, col.prop, '');

            if (Array.isArray(propContent)) {
              propContent.forEach((o) => {
                const matchingProp = allProps.find((p) => Object.keys(o).includes(p));

                csvObject[col.name] = propContent.map((p) => _.get(p, matchingProp)).join(', ');
              });
            } else if (_.isObject(propContent)) {
              csvObject[col.name] = _.get(propContent, allProps[propIndex], '');
            } else {
              csvObject[col.name] = propContent;
            }
          });
        } else {
          csvObject[col.name] = object[col.prop];
        }
      }
    });
    cb(null, transformExportData(csvObject));
  };

  stream._final = function () {
    this.push(null);
  };
  return stream;
};

const utfBOM = function () {
  const stream = new Transform({ objectMode: true });

  stream.readable = true;
  stream.writable = true;
  let firstEmmited = false;

  stream._transform = function (chunk, encoding, cb) {
    if (!firstEmmited) {
      firstEmmited = true;
      cb(null, `\ufeff${chunk}`);
    } else {
      cb(null, chunk);
    }
  };

  stream._final = function () {
    this.push(null);
  };
  // UTF-8 BOM as first character
  return stream;
};

class QueryMapper {
  constructor(queryWhitelist = []) {
    this._queryWhitelist = queryWhitelist;
  }

  toTargetPropField(name) {
    const whitelist = this._queryWhitelist.find((q) => q.queryProp === name);

    if (whitelist) {
      return whitelist.targetProp;
    }
    return null;
  }

  toAggregationField(name) {
    const whitelist = this._queryWhitelist.find((q) => q.targetProp === name);

    if (whitelist) {
      return whitelist.queryProp;
    }
    return null;
  }
}

const _streamQueryDecorator = (queryObj) => queryObj.cursor({ batchSize: 10 });
const DEFAULT_INITIAL_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MONGO_EXCLUDED_PROPS = ['_v', '__v'];
const MONGO_DATETIME_MASK = '%m-%d-%Y %H:%M';
const MAX_NAME_CHARS = 4;
const _aggregationFieldName = (path, propName) => {
  if (path.instance === 'String' || path.instance === 'Date' || path.instance === 'Number') {
    return propName;
  }
  return `${propName}Text`;
};

const setQueryWhiteList = (path, extracted, propName) => {
  let lmsOptions = _.get(path, 'options');
  const ovewrittenPropName = _.get(lmsOptions, '__lms.pathOverwrite', propName);

  extracted.modelPropsTypes[ovewrittenPropName] = path.instance;
  if (path.instance === 'Array') {
    lmsOptions = _.get(path, 'options.type[0]');
  }
  const gridSearchable = _.get(lmsOptions, '__lms.gridSearchable');
  const properQueryParam = _aggregationFieldName(path, ovewrittenPropName);

  if (path.instance === 'String') {
    // TODO: check enum special case
    extracted.modelStringProps.push(ovewrittenPropName);
  } else {
    extracted.modelNonStringProps.push(ovewrittenPropName);
  }
  if (gridSearchable) {
    if (gridSearchable === true) {
      extracted.queryWhitelist.push({
        queryProp: properQueryParam,
        targetProp: ovewrittenPropName,
      });
    } else {
      extracted.queryWhitelist.push(gridSearchable);
    }
  }
  return extracted;
};

const _transformSearchTerms = (filtersQuery, queryMapper) => {
  const filterKeys = Object.keys(filtersQuery);

  if (filterKeys.length > 0) {
    filterKeys.forEach((key) => {
      // ObjectID filtering
      if (validObjectId(filtersQuery[key])) {
        const id = filtersQuery[key];

        filtersQuery[key] = new mongoose.Types.ObjectId(id);
      } else {
        const searchTerm = filtersQuery[key].replace(' ', '.*');
        const reg = `.*${searchTerm}.*`;

        if (isRegExpSafe(reg)) {
          // TODO: add log in case of invalid
          const aggregationField = queryMapper.toAggregationField(key);

          filtersQuery[aggregationField] = new RegExp(reg, 'i');
          if (key !== aggregationField) {
            delete filtersQuery[key];
          }
        }
        // else ignoring dangerous regular expression
      }
    });
  }
  return filtersQuery;
};

const setCsvColumns = (path, extracted, propName) => {
  const lmsOptions = _.get(path, 'options');
  let ovewrittenPropName = _.get(lmsOptions, '__lms.pathOverwrite', propName);

  ovewrittenPropName = _.get(lmsOptions, '__lms.csvProp', ovewrittenPropName);
  let csvColName = _.get(path, 'options.__lms.csvHeader');

  if (path.instance === 'Array') {
    csvColName = _.get(path, 'options.__lms.csvHeader');
    if (_.isEmpty(csvColName)) {
      csvColName = _.get(path, 'options.type[0].__lms.csvHeader');
    }
  }
  if (csvColName) {
    extracted.csvColumns.push({ name: csvColName, prop: ovewrittenPropName });
  }
  return extracted;
};

const _extractPath = (schema, parent) => {
  let extracted = {
    modelPropsTypes: {},
    modelStringProps: [],
    modelNonStringProps: [],
    queryWhitelist: [],
    csvColumns: [],
  };

  schema.eachPath((name, path) => {
    if (MONGO_EXCLUDED_PROPS.indexOf(name) === -1) {
      const propName = parent ? `${parent}.${name}` : name;

      if (path.schema && (path.instance === 'Array' || path.instance === 'Embedded')) {
        const newlyExtracted = _extractPath(path.schema, propName);

        extracted.modelStringProps = extracted.modelStringProps.concat(newlyExtracted.modelStringProps);
        extracted.modelNonStringProps = extracted.modelNonStringProps.concat(newlyExtracted.modelNonStringProps);
        extracted.queryWhitelist = extracted.queryWhitelist.concat(newlyExtracted.queryWhitelist);
        extracted.csvColumns = extracted.csvColumns.concat(newlyExtracted.csvColumns);
        Object.assign(propName);
      } else if (path.schema === undefined && path.instance === 'Array') {
        // In case of array field of ObjectID's)
        extracted = setQueryWhiteList(path, extracted, propName);
        extracted = setCsvColumns(path, extracted, propName);
      } else if (path.instance !== 'Array') {
        extracted = setQueryWhiteList(path, extracted, propName);
        extracted = setCsvColumns(path, extracted, propName);
      }
    }
  });
  return extracted;
};

const _filterPropTypes = (modelPropsTypes, nestedPropTranslation) => {
  const filtered = {};

  Object.keys(modelPropsTypes).forEach((p) => {
    const isNestedProperty = p.indexOf('.') !== -1;

    if (!isNestedProperty || nestedPropTranslation[p] !== undefined) {
      filtered[p] = modelPropsTypes[p];
    }
  });
  return filtered;
};

const _filterProps = (propArr, nestedPropTranslation) => {
  const nestedPropsArr = Object.keys(nestedPropTranslation);
  return propArr.filter((p) => {
    const isNestedProperty = p.indexOf('.') !== -1;
    return !isNestedProperty || nestedPropsArr.indexOf(p) !== -1;
  });
};

const _extractAndFilterPath = (schema, nestedPropTranslation = {}) => {
  const extracted = _extractPath(schema);
  const modelPropsTypes = _filterPropTypes(extracted.modelPropsTypes, nestedPropTranslation);
  const modelStringProps = _filterProps(extracted.modelStringProps, nestedPropTranslation);
  const modelNonStringProps = _filterProps(extracted.modelNonStringProps, nestedPropTranslation);
  const queryMapper = new QueryMapper(extracted.queryWhitelist);
  const { csvColumns } = extracted;
  return {
    modelPropsTypes,
    modelStringProps,
    modelNonStringProps,
    queryMapper,
    csvColumns,
  };
};

const _parseFilterQueryObj = (filters) => {
  // Parse the filter if empty object nothing to do
  let filtersQuery = {};

  try {
    if (typeof filters === 'string') {
      filtersQuery = JSON.parse(filters);
    } else if (_.isObject(filters)) {
      filtersQuery = filters;
    }
  } catch (e) {
    // TODO: Add logger here
    filtersQuery = {};
  }
  return filtersQuery;
};

const _buildFilterQueryObj = (filters, queryMapper) => {
  const filtersQuery = _parseFilterQueryObj(filters);

  Object.keys(filtersQuery).forEach((key) => {
    if (key !== '__tz') {
      const aggregationField = queryMapper.toTargetPropField(key);

      // There is no aggregation field for _id so we need to skip iteration
      if (validObjectId(filtersQuery[key]) && key === ID_KEY) {
        return;
      }
      if (!aggregationField) {
        delete filtersQuery[key];
      } else if (aggregationField !== key) {
        filtersQuery[aggregationField] = filtersQuery[key];
        delete filtersQuery[key];
      }
    }
  });
  return filtersQuery;
};

const _buildSearchQuery = (filters) => {
  let searchTerm = filters.q;
  const matchLiteralPhrase = filters.q.match('"');
  const isOneWord = !filters.q.match(' ');

  if (isOneWord && !matchLiteralPhrase) {
    searchTerm = `"${searchTerm}"`;
  }
  if (matchLiteralPhrase) {
    searchTerm = searchTerm.replace(/"/g, '"');
  }
  delete filters.q;
  filters.$text = {
    $search: searchTerm,
    $caseSensitive: false,
  };
  return filters;
};

const _extractQuery = (filters) => {
  const keysToExclude = ['q', 'sort', 'page', 'limit', 'filter'];

  if (filters) {
    if (filters.q) {
      filters = _buildSearchQuery(filters);
    }
    keysToExclude.forEach((k) => {
      delete filters[k];
    });
    return filters;
  }
  return {};
};

const _buildSortQuery = (filters) => {
  if (typeof filters.sort === 'string') {
    const descendingSort = filters.sort.match('-');
    const sortMode = descendingSort ? -1 : 1;
    const sortProperty = descendingSort ? filters.sort.slice(1) : filters.sort;

    filters.sort = { [sortProperty]: sortMode };
  }
  return filters;
};

const properAggregationFilename = (pipelineOptions, collectionName) => {
  const filters = _parseFilterQueryObj(_.get(pipelineOptions, 'filters.filter'));
  let filename = collectionName;

  Object.keys(filters).filter((f) => f !== '__tz').forEach((key) => {
    filename += `_${key.slice(0, MAX_NAME_CHARS)}-${filters[key].slice(0, MAX_NAME_CHARS)}`;
  });
  return filename;
};

const _buildPaginationQuery = (filters) => {
  // note 0 will cast as false
  if (filters.page && filters.limit) {
    if (isNaN(filters.page) || isNaN(filters.limit)) {
      filters.page = DEFAULT_INITIAL_PAGE;
      filters.limit = DEFAULT_PAGE_SIZE;
    }
    // assuming filters.page is > 0
    filters.skip = (filters.page * filters.limit) - filters.limit;
  }
  return filters;
};
const _mongoParamRenameStrategy = (param) => ({ inField: `$${param}`, outField: param });
const _mongooseParamRenameStrategy = (param, transformations) => {
  const isNestedProperty = param.indexOf('.') !== -1;
  return isNestedProperty ? transformations[param] : { inField: `$${param}`, outField: param };
};

const getAggregateStrategy = (model) => {
  if (_.isFunction(model.aggregateWithDeleted)) {
    return model.aggregateWithDeleted.bind(model);
  }
  return model.aggregate.bind(model);
};

const _mongoAggregationStrategy = (model) => (pipelines, stream) => {
  const aggregateStrategy = getAggregateStrategy(model);

  if (stream) {
    return _streamQueryDecorator(aggregateStrategy(pipelines, { allowDiskUse: true }));
  }
  // native
  return aggregateStrategy(pipelines, { allowDiskUse: true });
};

const _mongooseAggregationStrategy = (model) => (pipelines, stream) => {
  const aggregateStrategy = getAggregateStrategy(model);

  if (stream) {
    // stream query
    return _streamQueryDecorator(aggregateStrategy(pipelines).allowDiskUse(true));
  }
  // mongoose
  return aggregateStrategy(pipelines).allowDiskUse(true);
};

const _mongoSchemaScanStrategy = (schemaDef) => {
  const flatSchema = flatten(schemaDef);
  const schemaKeys = _.keys(flatSchema);
  const modelStringProps = [];
  const modelNonStringProps = [];
  const modelPropsTypes = {};
  const nestedModelPropsTypes = {};

  schemaKeys.forEach((name) => {
    if (MONGO_EXCLUDED_PROPS.indexOf(name) === -1) {
      modelPropsTypes[name] = flatSchema[name];
      if (flatSchema[name] === 'String') {
        modelStringProps.push(name);
      } else {
        modelNonStringProps.push(name);
      }
    }
  });
  return {
    modelStringProps,
    modelNonStringProps,
    modelPropsTypes,
    nestedModelPropsTypes,
  };
};

const _mongooseSchemaScanStrategy = (model) => (transformations) => {
  const extracted = _extractAndFilterPath(model.schema, transformations);
  const { modelStringProps } = extracted;
  const { modelNonStringProps } = extracted;
  const { modelPropsTypes } = extracted;
  const { queryMapper } = extracted;
  const { csvColumns } = extracted;
  const nestedModelPropsTypes = {};

  if (transformations) {
    Object.keys(model).forEach((key) => {
      const { outField } = model[key];

      nestedModelPropsTypes[outField] = modelPropsTypes[key];
    });
  }
  return {
    csvColumns,
    modelStringProps,
    modelNonStringProps,
    modelPropsTypes,
    nestedModelPropsTypes,
    queryMapper,
  };
};

class AggregationBuilder {
  constructor(strategies) {
    this.collectionName = strategies.collectionName;
    this._aggregationStrategy = strategies.aggregationStrategy;
    this._extractPropertiesStrategy = strategies.extractPropertiesStrategy;
    this._paramRenameStrategy = strategies.paramRenameStrategy;
    this._countStrategy = strategies.countStrategy;
  }

  buildPipelines(pipelineOptions) {
    const filters = _.get(pipelineOptions, 'filters', {});
    const extraPipelines = _.get(pipelineOptions, 'extraPipelines', []);
    const extraQueryParams = _.get(pipelineOptions, 'extraQueryParams', []);
    const transformations = _.get(pipelineOptions, 'transformations', {});
    const utcOffsetInMinutes = _.get(pipelineOptions, 'utcOffsetInMinutes', '0');
    const sortIfAvailable = _.get(pipelineOptions, 'sortIfAvailable', true);
    const shouldPaginate = _.get(pipelineOptions, 'shouldPaginate', true);
    const {
      modelPropsTypes,
      modelStringProps,
      modelNonStringProps,
      nestedModelPropsTypes,
      queryMapper,
    } = this._extractPropertiesStrategy();
    const filtersClone = _.cloneDeep(filters);
    const apiQuery = _extractQuery(filtersClone);
    const rawQuery = _buildFilterQueryObj(filters.filter, queryMapper);
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
    const initialParams = _.pick(rawQuery, initialQueryStringParams);
    const initialQuery = _transformSearchTerms(initialParams, queryMapper);

    // if (!_.isEmpty({ 'a': 1 })) = {};
    // In case of empty object we should get them anyways
    pipelines.push({ $match: { ...initialQuery, ...apiQuery } });
    // TODO: add forced part of the query like LSPID and another messed up parameters
    let sorted = false;
    let filtersSort = null;

    if (sortIfAvailable) {
      // Sort configuration
      filtersSort = _buildSortQuery(filters);
      // Sort after the first match
      // if it is on the doc fields sort here
      //  otherwise sort after transformation
      let sortUnique = '';

      if (filters.sort) {
        sortUnique = Object.keys(filtersSort.sort)[0] || '';
      }

      if (sortUnique !== '' && typeof modelPropsTypes[sortUnique] !== 'undefined') {
        pipelines.push({ $sort: filtersSort.sort });
        sorted = true;
      }
    }

    // Execute extra pipelines sent as additional parameter
    if (extraPipelines && _.isArray(extraPipelines) && extraPipelines.length > 0) {
      pipelines = pipelines.concat(extraPipelines);
    }

    // Apply Transformations to non string params
    // Use $addFields to override parameters
    const addFieldsPipes = [{ $addFields: {} }];

    // This attributes potencially needs transformations
    modelNonStringProps.forEach((param) => {
      const properParam = this._paramRenameStrategy(param, transformations);

      switch (modelPropsTypes[param]) {
        case 'Date': {
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
        case 'Boolean': {
          let textOutName = properParam.outField;

          if (properParam.inField === `$${properParam.outField}`) {
            // inField === outField equals no transformations
            textOutName = `${properParam.outField}Text`;
          }
          addFieldsPipes[0].$addFields[textOutName] = {
            $switch: {
              branches: [
                { case: { $eq: [properParam.inField, true] }, then: 'true' },
                { case: { $eq: [properParam.inField, false] }, then: 'false' },
              ],
              default: 'false',
            },
          };
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
    const afterTransformationsQuery = _transformSearchTerms(_.pick(rawQuery, initialQueryNonStringParams.concat(aditionalParams)), queryMapper);

    // Prevent pushing and aditional {} match
    if (_.keys(afterTransformationsQuery).length > 0) {
      pipelines.push({ $match: afterTransformationsQuery });
    }

    // Extra Sort on "new" computed/transformed properties
    // Extra Sort Again
    if (!sorted && filters.sort && filtersSort) {
      pipelines.push({ $sort: filtersSort.sort });
    }
    if (shouldPaginate) {
      const paginationQuery = _buildPaginationQuery(filters);

      if (filters.page) {
        pipelines.push({ $skip: paginationQuery.skip });
      }
      // TODO: if there's pagination there's limit join this two together and change page for skip
      if (filters.limit) {
        pipelines.push({ $limit: paginationQuery.limit });
      }
    }
    return pipelines;
  }

  _csvPreprocesing() {
    const { csvColumns } = this._extractPropertiesStrategy();
    return csvStream(csvColumns);
  }

  /**
   * Returns the object count of the aggregation
   * @param {Object} options the aggregation options.
   * @param {Object} options.filters filters to apply to the aggretation.
   * @param {Array} options.extraPipelines array of pipelines to add to the transformation.
   * @param {Array} options.extraQueryParams whitelisted query options.
   * @param {String} options.utcOffsetInMinutes the timezone offset in minutes (default is 0).
   * @param {Object} options.transformations the transformations to apply to properties.
   * @returns {Promise} that resolves to a number.
   */
  count(pipelineOptions) {
    const properPipelineOptions = {
      ...pipelineOptions,
      sortIfAvailable: false,
      shouldPaginate: false,
    };
    return new Promise((resolve, reject) => {
      const stream = this.stream(properPipelineOptions);
      let count = 0;
      let resolved = false;

      stream.on('data', () => {
        count++;
      });
      stream.on('close', () => {
        if (!resolved) {
          resolved = true;
          resolve(count);
        }
      });
      stream.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });
    });
  }

  /**
   * Returns the aggregation results as stream
   * @param {Object}  options the aggregation options.
   * @param {Object}  options.filters filters to apply to the aggretation.
   * @param {Array}   options.extraPipelines array of pipelines to add to the transformation.
   * @param {Array}   options.extraQueryParams whitelisted query options.
   * @param {String}  options.utcOffsetInMinutes the timezone offset in minutes (default is 0).
   * @param {Object}  options.transformations the transformations to apply to properties.
   * @param {Boolean} options.shouldPaginate whether the aggregation should
   * paginate results (default true).
   * @returns {Stream} that streams the aggregation result.
   */
  stream(pipelineOptions) {
    const pipelines = this.buildPipelines(pipelineOptions);
    return this._aggregationStrategy(pipelines, true);
  }

  /**
   * Returns the aggregation results
   * @param {Object}  options the aggregation options.
   * @param {Object}  options.filters filters to apply to the aggretation.
   * @param {Array}   options.extraPipelines array of pipelines to add to the transformation.
   * @param {Array}   options.extraQueryParams whitelisted query options.
   * @param {String}  options.utcOffsetInMinutes the timezone offset in minutes (default is 0).
   * @param {Object}  options.transformations the transformations to apply to properties.
   * @param {Boolean} options.shouldPaginate whether the aggregation should
   * paginate results (default true).
   * @returns {Promise} that resolves to the aggregation results.
   */
  exec(pipelineOptions) {
    const pipelines = this.buildPipelines(pipelineOptions);
    return this._aggregationStrategy(pipelines, false);
  }

  /**
   * Returns the object count of the aggregation
   * @param {Object}  options the aggregation options.
   * @param {Object}  options.filters filters to apply to the aggretation.
   * @param {Array}   options.extraPipelines array of pipelines to add to the transformation.
   * @param {Array}   options.extraQueryParams whitelisted query options.
   * @param {String}  options.utcOffsetInMinutes the timezone offset in minutes (default is 0).
   * @param {Object}  options.transformations the transformations to apply to properties.
   * @param {Boolean} options.shouldPaginate whether the aggregation should
   * paginate results (default true).
   * @returns {Stream} the aggregation result in csv format.
   */
  csvStream(pipelineOptions) {
    const aggregationStream = this.stream(pipelineOptions);
    const csvPreprocessingStream = this._csvPreprocesing();
    const csvWriterStream = csvWriter();
    const utf8BOMStream = utfBOM();

    pipeWithErrors(aggregationStream, csvPreprocessingStream);
    pipeWithErrors(csvPreprocessingStream, csvWriterStream);
    pipeWithErrors(csvWriterStream, utf8BOMStream);
    const fileName = properAggregationFilename(pipelineOptions, this.collectionName);

    utf8BOMStream.__filename = fileName;
    return utf8BOMStream;
  }
}

const mongooseAggregation = (model) => {
  const aggregationBuilder = new AggregationBuilder({
    collectionName: model.collection.collectionName,
    aggregationStrategy: _mongooseAggregationStrategy(model),
    extractPropertiesStrategy: _mongooseSchemaScanStrategy(model),
    paramRenameStrategy: _mongooseParamRenameStrategy,
  });
  return aggregationBuilder;
};

const mongoAggregation = (model) => {
  const aggregationBuilder = new AggregationBuilder({
    // FIXME a collection name should be provided
    collectionName: null,
    aggregationStrategy: _mongoAggregationStrategy(model),
    extractPropertiesStrategy: _mongoSchemaScanStrategy,
    paramRenameStrategy: _mongoParamRenameStrategy,
  });
  return aggregationBuilder;
};

module.exports = {
  mongooseAggregation,
  mongoAggregation,
  csvStream,
  utfBOM,
  properAggregationFilename,
};
