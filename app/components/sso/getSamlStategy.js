const _ = require('lodash');
const { models: mongooseSchema } = require('../database/mongo');

const getSamlStrategy = async (lspId, companyId) => {
  const ssoSettings = await mongooseSchema.Company.getSsoSettings(companyId, lspId);
  const isSSOEnabled = _.get(ssoSettings, 'isSSOEnabled', false);
  if (!isSSOEnabled) {
    throw new Error('SSO is not enabled for this company or no company is found.');
  }
  const { metadata, entryPoint, certificate } = ssoSettings;

  return {
    issuer: metadata,
    path: `/api/auth/ssoCallback/${lspId}/${companyId}`,
    entryPoint,
    cert: certificate,
  };
};

module.exports = getSamlStrategy;
