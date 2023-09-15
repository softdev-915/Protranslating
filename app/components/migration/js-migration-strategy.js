/* eslint-disable global-require,import/no-dynamic-require */
const logger = require('../log/logger');

class JSMigrationStrategy {
  constructor(file) {
    this.file = file;
    this.logger = logger;
  }

  execute() {
    this.logger.info(`Executing migration "${this.file}" from pid ${process.pid}`);
    return require(this.file)();
  }
}

module.exports = JSMigrationStrategy;
