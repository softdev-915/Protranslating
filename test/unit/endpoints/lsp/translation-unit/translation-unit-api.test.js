/* eslint-disable no-unused-expressions,class-methods-use-this */
/* global describe, it, before, beforeEach, after, afterEach 
const chai = require('chai');
const { Types: { ObjectId } } = require('mongoose');
const faker = require('faker');
require('mocha');

const expect = chai.expect;
const { buildSchema } = require('../../../components/database/mongo/schemas');
const { loadData } = require('../../../components/database/mongo/schemas/helper');

const mockSchema = (schema, translationUnits) =>
  loadData(schema, { TranslationUnit: translationUnits });

const nullLogger = require('../../../../../app/components/log/null-logger');

const TranslationUnitAPI = require('../../../../../app/endpoints/lsp/translation-unit/translation-unit-api');

const lspId = {
  _id: new ObjectId(),
};

const lspId2 = {
  _id: new ObjectId(),
};

const currentUser = {
  email: 'test@protranslating.com',
  lsp: lspId,
};

const anotherUser = {
  email: 'test@anotherLsp.com',
  lsp: lspId2,
};

const testConfig = {
  get() {

  },
  environment {
    return {};
  },
};

const mockTranslationUnit = (templateTranslationUnit) => {
  const translationUnit = {
    _id: new ObjectId(),
    name: faker.lorem.word(),
    deletedAt: new Date(),
    restoredAt: new Date(),
    deleted: false,
  };
  if (templateTranslationUnit) {
    Object.assign(translationUnit, templateTranslationUnit);
  }
  return translationUnit;
};

const mockTranslationUnits = (howMany, lsp) => {
  const list = [];
  let template;
  if (howMany > 0) {
    for (let i = 1; i <= howMany; i++) {
      template = {
        lspId: lsp,
      };
      const translationUnit = mockTranslationUnit(template);
      list.push(translationUnit);
    }
  }
  return list;
};

const translationUnitsLSP1 = mockTranslationUnits(3, lspId);

const translationUnitsLSP2 = mockTranslationUnits(3, lspId2);

const allTranslationUnits = translationUnitsLSP1.concat(translationUnitsLSP2);

describe('Translation Unit API', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
  }));

  it('should return an empty list', async () => {
    const translationUnitAPI = new TranslationUnitAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    translationUnitAPI.logger = nullLogger;
    translationUnitAPI.schema = schema;
    await mockSchema(schema, []);
    const result = await translationUnitAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(0);
  });


  it('should only return records from LSP1', async () => {
    const translationUnitAPI = new TranslationUnitAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    translationUnitAPI.logger = nullLogger;
    translationUnitAPI.schema = schema;
    await mockSchema(schema, allTranslationUnits);
    const result = await translationUnitAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(3);
    expect(result.list[0].lspId.toString()).to.eql(lspId._id.toString());
    expect(result.list[1].lspId.toString()).to.eql(lspId._id.toString());
    expect(result.list[2].lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should return records from LSP2', async () => {
    const translationUnitAPI = new TranslationUnitAPI(nullLogger, { user: anotherUser,
      configuration: testConfig });
    translationUnitAPI.logger = nullLogger;
    translationUnitAPI.schema = schema;
    await mockSchema(schema, allTranslationUnits);
    const result = await translationUnitAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(3);
    expect(result.list[0].lspId.toString()).to.eql(lspId2._id.toString());
    expect(result.list[1].lspId.toString()).to.eql(lspId2._id.toString());
    expect(result.list[2].lspId.toString()).to.eql(lspId2._id.toString());
  });

  it('should return a translation unit when passing an id', async () => {
    const translationUnitAPI = new TranslationUnitAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    translationUnitAPI.logger = nullLogger;
    translationUnitAPI.schema = schema;
    const existingMethodId = allTranslationUnits[1]._id.toString();
    await mockSchema(schema, allTranslationUnits);
    const result = await translationUnitAPI.list({ _id: existingMethodId });
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(1);
    expect(result.list[0].id).to.equal(existingMethodId);
    expect(result.list[0].lspId.toString()).to.equal(lspId._id.toString());
  });

  it('should create a translation unit', async () => {
    const translationUnitAPI = new TranslationUnitAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    const newTranslationUnit = mockTranslationUnit();
    translationUnitAPI.logger = nullLogger;
    translationUnitAPI.schema = schema;
    await mockSchema(schema, allTranslationUnits);
    const translationUnitCreated = await translationUnitAPI.create(newTranslationUnit);
    expect(translationUnitCreated.name).to.eql(newTranslationUnit.name);
    expect(translationUnitCreated.lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should create a translation unit for another lsp even if another one with the same name already exist', async () => {
    const translationUnitAPI = new TranslationUnitAPI(nullLogger, {
      user: anotherUser,
      configuration: testConfig,
    });
    const newTranslationUnit = mockTranslationUnit();
    translationUnitAPI.logger = nullLogger;
    translationUnitAPI.schema = schema;
    await mockSchema(schema, allTranslationUnits);
    const translationUnitCreated = await translationUnitAPI.create(newTranslationUnit);
    expect(translationUnitCreated.name).to.eql(newTranslationUnit.name);
    expect(translationUnitCreated.lspId.toString()).to.eql(lspId2._id.toString());
  });

  it('should throw an error when trying to create an internal department if there is already one with the same name for the same lsp', async () => {
    const translationUnitAPI = new TranslationUnitAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    translationUnitAPI.logger = nullLogger;
    translationUnitAPI.schema = schema;
    await mockSchema(schema, allTranslationUnits);
    try {
      await translationUnitAPI.create(allTranslationUnits[1]);
    } catch (err) {
      expect(err).to.exist;
      expect(err.code).to.eql(409);
      expect(err.message).to.eql('Translation unit already exists');
    }
  });

  it('should update a translation unit', async () => {
    const translationUnitAPI = new TranslationUnitAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    const updateUnit = {
      name: 'Unit 1 updated',
      _id: allTranslationUnits[2]._id.toString(),
      lspId,
    };
    translationUnitAPI.logger = nullLogger;
    translationUnitAPI.schema = schema;
    await mockSchema(schema, allTranslationUnits);
    const translationUnitUpdated = await translationUnitAPI.update(updateUnit);
    expect(translationUnitUpdated.name).to.eql(updateUnit.name);
    expect(translationUnitUpdated.lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should append the deleted flag with true when deleting a unit', async () => {
    const translationUnitAPI = new TranslationUnitAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    const deleteUnit = {
      name: 'Unit 1',
      _id: allTranslationUnits[2]._id.toString(),
      lspId,
      deleted: true,
    };
    translationUnitAPI.logger = nullLogger;
    translationUnitAPI.schema = schema;
    await mockSchema(schema, allTranslationUnits);
    const translationUnitUpdated = await translationUnitAPI.update(deleteUnit);
    expect(translationUnitUpdated.name).to.eql(deleteUnit.name);
    expect(translationUnitUpdated.deleted).to.eql(true);
    expect(translationUnitUpdated.lspId.toString()).to.eql(lspId._id.toString());
  });

  it.skip('should return the unit list with 3 results', () => {});
  it.skip('should return the unit list filtered by name', () => {});
});
*/