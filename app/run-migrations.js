/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const fs = require('fs');
const Promise = require('bluebird');
const logger = require('./components/log/logger');

const MIGRATIONS_DIR_PATH = `${__dirname}/migrations`;

(async () => {
  const readdirAsync = Promise.promisify(fs.readdir);
  const migrationNameRegexp = /^\d*\.js$/;
  const migrations = (await readdirAsync(MIGRATIONS_DIR_PATH))
    .filter((m) => migrationNameRegexp.test(m))
    .sort();

  await Promise.mapSeries(migrations, (migrationFileName) => {
    const fullPath = `${MIGRATIONS_DIR_PATH}/${migrationFileName}`;

    logger.info(fullPath);
    const migration = require(fullPath);

    return migration();
  });
})()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(err);
    process.exit(0);
  });
