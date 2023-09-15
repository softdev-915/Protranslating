const { MultiSamlStrategy } = require('passport-saml');
const _ = require('lodash');
const getSamlStrategy = require('./getSamlStategy');
const { models: mongooseSchema } = require('../database/mongo');

const strategy = new MultiSamlStrategy({
  passReqToCallback: true,
  getSamlOptions(request, done) {
    const lspId = _.get(request, 'params.lspId', null);
    const companyId = _.get(request, 'params.companyId', null);

    if (_.isNil(lspId) || _.isNil(companyId)) {
      return request.res.redirect(301, '/login?samlError=400');
    }
    getSamlStrategy(lspId, companyId)
      .then((foundStrategy) => done(null, foundStrategy))
      .catch(() => request.res.redirect(301, '/login?samlError=401'));
  },
}, ((req, profile, done) => {
  const lspId = _.get(req, 'params.lspId', null);

  mongooseSchema.User.findOneWithDeleted({
    lsp: lspId, email: profile.nameID,
  }).then((user) => {
    if (_.isNil(user)) {
      return req.res.redirect(301, '/login?samlError=402');
    }

    return done(null, user);
  });
}));

module.exports = strategy;
