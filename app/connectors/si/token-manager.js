const _ = require('lodash');
const logger = require('../../components/log/logger');
const { models: mongooseSchema } = require('../../components/database/mongo');

/**
 * Provides si connector tokens. Stores tokens in memory in a dictionary.
 * Where key is a string template `${lsp._id}-${lsp.lspAccountingPlatformLocation}`
 * and value is a si auth information
 */
class SiConnectorTokenManager {
  constructor(generateTokenFunc) {
    this.generateTokenFunc = generateTokenFunc;
    this.lspTokenCache = {};
    this.logger = logger;
  }

  async getToken(lspId) {
    const location = await mongooseSchema.Lsp.getLocationId(lspId);
    let token = await this.findTokenInDb(lspId, location);

    if (_.isNil(token)) {
      const { sessionId, endpoint } = await this.generateTokenFunc(lspId);

      token = new mongooseSchema.SiToken({
        lspId, sessionId, endpoint, location,
      });
      if (endpoint !== 'mock') {
        await token.save();
      }
    }
    const tokenToReturn = _.pick(token.toObject(), ['sessionId', 'endpoint']);

    this.logger.silly(
      `Returnning token for location: ${location}. Token ${JSON.stringify(tokenToReturn)}`,
      { label: 'si-connector-token' },
    );

    return tokenToReturn;
  }

  async findTokenInDb(lspId, location) {
    const tokens = await mongooseSchema.SiToken.find({ lspId, location });

    if (tokens.length === 0) {
      return null;
    }
    if (tokens.length > 1) {
      await mongooseSchema.SiToken.deleteMany({ lspId, location });

      return null;
    }

    return tokens[0];
  }

  deleteToken(lspId) {
    return mongooseSchema.SiToken.deleteMany({ lspId });
  }

  async refreshToken(lspId) {
    await this.deleteToken(lspId);

    return this.getToken(lspId);
  }
}

module.exports = SiConnectorTokenManager;
