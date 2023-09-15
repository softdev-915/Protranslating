/* eslint-disable global-require,import/no-dynamic-require */
const mongoose = require('mongoose');
const { upperFirst, camelCase, isEmpty } = require('lodash');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const LmsAuthSchema = require('./schemas/lms-auth');
const AuditTrailsSchema = require('./schemas/audit-trail');
const logger = require('../../log/logger');

const readFiles = Promise.promisify(fs.readdir);
const toModelName = (file) => upperFirst(camelCase(file));
const filterSchemas = (schema) => !/audit-trail|lms-auth.js|subschemas/.test(schema);

module.exports = {
  models: {},
  async connect(configuration) {
    const connectionPromises = [
      mongoose.connect(configuration.environment.MONGODB_LMS_CONNECTION_STRING),
      mongoose.createConnection().openUri(configuration.environment.MONGODB_LMS_AUTH_CONNECTION_STRING),
      mongoose.createConnection().openUri(configuration.environment.LMS_SECONDARY_CONNECTION_STRING),
      mongoose.createConnection().openUri(configuration.environment.MONGODB_LMS_AUDIT_CONNECTION_STRING),
    ];

    [
      this.mongoose,
      this.mongooseAuth,
      this.mongooseSecondary,
      this.auditDb,
    ] = await Promise.all(connectionPromises);

    logger.info('[Connected to mongo]');
    return this;
  },
  async loadSchemas() {
    const schemas = {};

    fs.readdirSync(path.resolve(__dirname, 'schemas'))
      .filter(filterSchemas)
      .map((f) => f.substring(0, f.length - 3))
      .forEach((f) => {
        schemas[toModelName(f)] = require(path.resolve(__dirname, 'schemas', f));
      });

    Object.keys(schemas).forEach((modelName) => {
      this.models[modelName] = mongoose.model(modelName, schemas[modelName]);
      this.models[`${modelName}Secondary`] = this.mongooseSecondary.model(modelName, schemas[modelName]);
    });

    Object.assign(
      this.models,
      { LmsAuth: this.mongooseAuth.model('LmsAuth', LmsAuthSchema) },
      { AuditTrails: this.auditDb.model('AuditTrails', AuditTrailsSchema) },
    );

    logger.info('[Schemas loaded]');
    return this.models;
  },
  async getSchema(schemaName) {
    const schemaDir = path.resolve(__dirname, 'schemas');
    const files = await readFiles(schemaDir);
    const filename = files
      .filter(filterSchemas)
      .find((name) => toModelName(path.basename(name, '.js')) === schemaName);
    if (isEmpty(filename)) {
      return null;
    }
    const file = require(path.join(schemaDir, filename));

    return mongoose.model(schemaName, file);
  },
};
