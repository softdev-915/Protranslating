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

describe('Static schema wrapper', () => {
  let schema;

  beforeEach(() => buildSchema().then((s) => {
    schema = new UserSchemaWrapper(TEST_USER, s);
  }));

  it('should set the updatedBy when calling update', (done) => {
    let _id;
    const catTool = new schema.CatTool({
      name: 'updateTest',
    });
    catTool.save()
    .then(() => {
      _id = catTool._id;
      _checkCreatedCatTool(catTool);
      return schema.CatTool.update({ _id }, { $set: { name: 'updateTestUpdated' } });
    })
    .then(() => schema.CatTool.findOne({ _id }))
    .then((sameCatTool) => {
      _checkUpdatedCatTool(sameCatTool);
      done();
    })
    .catch(done);
  });

  it('should set the updatedBy when calling updateMany', (done) => {
    let _id1;
    let _id2;
    const catTool1 = new schema.CatTool({
      name: 'updateMany1Test',
    });
    const catTool2 = new schema.CatTool({
      name: 'updateMany2Test',
    });
    Promise.all([catTool1.save(), catTool2.save()])
    .then(() => {
      _id1 = catTool1._id;
      _id2 = catTool2._id;
      _checkCreatedCatTool(catTool1);
      _checkCreatedCatTool(catTool2);
      return schema.CatTool.updateMany({ _id: { $in: [_id1, _id2] } }, { $set: { name: 'updateManyTest' } });
    })
    .then(() => schema.CatTool.find({ _id: { $in: [_id1, _id2] } }))
    .then((catTools) => {
      expect(catTools).to.exist;
      expect(catTools.length).to.eql(2);
      _checkUpdatedCatTool(catTools[0]);
      _checkUpdatedCatTool(catTools[1]);
      done();
    })
    .catch(done);
  });

  it('should set the updatedBy when calling updateOne', (done) => {
    let _id1;
    let _id2;
    const catTool1 = new schema.CatTool({
      name: 'updateOneTest',
    });
    const catTool2 = new schema.CatTool({
      name: 'updateOneTest',
    });
    Promise.all([catTool1.save(), catTool2.save()])
    .then(() => {
      _id1 = catTool1._id;
      _id2 = catTool2._id;
      _checkCreatedCatTool(catTool1);
      _checkCreatedCatTool(catTool2);
      return schema.CatTool.updateOne({ name: 'updateOneTest' }, { $set: { name: 'updateOneTestUpdated' } });
    })
    .then(() => schema.CatTool.find({ _id: { $in: [_id1, _id2] } }))
    .then((catTools) => {
      expect(catTools).to.exist;
      expect(catTools.length).to.eql(2);
      if (catTools[0].name === 'updateOneTest') {
        expect(catTools[1].name).to.eql('updateOneTestUpdated');
        _checkUpdatedCatTool(catTools[1]);
        _checkCreatedCatTool(catTools[0]);
      } else {
        expect(catTools[0].name).to.eql('updateOneTestUpdated');
        expect(catTools[1].name).to.eql('updateOneTest');
        _checkUpdatedCatTool(catTools[0]);
        _checkCreatedCatTool(catTools[1]);
      }
      done();
    })
    .catch(done);
  });

  it('should set the updatedBy when calling findOneAndUpdate', (done) => {
    let _id1;
    let _id2;
    const catTool1 = new schema.CatTool({
      name: 'findOneAndUpdateTest',
    });
    const catTool2 = new schema.CatTool({
      name: 'findOneAndUpdateTest',
    });
    Promise.all([catTool1.save(), catTool2.save()])
    .then(() => {
      _id1 = catTool1._id;
      _id2 = catTool2._id;
      _checkCreatedCatTool(catTool1);
      _checkCreatedCatTool(catTool2);
      return schema.CatTool.findOneAndUpdate({ name: 'findOneAndUpdateTest' }, { $set: { name: 'findOneAndUpdateTestUpdated' } });
    })
    .then((oldCatTool) => {
      _checkCreatedCatTool(oldCatTool);
      return schema.CatTool.find({ _id: { $in: [_id1, _id2] } });
    })
    .then((catTools) => {
      expect(catTools).to.exist;
      expect(catTools.length).to.eql(2);
      if (catTools[0].name === 'findOneAndUpdateTest') {
        expect(catTools[1].name).to.eql('findOneAndUpdateTestUpdated');
        _checkUpdatedCatTool(catTools[1]);
        _checkCreatedCatTool(catTools[0]);
      } else {
        expect(catTools[0].name).to.eql('findOneAndUpdateTestUpdated');
        expect(catTools[1].name).to.eql('findOneAndUpdateTest');
        _checkUpdatedCatTool(catTools[0]);
        _checkCreatedCatTool(catTools[1]);
      }
      done();
    })
    .catch(done);
  });

  it('should set the updatedBy when calling replaceOne', (done) => {
    const catTool1 = new schema.CatTool({
      name: 'replaceOneTest',
    });
    const catTool2 = new schema.CatTool({
      name: 'replaceOneTest',
    });
    Promise.all([catTool1.save(), catTool2.save()])
    .then(() => {
      _checkCreatedCatTool(catTool1);
      _checkCreatedCatTool(catTool2);
      return schema.CatTool.replaceOne({ name: 'replaceOneTest' }, { name: 'replaceOneTestReplaced' });
    })
    .then(() => schema.CatTool.find({ name: { $in: ['replaceOneTest', 'replaceOneTestReplaced'] } }))
    .then((catTools) => {
      expect(catTools).to.exist;
      expect(catTools.length).to.eql(2);
      if (catTools[0].name === 'replaceOneTest') {
        expect(catTools[1].name).to.eql('replaceOneTestReplaced');
        _checkCreatedCatTool(catTools[1]);
        _checkCreatedCatTool(catTools[0]);
      } else {
        expect(catTools[0].name).to.eql('replaceOneTestReplaced');
        expect(catTools[1].name).to.eql('replaceOneTest');
        _checkCreatedCatTool(catTools[0]);
        _checkCreatedCatTool(catTools[1]);
      }
      done();
    })
    .catch(done);
  });

  it('should set the updatedBy when calling findByIdAndUpdate', (done) => {
    let _id1;
    let _id2;
    const catTool1 = new schema.CatTool({
      name: 'findByIdAndUpdateTest',
    });
    const catTool2 = new schema.CatTool({
      name: 'findByIdAndUpdateTest',
    });
    Promise.all([catTool1.save(), catTool2.save()])
    .then(() => {
      _id1 = catTool1._id;
      _id2 = catTool2._id;
      _checkCreatedCatTool(catTool1);
      _checkCreatedCatTool(catTool2);
      return schema.CatTool.findByIdAndUpdate(_id1, { $set: { name: 'findByIdAndUpdateUpdated' } });
    })
    .then(() => schema.CatTool.find({ _id: { $in: [_id1, _id2] } }))
    .then((catTools) => {
      expect(catTools).to.exist;
      expect(catTools.length).to.eql(2);
      if (catTools[0].name === 'findByIdAndUpdateTest') {
        expect(catTools[1].name).to.eql('findByIdAndUpdateUpdated');
        _checkUpdatedCatTool(catTools[1]);
        _checkCreatedCatTool(catTools[0]);
      } else {
        expect(catTools[0].name).to.eql('findByIdAndUpdateUpdated');
        expect(catTools[1].name).to.eql('findByIdAndUpdateTest');
        _checkUpdatedCatTool(catTools[0]);
        _checkCreatedCatTool(catTools[1]);
      }
      done();
    })
    .catch(done);
  });
});
*/