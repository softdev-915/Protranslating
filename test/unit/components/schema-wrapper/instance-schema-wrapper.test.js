/* eslint-disable no-unused-expressions,class-methods-use-this */
/* global describe, it, beforeEach 
const Promise = require('bluebird');
const chai = require('chai');
require('mocha');

const expect = chai.expect;

const TEST_USER = { email: 'schema-wrapper-test@protranslating.com' };

const UserSchemaWrapper = require('../../../../app/components/schema-wrapper');
const { buildSchema } = require('../../components/database/mongo/schemas');

const _checkCreatedCatTool = (catTool) => {
  expect(catTool).to.exist;
  expect(catTool._id).to.exist;
  expect(catTool.createdBy).to.exist;
  expect(catTool.updatedBy).to.not.exist;
  expect(catTool.createdBy).to.eql(TEST_USER.email);
};

const _checkUpdatedCatTool = (catTool) => {
  expect(catTool).to.exist;
  expect(catTool._id).to.exist;
  expect(catTool.createdBy).to.exist;
  expect(catTool.updatedBy).to.exist;
  expect(catTool.createdBy).to.eql(TEST_USER.email);
  expect(catTool.updatedBy).to.eql(TEST_USER.email);
};

describe('Instance schema wrapper', () => {
  let schema;

  beforeEach(() => buildSchema().then((s) => {
    schema = new UserSchemaWrapper(TEST_USER, s);
  }));

  it('should set the createdBy on new save', (done) => {
    const catTool = new schema.CatTool({
      name: 'newCatTool',
    });
    catTool.save()
    .then(() => {
      _checkCreatedCatTool(catTool);
      done();
    })
    .catch(done);
  });

  it('should set the updatedBy when update', (done) => {
    const catTool = new schema.CatTool({
      name: 'newCatTool',
    });
    catTool.save()
    .then(() => {
      _checkCreatedCatTool(catTool);
      catTool.name = 'updatedCatTool';
      return catTool.save();
    })
    .then(() => {
      _checkUpdatedCatTool(catTool);
      done();
    })
    .catch(done);
  });
});
*/