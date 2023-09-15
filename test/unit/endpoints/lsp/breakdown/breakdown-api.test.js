/* eslint-disable no-unused-expressions,class-methods-use-this */
/* global describe, it, before, beforeEach, after, afterEach 
const mongoose = require('mongoose');
const { Types: { ObjectId } } = require('mongoose');
const faker = require('faker');
const chai = require('chai');
require('mocha');

const expect = chai.expect;
const { buildSchema } = require('../../../components/database/mongo/schemas');
const { loadData } = require('../../../components/database/mongo/schemas/helper');

const mockSchema = (schema, breakdowns) => loadData(schema, { Breakdown: breakdowns });

const nullLogger = require('../../../../../app/components/log/null-logger');

const BreakdownAPI = require('../../../../../app/endpoints/lsp/breakdown/breakdown-api');

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

const mockBreakdown = (templateBreakdown) => {
  const breakdown = {
    _id: new mongoose.Types.ObjectId(),
    name: faker.lorem.word(),
    deletedAt: new Date(),
    restoredAt: new Date(),
    deleted: false,
  };
  if (templateBreakdown) {
    Object.assign(breakdown, templateBreakdown);
  }
  return breakdown;
};

const mockBreakdowns = (howMany, lsp) => {
  const list = [];
  let template;
  if (howMany > 0) {
    for (let i = 1; i <= howMany; i++) {
      template = {
        lspId: lsp,
      };
      const breakdown = mockBreakdown(template);
      list.push(breakdown);
    }
  }
  return list;
};

const breakdownsLSP1 = mockBreakdowns(3, lspId._id);

const breakdownsLSP2 = mockBreakdowns(3, lspId2._id);

const allBreakdowns = breakdownsLSP1.concat(breakdownsLSP2);

describe('Breakdown API', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
  }));

  it('should return an empty list', async () => {
    const breakdownAPI = new BreakdownAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    breakdownAPI.logger = nullLogger;
    breakdownAPI.schema = schema;
    await mockSchema(schema, []);
    const result = await breakdownAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(0);
  });

  it('should only return breakdowns for LSP 1', async () => {
    const breakdownAPI = new BreakdownAPI(nullLogger, {
      user: currentUser,
      configuration: testConfig,
    });
    breakdownAPI.logger = nullLogger;
    breakdownAPI.schema = schema;
    await mockSchema(schema, allBreakdowns);
    const result = await breakdownAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(3);
    expect(result.list[0].lspId.toString()).to.eql(lspId._id.toString());
    expect(result.list[1].lspId.toString()).to.eql(lspId._id.toString());
    expect(result.list[2].lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should only return breakdowns for LSP 2', async () => {
    const breakdownAPI = new BreakdownAPI(nullLogger, {
      user: anotherUser,
      configuration: testConfig,
    });
    breakdownAPI.logger = nullLogger;
    breakdownAPI.schema = schema;
    await mockSchema(schema, allBreakdowns);
    const result = await breakdownAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(3);
    expect(result.list[0].lspId.toString()).to.eql(lspId2._id.toString());
    expect(result.list[1].lspId.toString()).to.eql(lspId2._id.toString());
    expect(result.list[2].lspId.toString()).to.eql(lspId2._id.toString());
  });

  it('should return a breakdown when passing an id', async () => {
    const breakdownAPI = new BreakdownAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    breakdownAPI.logger = nullLogger;
    breakdownAPI.schema = schema;
    const existingMethodId = breakdownsLSP1[0]._id.toString();
    await mockSchema(schema, breakdownsLSP1);
    const result = await breakdownAPI.list({ _id: existingMethodId });
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(1);
    expect(result.list[0].id).to.equal(existingMethodId);
  });

  it('should create a breakdown for LSP 1', async () => {
    const breakdownAPI = new BreakdownAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    const newBreakdown = {
      name: 'Match 4',
      _id: '',
    };
    breakdownAPI.logger = nullLogger;
    breakdownAPI.schema = schema;
    await mockSchema(schema, []);
    const breakdownCreated = await breakdownAPI.create(newBreakdown);
    expect(breakdownCreated.name).to.eql(newBreakdown.name);
    expect(breakdownCreated.lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should throw an error when trying to create a breakdown if there is already one with the same name for the same lsp', async () => {
    const breakdownAPI = new BreakdownAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    breakdownAPI.logger = nullLogger;
    breakdownAPI.schema = schema;
    await mockSchema(schema, allBreakdowns);
    try {
      await breakdownAPI.create(allBreakdowns[0]);
    } catch (err) {
      expect(err).to.exist;
      expect(err.code).to.eql(409);
      expect(err.message).to.eql('Fuzzy match already exists');
    }
  });

  it('should create a breakdown for another lsp even if another breakdown with the same name already exist for anothe lsp', async () => {
    const breakdownAPI = new BreakdownAPI(nullLogger, {
      user: anotherUser,
      configuration: testConfig,
      lspId2,
    });
    breakdownAPI.logger = nullLogger;
    breakdownAPI.schema = schema;
    await mockSchema(schema, breakdownsLSP1);
    const newBreakdown = {
      name: 'Match 1',
      _id: '',
    };
    const breakdownCreated = await breakdownAPI.create(newBreakdown);
    expect(breakdownCreated.name).to.eql(breakdownCreated.name);
    expect(breakdownCreated.lspId.toString()).to.eql(lspId2._id.toString());
  });

  it('should update a breakdown', async () => {
    const breakdownAPI = new BreakdownAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    const updateBreakdown = {
      name: 'Match 1 updated',
      _id: allBreakdowns[1]._id.toString(),
    };
    breakdownAPI.logger = nullLogger;
    breakdownAPI.schema = schema;
    await mockSchema(schema, allBreakdowns);
    const breakdownUpdated = await breakdownAPI.update(updateBreakdown);
    expect(breakdownUpdated.name).to.eql(updateBreakdown.name);
    expect(breakdownUpdated.lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should append the deleted flag with true when deleting a breakdown', async () => {
    const breakdownAPI = new BreakdownAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    const deleteBreakdown = {
      name: 'Match 1',
      _id: breakdownsLSP1[1]._id.toString(),
      deleted: true,
    };
    breakdownAPI.logger = nullLogger;
    breakdownAPI.schema = schema;
    await mockSchema(schema, breakdownsLSP1);
    const breakdownUpdated = await breakdownAPI.update(deleteBreakdown);
    expect(breakdownUpdated.name).to.eql(deleteBreakdown.name);
    expect(breakdownUpdated.deleted).to.eql(true);
    expect(breakdownUpdated.lspId.toString()).to.eql(lspId._id.toString());
  });
  it.skip('should return the breakdown list with 3 results', () => {});
  it.skip('should return the breakdown list filtered by name', () => {});
});
*/