const { isArray, isEmpty, get } = require('lodash');
const { models: mongooseSchema } = require('../database/mongo');
const { RestError } = require('../api-response');

module.exports = async (req, res, next) => {
  const lspMatchedUrl = req.originalUrl.match(/\/lsp\/.*\//g);
  const isLspBasedUrl = isArray(lspMatchedUrl) && !isEmpty(lspMatchedUrl);
  const user = get(req, 'session.user');
  if (user && isLspBasedUrl) {
    const { _id, lsp, email } = user;
    try {
      await mongooseSchema.User.validateConsumedApiQuota({
        _id,
        lsp,
        email,
        mockFlags: req.flags,
      });
    } catch (err) {
      const message = get(err, 'message', err);
      return next(new RestError(err.code, { message }));
    }
  }
  next();
};
