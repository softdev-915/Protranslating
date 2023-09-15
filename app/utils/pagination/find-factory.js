// DISCLAIMER:
// BACK OFF!!!
// This is professional code ment for professional developers.
// If you are thinking on editing ANYTHING in this file,
// you are probably wrong.
const _ = require('lodash');
const Promise = require('bluebird');

/**
 * @typedef ModelPropType
 * @type {object}
 * @property {boolean} isArray indicates if the prop is an array.
 * @property {object} modelType the model type.
 * @property {boolean} isRef whether this type is a ref type.
 * @property {string} [ref] the model's name referenced. Only present if isRef is true.
 *
 * @typedef PathAnalysis
 * @type {object}
 * @property {array} analizedPath an array representing the full path analysis.
 * @property {object} [reference] the reference for this path if any.
 *
 * @typedef ExtraQueryProps
 * @type {object}
 * @property {string} model the model name.
 * @property {object} query the query to make over the given model.
 * @property {string} queryPath the query path to add the _ids found to the final query.
 */

/**
 * @param {object} modelProp the mongoose model property
 * @returns {ModelPropType} the ModelPropType
 */
const getModelPropType = (modelProp) => {
  const modelPropType = {};
  modelPropType.isArray = modelProp.$isMongooseArray || false;
  if (modelPropType.isArray) {
    // does not support matrixes (arrays of arrays).
    return modelPropType;
  }
  modelPropType.modelType = _.get(modelProp, 'type', modelProp);
  const ref = _.get(modelProp, 'options.ref');
  modelPropType.isRef = !_.isNil(ref);
  if (modelPropType.isRef) {
    modelPropType.ref = ref;
  }
  return modelPropType;
};

const getModelPaths = (schema, modelName) => {
  const model = _.get(schema, modelName);
  if (_.isNil(model)) {
    throw new Error(`model "${modelName}" does not exist in schema`);
  }
  return model.schema.paths;
};

/**
 * @class PathAnalyzerStateMachine
 * PathAnalyzerStateMachine will statefully analyze a
 * series of given paths through the feed method.
 * Once all paths are fed, analyzeAndReset will return an array
 * of analyzed paths.
 */
class PathAnalyzerStateMachine {
  constructor(schema, model) {
    this._schema = schema;
    this._originalModel = model;
    this._init();
  }

  /**
   * adds a path to the analyzer
   * @param {string} path analyze the path contextually.
   */
  feed(path) {
    this._addPath(path);
    if (this._isValidPath(path)) {
      // om nom nom nom nom
      this._feed(path);
    } else {
      // Dude the path must be a string and exist
      throw new Error(`the path "${path}" is invalid. Full path is "${this._accumulatedPath}"`);
    }
    this._firstPathFed = false;
  }

  analyzeAndReset() {
    const paths = this._analyzedPaths;
    this._init();
    return paths;
  }

  _init() {
    this._model = this._originalModel.schema.paths;
    this._afterRefPath = [];
    this._analyzedPaths = [];
    this._currentRef = null;
    this._root = null;
    this._accumulatedPath = null;
    this._firstPathFed = true;
    this._isArray = false;
  }

  _feed(path) {
    if (this._firstPathFed) {
      // if root is null and this is the first path , then extract the root from the model
      this._root = _.get(this._model, path);
    } else if (this._isArray) {
      this._root = _.get(this._root, path);
      this._isArray = false;
    }
    if (_.isNil(this._root)) {
      throw new Error(`the path "${this._accumulatedPath}" is invalid. The path that triggered the error is "${path}"`);
    }
    if (!_.isNil(this._currentRef)) {
      // if there is a current ref, then add the path to the prop property
      const prop = this._joinPath(_.get(this._currentRef, 'prop'), path);
      // I can do this because this._currentRef is an object, thus it is a memory reference.
      this._currentRef.prop = prop;
      this._currentRef.fullpath = this._accumulatedPath;
    }
    const modelPropType = getModelPropType(this._root);
    this._analyzedPaths.push({
      path: this._accumulatedPath,
      pathPart: path,
      modelPropType,
    });
    let newRoot = this._root;
    if (modelPropType.isRef) {
      // if model is a ref, switch to the referenced model
      this._model = getModelPaths(this._schema, modelPropType.ref);
      newRoot = this._model;
      modelPropType.fullpath = this._accumulatedPath;
      this._currentRef = modelPropType;
    } else if (modelPropType.isArray) {
      // if it is not a ref but it is an array, then access schema.path
      newRoot = _.get(this._root, 'schema.paths');
      this._isArray = true;
    } else if (!this._firstPathFed) {
      // if it is not a ref and not an array then this is the root element.
      if (_.get(this._root, 'instance') === 'Embedded') {
        newRoot = _.get(this._root, `schema.paths.${path}`);
      } else {
        newRoot = _.get(this._root, path);
      }
    }
    // check if the root is a mongoose schema instance. If it is, it will have the
    // "paths" property.
    // if (!_.isNil(_.get(newRoot, 'paths'))) {
    // we found a schema index, the root element should be the paths property
    // newRoot = newRoot.paths;
    // }
    // at this point _root can be null. As long as nobody feed another path.
    // If someone calls feed with _root null (and it is not the first call)
    // it will throw an error (see the first error thrown in the algorithm).
    this._root = newRoot;
  }

  _joinPath(suffix, path) {
    if (_.isNil(suffix) || suffix === '') {
      return path;
    }
    return `${suffix}.${path}`;
  }

  _addPath(path) {
    this._accumulatedPath = this._joinPath(this._accumulatedPath, path);
  }

  _isValidPath(path) {
    return typeof path === 'string' && path.indexOf('.') === -1;
  }
}

const EMPTY_SUBQUERY = new Error('A subquery returned an empty result');

class FindQuery {
  constructor(options) {
    this.schema = _.get(options, 'schema');
    this.model = _.get(options, 'model');
    if (typeof this.model === 'string') {
      // if string provided then transform model into the actual model.
      this.model = this.schema[this.model];
    }
    this.paths = _.get(options, 'paths');
    this.timezoneOffsetInMinutes = _.get(options, 'timezoneOffsetInMinutes', 0);
    this._hasPathReferences = null;
    this.nonReferencePaths = [];
    this.referencePaths = {};
    this.referenceQueryPaths = {};
    this._scanPathReferences();
  }

  static isEmptySubQueryError(error) {
    return error === EMPTY_SUBQUERY;
  }

  /**
   * Given a query, execute will return a cursor to
   * @param {object} query flattened query conditions
   * @param {string|object} [sort] a mongodb sort compliant paramenter
   * @param {number} [limit] the max amount of results desired.
   * If falsy then no limit will be imposed.
   * @param {ExtraQueryProps[]} [extraQueryParams] an array of extra query params.
   * @returns {array} the query execution result
   */
  async exec(query, sort, limit, extraQueryParams) {
    let queryCursorFactory;
    try {
      queryCursorFactory = await this._queryCursorFactory(query, extraQueryParams);
    } catch (e) {
      if (!FindQuery.isEmptySubQueryError(e)) {
        // unknown error, throw it up the stack.
        throw e;
      }
      // if a subquery returned an empty result we skip making
      // the actual query and return an empty array.
      return [];
    }
    let queryCursor = queryCursorFactory();
    queryCursor = this._postProcessQueryCursor(queryCursor, sort, limit);
    const result = await queryCursor.exec();
    return result;
  }

  _queryCursorFactory(query, extraQueryParams) {
    let referenceQueries = this._referenceQueries(query);
    if (extraQueryParams && extraQueryParams.length > 0) {
      referenceQueries = referenceQueries.concat(extraQueryParams);
    }
    // execute the reference queries to grab the _ids from the database
    // this would replace the $lookup
    return Promise.mapSeries(referenceQueries, async (referenceQuery) => {
      // TODO: check if withDeleted is necesary when sending a query parameter
      referenceQuery._ids = await this.schema[referenceQuery.model].find(referenceQuery.query).select('_id').lean();
      if (referenceQuery._ids.length === 0) {
        // if the query returns an empty array we throw an error
        // to stop processing. We know that the final query will
        // result on an empty array anyway
        throw EMPTY_SUBQUERY;
      }
      referenceQuery._ids = referenceQuery._ids.map(rq => rq._id);
    }, { concurrency: 3 }).then(() => {
      // make a shallow copy of the query.
      const smartQuery = Object.assign({}, query);
      referenceQueries.forEach((referenceQuery) => {
        // Now check this out
        // replace the original query for an $in query
        // with the ids of the previously executed query.
        // NICE!
        if (!_.isNil(referenceQuery.path)) {
          _.unset(smartQuery, referenceQuery.path);
        }
        const originalQueryProp = _.get(smartQuery, referenceQuery.queryPath);
        const newQueryProp = Object.assign({}, originalQueryProp, { $in: referenceQuery._ids });
        _.set(smartQuery, referenceQuery.queryPath, newQueryProp);
      });
      return () => this.model.find(smartQuery);
    });
  }

  _postProcessQueryCursor(queryCursor, sort, limit) {
    if (limit) {
      queryCursor = queryCursor.limit(limit);
    }
    if (sort) {
      queryCursor = queryCursor.sort(sort);
    }
    if (this.nonReferencePaths.length) {
      queryCursor = queryCursor.select(this.nonReferencePaths);
    }
    const populate = this._buildPopulate();
    if (populate.length > 0) {
      // TODO: check if the select in line 202 does not mess up with the populate selection.
      queryCursor = queryCursor.populate(populate);
    }
    return queryCursor;
  }

  _buildPopulate() {
    const pathReferencesKeys = Object.keys(this.referencePaths);
    if (pathReferencesKeys.length > 0) {
      return Object.keys(this.referencePaths).map((path) => {
        const reference = _.get(this.referencePaths, path);
        return {
          path,
          select: reference.props,
          // options: { withDeleted: true },
        };
      }).reduce((accumulator, current) => {
        const found = accumulator.find(a => a.path === current.path);
        if (!found) {
          return accumulator.concat([current]);
        }
        Object.assign(found.select, current.select);
        return accumulator;
      }, []);
    }
    return [];
  }

  _referenceQueries(query) {
    this._scanQueryReferences(query);
    return Object.keys(this.referenceQueryPaths).map((queryPath) => {
      const reference = this.referenceQueryPaths[queryPath];
      return {
        path: reference.fullPath,
        queryPath,
        model: reference.modelName,
        query: reference.query,
      };
    }).reduce((accumulator, current) => {
      const found = accumulator.find(a => a.path === current.path);
      if (!found) {
        return accumulator.concat([current]);
      }
      Object.assign(found.query, current.query);
      return accumulator;
    }, []);
  }

  /**
   * retrieves the dependency from the path
   * @param {string} path the path to analyze.
   * @returns {PathAnalysis} the path analysis.
   */
  _analyzePath(path) {
    const splittedPath = path.split('.');
    const pathStateMachine = new PathAnalyzerStateMachine(this.schema, this.model);
    splittedPath.forEach((pathPart) => {
      // feed every path to the state machine
      pathStateMachine.feed(pathPart);
    });
    return pathStateMachine.analyzeAndReset();
  }

  /**
   * _assertOnlyOneRefIfAny
   * @param {string} path
   * @returns {AnalyzedPath} the analyzed path plus the reference if any
   */
  _assertOnlyOneRefIfAny(path) {
    const analyzedPath = this._analyzePath(path);
    const lastElement = analyzedPath.length - 1;
    // if a ref is the last elements, we don't have to access the reference,
    // in such case only the Id is needed
    const refFilter = (ap, index) => ap.modelPropType.isRef && index !== lastElement;
    const references = analyzedPath.filter(refFilter);
    let reference = null;
    if (references.length > 1) {
      // accessing a reference inside a reference is not supported.
      // it would make the algorithm much harder, not many queries (if any)
      // needs this feature and probably would be a symptom of a bad design anyway.
      throw new Error(`path "${path}" is a contains a ref inside a ref. This is not supported`);
    } else if (references.length > 0) {
      reference = references[0];
    }
    return {
      analyzedPath,
      reference,
    };
  }

  _scanReferences(paths, referenceMap, onReference, onNonReferencePath) {
    if (!_.isNil(paths)) {
      // analyze the paths to determine the dependencies.
      paths.forEach((p) => {
        const { analyzedPath, reference } = this._assertOnlyOneRefIfAny(p);
        if (reference) {
          const updatedReference = onReference(referenceMap, reference, p);
          referenceMap[reference.path] = updatedReference;
        } else if (!_.isNil(onNonReferencePath)) {
          onNonReferencePath(p, analyzedPath);
        }
      });
    }
  }

  /**
   * _scanPathReferences builds a path reference map for the paths provided.
   * The path reference map is used to add the proper populate into the query.
   */
  _scanPathReferences() {
    this._scanReferences(this.paths, this.referencePaths, (referenceMap, reference) => {
      const originalReference = _.get(referenceMap, reference.path);
      const updatedReference = Object.assign({
        modelName: reference.modelPropType.ref, props: {},
      }, originalReference);
      updatedReference.props[reference.modelPropType.prop] = 1;
      return updatedReference;
    }, (p) => {
      // paths that does not contain any references are stored for selection
      this.nonReferencePaths.push(p);
    });
  }

  /**
   * _scanQueryReferences builds a query path reference map for the query provided.
   * The query path reference map is used to make the proper queries BEFORE the actual query.
   */
  _scanQueryReferences(query) {
    // override queryReferences to ensure that this object can be reused across different queries.
    this.referenceQueryPaths = {};
    if (!_.isNil(query)) {
      const queryKeys = Object.keys(query);
      this._scanReferences(queryKeys, this.referenceQueryPaths, (referenceMap, reference) => {
        const originalReference = _.get(referenceMap, reference.path);
        const updatedReference = Object.assign({
          modelName: reference.modelPropType.ref, query: {},
        }, originalReference);
        const originalQueryParam = _.get(query, reference.modelPropType.fullpath);
        updatedReference.query[reference.modelPropType.prop] = originalQueryParam;
        updatedReference.fullPath = reference.modelPropType.fullpath;
        return updatedReference;
      });
    }
  }
}

/**
 * FindFactory is able to search, filter (pick proper properties) and
 * populate (with filtering as well) entities in a generic way.
 * FindFactory DOES NOT use aggregations.
 * @constructor findFactory
 * @param {object} options the find factory initialize options.
 * @param {object} options.schema the schema object (mandatory).
 * @param {string|object} options.model the model to query (mandatory).
 * @param {array<string>} options.paths the properties path needed.
 * @param {number} [options.timezoneOffsetInMinutes] the UTC timezone offset in minutes.
 * @returns {function} a function that accepts the filter param
 */
const findFactory = function (options) {
  // I don't want to expose FindQuery and nobody should do so.
  // Notice that findFactory does not have state, that is intended.
  // findFactory SHOULD NEVER HAVE STATE.
  const findQuery = new FindQuery(options);
  return {
    exec: ({ query, sort, limit, extraQueryParams }) =>
      findQuery.exec(query, sort, limit, extraQueryParams),
    stream: ({ query, sort, limit, extraQueryParams }) =>
      findQuery.stream(query, sort, limit, extraQueryParams),
  };
};

module.exports = findFactory;
