#!/usr/bin/env node
//
// migrate.js: Scan folders searching for bson files and compress them into backup files
//
// Usage:
//
// GCS_KEY_FILE='./gcs-lms-test-credentials.json' \
// GCS_BUCKET='pts-lms-test-files' \
// LMS_BACKUP_AUDIT_PREFIX='/pts-lms-test-files/backup-audit-files/cloud' \
// LMS_BACKUP_NOTIFICATION_PREFIX='/pts-lms-test-files/backup-notifications-files/cloud' \
// LMS_BACKUP_AUDIT_PATH='/pts-lms-test-files/backup-audit-files' \
// LMS_BACKUP_NOTIFICATION_PATH='/pts-lms-test-files/backup-notification-files' \
// node migrate.js
//
//
//
// To save tars
// LMS_BACKUP_AUDIT_PREFIX=/pts-lms-test-files/backup-audit-files/cloud
// LMS_BACKUP_NOTIFICATION_PREFIX=/pts-lms-test-files/backup-notifications-files/cloud
// Note: as this was a prefix we only need to remove the first '/'
// e.g.
// pts-lms-test-files/backup-audit-files/cloud/backup-2018-10.tar
// pts-lms-test-files/backup-audit-files/cloud/backup-2018-11.tar
// pts-lms-test-files/backup-audit-files/cloud/backup-2018-12.tar
//
// To read bsons
// LMS_BACKUP_AUDIT_PATH=/pts-lms-test-files/backup-audit-files
// LMS_BACKUP_NOTIFICATION_PATH=/pts-lms-test-files/backup-notification-files
// Note: as this was folder mounted on the server we need to remove the first part
// which is /pts-lms-test-files
//
// GCS Sample configs:
// GCS_KEY_FILE=/lms-test-credentials.json
// GCS_BUCKET=pts-lms-test-files
//
const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const storage = require('@google-cloud/storage');
const fs = require('fs');
const tar = require('tar-stream');
const getenv = require('getenv');

process.on('uncaughtException', (err) => {
  console.log(`Unexpected exception exception: ${err}\n`);
});

/*
// Note: enable for test only
// GCS configs
const GCS_KEY_FILE = './gcs-lms-test-credentials.json';
const GCS_BUCKET = 'pts-lms-test-files';

// tar destination
const LMS_BACKUP_AUDIT_PREFIX = '/pts-lms-test-files/backup-audit-files/cloud';
const LMS_BACKUP_NOTIFICATION_PREFIX = '/pts-lms-test-files/backup-notifications-files/cloud';
// bson source
const LMS_BACKUP_AUDIT_PATH = '/pts-lms-test-files/backup-audit-files';
const LMS_BACKUP_NOTIFICATION_PATH = '/pts-lms-test-files/backup-notification-files';
*/
const GCS_KEY_FILE = getenv('GCS_KEY_FILE');
const GCS_BUCKET = getenv('GCS_BUCKET');

// tar destination
const LMS_BACKUP_AUDIT_PREFIX = getenv('LMS_BACKUP_AUDIT_PREFIX');
const LMS_BACKUP_NOTIFICATION_PREFIX = getenv('LMS_BACKUP_NOTIFICATION_PREFIX');
// bson source
const LMS_BACKUP_AUDIT_PATH = getenv('LMS_BACKUP_AUDIT_PATH');
const LMS_BACKUP_NOTIFICATION_PATH = getenv('LMS_BACKUP_NOTIFICATION_PATH');

const gcs = storage({
  keyFilename: GCS_KEY_FILE
});
const bucket = gcs.bucket(GCS_BUCKET);

const getSrcFolderPrefix = (folder) => {
  const path = folder.replace(/^\//, '').split('/');
  path.shift();
  return path.join('/');
};
const getDestPrefix = (destPrefix) => destPrefix.replace(/^\//, '');

const log = (...args) => console.log(`[${moment().format('YYYY-MM-DD HH:mm')}]`, ...args);

const searchFiles = async (search, filterRegExp) => {
  if (!_.isString(search) || search.trim() === "") {
    throw new Error('Invalid search prefix supplied');
  }
  return bucket.getFiles({prefix: search.replace(/^\//, '')})
    .then(results => {
      const files = _.get(results, '[0]', []);
      return files
        .filter(f => _.isString(f.name) && f.name.match(filterRegExp));
        // .map(f => f.name);
    });
};

const scanPeriod = (period, srcFolderPrefix, destPrefix) => {
  const filterRegExp = /.*\.bson$/;
  const p = period;
  log(`Scanning ${p.year}-${p.month}...`);
  return searchFiles(`${srcFolderPrefix}/${p.year}/${p.month}`, filterRegExp)
    .then(files => {
      log(`[${period.year}-${period.month}] Found:`, files.length);
      if (files.length == 0) {
        return;
      }
      return createTarIfNotExist(p, files, srcFolderPrefix, destPrefix);
    });
};

const createTarIfNotExist = (period, files, srcFolderPrefix, destPrefix) => {
  const destPath = `${destPrefix.replace(/\/$/, '')}/backup-${period.year}-${period.month}.tar`;
  // Save tar also into GCS
  const destFile = bucket.file(destPath);
  return destFile.exists()
    .then(response => {
      const exist = _.get(response, '[0]');
      if (!_.isBoolean(exist)) {
        throw new Error('Exist flag expected to be boolean');
        return;
      }
      if (!exist) {
        log(`Creating: Tar file: ${destPath}`);
        return createTar(period, files, srcFolderPrefix, destPrefix);
      }
      log(`Skipping: Tar file already exists: ${destPath}`);
      return exist;
    });
};

const createTar = (period, files, srcFolderPrefix, destPrefix, tempCopy = false) => {
  const destPath = `${destPrefix.replace(/\/$/, '')}/backup-${period.year}-${period.month}.tar`;
  // Save tar also into GCS
  const destFile = bucket.file(destPath);
  const destFileStream = destFile.createWriteStream();
  // Initialize packer
  const pack = tar.pack();

  if (tempCopy) {
    // pipe to temporal file
    const tempPath = `./temp/backup-${period.year}-${period.month}.tar`;
    const tempStream = fs.createWriteStream(tempPath);
    pack.pipe(tempStream);
  }

  // Pipe to final destination
  pack.pipe(destFileStream);
  log(`[${period.year}-${period.month}] Packing into:`, destPath);
  const entryPromises = files.map((f, index)  => {
    return () => {
      const bsonFile = bucket.file(f.name);

      return bsonFile.getMetadata().then(metadata => {
        // console.log('metadata', metadata.size);
        const bsonMetadata = _.get(metadata, '[0]')
        const bsonSize = parseInt(_.get(bsonMetadata, 'size', 1), 10);

        return new Promise((resolve, reject) => {
          // log(`Packing ${period.year}-${period.month} ${f.name}`);
          // replace the common prefix part of the name PREFIX:lms/notifications/...
          const destination = f.name
            .replace(`${srcFolderPrefix}/${period.year}/${period.month}`, '')
            .replace(/^\//, '');
          const entry = pack.entry({ name: destination, size: bsonSize }, function(err) {
            // Force size mismatch if stram incomplete
            if (err) {
              log(`(${index+1}/${files.length}) [${period.year}-${period.month}] ${destination} FAIL`);
              log(`Error has occured while packing ${f.name}`, err);
              return reject(err);
            }
            log(`(${index+1}/${files.length}) [${period.year}-${period.month}] ${destination} OK`);
            resolve();
          });
          // entry.end();
          const gcFile = bsonFile.createReadStream();
          gcFile.pipe(entry);
        });
      });
    }
  });
  return Promise.resolve(entryPromises)
    .mapSeries(f => f())
    .then(() => {
      pack.finalize();
    });
};

const minYear = 2016;
const currentYear = parseInt(moment().format('YYYY'), 10);
const currentMonth = parseInt(moment().format('M'), 10);

// log(currentYear, currentMonth);

let periods = [];

// Genrate a list of possible year/month combinations
for (let i = currentYear; i >= minYear; i--) {
  for (let m = 1; m <= 12; m++) {

    if (i === currentYear && m > currentMonth) {
      // skip
      continue;
    }
    periods.push({ year: i, month: m });
  }
}

// Note: enable next line for a quick test
// periods = [{year: 2018, month:1}];


(async () => {
  try {
    log('Create audit backup tar files');
    log('-------------------------------------------------------');
    const srcFolderPrefixAudit = getSrcFolderPrefix(LMS_BACKUP_AUDIT_PATH);
    const destPrefixAudit = getDestPrefix(LMS_BACKUP_AUDIT_PREFIX);
    const scanPromisesAudit = periods.map((p) => (() => scanPeriod(p,
      srcFolderPrefixAudit, destPrefixAudit)));
    await Promise.resolve(scanPromisesAudit).mapSeries(f => f());

    log('Create notification backup tar files');
    log('-------------------------------------------------------');
    const srcFolderPrefix = getSrcFolderPrefix(LMS_BACKUP_NOTIFICATION_PATH);
    const destPrefix = getDestPrefix(LMS_BACKUP_NOTIFICATION_PREFIX);
    const scanPromises = periods.map((p) => (() => scanPeriod(p, srcFolderPrefix, destPrefix)));
    await Promise.resolve(scanPromises).mapSeries(f => f());

    log('Backups migrated successfully');
  } catch (e) {
    log('Error...', e);
  }
})();
