const _ = require('lodash');
const SchemaAwareAPI = require('../../schema-aware-api');
const { exportFactory, searchFactory } = require('../../../utils/pagination');
const { CsvExport } = require('../../../utils/csvExporter');
const configuration = require('../../../components/configuration');

class CompromisedPasswordApi extends SchemaAwareAPI {
  _getQueryFilters({ paginationParams = {} }) {
    const query = { ...paginationParams, lspId: this.lspId };
    return { query };
  }

  async list(filters) {
    const { query } = this._getQueryFilters(filters);
    let list = await searchFactory({
      model: this.schema.CompromisedPassword,
      filters: query,
      utcOffsetInMinutes: filters.__tz,
    });
    if (this.isProd) {
      list = list.map((row) => _.pick(row, ['password']));
    }
    return { list, total: list.length };
  }

  async export(filters) {
    const { query } = this._getQueryFilters(filters);
    const cursor = await exportFactory(this.schema.CompromisedPassword, query, [], [], filters.__tz);
    const csvExporter = new CsvExport(cursor, {
      schema: this.schema.CompromisedPassword,
      lspId: this.lspId,
      configuration,
      logger: this.logger,
      filters: { query },
    });
    return csvExporter.export();
  }
}

module.exports = CompromisedPasswordApi;
