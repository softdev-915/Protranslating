/*const chai = require('chai');

require('mocha');

const { buildSchema } = require('../database/mongo/schemas');
const { loadData } = require('../database/mongo/schemas/helper');
const nullLogger = require('../../../../app/components/log/null-logger');
const SchedulerJobObserver = require('../../../../app/components/scheduler/scheduler-job-observer');
const { Types: { ObjectId } } = require('mongoose');

const expect = chai.expect;
const lspId1 = new ObjectId();
const knownScheduler = {
  name: 'knownScheduler',
  lspId: lspId1,
};

const failingScheduler = {
  lspId: lspId1,
  run: () => {
    throw new Error('Failing scheduler');
  },
};

const successScheduler = {
  lspId: lspId1,
  run: (job, done) => done(),
};

describe('SchedulerJobObserver test', () => {
  let schema;
  beforeEach((done) => {
    buildSchema().then((s) => {
      loadData(s, {
        Scheduler: knownScheduler,
      }).then(() => {
        schema = s;
        done();
      });
    });
  });

  it.skip('should save an error if the scheduler fails', (done) => {
    const schedulerJobObserver = new SchedulerJobObserver(schema, failingScheduler, nullLogger);
    schedulerJobObserver.run({
      attrs: {
        name: knownScheduler.name,
        data: {
          lspId: lspId1,
          nameWithoutLsp: knownScheduler.name,
        },
      },
    }, () => {
      schema.Scheduler.findOne({ name: knownScheduler.name, lspId: lspId1 })
        .then((dbScheduler) => {
          expect(dbScheduler).to.exist;
          expect(dbScheduler.executionHistory).to.exist;
          expect(dbScheduler.executionHistory.length).to.eql(2);
          expect(dbScheduler.executionHistory[0].status).to.eql('error');
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  it('should save a success message if the scheduler runs successfully', (done) => {
    const schedulerJobObserver = new SchedulerJobObserver(schema, successScheduler);
    schedulerJobObserver.run({
      attrs: {
        name: knownScheduler.name,
        data: {
          lspId: lspId1,
          nameWithoutLsp: knownScheduler.name,
        },
      },
    }, () => {
      schema.Scheduler.findOne({ name: knownScheduler.name, lspId: lspId1 })
        .then((dbScheduler) => {
          expect(dbScheduler).to.exist;
          expect(dbScheduler.executionHistory).to.exist;
          expect(dbScheduler.executionHistory.length).to.eql(2);
          expect(dbScheduler.executionHistory[0].status).to.eql('success');
          done();
        })
        .catch((error) => {
          done(error);
        });
    });
  });
});
*/