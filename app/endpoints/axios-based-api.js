const _ = require('lodash');
const axios = require('axios');
const { RestError } = require('../components/api-response');
const SchemaAwareApi = require('./schema-aware-api');

class AxiosBasedApi extends SchemaAwareApi {
  constructor(logger, options = {}) {
    super(logger, options);
    if (_.isNil(options.baseUrl)) {
      throw new Error('Base URL is required');
    }
    this.baseUrl = options.baseUrl;
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: _.pickBy(options.headers, _.identity),
    });
  }

  get(endpoint, options) {
    return this.axiosInstance.get(endpoint, options).catch(this._handleError.bind(this));
  }

  post(endpoint, body, options) {
    return this.axiosInstance.post(endpoint, body, options).catch(this._handleError.bind(this));
  }

  put(endpoint, body, options) {
    return this.axiosInstance.put(endpoint, body, options).catch(this._handleError.bind(this));
  }

  delete(endpoint, body) {
    const options = {};
    if (!_.isNil(body)) {
      options.data = body;
    }
    return this.axiosInstance.delete(endpoint, options).catch(this._handleError.bind(this));
  }

  _handleError(e) {
    const { path = '', method = '' } = e.request;
    this.logger.error(`Failed ${method} request to ${this.baseUrl}${path} with the message: ${e.message}`);
    throw new RestError(_.get(e, 'response.status', 500), {
      message: _.get(e, 'response.data.message', e.message),
      data: _.get(e, 'response.data'),
    });
  }
}

module.exports = AxiosBasedApi;
