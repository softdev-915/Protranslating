/* eslint-disable import/no-dynamic-require */
const _ = require('lodash');
const logger = require('../../app/components/log/logger');

const MIGRATIONS_DIR_PATH = '../../app/migrations';
const migrationName = process.argv[2];

if (_.isEmpty(migrationName)) {
  logger.error(`Migration ${migrationName}.js does not exist`);
  process.exit(0);
}
const fullPath = `${MIGRATIONS_DIR_PATH}/${migrationName}.js`;
const migration = require(fullPath);

(async () => {
  logger.info(`Running migration: ${fullPath}`);

  return migration();
})()
  .then(() => {
    logger.info(`Successfully ran migration ${fullPath}`);
    process.exit(0);
  })
  .catch((err) => {
    logger.error(err);
    process.exit(0);
  });
