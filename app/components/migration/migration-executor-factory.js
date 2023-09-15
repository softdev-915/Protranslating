const path = require('path');
const JSMigrationStrategy = require('./js-migration-strategy');

const executorFactory = (file) => {
  const ext = path.extname(file);
  if (ext === '.js') {
    return new JSMigrationStrategy(file);
  }
  throw new Error(`Cannot execute migration with ${file}. Only .js files allowed`);
};

module.exports = executorFactory;
