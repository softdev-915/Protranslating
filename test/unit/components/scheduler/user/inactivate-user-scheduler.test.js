/* eslint-disable no-unused-expressions,class-methods-use-this,global-require*/
/* global describe, it, before, beforeEach, after, afterEach 
const Promise = require('bluebird');
const chai = require('chai');
const moment = require('moment');
const nullLogger = require('../../../../../app/components/log/null-logger');
const { Types: { ObjectId } } = require('mongoose');
require('mocha');

const expect = chai.expect;

const InactivateUserScheduler = require('../../../../../app/components/scheduler/user');

const { buildSchema } = require('../../database/mongo/schemas');
const { loadData } = require('../../database/mongo/schemas/helper');

const mockSchema = (schema, users) => loadData(schema, { User: users });

const lspId = new ObjectId();

// const loggerSpy = sinon.spy(nullLogger, 'warn');

describe('InactivateUserScheduler', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
  }));

//  afterEach(() => { loggerSpy.reset(); });

  it('should run the scheduler inactive-user and build the proper query to inactivate users', (done) => {
    const name = 'user';
    const testData = {
      test: true,
      lspId: lspId,
    };
    const mockJob = { attrs: { data: testData } };
    mockSchema(schema, []).then(() => {
      const inactivateUserScheduler = new InactivateUserScheduler(name, null,
        { inactivePeriod: 75 });
      inactivateUserScheduler.schema = schema;
      inactivateUserScheduler.logger = nullLogger;
      return new Promise((resolve) => {
        inactivateUserScheduler.run(mockJob, (a) => {
          resolve(a);
        });
      });
    })
    .then(() => {
      const fromInactiveDate = moment.utc().subtract('days', 75).format('YYYY-MM-DD');
      const updateCall = schema.User.update.getCalls();
      expect(updateCall[0].args.length).to.eql(3);
      expect(updateCall[0].args[0].$or.length).to.eql(2);
      expect(updateCall[0].args[0].$or[0].$and.length).to.eql(2);

      const createdAtField = updateCall[0].args[0].$or[0].$and[0].createdAt.$lt;
      const createdAtMoment = moment(createdAtField).utc().format('YYYY-MM-DD');
      expect(createdAtMoment).to.eql(fromInactiveDate);
      expect(updateCall[0].args[0].$or[0].$and[1].$or[0].lastLoginAt)
        .to.be.null;
      expect(updateCall[0].args[0].$or[0].$and[1].$or[1].lastLoginAt.$exists)
        .to.be.false;
      const lastLoginAtField = updateCall[0].args[0].$or[1].lastLoginAt.$lt;
      const lastLoginAtMoment = moment(lastLoginAtField).utc().format('YYYY-MM-DD');
      expect(lastLoginAtMoment).to.eql(fromInactiveDate);
      expect(updateCall[0].args[0].lsp).to.exist;
      expect(updateCall[0].args[1].$set).to.eql({ deleted: true });
      expect(updateCall[0].args[2].multi).to.eql(true);
      expect(schema.User.inactivateUsers.args.length).to.eql(1);
      expect(schema.User.inactivateUsers.args[0][0]).to.eql(75);
    }).then(() => {
      done();
    })
    .catch((err) => {
      expect(err).to.not.exist;
      done(err);
    });
  });
});
*/