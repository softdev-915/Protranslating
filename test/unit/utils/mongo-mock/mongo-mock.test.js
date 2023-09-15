/* eslint-disable global-require,import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies,no-unused-expressions */
/* global describe, it, beforeEach
const chai = require('chai');
const mongoose = require('mongoose');
require('mocha');

const { buildSchema } = require('../../components/database/mongo/schemas');

const expect = chai.expect;

describe('Mongo mock', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
  }));

  it('test insertion', (done) => {
    const user = new schema.CatTool({
      name: 'memoq',
    });
    schema.CatTool.find()
    .then((catTools) => {
      expect(catTools).to.exist;
      expect(catTools.length).to.eql(0);
    })
    .then(() => user.save())
    .then((saveResult) => {
      expect(saveResult.errors).to.not.exist;
      return schema.CatTool.find();
    })
    .then((catTools) => {
      expect(catTools).to.exist;
      expect(catTools.length).to.eql(1);
      expect(catTools[0].name).to.eql('memoq');
      done();
    })
    .catch(done);
  });

  it('test insertion with id', (done) => {
    const user = new schema.CatTool({
      _id: new mongoose.Types.ObjectId(),
      name: 'memoq',
    });
    schema.CatTool.find()
    .then((catTools) => {
      expect(catTools).to.exist;
      expect(catTools.length).to.eql(0);
    })
    .then(() => user.save())
    .then((saveResult) => {
      expect(saveResult.errors).to.not.exist;
      return schema.CatTool.find();
    })
    .then((catTools) => {
      expect(catTools).to.exist;
      expect(catTools.length).to.eql(1);
      expect(catTools[0].name).to.eql('memoq');
      done();
    })
    .catch(done);
  });
});
*/
