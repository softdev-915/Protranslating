// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { buildPaginationQuery } = require('../../../utils/pagination');
const { startsWithSafeRegexp } = require('../../../utils/regexp');

const { RestError } = apiResponse;

class FooterTemplateAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (_.get(filters, '_id', '')) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  async getById(id) {
    const footerTemplate = await this.schema.FooterTemplate.findOneWithDeleted({
      _id: new mongoose.Types.ObjectId(id), lspId: this.lspId,
    });
    if (_.isEmpty(footerTemplate)) {
      throw new RestError(404, { message: 'Footer template is not found' });
    }
    return footerTemplate;
  }

  async nameList(params) {
    const query = { lspId: this.lspId };
    const { paginationParams } = params;
    if (_.isString(paginationParams.filter)) {
      const filters = paginationParams.filter;
      if (filters.name) {
        _.assign(query, { name: startsWithSafeRegexp(filters.name) });
      }
    }
    const { limit, skip } = buildPaginationQuery(paginationParams);
    const footerTemplates = await this.schema.FooterTemplate.findWithDeleted(query)
      .select(params.select)
      .limit(limit)
      .skip(skip)
      .sort({ name: 1 })
      .lean();
    return { list: footerTemplates, total: footerTemplates.length };
  }

  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the footer template list`);
    let list = [];
    const query = this._getQueryFilters(filters);
    try {
      list = await this.schema.FooterTemplate.gridAggregation().exec({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing footer template aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list,
      total: list.length,
    };
  }

  async create(footerTemplate) {
    const defFooterTemplate = {
      name: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const newFooterTemplate = new this.schema.FooterTemplate(defFooterTemplate);
    newFooterTemplate.safeAssign(footerTemplate);
    const footerTemplateCreated = await this._save(newFooterTemplate);
    return footerTemplateCreated;
  }

  async edit(footerTemplate) {
    const footerTemplateInDb = await this.schema.FooterTemplate.findOneWithDeleted({
      _id: new mongoose.Types.ObjectId(footerTemplate._id),
      lspId: this.lspId,
    });

    if (!footerTemplateInDb) {
      throw new RestError(404, { message: 'Footer template does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'footerTemplate',
    });
    await concurrencyReadDateChecker.failIfOldEntity(footerTemplateInDb);
    footerTemplateInDb.safeAssign(footerTemplate);
    const footerTemplateUpdated = await this._save(footerTemplateInDb);
    return footerTemplateUpdated;
  }

  async _save(footerTemplate) {
    try {
      await footerTemplate.save();
      return footerTemplate;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the footer template: ${footerTemplate.name} due to err: duplicated key`);
        throw new RestError(409, { message: `Footer template ${footerTemplate.name} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the footer template: ${footerTemplate.name} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = FooterTemplateAPI;
