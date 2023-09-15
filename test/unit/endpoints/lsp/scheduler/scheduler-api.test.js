/* eslint-disable no-unused-expressions,class-methods-use-this */
/* global describe, it, before, beforeEach, after, afterEach
const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
require('mocha');

const Promise = require('bluebird');

const nullLogger = require('../../../../../app/components/log/null-logger');

const { buildSchema } = require('../../../components/database/mongo/schemas');
const { loadData } = require('../../../components/database/mongo/schemas/helper');

const SchedulerAPI = require('../../../../../app/endpoints/lsp/scheduler/scheduler-api');

const lspId1 = '5907892364414170ef952e1c';
const currentUser = {
  email: 'test@protranslating.com',
  lsp: {
    _id: lspId1,
  },
};

const mockSchema = (schema, schedulers) => loadData(schema, {
  Scheduler: schedulers,
});

const mockApplicationScheduler = () => ({
  cancel: () => Promise.resolve(),
  setupJob: () => {},
});

const expect = chai.expect;

describe('Scheduler API', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
  }));

  it('should fail if no valid configuration is given', (done) => {
    const schedulerAPI = new SchedulerAPI(nullLogger);
    schedulerAPI.logger = nullLogger;
    schedulerAPI.schema = schema;
    schedulerAPI.applicationSchedulerFactory = mockApplicationScheduler;
    const scheduler = {};
    mockSchema(schema).then(() => schedulerAPI.update(currentUser, scheduler))
    .then(() => {
      done('should have failed');
    }).catch((err) => {
      expect(err.code).to.eql(400);
      expect(err.message).to.eql('Invalid schedule config');
    })
    .then(() => { done(); })
    .catch(done);
  });

  it('should fail if invalid every', (done) => {
    const schedulerAPI = new SchedulerAPI();
    schedulerAPI.logger = nullLogger;
    schedulerAPI.schema = schema;
    schedulerAPI.applicationSchedulerFactory = mockApplicationScheduler;
    const scheduler = { every: '1 min' };
    mockSchema(schema).then(() => schedulerAPI.update(currentUser, scheduler))
    .then(() => {
      done('should have failed');
    }).catch((err) => {
      expect(err.code).to.eql(400);
      expect(err.message).to.eql('Invalid schedule config');
    })
    .then(() => { done(); })
    .catch(done);
  });

  it('should fail if no scheduler found', (done) => {
    const schedulerAPI = new SchedulerAPI(nullLogger, { user: currentUser });
    schedulerAPI.schema = schema;
    schedulerAPI.applicationSchedulerFactory = mockApplicationScheduler;
    const scheduler = { every: '1 minutes' };
    mockSchema(schema).then(() => schedulerAPI.update(currentUser, scheduler, lspId1))
    .then(() => {
      done('should have failed');
    }).catch((err) => {
      expect(err.code).to.eql(404);
      expect(err.message).to.eql('Scheduler does not exist');
    })
    .then(() => { done(); })
    .catch(done);
  });

  it('should update the scheduler', (done) => {
    const applicationScheduler = mockApplicationScheduler();
    const schedulerAPI = new SchedulerAPI(nullLogger, { user: currentUser });
    schedulerAPI.schema = schema;
    schedulerAPI.applicationSchedulerFactory = () => Promise.resolve(applicationScheduler);
    const scheduler = {
      _id: new mongoose.Types.ObjectId().toString(),
      every: '1 minutes',
      lspId: lspId1,
      name: 'forgotPassword' };
    const cancelSpy = sinon.spy(applicationScheduler, 'cancel');
    const setupJobSpy = sinon.spy(applicationScheduler, 'setupJob');
    mockSchema(schema, [scheduler]).then(() => schedulerAPI.update(currentUser, scheduler, lspId1))
    .then(() => {
      expect(schema.Scheduler.findOneWithDeleted.called).to.eql(true);
      expect(cancelSpy.called).to.eql(true);
      expect(setupJobSpy.called).to.eql(true);
      done();
    })
    .catch((err) => {
      expect(err).to.not.exist;
      done(err);
    });
  });
});
*/
