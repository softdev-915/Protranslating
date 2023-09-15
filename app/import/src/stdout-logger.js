/* eslint-disable space-unary-ops */
const winston = require('winston');
const moment = require('moment');

const loggerFactory = (consoleLevel = 'error') => {
  this.transports = [
    new (winston.transports.Console)({
      level: consoleLevel,
      timestamp: true,
      json: false,
      colorize: true,
    }),
  ];
  return new(winston.Logger)({
    level: 'silly',
    timestamp: () => moment().utc().toDate(),
    transports: this.transports,
  });
};

module.exports = loggerFactory;
