/* eslint-disable no-unused-expressions,class-terms-use-this */
/* global describe, it, before, beforeEach, after, afterEach 
const chai = require('chai');
const faker = require('faker');
const mongoose = require('mongoose');
const { Types: { ObjectId } } = require('mongoose');
require('mocha');

const expect = chai.expect;
const { buildSchema } = require('../../../components/database/mongo/schemas');
const { loadData } = require('../../../components/database/mongo/schemas/helper');

const mockSchema = (schema, billingTerms) => loadData(schema, { BillingTerm: billingTerms });

const nullLogger = require('../../../../../app/components/log/null-logger');
const BillingTermAPI = require('../../../../../app/endpoints/lsp/billing-term/billing-term-api');

const lspId = {
  _id: new ObjectId(),
};

const currentUser = {
  email: 'test@protranslating.com',
  lsp: lspId,
};

const lspId2 = new ObjectId();

const userLsp2 = {
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

const mockBillingTerm = (templateBilling) => {
  const billingTerm = {
    _id: new mongoose.Types.ObjectId(),
    name: faker.name.firstName(),
    deletedAt: new Date(),
    restoredAt: new Date(),
    deleted: false,
  };
  if (templateBilling) {
    Object.assign(billingTerm, templateBilling);
  }
  return billingTerm;
};

const mockBillingTerms = (howMany, lsp) => {
  const list = [];
  let template;
  if (howMany > 0) {
    for (let i = 1; i <= howMany; i++) {
      template = {
        lspId: lsp,
      };
      const billingTerm = mockBillingTerm(template);
      list.push(billingTerm);
    }
  }
  return list;
};

const billingTermsLSP1 = mockBillingTerms(3, lspId);

const billingTermsLSP2 = mockBillingTerms(3, lspId2);

const mockUser = (templateUser) => {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const randomNumber = faker.random.number();
  const email = `${firstName}.${lastName}_${randomNumber}@protranslating.com`;
  const user = {
    _id: new mongoose.Types.ObjectId(),
    email,
    firstName,
    lastName,
    roles: [],
    groups: [],
    lsp: lspId,
  };
  if (templateUser) {
    Object.assign(user, templateUser);
  }
  return user;
};

describe('Billing-termAPI', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
  }));

  it('should return an empty list', async () => {
    const billingTermAPI = new BillingTermAPI(nullLogger, {
      user: currentUser,
      configuration: testConfig,
      lspId,
    });
    billingTermAPI.logger = nullLogger;
    billingTermAPI.schema = schema;
    await mockSchema(schema, []);
    const result = await billingTermAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(0);
  });

  it('should only return billing terms from LSP1', async () => {
    const billingTermAPI = new BillingTermAPI(nullLogger, {
      user: currentUser,
      configuration: testConfig,
    });
    billingTermAPI.logger = nullLogger;
    billingTermAPI.schema = schema;
    const allBillingTerms = billingTermsLSP1.concat(billingTermsLSP2);
    await mockSchema(schema, allBillingTerms);
    const result = await billingTermAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(3);
    expect(result.list[0].lspId.toString()).to.eql(lspId._id.toString());
    expect(result.list[1].lspId.toString()).to.eql(lspId._id.toString());
    expect(result.list[2].lspId.toString()).to.eql(lspId._id.toString());
  });


  it('should only return billing terms from LSP2', async () => {
    const billingTermAPI = new BillingTermAPI(nullLogger, {
      user: userLsp2,
      configuration: testConfig,
      lspId,
    });
    billingTermAPI.logger = nullLogger;
    billingTermAPI.schema = schema;
    const allBillingTerms = billingTermsLSP1.concat(billingTermsLSP2);
    await mockSchema(schema, allBillingTerms);
    const result = await billingTermAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(3);
    expect(result.list[0].lspId.toString()).to.eql(lspId2._id.toString());
    expect(result.list[1].lspId.toString()).to.eql(lspId2._id.toString());
    expect(result.list[2].lspId.toString()).to.eql(lspId2._id.toString());
  });

  it('should return a billing term of LSP1 when passing an id', async () => {
    const user = mockUser({ roles: ['BILLING-TERM_READ_ALL'], type: 'Staff' });
    const billingTermAPI = new BillingTermAPI(nullLogger, {
      user: user,
      configuration: testConfig,
      lspId,
    });
    billingTermAPI.logger = nullLogger;
    billingTermAPI.schema = schema;
    const existingTermId = billingTermsLSP1[0]._id.toString();
    const allBillingTerms = billingTermsLSP1.concat(billingTermsLSP2);
    await mockSchema(schema, allBillingTerms);
    const result = await billingTermAPI.list({ _id: existingTermId });
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(1);
    expect(result.list[0].id).to.equal(existingTermId);
    expect(result.list[0].lspId.toString()).to.equal(lspId._id.toString());
  });

  it('should create a billing term for LSP1', async () => {
    const user = mockUser({ roles: ['BILLING-TERM_CREATE_ALL'], type: 'Staff' });
    const billingTermAPI = new BillingTermAPI(nullLogger, {
      user: user,
      configuration: testConfig,
      lspId,
    });
    billingTermAPI.logger = nullLogger;
    billingTermAPI.schema = schema;
    await mockSchema(schema, []);
    const newBillingTerm = {
      name: 'Net 100',
      _id: '',
    };
    const billingTermCreated = await billingTermAPI.create(newBillingTerm);
    expect(billingTermCreated.lspId.toString()).to.eql(lspId._id.toString());
    expect(billingTermCreated.name).to.eql(newBillingTerm.name);
  });

  it('should create a billing term for LSP2', async () => {
    const user = mockUser({ roles: ['BILLING-TERM_CREATE_ALL'], type: 'Staff', lsp: lspId2 });
    const billingTermAPI = new BillingTermAPI(nullLogger, {
      user: user,
      configuration: testConfig,
      lspId,
    });
    billingTermAPI.logger = nullLogger;
    billingTermAPI.schema = schema;
    await mockSchema(schema, []);
    const newBillingTerm = {
      name: 'Net 100',
      _id: '',
    };
    const billingTermCreated = await billingTermAPI.create(newBillingTerm);
    expect(billingTermCreated.lspId.toString()).to.eql(lspId2._id.toString());
    expect(billingTermCreated.name).to.eql(newBillingTerm.name);
  });

  it('should throw an error when trying to create a billing term if there is already one with the same name for the same lsp', async () => {
    const user = mockUser({ roles: ['BILLING-TERM_CREATE_ALL'], type: 'Staff' });
    const billingTermAPI = new BillingTermAPI(nullLogger, {
      user: user,
      configuration: testConfig,
      lspId,
    });
    billingTermAPI.logger = nullLogger;
    billingTermAPI.schema = schema;
    const newBillingTerm = {
      name: 'Net 90',
      _id: '',
    };
    await mockSchema(schema, billingTermsLSP1);
    try {
      await billingTermAPI.create(newBillingTerm);
    } catch (err) {
      expect(err).to.exist;
      expect(err.code).to.eql(409);
      expect(err.message).to.eql('Billing term already exists');
    }
  });

  it('should create a billing term for LSP 1 if there is already one with the same name for LSP2', async () => {
    const user = mockUser({ roles: ['BILLING-TERM_CREATE_ALL'], type: 'Staff' });
    const billingTermAPI = new BillingTermAPI(nullLogger, {
      user: user,
      configuration: testConfig,
      lspId,
    });
    billingTermAPI.logger = nullLogger;
    billingTermAPI.schema = schema;
    const newBillingTerm = mockBillingTerm();
    const allBillingTerms = billingTermsLSP1.concat(billingTermsLSP2);
    await mockSchema(schema, allBillingTerms);
    const billingTermCreated = await billingTermAPI.create(newBillingTerm);
    expect(billingTermCreated.lspId.toString()).to.eql(lspId._id.toString());
    expect(billingTermCreated.name).to.eql(newBillingTerm.name);
  });

  it('should update a billing term for LSP1', async () => {
    const user = mockUser({ roles: ['BILLING-TERM_UPDATE_ALL'], type: 'Staff' });
    const billingTermAPI = new BillingTermAPI(nullLogger, {
      user: user,
      configuration: testConfig,
      lspId,
    });
    billingTermAPI.logger = nullLogger;
    billingTermAPI.schema = schema;
    await mockSchema(schema, billingTermsLSP1);
    const updateBillingTerm = {
      name: 'Net 90 updated',
      _id: billingTermsLSP1[0]._id.toString(),
    };
    const billingTermUpdated = await billingTermAPI.update(updateBillingTerm);
    expect(billingTermUpdated.name).to.eql(updateBillingTerm.name);
    expect(billingTermUpdated.lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should append the deleted flag with true when deleting a billing term', async () => {
    const user = mockUser({ roles: ['BILLING-TERM_UPDATE_ALL'], type: 'Staff' });
    const billingTermAPI = new BillingTermAPI(nullLogger, {
      user: user,
      configuration: testConfig,
      lspId,
    });
    billingTermAPI.logger = nullLogger;
    billingTermAPI.schema = schema;
    await mockSchema(schema, billingTermsLSP1);
    const deleteBillingTerm = {
      name: 'Net 60',
      _id: billingTermsLSP1[1]._id.toString(),
      deleted: true,
    };
    const billingTermUpdated = await billingTermAPI.update(deleteBillingTerm);
    expect(billingTermUpdated.name).to.eql(deleteBillingTerm.name);
    expect(billingTermUpdated.deleted).to.eql(true);
    expect(billingTermUpdated.lspId.toString()).to.eql(lspId._id.toString());
  });
  it.skip('should return the billing term list with 3 results', () => {});
  it.skip('should return the billing term list filtered by name', () => {});
});
*/