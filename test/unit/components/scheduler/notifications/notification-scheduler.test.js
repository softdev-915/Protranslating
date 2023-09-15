/* eslint-disable no-unused-expressions,class-methods-use-this,global-require*/
/* global describe, it, before, beforeEach, after, afterEach 
const Promise = require('bluebird');
const chai = require('chai');
const sinon = require('sinon');
const nullLogger = require('../../../../../app/components/log/null-logger');
const mongoose = require('mongoose');
const mockConf = require('../../../../../app/components/configuration');
require('mocha');

const expect = chai.expect;

const NotificationScheduler = require('../../../../../app/components/scheduler/notifications');

const { buildSchema } = require('../../database/mongo/schemas');
const { loadData } = require('../../database/mongo/schemas/helper');

const mockSchema = (schema, notifications) => loadData(schema, {
  Notification: notifications,
});

const loggerSpy = sinon.spy(nullLogger, 'warn');

describe('NotificationScheduler', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
  }));

  afterEach(() => { loggerSpy.reset(); });

  it('should not handle notification if empy array', (done) => {
    let handlerFactorySpy;
    const name = 'notification';
    const mockJob = { attrs: { data: { } } };
    mockSchema(schema, []).then(() => {
      const handler = () => ({ handle: () => Promise.resolve() });
      handlerFactorySpy = sinon.spy(handler);
      const notificationScheduler = new NotificationScheduler(name, mockConf);
      notificationScheduler.schema = schema;
      notificationScheduler.logger = nullLogger;
      notificationScheduler.notificationHandlerFactory = handlerFactorySpy;
      return new Promise((resolve) => {
        notificationScheduler.run(mockJob, () => {
          resolve();
        });
      });
    }).then(() => {
      expect(schema.Notification.findUnprocessed.called).to.eql(true);
      expect(schema.Notification.setProcessed.called).to.eql(false);
      expect(handlerFactorySpy.called).to.eql(false);
    }).then(() => { done(); })
    .catch((err) => {
      done(err);
    });
  });

  it('should process and delete all notifications', (done) => {
    const name = 'notification';
    const testData = { test: true };
    const mockJob = { attrs: { data: testData } };
    const notificationId = mongoose.Types.ObjectId();
    const notification = { _id: notificationId, type: name };
    let handlerFactorySpy;
    mockSchema(schema, [notification]).then(() => {
      const handler = () => ({ handle: () => Promise.resolve() });
      handlerFactorySpy = sinon.spy(handler);
      const notificationScheduler = new NotificationScheduler(name, mockConf);
      notificationScheduler.schema = schema;
      notificationScheduler.logger = nullLogger;
      notificationScheduler.notificationHandlerFactory = handlerFactorySpy;
      return new Promise((resolve) => {
        notificationScheduler.run(mockJob, () => {
          resolve();
        });
      });
    })
    .then(() => {
      expect(schema.Notification.findUnprocessed.called).to.eql(true);
      expect(schema.Notification.setProcessed.called).to.eql(true);
      const deleteCalls = schema.Notification.setProcessed.getCalls();
      expect(deleteCalls.length).to.eql(1);
      expect(deleteCalls[0].args.length).to.eql(1);
      expect(deleteCalls[0].args[0].length).to.eql(1);
      expect(deleteCalls[0].args[0][0]._id).to.eql(notification._id);
      expect(handlerFactorySpy.called).to.eql(true);
      const calls = handlerFactorySpy.getCalls();
      expect(calls.length).to.eql(1);
      expect(calls[0].args.length).to.eql(2);
      expect(calls[0].args[0]._id).to.eql(notification._id);
      expect(calls[0].args[0].type).to.eql(notification.type);
      expect(loggerSpy.called).to.eql(false);
    }).then(() => { done(); })
    .catch((err) => {
      done(err);
    });
  });
});
*/