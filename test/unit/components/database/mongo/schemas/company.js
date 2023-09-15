/* eslint-disable no-unused-expressions,class-methods-use-this */
/* global describe, it, before, beforeEach, after, afterEach */
const _ = require('lodash');
const chai = require('chai');

const { expect } = chai;
const bluebird = require('bluebird');
const sinon = require('sinon');
const mongoose = require('mongoose');

require('sinon-as-promised')(bluebird);
require('sinon-mongoose');

const ObjectId = (_id) => _id;
const ISODate = (date) => new Date(date).toISOString();
const CompanySchema = require('../../../../../../app/components/database/mongo/schemas/company.js');

const Company = mongoose.model('company', CompanySchema);
const CompanyMock = sinon.mock(Company);
const CompaniesDummyList = [
  {
    _id: new ObjectId('591a1913ddd7927da87a4d27'),
    createdAt: ISODate('2017-05-15T21:09:39.945Z'),
    updatedAt: ISODate('2017-05-15T21:09:49.225Z'),
    name: 'LMS19C1',
    lspId: new ObjectId('591a06b7aa73e93a1203f8e4'),
    createdBy: 'lms19u1@sample.com',
    deleted: false,
    hierarchy: '',
    subcompanies: [
      new ObjectId('591a191dddd7927da87a4d30'),
    ],
    subSubParentId: '',
    subParentId: '',
    parentId: '',
    __v: 0,
  },
  {
    _id: new ObjectId('591a191dddd7927da87a4d30'),
    parentCompany: new ObjectId('591a1913ddd7927da87a4d27'),
    createdAt: ISODate('2017-05-15T21:09:49.223Z'),
    updatedAt: ISODate('2017-05-15T21:10:52.184Z'),
    name: 'LMS19S1',
    lspId: new ObjectId('591a06b7aa73e93a1203f8e4'),
    createdBy: 'lms19u1@sample.com',
    deleted: false,
    hierarchy: '591a1913ddd7927da87a4d27',
    subcompanies: [
      new ObjectId('591a1929ddd7927da87a4d3b'),
    ],
    subSubParentId: '',
    subParentId: '',
    parentId: '591a1913ddd7927da87a4d27',
    __v: 0,
  },
  {
    _id: new ObjectId('591a1929ddd7927da87a4d3b'),
    subparentCompany: new ObjectId('591a191dddd7927da87a4d30'),
    parentObj: new ObjectId('591a1913ddd7927da87a4d27'),
    createdAt: ISODate('2017-05-15T21:10:01.804Z'),
    updatedAt: ISODate('2017-05-15T21:10:01.804Z'),
    name: 'LMS19SS1',
    lspId: new ObjectId('591a06b7aa73e93a1203f8e4'),
    createdBy: 'lms19u1@sample.com',
    deleted: false,
    hierarchy: '591a1913ddd7927da87a4d27#591a191dddd7927da87a4d30',
    subcompanies: [],
    subSubParentId: '',
    subParentId: '591a191dddd7927da87a4d30',
    parentId: '591a1913ddd7927da87a4d27',
    __v: 0,
  },
];

describe('Company Model', () => {
  it('should call Company.save', (done) => {
    const companyData = { name: 'First' };
    const companyMock = sinon.mock(new Company(companyData));
    const company = companyMock.object;

    companyMock
      .expects('save')
      .yields(null, companyData);

    company.save((err, doc) => {
      CompanyMock.verify();
      CompanyMock.restore();
      expect(err).to.be.a('null');
      expect(doc).to.be.an('object').that.deep.equals(companyData);
      done();
    });
  });

  it('should link documents', (done) => {
    const populatedDoc = CompaniesDummyList[1];

    CompanyMock
      .expects('findOneAndUpdate')
      .withArgs(
        { _id: populatedDoc.parentId },
        { $addToSet: { subcompanies: populatedDoc._id } },
        { new: true },
      )
      .chain('exec')
      .resolves(populatedDoc);

    Company.linkDocuments(populatedDoc).then((result) => {
      CompanyMock.verify();
      CompanyMock.restore();
      expect(result).to.have.property('subcompanies')
        .that.is.an('array');
      done();
    });
  });

  it('should unlink documents', (done) => {
    // Override Company Mock
    const CompanyMock = sinon.mock(Company);
    const populatedDoc = CompaniesDummyList[1];

    CompanyMock
      .expects('findOneAndUpdate')
      .withArgs(
        { _id: populatedDoc.parentId },
        { $pull: { subcompanies: populatedDoc._id } },
        { new: true },
      )
      .chain('exec')
      .yields(null, populatedDoc);

    Company.unLinkDocuments(populatedDoc, (err, result) => {
      CompanyMock.verify();
      CompanyMock.restore();
      expect(result).to.have.property('subcompanies')
        .that.is.an('array');
      done();
    });
  });

  it('should find with deleted and populate hierarchy', (done) => {
    // Override Company Mock
    const CompanyMock = sinon.mock(Company);
    const expectedParams = { };
    const populatedDoc = CompaniesDummyList[0];
    populatedDoc.parentId = { _id: 'PARENTID' };
    CompanyMock
      .expects('findWithDeleted').withArgs(expectedParams)
      .chain('populate')
      .chain('exec')
      .resolves(populatedDoc);

    Company.findWithDeletedAndPopulateHierarchy({}).then((result) => {
      CompanyMock.verify();
      CompanyMock.restore();
      expect(result).to.have.property('parentId')
        .that.is.an('object')
        .that.deep.equals({ _id: 'PARENTID' });
      done();
    });
  });

  it('should find and populate', (done) => {
    const expectedParams = { _id: 'ID', lspId: 'LSPID' };
    const populatedDoc = CompaniesDummyList[0];
    populatedDoc.parentId = { _id: 'PARENTID' };
    CompanyMock
      .expects('findOne').withArgs(expectedParams)
      .chain('populate')
      .chain('exec')
      .resolves(populatedDoc);

    Company.findOneAndPopulate('ID', 'LSPID').then((result) => {
      CompanyMock.verify();
      CompanyMock.restore();
      expect(result).to.have.property('parentId')
        .that.is.an('object')
        .that.deep.equals({ _id: 'PARENTID' });
      done();
    });
  });
});
