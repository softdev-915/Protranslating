const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

const migrationReaderFactory = folder => (() => new Promise((resolve, reject) => {
  fs.readdir(folder, (err, files) => {
    const migrationFiles = files.filter(f => f.match('.js'));
    if (err) {
      reject(err);
    }
    resolve(migrationFiles.map(f => path.join(folder, f)));
  });
}));

module.exports = migrationReaderFactory;
