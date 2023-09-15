const SchemaAwareAPI = require('../../schema-aware-api');
const { RestError } = require('../../../components/api-response');
const { sanitizeHTML } = require('../../../utils/security/html-sanitize');

class ExternalResourceAPI extends SchemaAwareAPI {
  retrieve() {
    return this.schema.ExternalResource.findOne({ lspId: this.lspId });
  }

  async upsert(externalResource) {
    let exRes;
    try {
      await this.schema.ExternalResource.deleteMany({ lspId: this.lspId });
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error deleting previous external resources. Error ${message}`);
      throw new RestError(500, { message: 'Failed to update external resources' });
    }
    try {
      const sanitizedHTML = sanitizeHTML(externalResource.html);
      exRes = new this.schema.ExternalResource({ lspId: this.lspId, html: sanitizedHTML });
      await exRes.save();
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error inserting new external resources. Error ${message}`);
      throw new RestError(500, { message: 'Failed to update external resources' });
    }
    return exRes;
  }
}

module.exports = ExternalResourceAPI;
