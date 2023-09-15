/* eslint-disable global-require,import/no-dynamic-require,import/no-extraneous-dependencies */
const sinon = require('sinon');
const { v4: uuidV4 } = require('uuid');
const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const mongodb = require('naive-mongo');

const mongoose = require('mongoose');

const initialData = require('./data.json');

mongoose.Promise = Promise;

mongodb.max_delay = 0;

const _nonSpyable = ['hooks', 'base', 'modelName', 'model', 'db', 'discriminators', 'schema', 'collection', 'Query', '$__insertMany', 'mongoose', '$appliedMethods', '$appliedHooks', '$init', '$caught', 'events', '_middleware'];
const _mustSpy = ['updateOne', 'updateMany', 'aggregate'];
const toModelName = (file) => _.upperFirst(_.camelCase(file));
const realSchemaDir = path.join(__dirname, '../../../../../../app/components/database/mongo/schemas');
const isDirectory = (file) => fs.statSync(path.join(realSchemaDir, file)).isDirectory();
const initializeData = (models) => Promise.map(
  Object.keys(initialData),
  (modelName) => models[modelName].create(initialData[modelName]),
  { concurrency: 1 },
);

const initializeSpies = (schema) => {
  Object.keys(schema).forEach((key) => {
    // spy on methods
    Object.keys(schema[key]).filter((k) => _nonSpyable.indexOf(k) === -1)
      .concat(_mustSpy).forEach((k) => {
        if (schema[key][k].isSinonProxy) {
          schema[key][k].reset();
        } else {
          sinon.spy(schema[key], k);
        }
      });
    // spy on new
    sinon.spy(schema, key);
  });
};

const buildSchema = function () {
  const models = {};
  const schemas = {};

  fs.readdirSync(realSchemaDir).filter((f) => f !== 'index.js' && !isDirectory(f))
    .map((f) => f.substring(0, f.length - 3))
    .forEach((f) => {
      schemas[toModelName(f)] = require(path.join(realSchemaDir, f));
    });
  Object.keys(schemas).forEach((modelName) => {
    const model = mongoose.model(modelName, schemas[modelName]);

    model.mongoose = mongoose;
    models[modelName] = model;
    models[`${modelName}Secondary`] = model;
  });

  return new Promise((resolve) => {
    const randomDBName = uuidV4();

    mongodb.MongoClient.connect(`mongodb://some.nasty.fake.host:8080/${randomDBName}`, ((err, db) => {
      let closePromise;

      if (mongoose.connection instanceof mongoose.Connection) {
        closePromise = Promise.resolve();
      } else {
        // forces closing the last connection if necessary
        closePromise = new Promise((res) => { mongoose.connection.close(true, res); });
      }

      return closePromise.then(() => {
        mongoose.connection = db;
        Object.keys(mongoose.models).forEach((k) => {
          mongoose.models[k].collection.conn = {
            db,
            base: {
              options: {
                debug: false,
              },
            },
            config: {},
          };
          mongoose.models[k].collection.onOpen();
        });
        initializeSpies(models);
        resolve(models);
      });
    }));
  }).then((m) => initializeData(m).then(() => m));
};

const truncateDB = (schema) => {
  Object.keys(schema).forEach((key) => {
    // clenup collection
    schema[key].collection.length = 0;
  });
};

module.exports = {
  buildSchema,
  truncateDB,
};
