const _ = require('lodash');
const { sendErrorResponse } = require('../api-response');

module.exports = () => (req, res, next) => {
  const isProd = process.env.NODE_ENV === 'PROD';
  if (req.session.user && _.has(req.headers, 'lms-mockapifailure') && !isProd) {
    return sendErrorResponse(res, 400, {
      message: `Mocked error for ${req.url}`,
    });
  }
  next();
};

