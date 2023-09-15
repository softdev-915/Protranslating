/* eslint-disable no-unused-expressions,class-methods-use-this */
/* global describe, it, before, beforeEach, after, afterEach 
const chai = require('chai');
const sinon = require('sinon');
const Promise = require('bluebird');
require('mocha');

const { Types: { ObjectId } } = require('mongoose');

const expect = chai.expect;

const { buildSchema } = require('../database/mongo/schemas');
const { loadData } = require('../database/mongo/schemas/helper');

const nullLogger = require('../../../../app/components/log/null-logger');

const ApplicationScheduler = require('../../../../app/components/scheduler/application-scheduler');

const agendaMock = () => {
  const mockedAgenda = {};
  mockedAgenda.now = sinon.spy(() => {});
  mockedAgenda.create = sinon.spy(() => ({
    attrs: {},
    schedule: () => {},
    save: () => Promise.resolve(),
  }));
  mockedAgenda.define = sinon.spy(() => {});
  mockedAgenda.every = sinon.spy(() => {});
  mockedAgenda.on = sinon.spy((event, fn) => setImmediate(fn));
  mockedAgenda.jobs = sinon.spy((query, cb) => {
    process.nextTick(() => {
      cb(null, []);
    });
  });
  mockedAgenda.start = sinon.spy(() => {});
  mockedAgenda.cancel = sinon.spy((query, cb) => {
    process.nextTick(() => {
      cb(null, []);
    });
  });
  mockedAgenda.stop = sinon.spy(fn => setImmediate(fn));
  return mockedAgenda;
};

const schedulerFactoryMock = (knownSchedulers) => {
  const mockSchedulerFactory = sinon.spy((scheduler) => {
    if (Object.keys(knownSchedulers).indexOf(scheduler.name) >= 0) {
      return knownSchedulers[scheduler.name];
    }
  });
  return mockSchedulerFactory;
};

const setup = (schema, scheduledJobs, knownSchedulers) =>
  loadData(schema, {
    Scheduler: scheduledJobs,
  }).then(() => {
    const entities = {};
    entities.agenda = agendaMock();
    entities.logger = nullLogger;
    entities.schema = schema;
    entities.schedulerFactory = schedulerFactoryMock(knownSchedulers);
    return entities;
  });

describe('ApplicationScheduler', () => {
  let schema;
  beforeEach(() =>
    buildSchema().then((s) => {
      schema = s;
    }));

  it('should bootstrap if no scheduler is found', (done) => {
    let entities;
    const scheduledJobs = [];
    const knownSchedulers = {};
    setup(schema, scheduledJobs, knownSchedulers)
      .then((e) => {
        entities = e;
        const applicationScheduler = new ApplicationScheduler(entities.agenda);
        applicationScheduler.logger = nullLogger;
        applicationScheduler.schema = entities.schema;
        applicationScheduler.schedulerFactory = entities.schedulerFactory;
        return applicationScheduler.configure.call(applicationScheduler);
      })
      .then(() => {
        expect(entities.schema.Scheduler.find.called).to.eql(true);
        expect(entities.schedulerFactory.called).to.eql(false);
        expect(entities.agenda.every.called).to.eql(false);
        expect(entities.agenda.start.called).to.eql(true);
        expect(entities.agenda.stop.called).to.eql(true);
      })
      .then(() => {
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should fail to create an ApplicationScheduler if no agenda is provided', (done) => {
    let entities;
    const scheduledJobs = [];
    const knownSchedulers = {};
    setup(schema, scheduledJobs, knownSchedulers)
      .then((e) => {
        entities = e;
        const applicationScheduler = new ApplicationScheduler();
        applicationScheduler.logger = nullLogger;
        applicationScheduler.schema = entities.schema;
        applicationScheduler.schedulerFactory = entities.schedulerFactory;
      })
      .then(() => done('Should have thrown an error'))
      .catch((errorThrown) => {
        expect(errorThrown).to.exist;
        expect(errorThrown.message).to.eql('Option agenda is required');
        done();
      });
  });

  it('should log a warning when trying to create an unknown scheduler name', (done) => {
    const scheduledJobs = [
      {
        name: 'unknown',
        every: '1 minute',
      },
    ];
    const handler = {
      run: () => {},
    };
    const handlerSpy = sinon.spy(handler, 'run');
    const knownSchedulers = {
      known: {
        run: sinon.spy(() => handler),
      },
    };
    let entities;
    setup(schema, scheduledJobs, knownSchedulers)
      .then((e) => {
        entities = e;
        const applicationScheduler = new ApplicationScheduler(entities.agenda);
        applicationScheduler.logger = nullLogger;
        applicationScheduler.schema = entities.schema;
        applicationScheduler.schedulerFactory = entities.schedulerFactory;
        return applicationScheduler.configure.call(applicationScheduler);
      })
      .then(() => {
        expect(entities.schema.Scheduler.find.called).to.eql(true);
        expect(entities.schedulerFactory.called).to.eql(true);
        expect(entities.agenda.every.called).to.eql(false);
        expect(entities.agenda.start.called).to.eql(true);
        expect(entities.agenda.stop.called).to.eql(true);
        expect(handlerSpy.called).to.eql(false);
      })
      .then(() => {
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should register a known handler in agenda', (done) => {
    const scheduledJobs = [
      {
        name: 'known',
        every: '1 minute',
        lspId: new ObjectId(),
      },
    ];
    const handler = {
      run: () => {},
    };
    const handlerSpy = sinon.spy(handler, 'run');
    const knownSchedulers = {
      known: handler,
    };
    let entities;
    setup(schema, scheduledJobs, knownSchedulers)
      .then((e) => {
        entities = e;
        const applicationScheduler = new ApplicationScheduler(entities.agenda);
        applicationScheduler.logger = nullLogger;
        applicationScheduler.schema = entities.schema;
        applicationScheduler.schedulerFactory = entities.schedulerFactory;
        return applicationScheduler.configure.call(applicationScheduler);
      })
      .then(() => {
        expect(entities.schema.Scheduler.find.called).to.eql(true);
        expect(entities.schedulerFactory.called).to.eql(true);
        expect(entities.agenda.define.called).to.eql(true);
        expect(entities.agenda.every.called).to.eql(true);
        expect(entities.agenda.start.called).to.eql(true);
        expect(entities.agenda.stop.called).to.eql(true);
        expect(handlerSpy.called).to.eql(false);
      })
      .then(() => {
        done();
      })
      .catch(done);
  });
});
*/