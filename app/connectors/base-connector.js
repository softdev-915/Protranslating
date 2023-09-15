const _ = require('lodash');
const { models: mongooseSchema } = require('../components/database/mongo');

class BaseConnector {
  get name() {
    if (_.isUndefined(this._name)) {
      throw Error('Property _name is not defined on connector object');
    }

    return this._name;
  }

  async getConnectorByLspId(lspId) {
    this.logger.debug(`SIConnector: getConnectorByLspId ${lspId}`);
    const { name } = this;
    const query = { lspId, name };
    const connectorInDb = await mongooseSchema.Connector.findOneWithDeleted(query);

    if (_.isNil(connectorInDb)) {
      throw new Error(`Connector with name ${name} was not found in lsp ${lspId}`);
    }

    return connectorInDb;
  }
}

module.exports = BaseConnector;
