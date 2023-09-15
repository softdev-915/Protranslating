const winston = require('winston');
const config = require('../configuration');

const { NODE_LOGS_LEVEL, NODE_LOGS_PATH, IS_DEV } = config.environment;
require('winston-daily-rotate-file');

const logger = winston.createLogger({
  level: NODE_LOGS_LEVEL,
  format: winston.format.json(),
  transports: [

    new winston.transports.DailyRotateFile({
      filename: NODE_LOGS_PATH,
      datePattern: 'YYYY-MM-DD-HH',
      maxSize: '20m',
    }),
  ],
});

if (IS_DEV) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }));
}

logger.fatal = function fatalError(err) {
  logger.error(err);
  process.exit(1);
};

module.exports = logger;
