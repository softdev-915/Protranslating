const _ = require('lodash');
const SchemaAwareAPI = require('../../schema-aware-api');
const { models } = require('../../../components/database/mongo');
const { hasUserAccessToSchema } = require('../../../utils/schema');
const { getPipelineToFilterRestrictedRecords } = require('../../../utils/schema/aggregation-helper');

class SchemaAPI extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.FORBIDDEN_FIELDS = ['taxId'];
  }

  getSchemaFromOptions(options) {
    const opt = _.get(options, 'type') || options;
    if (!_.isArray(opt)) return opt;
    return this.getSchemaFromOptions(opt[0]);
  }

  extractFieldsFromObject(name, paths, type) {
    let ref = '';
    const fields = Object.values(paths).map(({
      instance = '', path = '', schema = {}, options = {},
    }) => {
      const schemaFromOptions = this.getSchemaFromOptions(options) || {};

      if (!_.isEmpty(schema.paths)) {
        return this.extractFieldsFromObject(path, schema.paths, instance);
      }
      if (instance === 'Mixed') {
        const mixedPaths = Object.keys(_.get(options, 'type', {}))
          .map((key) => ({ path: key, instance: 'String' }));
        return this.extractFieldsFromObject(path, mixedPaths, 'Embedded');
      }
      if (!_.isEmpty(schemaFromOptions.paths)) {
        return this.extractFieldsFromObject(path, schemaFromOptions.paths, instance);
      }
      if (this.FORBIDDEN_FIELDS.includes(path)) {
        return null;
      }
      const fieldRef = _.get(options, 'ref', _.get(options, 'type.0.ref', ''));

      if (path === '_id') {
        ref = fieldRef;
      }
      return { name: path, type: instance, ref: fieldRef };
    }).filter((field) => !_.isNil(field));
    return {
      name, fields, type, ref,
    };
  }

  async getAllSchemas() {
    const list = Object.entries(models)
      .map(([, { modelName = '', schema = {} }]) => this.extractFieldsFromObject(modelName, schema.paths, 'Embedded'));
    return { list, total: list.length };
  }

  async getSchemasForCurrentUser() {
    const list = Object.entries(models)
      .filter(([modelName]) =>
        hasUserAccessToSchema(modelName, this.user, [
          'READ_ALL',
          'READ_OWN',
          'CREATE_ALL',
          'CREATE_OWN',
          'UPDATE_ALL',
          'UPDATE_OWN',
        ]),
      )
      .map(([, { modelName = '', schema = {} }]) => {
        if (_.has(schema.statics, 'PATHS_TO_MASK')) this.FORBIDDEN_FIELDS.push(...schema.statics.PATHS_TO_MASK);
        return this.extractFieldsFromObject(modelName, schema.paths, 'Embedded');
      });
    return { list, total: list.length };
  }

  async getFieldValues(field) {
    const schemas = await this.getSchemasForCurrentUser();

    this.logger.debug(`Split from schema-api ${field}`);
    const fieldPath = field.split('.');
    const schemaName = fieldPath.shift();
    let list = [];
    const schema = schemas.list.find(({ name }) => name === schemaName);

    if (!_.isEmpty(schema)) {
      let embedded = _.cloneDeep(schema);
      let pathStartIndex = 0;
      const unwinds = [];

      fieldPath.forEach((v, i) => {
        const fieldName = fieldPath.slice(pathStartIndex, i + 1).join('.');
        const foundField = _.get(embedded, 'fields', []).find(({ name }) => name === fieldName);

        if (!_.isEmpty(foundField)) {
          if (foundField.type === 'Array') {
            unwinds.push({ $unwind: `$${fieldPath.slice(0, i + 1).join('.')}` });
          }
          pathStartIndex = i + 1;
          embedded = foundField;
        }
      });
      let pipeline = await getPipelineToFilterRestrictedRecords(schema.name, this.user);
      pipeline = pipeline.concat(unwinds);
      pipeline.push({
        $project: { _id: false, value: `$${fieldPath.join('.')}` },
      });
      list = await this.schema[schema.name].aggregate(pipeline);
      list = _.uniq(list.map(({ value }) => value));
    }
    return { list, total: list.length };
  }
}

module.exports = SchemaAPI;
