const weasyprint = require('weasyprint');
const SchemaAwareAPI = require('../../schema-aware-api');
const configuration = require('../../../components/configuration');
const ServerURLFactory = require('../../../components/application/server-url-factory');

class ReportApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.serverUrlFactory = new ServerURLFactory(configuration);
    this.envConfig = configuration.environment;
  }

  async generatePdfReport(content, reportCss) {
    const html = `
      <html>
        ${reportCss}
        <body>
          ${content}
        </body>
      </html>
    `;
    return weasyprint(html, { 'base-url': this.origin, 'presentational-hints': true });
  }
}

module.exports = ReportApi;
