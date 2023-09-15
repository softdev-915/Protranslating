const ApplicationLogger = require('./logger');

const excludedApiUrls = [
  '/api/log/create',
];
/**
 * Appends a logger to the request that contains the request context.
 *  application configuration module interface.
 */
module.exports = () => (req, res, next) => {
  req.$logger = ApplicationLogger;
  if (excludedApiUrls.includes(req.url)) {
    next();
    return;
  }
  // Global NodeJS Log
  req.$logger.info(`${req.method} ${req.url} starts`);
  req.$logger.silly(`${req.method} ${req.url} request headers ${JSON.stringify(req.headers)}`);
  const resLoggerHandler = () => {
    req.$logger.info(`${req.method} ${req.url} closed with status ${res.statusCode}`);
    const headers = res.getHeaders();

    req.$logger.silly(`${req.method} ${req.url} response close headers ${JSON.stringify(headers)}`);
    res.removeListener('close', resLoggerHandler);
  };
  const resLoggerHandlerFinish = () => {
    req.$logger.info(`${req.method} ${req.url} finish with status ${res.statusCode}`);
    const headers = res.getHeaders();

    req.$logger.silly(`${req.method} ${req.url} response finish headers ${JSON.stringify(headers)}`);
    res.removeListener('finish', resLoggerHandlerFinish);
  };

  res.on('close', resLoggerHandler);
  res.on('finish', resLoggerHandlerFinish);
  next();
};
