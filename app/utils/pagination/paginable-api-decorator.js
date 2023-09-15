const requestUtils = require('../request');
const _ = require('lodash');

class PaginableAPIDecorator {
  /**
   * @param {Object} api Api to wrap
   * @param {Object} req Http Request
   * @param {Object} options
   * @param {String} options.listMethod Optional method name Default 'list'
   * @param {Function} options.queryTranslator A function that translates a query
   */
  constructor(api, req, options) {
    this.api = api;
    this.req = req;
    this.listMethod = _.get(options, 'listMethod', 'list');
    this.queryTranslator = _.get(options, 'queryTranslator');
  }
  getPaginationParams() {
    let readFromKey = 'query';
    if (this.req.query && this.req.query.params && Object.keys(this.req.query.params).length) {
      readFromKey = 'query.params';
    }
    const paginationParams = requestUtils.extractPaginationParams(this.req, readFromKey);
    return paginationParams;
  }

  /** Used by classes that don't extend from SchemaAwareApi (right now AuditApi)
   * @param {Object} user making the request
   * @param {Object} filters query filters sent from the client
   */
  noSchemaList(user, filters) {
    const params = this._buildListQueryParams(filters);
    return this.api[this.listMethod].call(this.api, user, params);
  }

  list(filters, res, req) {
    const params = this._buildListQueryParams(filters);
    if (!_.isNil(req)) {
      params.locale = requestUtils.extractLocale(req);
    }
    return this.api[this.listMethod].call(this.api, params, res);
  }

  _buildListQueryParams(filters) {
    const paginationParams = Object.assign(
      {}, this.getPaginationParams(), _.get(filters, 'paginationParams', {}),
    );
    let params = Object.assign({}, filters, { paginationParams });
    if (this.queryTranslator) {
      params = this.queryTranslator(params);
    }
    return params;
  }
}

module.exports = PaginableAPIDecorator;
