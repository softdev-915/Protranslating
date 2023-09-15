/* eslint-disable no-unused-expressions,class-methods-use-this */
/* global describe, it, before, beforeEach, after, afterEach 
const chai = require('chai');
const faker = require('faker');
const mongoose = require('mongoose');
const { Types: { ObjectId } } = require('mongoose');
require('mocha');

const expect = chai.expect;
const { buildSchema } = require('../../../components/database/mongo/schemas');
const { loadData } = require('../../../components/database/mongo/schemas/helper');

const mockSchema = (schema, currencies) => loadData(schema, { Currency: currencies });

const nullLogger = require('../../../../../app/components/log/null-logger');

const CurrencyAPI = require('../../../../../app/endpoints/lsp/currency/currency-api');

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

const mockCurrency = (templateCurrency) => {
  const currency = {
    _id: new mongoose.Types.ObjectId(),
    name: faker.lorem.word(),
    isoCode: faker.lorem.word(),
    deletedAt: new Date(),
    restoredAt: new Date(),
    deleted: false,
  };
  if (templateCurrency) {
    Object.assign(currency, templateCurrency);
  }
  return currency;
};

const mockCurrencies = (howMany, lsp) => {
  const list = [];
  let template;
  if (howMany > 0) {
    for (let i = 1; i <= howMany; i++) {
      template = {
        lspId: lsp,
      };
      const currency = mockCurrency(template);
      list.push(currency);
    }
  }
  return list;
};

const currenciesLSP1 = mockCurrencies(3, lspId._id);
const currenciesLSP2 = mockCurrencies(3, lspId2._id);
const allCurrencies = currenciesLSP1.concat(currenciesLSP2);

describe('currencyAPI', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
  }));

  it('should return an empty list', async () => {
    const currencyAPI = new CurrencyAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    currencyAPI.logger = nullLogger;
    currencyAPI.schema = schema;
    await mockSchema(schema, []);
    const result = await currencyAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(0);
  });

  it('should only list currencies for LSP1', async () => {
    const currencyAPI = new CurrencyAPI(nullLogger, {
      user: currentUser,
      configuration: testConfig });
    currencyAPI.logger = nullLogger;
    currencyAPI.schema = schema;
    await mockSchema(schema, allCurrencies);
    const result = await currencyAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(3);
    expect(result.list[0].lspId.toString()).to.eql(lspId._id.toString());
    expect(result.list[1].lspId.toString()).to.eql(lspId._id.toString());
    expect(result.list[2].lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should only list currencies for LSP2', async () => {
    const currencyAPI = new CurrencyAPI(nullLogger, {
      user: anotherUser,
      configuration: testConfig });
    currencyAPI.logger = nullLogger;
    currencyAPI.schema = schema;
    await mockSchema(schema, allCurrencies);
    const result = await currencyAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(3);
    expect(result.list[0].lspId.toString()).to.eql(lspId2._id.toString());
    expect(result.list[1].lspId.toString()).to.eql(lspId2._id.toString());
    expect(result.list[2].lspId.toString()).to.eql(lspId2._id.toString());
  });

  it('should return a currency when passing an id for LSP1', async () => {
    const currencyAPI = new CurrencyAPI(nullLogger, {
      user: currentUser,
      configuration: testConfig,
    });
    currencyAPI.logger = nullLogger;
    currencyAPI.schema = schema;
    const existingCurrency = currenciesLSP1[0];
    await mockSchema(schema, allCurrencies);
    const result = await currencyAPI.list({ _id: existingCurrency._id.toString() });
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(1);
    expect(result.list[0].id).to.equal(existingCurrency._id.toString());
    expect(result.list[0].name).to.equal(existingCurrency.name);
    expect(result.list[0].isoCode).to.equal(existingCurrency.isoCode);
    expect(result.list[0].lspId.toString()).to.equal(existingCurrency.lspId.toString());
  });

  it('should create a currency for LSP1', async () => {
    const currencyAPI = new CurrencyAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    const newCurrency = {
      name: 'Currency 4',
      isoCode: 'isoCode 4',
      _id: '',
    };
    currencyAPI.logger = nullLogger;
    currencyAPI.schema = schema;
    await mockSchema(schema, allCurrencies);
    const currencyCreated = await currencyAPI.create(newCurrency);
    expect(currencyCreated.name).to.eql(newCurrency.name);
    expect(currencyCreated.lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should throw an error when trying to create a currency if there is already one with the same name for the same lsp', async () => {
    const currencyAPI = new CurrencyAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    currencyAPI.logger = nullLogger;
    currencyAPI.schema = schema;
    await mockSchema(schema, allCurrencies);
    try {
      await currencyAPI.create(allCurrencies[0]);
    } catch (err) {
      expect(err).to.exist;
      expect(err.code).to.eql(409);
    }
  });

  it('should create a currency for another lsp even if another currency with the same name already exist for anothe lsp', async () => {
    const currencyAPI = new CurrencyAPI(nullLogger, {
      user: anotherUser,
      configuration: testConfig,
      lspId2,
    });
    currencyAPI.logger = nullLogger;
    currencyAPI.schema = schema;
    await mockSchema(schema, allCurrencies);
    const newCurrency = mockCurrency();
    const currencyCreated = await currencyAPI.create(newCurrency);
    expect(currencyCreated.name).to.eql(currencyCreated.name);
    expect(currencyCreated.lspId.toString()).to.eql(lspId2._id.toString());
  });

  it('should update a currency', async () => {
    const currencyAPI = new CurrencyAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    const updateCurrency = {
      name: 'Currency 1 updated',
      isoCode: 'isoCode 5',
      _id: allCurrencies[1]._id.toString(),
    };
    currencyAPI.logger = nullLogger;
    currencyAPI.schema = schema;
    await mockSchema(schema, allCurrencies);
    const currencyUpdated = await currencyAPI.update(updateCurrency);
    expect(currencyUpdated.name).to.eql(updateCurrency.name);
    expect(currencyUpdated.isoCode).to.eql(updateCurrency.isoCode);
    expect(currencyUpdated.lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should append the deleted flag with true when deleting a currency', async () => {
    const currencyAPI = new CurrencyAPI(nullLogger, { user: currentUser,
      configuration: testConfig });
    const deleteCurrency = {
      name: 'Currency 1',
      _id: currenciesLSP1[1]._id.toString(),
      deleted: true,
    };
    currencyAPI.logger = nullLogger;
    currencyAPI.schema = schema;
    await mockSchema(schema, currenciesLSP1);
    const currencyUpdated = await currencyAPI.update(deleteCurrency);
    expect(currencyUpdated.name).to.eql(deleteCurrency.name);
    expect(currencyUpdated.deleted).to.eql(true);
    expect(currencyUpdated.lspId.toString()).to.eql(lspId._id.toString());
  });

  it.skip('should return the currency list with 3 results', () => {});
  it.skip('should return the currency list filtered by name', () => {});
});
*/