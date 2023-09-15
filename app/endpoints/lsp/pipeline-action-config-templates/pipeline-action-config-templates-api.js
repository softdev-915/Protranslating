const _ = require('lodash');
const { Types: { ObjectId } } = require('mongoose');
const SchemaAwareAPI = require('../../schema-aware-api');
const { RestError } = require('../../../components/api-response');

class PipelineActionConfigTemplatesApi extends SchemaAwareAPI {
  constructor({ user, logger }) {
    super(logger, { user });
  }

  async list(companyId, { action, term } = {}) {
    const query = _.omitBy({
      lspId: this.lspId,
      companyId: new ObjectId(companyId),
      actionName: action,
      isHidden: false,
    }, _.isNil);
    if (!_.isNil(term)) {
      query.name = new RegExp(term, 'i');
    }
    const templates = await this.schema.PipelineActionConfigTemplate.find(query);
    return { templates, total: templates.length };
  }

  async create(companyId, data) {
    delete data._id;
    const newTemplate = new this.schema.PipelineActionConfigTemplate({
      ...data,
      lspId: this.lspId,
      companyId,
    });
    await newTemplate.save();
    return newTemplate;
  }

  async getByName({ companyId, action, name }) {
    const query = {
      lspId: this.lspId,
      companyId: new ObjectId(companyId),
      actionName: action,
      isHidden: false,
      name,
    };
    const template = await this.schema.PipelineActionConfigTemplate.findOne(query);
    if (_.isNil(template)) {
      throw new RestError(404, { message: 'Config template not found' });
    }
    return template;
  }

  async update(companyId, templateId, data) {
    const query = {
      _id: new ObjectId(templateId),
      lspId: this.lspId,
      companyId: new ObjectId(companyId),
      isHidden: false,
    };
    const template = await this.schema.PipelineActionConfigTemplate.findOne(query);
    if (_.isNil(template)) {
      throw new RestError(404, { message: 'Config template not found' });
    }
    template.configYaml = data.configYaml;
    await template.save();
    return template;
  }

  async hide(companyId, templateId) {
    const template = await this.schema.PipelineActionConfigTemplate.findOne({
      _id: new ObjectId(templateId),
      lspId: this.lspId,
      companyId: new ObjectId(companyId),
      isHidden: false,
    });
    if (_.isNil(template)) {
      throw new RestError(404, { message: 'Config template not found' });
    }
    template.isHidden = true;
    await template.save();
  }

  deleteAll(companyId) {
    return this.schema.PipelineActionConfigTemplate.deleteMany({
      lspId: this.lspId,
      companyId: new ObjectId(companyId),
      isHidden: false,
    });
  }
}

module.exports = PipelineActionConfigTemplatesApi;
