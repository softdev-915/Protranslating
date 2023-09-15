const SchemaAwareAPI = require('../../schema-aware-api');

class PaymentGatewayApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.logger = logger;
  }

  async list() {
    const list = await this.schema.PaymentGateway.find().lean();
    return list;
  }
}

module.exports = PaymentGatewayApi;
