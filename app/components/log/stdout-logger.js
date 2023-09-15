const moment = require('moment');
const winston = require('winston');

module.exports = winston.createLogger({
  level: 'silly',
  timestamp: () => moment().utc().toDate(),
  transports: [new (winston.transports.Console)({
    colorize: true,
  })],
});
