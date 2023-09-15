const { RestError } = require('../api-response');
const { extractLspFromURL } = require('../../utils/request');
const _ = require('lodash');

module.exports = (req, res, next) => {
  if (req.session && req.session.user) {
    const lspId = extractLspFromURL(req);
    const userLspId = _.get(req, 'session.user.lsp._id', '').toString();
    if (lspId && userLspId !== lspId) {
      throw new RestError(403, { message: 'The user does not belong to the given lsp' });
    }
  }
  next();
};
