const _ = require('lodash');
const { RestError } = require('../../../components/api-response');
const mongooseSchema = require('../../../components/database/mongo').models;
const { searchFactory } = require('../../../utils/pagination');
const { CsvExport } = require('../../../utils/csvExporter');

const auditColumnTransformer = (csvBuilderInstance) => csvBuilderInstance
  .virtual('Request Body', (row) => (row.req.bodyPlainText || row.req.body || ''))
  .virtual('Request Body', (row) => (row.req.bodyPlainText || row.req.body || ''))
  .virtual('Query String', (row) => _.get(row, 'req.query', ''))
  .virtual('IP', (row) => {
    const ipTokenList = _.get(row, "req.headers['x-forwarded-for']", '');
    return ipTokenList.replace(/^.*,/, '');
  });

const AUDIT_CSV_COLUMNS_DEFINITION = {
  headers: [
    'Date',
    'Url',
    'User Login',
    'Status Code',
    'Request Body',
    'Response Body',
    'Session Id',
    'IP',
    'Method',
    'Query String',
    'User Agent',
  ],
  alias: {
    Date: 'timestamp',
    Url: 'req.url',
    'User Login': 'user.email',
    'Status Code': 'res.statusCode',
    'Request Body': 'req.bodyPlainText',
    'Response Body': 'res.bodyPlainText',
    'Session Id': 'req.sessionID',
    IP: 'req.headers.x-forwarded-for',
    Method: 'req.method',
    'User Agent': 'req.headers.user-agent',
  },
};

class AuditApi {
  /**
   * @param {Object} options
   * @param {Object} options.logger
   */
  constructor(logger, options) {
    this.logger = logger;
    this.configuration = _.get(options, 'configuration');
    this.lspId = _.get(options, 'lspId');
    this.schema = mongooseSchema;
  }

  async auditList(user, filters) {
    const query = { lspId: this.lspId, ..._.get(filters, 'paginationParams', {}) };

    try {
      const list = await searchFactory({
        model: this.schema.AuditTrails,
        filters: query,
        utcOffsetInMinutes: filters.__tz,
        shouldProcessNestedProps: true,
      });
      return {
        list,
        total: list.length,
      };
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error performing aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
  }

  /**
   * Returns the audit list as a csv file
   * @param {Object} user making this request.
   * @param {String} user.lsp the ID of the lsp to operate with.
   * @param {Object} groupFilters to filter the groups returned.
   */
  async auditExport(user, filters) {
    const query = { lspId: this.lspId, ..._.get(filters, 'paginationParams', {}) };
    query.limit = 10000000000000;
    const csvStream = await searchFactory({
      model: this.schema.AuditTrails,
      filters: query,
      utcOffsetInMinutes: filters.__tz,
      useStream: true,
    });
    const csvExporter = new CsvExport(csvStream, {
      schema: this.schema.AuditTrails,
      lspId: this.lspId,
      configuration: this.configuration,
      logger: this.logger,
      filters: query,
      csvOptions: {
        columnHeaders: AUDIT_CSV_COLUMNS_DEFINITION,
        columnTransformer: auditColumnTransformer,
      },
    });
    return csvExporter.export();
  }
}

module.exports = AuditApi;
