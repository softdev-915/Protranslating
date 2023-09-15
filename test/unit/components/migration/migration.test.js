/* eslint-disable no-unused-expressions,class-methods-use-this */
/* global describe, it, before, beforeEach, after, afterEach
const Promise = require('bluebird');
const chai = require('chai');

require('mocha');

const { buildSchema } = require('../database/mongo/schemas');
const { loadData } = require('../database/mongo/schemas/helper');
const configuration = require('../../../configuration');
const ApplicationCrypto = require('../../../../components/crypto');

const envConfig = configuration.environment;
const applicationCrypto = ApplicationCrypto(envConfig.CRYPTO_KEY_PATH);

const expect = chai.expect;

const MigrationRunner = require('../../../../app/components/migration');

const mockMigrationReaderFactory = files => () => Promise.resolve(files);
const VoidMigrationExecutorFactory = function () {
  const self = this;
  this.executedMigrations = 0;
  return () => ({
    execute() {
      self.executedMigrations++;
      return Promise.resolve();
    },
    data() {
      return self;
    },
  });
};

const setup = (schema, files, migrations) => {
  let actualMigrations = migrations;
  if (!actualMigrations) {
    actualMigrations = [];
  }
  return loadData(schema, { Migration: actualMigrations }).then(() => {
    const reader = mockMigrationReaderFactory(files);
    const executorFactory = new VoidMigrationExecutorFactory();
    const migrationRunner = new MigrationRunner();
    migrationRunner.schema = schema;
    migrationRunner.migrationReader = reader;
    migrationRunner.executorFactory = executorFactory;
    return {
      schema,
      reader,
      executorFactory,
      migrationRunner,
    };
  });
};

describe('MigrationRunner', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
  }));

  it('should run all migrations if collection is empty', (done) => {
    const files = ['/app/migrations/20170101000000', '/app/migrations/20170102000000', '/app/migrations/20170102000100'];
    let testEntities;
    setup(schema, files).then((te) => {
      testEntities = te;
      return testEntities.migrationRunner.executeMigrations();
    })
      .then(() => {
        expect(testEntities.executorFactory().data().executedMigrations).to.eql(3);
      })
      .then(() => done())
      .catch(done);
  });
});
*/
