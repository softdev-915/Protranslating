const _ = require('lodash');
const SchemaAwareAPI = require('../../schema-aware-api');
const EntityExporter = require('./service/export/entity-exporter');
const EntityImporter = require('./service/import/entity-importer');
const { environment } = require('../../../components/configuration');

class ImportEntityApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.mockedEntities = options.mockedEntities;
  }

  getAllowedSchemas(schemas) {
    const { IMPORT_MODULE_ENTITIES } = environment;
    const entities = _.defaultTo(this.mockedEntities, IMPORT_MODULE_ENTITIES)
      .map((entity) => _.trim(entity).toLowerCase())
      .filter((entity) => !_.isEmpty(entity));
    return schemas.filter(({ name }) => entities.includes(name.toLowerCase()));
  }

  async export(schemaFields) {
    return new EntityExporter(this.getAllowedSchemas(schemaFields)).export();
  }

  async import(file, schemas) {
    await new EntityImporter(
      this.schema,
      file,
      this.getAllowedSchemas(schemas),
      this.user,
    ).import();
  }
}

module.exports = ImportEntityApi;
