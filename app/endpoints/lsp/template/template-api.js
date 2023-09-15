const mongoose = require('mongoose');
const _ = require('lodash');
const SchemaAwareAPI = require('../../schema-aware-api');
const { validObjectId } = require('../../../utils/schema');
const apiResponse = require('../../../components/api-response');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { sanitizeHTML } = require('../../../utils/security/html-sanitize');

const SANITIZE_OPTIONS = {
  allowedTags: ['style', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'span',
    'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'br', 'hr'],
  allowedAttributes: {
    table: ['style', 'class', 'id'],
    th: ['style', 'class', 'colspan', 'data-e2e-type'],
    thead: ['class'],
    td: ['style', 'class', 'colspan', 'data-e2e-type'],
    tr: ['class'],
    style: ['type'],
    hr: ['class'],
    img: ['src'],
    div: ['class', 'id', 'data-e2e-type', 'style'],
    li: ['class', 'data-e2e-type'],
    ul: ['class'],
    span: ['style', 'class'],
    p: ['style', 'class'],
    h1: ['style', 'class'],
    h2: ['style', 'class'],
    h3: ['style', 'class'],
    h4: ['style', 'class'],
    h5: ['style', 'class'],
    h6: ['style', 'class'],
    pre: ['style', 'class'],
    a: ['href', 'rel', 'target', 'class'],
  },
  transformTags: {
    a: (tagName, attribs) => {
      // add noopener noreferrer to anchors
      const newAttribs = { ...attribs, rel: 'noopener noreferrer' };
      return {
        tagName,
        attribs: newAttribs,
      };
    },
  },
};
const { RestError } = apiResponse;

class TemplateAPI extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
  }

  _getPipeline(filters) {
    let query = { lspId: this.lspId };
    const pipeline = [];

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    const extraQueryParams = ['inactiveText'];
    return {
      query,
      pipeline,
      extraQueryParams,
    };
  }

  /**
   * Returns the template's list
   * @param {Object} templateFilters to filter the templates returned.
   * @param {String} templateFilters.id the template's id to filter.
   */
  async export(filters) {
    let csvStream;
    const queryFilters = this._getPipeline(filters);

    try {
      csvStream = this.schema.Template.gridAggregation().csvStream({
        filters: queryFilters.query,
        extraPipelines: queryFilters.pipeline,
        utcOffsetInMinutes: filters.__tz,
        extraQueryParams: queryFilters.extraQueryParams,
        shouldPaginate: false,
      });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error transforming to csv. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      filename: `${csvStream.__filename}.csv`,
      fileReadStream: csvStream,
    };
  }

  /* Returns the quote template list
   * @param {Object} templateFilters to filter the list returned.
   * @param {String} templateFilters.id the template id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the quote template list`);
    let list = [];
    const queryFilters = this._getPipeline(filters);

    try {
      list = await this.schema.Template.gridAggregation().exec({
        filters: queryFilters.query,
        extraPipelines: queryFilters.pipeline,
        utcOffsetInMinutes: filters.__tz,
        extraQueryParams: queryFilters.extraQueryParams,
      });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error performing quote template aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list,
      total: list.length,
    };
  }

  async retrieveById(templateId) {
    if (!validObjectId(templateId)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const _id = new mongoose.Types.ObjectId(templateId);
    const template = await this.schema.Template.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!template) {
      throw new RestError(404, { message: `Template with _id ${templateId} was not found` });
    }
    return template;
  }

  async retrieveByTypes(templateTypesString) {
    const templateTypes = templateTypesString.split(',');
    const query = {
      type: { $in: templateTypes },
      lspId: this.lspId,
    };
    const projection = {
      type: 1, name: 1, customFields: 1, hiddenFields: 1, hideableFields: 1,
    };
    const templates = await this.schema.Template.find(query, projection);
    return templates;
  }

  async retrieveByName(name) {
    const query = {
      name,
      lspId: this.lspId,
    };
    const template = await this.schema.Template.findOne(query).lean();
    return template;
  }

  retrieveByNames(names) {
    const { lspId } = this;

    if (!Array.isArray(names)) {
      names = [names];
    }
    const query = { lspId, name: { $in: names } };
    return this.schema.Template.find(query, { type: 1, name: 1 });
  }

  async retrieveFooterByTemplateId(templateId) {
    const template = await this.retrieveById(templateId);
    const footerTemplateId = template.footerTemplate;
    if (_.isNil(footerTemplateId)) {
      return null;
    }
    return this._getFooterTemplate(footerTemplateId);
  }

  async retrieveFooterByTemplateName(name) {
    const template = await this.retrieveByName(name);
    const footerTemplateId = template.footerTemplate;
    if (_.isNil(footerTemplateId)) {
      return null;
    }
    return this._getFooterTemplate(footerTemplateId);
  }

  async create(template) {
    delete template._id;
    const defTemplate = {
      name: '',
      type: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const dbTemplate = new this.schema.Template(defTemplate);
    const templateCreated = await this._save(template, dbTemplate);
    return templateCreated;
  }

  async update(template) {
    if (!validObjectId(template._id)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const _id = new mongoose.Types.ObjectId(template._id);
    const dbTemplate = await this.schema.Template.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (_.isNil(dbTemplate)) {
      throw new RestError(404, { message: 'Template does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'template',
    });
    await concurrencyReadDateChecker.failIfOldEntity(dbTemplate);
    const templateUpdated = await this._save(template, dbTemplate);
    return templateUpdated;
  }

  async _getFooterTemplate(footerTemplateId) {
    const footerTemplate = await this.schema.FooterTemplate.findOneWithDeleted({
      _id: footerTemplateId,
      lspId: this.lspId,
    });
    if (!footerTemplate) {
      return null;
    }
    return footerTemplate;
  }

  async _save(template, dbTemplate) {
    template.template = sanitizeHTML(template.template, SANITIZE_OPTIONS);
    dbTemplate.safeAssign(template);
    try {
      await dbTemplate.save();
      return dbTemplate;
    } catch (err) {
      this.logger.debug(`User ${this.user.email} couldn't save the template: ${dbTemplate.name} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = TemplateAPI;
