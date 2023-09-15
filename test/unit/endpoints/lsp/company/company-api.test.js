/* eslint-disable no-unused-expressions,class-methods-use-this */
/* global describe, it, before, beforeEach, after, afterEach 
const chai = require('chai');
const faker = require('faker');
const mongoose = require('mongoose');
const { Types: { ObjectId } } = require('mongoose');

require('mocha');

const { newMockBucket } = require('../../../../../app/components/aws/mock-bucket');

const expect = chai.expect;
const { buildSchema } = require('../../../components/database/mongo/schemas');
const { loadData } = require('../../../components/database/mongo/schemas/helper');

const mockSchema = (schema, data) => loadData(schema, data);
const nullLogger = require('../../../../../app/components/log/null-logger');
const CompanyAPI = require('../../../../../app/endpoints/lsp/company/company-api');

const ISODate = date => new Date(date).toISOString();
const RATE_ENTITY_TIED_FIELDS = ['breakdown', 'internalDepartment', 'translationUnit'];
const testConfig = require('../../../../../app/components/configuration/index');

const mockCommonEntitySchema = (template) => {
  const entity = {
    _id: new mongoose.Types.ObjectId(),
    name: faker.name.firstName(),
    deletedAt: new Date(),
    restoredAt: new Date(),
    deleted: false,
  };
  if (template) {
    Object.assign(entity, template);
  }
  return entity;
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

const createEntities = (howMany, mockFunction, lsp) => {
  const list = [];
  let template;
  if (howMany > 0) {
    for (let i = 1; i <= howMany; i++) {
      template = {
        lspId: lsp,
      };
      const entity = mockFunction(template);
      list.push(entity);
    }
  }
  return list;
};
const lspId = new ObjectId();
const lspId2 = new ObjectId();
const lsp = {
  _id: lspId,
  emailConnectionString: 'email',
  lspAccountingPlatformLocation: 'lspAccountingPlatformLocation',
  vendorPaymentPeriodStartDate: new Date(),
  securityPolicy: {
    passwordComplexity: {
      lowerCaseLetters: true,
      upperCaseLetters: true,
      specialCharacters: true,
      hasDigitsIncluded: true,
    },
    passwordExpirationDays: 60,
    numberOfPasswordsToKeep: 2,
    minPasswordLength: 10,
    maxInvalidLoginAttempts: 2,
    lockEffectivePeriod: 15,
    timeoutInactivity: 30,
  },
  pcSettings: {
    mtThreshold: 0,
  },
  revenueRecognition: {
    startDate: new Date(),
    endDate: new Date(),
  },
  financialEntityPrefix: 'pre',
  timezone: 'silly',
};
const lsp2 = {
  _id: lspId2,
  emailConnectionString: 'email',
  lspAccountingPlatformLocation: 'lspAccountingPlatformLocation',
  vendorPaymentPeriodStartDate: new Date(),
  securityPolicy: {
    passwordComplexity: {
      lowerCaseLetters: true,
      upperCaseLetters: true,
      specialCharacters: true,
      hasDigitsIncluded: true,
    },
    passwordExpirationDays: 60,
    numberOfPasswordsToKeep: 2,
    minPasswordLength: 10,
    maxInvalidLoginAttempts: 2,
    lockEffectivePeriod: 15,
    timeoutInactivity: 30,
  },
  pcSettings: {
    mtThreshold: 0,
  },
  revenueRecognition: {
    startDate: new Date(),
    endDate: new Date(),
  },
  financialEntityPrefix: 'pre',
  timezone: 'silly',
};
const lsps = [lsp, lsp2];
const languages = [{
  _id: new ObjectId(),
  name: 'Afrikaans',
  isoCode: 'AFR',
}, {
  _id: new ObjectId(),
  name: 'Albanian',
  isoCode: 'SQI',
}, {
  _id: new ObjectId(),
  name: 'Spanish',
  isoCode: 'SPA',
}, {
  _id: new ObjectId(),
  name: 'French',
  isoCode: 'FRE',
}];
const internalDepartmentsLSP1 = createEntities(3, mockCommonEntitySchema, lspId);
const internalDepartmentsLSP2 = createEntities(3, mockCommonEntitySchema, lspId2);
const internalDepartments = internalDepartmentsLSP1.concat(internalDepartmentsLSP2);
const abilitiesLSP1 = createEntities(3, mockCommonEntitySchema, lspId);
const abilitiesLSP2 = createEntities(3, mockCommonEntitySchema, lspId2);
const abilities = abilitiesLSP1.concat(abilitiesLSP2);
const currenciesLSP1 = createEntities(3, mockCurrency, lspId);
const currenciesLSP2 = createEntities(3, mockCurrency, lspId2);
const currencies = currenciesLSP1.concat(currenciesLSP2);
const paymentMethodsLSP1 = createEntities(3, mockCommonEntitySchema, lspId);
const paymentMethodsLSP2 = createEntities(3, mockCommonEntitySchema, lspId2);
const paymentMethods = paymentMethodsLSP1.concat(paymentMethodsLSP2);
const translationUnitsLSP1 = createEntities(3, mockCommonEntitySchema, lspId);
const translationUnitsLSP2 = createEntities(3, mockCommonEntitySchema, lspId2);
const translationUnits = translationUnitsLSP1.concat(translationUnitsLSP2);
const breakdownsLSP1 = createEntities(3, mockCommonEntitySchema, lspId);
const breakdownsLSP2 = createEntities(3, mockCommonEntitySchema, lspId2);
const breakdowns = breakdownsLSP1.concat(breakdownsLSP2);
const billingTermsLSP1 = createEntities(3, mockCommonEntitySchema, lspId);
const billingTermsLSP2 = createEntities(3, mockCommonEntitySchema, lspId2);
const billingTerms = billingTermsLSP1.concat(billingTermsLSP2);
const mockUser = (templateUser, lsp) => {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const randomNumber = faker.random.number();
  const email = `${firstName}.${lastName}_${randomNumber}@protranslating.com`;
  const user = {
    _id: new mongoose.Types.ObjectId(),
    email,
    firstName,
    lastName,
    groups: [],
    lsp,
  };
  if (templateUser) {
    Object.assign(user, templateUser);
  }
  return user;
};

const companies = [{
  _id: new ObjectId(),
  name: 'Company 1',
  lspId,
  deleted: false,
  deletedAt: ISODate(new Date()),
  updatedAt: ISODate(new Date()),
  createdAt: ISODate(new Date()),
  restoredAt: ISODate(new Date()),
  cidr: [],
  billingInformation: {
    billingTerm: billingTermsLSP1[1]._id.toString(),
    paymentMethod: paymentMethods[1]._id.toString(),
    purchaseOrderRequired: false,
    onHold: false,
    onHoldReason: '',
    grossProfit: 15,
    notes: 'Original notes',
    rates: [],
  },
}, {
  _id: new ObjectId(),
  name: 'Company 1',
  lspId,
  deleted: false,
  deletedAt: ISODate(new Date()),
  updatedAt: ISODate(new Date()),
  createdAt: ISODate(new Date()),
  restoredAt: ISODate(new Date()),
  cidr: [],
  billingInformation: {
    billingTerm: billingTermsLSP1[1]._id,
    paymentMethod: paymentMethodsLSP1[1]._id,
    purchaseOrderRequired: false,
    onHold: false,
    onHoldReason: '',
    grossProfit: 15,
    notes: 'Original notes',
    rates: [],
  },
}, {
  _id: new ObjectId(),
  name: 'Company 2',
  lspId,
  deleted: false,
  deletedAt: ISODate(new Date()),
  updatedAt: ISODate(new Date()),
  createdAt: ISODate(new Date()),
  restoredAt: ISODate(new Date()),
  cidr: [],
}, {
  _id: new ObjectId(),
  name: 'Company 2',
  lspId: lspId2,
  deleted: false,
  deletedAt: ISODate(new Date()),
  updatedAt: ISODate(new Date()),
  createdAt: ISODate(new Date()),
  restoredAt: ISODate(new Date()),
  cidr: [],
}];

const mockDependencies = async schema =>
  mockSchema(schema, {
    Lsp: lsps,
    BillingTerm: billingTerms,
    Language: languages,
    PaymentMethod: paymentMethods,
    Ability: abilities,
    TranslationUnit: translationUnits,
    InternalDepartment: internalDepartments,
    Breakdown: breakdowns,
    Currency: currencies,
  });

const compareObjValues = (responseValue, sentValue, property) => {
  if (responseValue !== null) {
    if (sentValue === null || (sentValue && sentValue[property] === null)) {
      expect(responseValue[property]).to.be.null;
    } else {
      expect(responseValue[property].toString()).to.eql(sentValue[property].toString());
    }
  }
};

const assertBillingInformation = (responseValue, originalValue) => {
  expect(responseValue).to.exist;
  expect(responseValue.notes).to.eql(originalValue.notes);
  expect(responseValue.onHold).to.eql(originalValue.onHold);
  expect(responseValue.purchaseOrderRequired).to.eql(originalValue.purchaseOrderRequired);
  expect(responseValue.onHoldReason).to.eql(originalValue.onHoldReason);
  compareObjValues(responseValue, originalValue, 'paymentMethod');
  compareObjValues(responseValue, originalValue, 'billingTerm');
  if (originalValue.rates.length) {
    const originalRate = originalValue.rates[0];
    const rate = responseValue.rates[0];
    const rateDetail = rate.rateDetails[0];
    const originalRateDetail = originalValue.rates[0].rateDetails[0];
    expect(responseValue.rates.length).to.eql(originalValue.rates.length);
    expect(rate.sourceLanguage.name).to.eql(originalRate.sourceLanguage.name);
    expect(rate.targetLanguage.name).to.eql(originalRate.targetLanguage.name);
    compareObjValues(rate.targetLanguage, originalRate.targetLanguage, 'name');
    compareObjValues(originalRate, rate, 'ability');
    expect(rate.minimumCharge).to.eql(originalRate.minimumCharge);
    expect(rate.rateDetails).to.exist;
    expect(rateDetail.price).to.eql(originalRateDetail.price);

    RATE_ENTITY_TIED_FIELDS.forEach((f) => {
      if (originalRateDetail[f]) {
        compareObjValues(rateDetail, originalRateDetail, f);
      }
    });
  }
};

describe('CompanyAPI', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
  }));

  it('should return an empty list', async () => {
    const user = mockUser({ roles: ['COMPANY_READ_ALL'], lsp: lspId });
    const companyAPI = new CompanyAPI(nullLogger, { user, configuration: testConfig, bucket: newMockBucket() });
    companyAPI.logger = nullLogger;
    companyAPI.schema = schema;
    await mockDependencies(schema);
    await mockSchema(schema, { Company: companies });
    const companyList = await companyAPI.list({});
    expect(companyList).to.exist;
    expect(companyList.list).to.exist;
    expect(companyList.list.length).to.eql(3);
  });

  it('should only return LSP1 companies', async () => {
    const user = mockUser({ roles: ['COMPANY_READ_ALL'] }, lspId);
    const companyAPI = new CompanyAPI(nullLogger, { user, configuration: testConfig, bucket: newMockBucket() });
    companyAPI.logger = nullLogger;
    companyAPI.schema = schema;
    await mockDependencies(schema);
    await mockSchema(schema, { Company: companies });
    const companyList = await companyAPI.list({});
    expect(companyList).to.exist;
    expect(companyList.list).to.exist;
    expect(companyList.list.length).to.eql(3);
    expect(companyList.list[0].lspId.toString()).to.eql(lspId._id.toString());
    expect(companyList.list[1].lspId.toString()).to.eql(lspId._id.toString());
    expect(companyList.list[2].lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should only return LSP2 companies', async () => {
    const user = mockUser({ roles: ['COMPANY_READ_ALL'] }, lspId2);
    const companyAPI = new CompanyAPI(nullLogger, { user, configuration: testConfig, bucket: newMockBucket() });
    companyAPI.logger = nullLogger;
    companyAPI.schema = schema;
    await mockDependencies(schema);
    await mockSchema(schema, { Company: companies });
    const companyList = await companyAPI.list({});
    expect(companyList).to.exist;
    expect(companyList.list).to.exist;
    expect(companyList.list.length).to.eql(1);
    expect(companyList.list[0].lspId.toString()).to.eql(lspId2._id.toString());
  });

  it('should retrieve the company\'s billing information if user has COMPANY_READ_ALL', async () => {
    const user = mockUser({ roles: ['COMPANY_READ_ALL'], type: 'Staff', company: { _id: companies[0]._id } }, lspId);
    const companyAPI = new CompanyAPI(nullLogger, { user, configuration: testConfig, bucket: newMockBucket() });
    companyAPI.logger = nullLogger;
    companyAPI.schema = schema;
    await mockDependencies(schema);
    await mockSchema(schema, { Company: companies });
    const result = await companyAPI.getPopulated(user, { _id: companies[0]._id });
    expect(result).to.exist;
    expect(result.billingInformation).to.exist;
  });

  it('should not retrieve the company\'s billing information if user is not the sales Rep and doesnt have the proper roles', async () => {
    const user = mockUser({ roles: ['COMPANY_READ_OWN'], type: 'Staff' }, lspId);
    const companyAPI = new CompanyAPI(nullLogger, { user, configuration: testConfig, bucket: newMockBucket() });
    companyAPI.logger = nullLogger;
    companyAPI.schema = schema;
    await mockDependencies(schema);
    await mockSchema(schema, { Company: companies });
    const result = await companyAPI.getPopulated(user, { _id: companies[0]._id });
    expect(result.billingInformation).to.not.exist;
  });

  it('should retrieve the company\'s billing information if user has COMPANY-BILLING_READ_OWN and he is the sales rep of the company', async () => {
    await mockDependencies(schema);
    const user = mockUser({ roles: ['COMPANY-BILLING_READ_OWN'], type: 'Staff' }, lspId);
    const companyAPI = new CompanyAPI(nullLogger, { user, configuration: testConfig, bucket: newMockBucket() });
    companyAPI.logger = nullLogger;
    companyAPI.schema = schema;
    companies[0].salesRep = user._id;
    await mockSchema(schema, { Company: companies });
    const result = await companyAPI.getPopulated(user, { _id: companies[0]._id });
    assertBillingInformation(result.billingInformation, companies[0].billingInformation);
  });

  it('should not retrieve the billing information if user is the Sales Rep but he doenst have the proper roles', async () => {
    const user = mockUser({ roles: ['COMPANY_READ_OWN'], type: 'Staff' }, lspId);
    const companyAPI = new CompanyAPI(nullLogger, { user, configuration: testConfig, bucket: newMockBucket() });
    companyAPI.logger = nullLogger;
    companyAPI.schema = schema;
    await mockDependencies(schema);
    await mockSchema(schema, { Company: companies });
    const result = await companyAPI.getPopulated(user, { _id: companies[0]._id });
    expect(result).to.exist;
    expect(result.billingInformation).to.not.exist;
  });

  it('should only list companies from LSP1 where the user is salesRep of', async () => {
    await mockDependencies(schema);
    const user = mockUser({ roles: ['COMPANY_READ_OWN', 'COMPANY-BILLING_READ_OWN'], type: 'Staff' }, lspId);
    companies[0].salesRep = user._id;
    const companyAPI = new CompanyAPI(nullLogger, { user, configuration: testConfig, bucket: newMockBucket() });
    companyAPI.logger = nullLogger;
    companyAPI.schema = schema;
    await mockSchema(schema, { Company: companies });
    const result = await companyAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(1);
    expect(result.list[0].lspId.toString()).to.eql(lspId._id.toString());
  });

  it('should only list companies from LSP2 where the user is salesRep of', async () => {
    await mockDependencies(schema);
    const user = mockUser({ roles: ['COMPANY_READ_OWN', 'COMPANY-BILLING_READ_OWN'], type: 'Staff' }, lspId2);
    companies[3].salesRep = user._id;
    const companyAPI = new CompanyAPI(nullLogger, { user, configuration: testConfig, bucket: newMockBucket() });
    companyAPI.logger = nullLogger;
    companyAPI.schema = schema;
    await mockSchema(schema, { Company: companies });
    const result = await companyAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(1);
    expect(result.list[0].lspId.toString()).to.eql(lspId2._id.toString());
  });

  it.skip('should update company\'s billing information', async () => {
    await mockDependencies(schema);
    const user = mockUser({ roles: ['COMPANY_READ_OWN', 'COMPANY-BILLING_UPDATE_OWN'], type: 'Staff' }, lspId);
    companies[0].salesRep = user._id.toString();
    const company = {
      _id: companies[0]._id.toString(),
      lspId,
      billingInformation: {
        purchaseOrderRequired: false,
        notes: 'Notes updated',
        onHold: true,
        onHoldReason: 'Reason of account on holding',
        grossProfit: 10,
        billingTerm: billingTerms[1]._id.toString(),
        paymentMethod: paymentMethods[1]._id.toString(),
        rates: [],
      },
    };
    const companyAPI = new CompanyAPI(nullLogger, { user, configuration: testConfig, bucket: newMockBucket() });
    companyAPI.logger = nullLogger;
    companyAPI.schema = schema;
    await mockSchema(schema, { Company: companies });
    const res = await companyAPI.update(company);
    assertBillingInformation(res.billingInformation, company.billingInformation);
  });

  it.skip('should not update company\'s billing information if user doesnt have the proper roles', async () => {
    await mockDependencies(schema);
    const user = mockUser({ roles: ['COMPANY_READ_OWN', 'COMPANY_UPDATE_ALL'], type: 'Staff' }, lspId);
    companies[1].salesRep = user._id.toString();
    const company = {
      _id: companies[1]._id.toString(),
      billingInformation: {
        purchaseOrderRequired: false,
        notes: 'Notes',
        onHold: true,
        onHoldReason: 'Reason of account on holding',
        grossProfit: 10,
        billingTerm: billingTerms[1]._id.toString(),
        paymentMethod: paymentMethods[1]._id.toString(),
        rates: [],
      },
    };
    const companyAPI = new CompanyAPI(nullLogger, { user, configuration: testConfig, bucket: newMockBucket() });
    companyAPI.logger = nullLogger;
    companyAPI.schema = schema;
    await mockSchema(schema, { Company: companies });
    const res = await companyAPI.update(company);
    assertBillingInformation(res.billingInformation, companies[1].billingInformation);
  });

  it('should list all companies if the user has COMPANY_READ_ALL', async () => {
    await mockDependencies(schema);
    const user = mockUser({ roles: ['COMPANY_READ_ALL'] }, lspId);
    const companyAPI = new CompanyAPI(nullLogger, { user, configuration: testConfig, bucket: newMockBucket() });
    companyAPI.logger = nullLogger;
    companyAPI.schema = schema;
    await mockSchema(schema, { Company: companies });
    const result = await companyAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(3);
  });

  it.skip('should add company rate\'s data', async () => {
    // Mock dependencies
    await mockDependencies(schema);
    const user = mockUser({ roles: ['COMPANY_READ_OWN', 'COMPANY-BILLING_UPDATE_OWN'], type: 'Staff' }, lspId);
    companies[0].salesRep = user._id.toString();
    const company = {
      _id: companies[0]._id.toString(),
      lspId,
      billingInformation: {
        purchaseOrderRequired: false,
        notes: 'Notes updated',
        onHold: true,
        onHoldReason: 'Reason of account on holding',
        grossProfit: 10,
        billingTerm: billingTerms[0]._id.toString(),
        paymentMethod: paymentMethods[0]._id.toString(),
        rates: [{
          sourceLanguage: languages[0],
          targetLanguage: languages[1],
          ability: abilities[1].name,
          minimumCharge: 0,
          rateDetails: [{
            price: 0,
            breakdown: breakdowns[2]._id.toString(),
            translationUnit: translationUnits[2]._id.toString(),
            currency: currencies[1]._id.toString(),
            internalDepartment: internalDepartments[2]._id.toString(),
          }],
        },
        ],
      },
    };
    const companyAPI = new CompanyAPI(nullLogger, { user, configuration: testConfig, bucket: newMockBucket() });
    companyAPI.logger = nullLogger;
    companyAPI.schema = schema;
    await mockSchema(schema, { Company: companies });
    const res = await companyAPI.update(company);
    assertBillingInformation(res.billingInformation, company.billingInformation);
  });

  it.skip('should update company\'s rate data', async () => {
    // Mock dependencies
    await mockDependencies(schema);
    const user = mockUser({ roles: ['COMPANY_READ_OWN', 'COMPANY-BILLING_UPDATE_OWN'], type: 'Staff' }, lspId);
    companies[1].salesRep = user._id.toString();
    const company = {
      _id: companies[1]._id.toString(),
      lspId,
      billingInformation: {
        purchaseOrderRequired: false,
        notes: 'Notes updated',
        onHold: true,
        onHoldReason: 'Reason of account on holding',
        grossProfit: 10,
        billingTerm: billingTerms[2]._id.toString(),
        paymentMethod: paymentMethods[1]._id.toString(),
        rates: [{
          sourceLanguage: languages[1],
          targetLanguage: languages[0],
          ability: abilities[1].name,
          minimumCharge: 20,
          rateDetails: [{
            breakdown: breakdowns[1]._id.toString(),
            currency: currencies[1]._id.toString(),
            translationUnit: translationUnits[1]._id.toString(),
            internalDepartment: internalDepartments[1]._id.toString(),
            price: 20.50,
          }],
        },
        ],
      },
    };
    const companyAPI = new CompanyAPI(nullLogger, { user, configuration: testConfig, bucket: newMockBucket() });
    companyAPI.logger = nullLogger;
    companyAPI.schema = schema;
    await mockSchema(schema, { Company: companies });
    const res = await companyAPI.update(company);
    assertBillingInformation(res.billingInformation, company.billingInformation);
  });
  it.skip('should return the company list with 3 results', async () => {});
  it.skip('should return the company list filtered by company name', async () => {});
  it.skip('should create a company', async () => {});
  it.skip('should update a company', async () => {});
  it.skip('should delete a company', async () => {});
});
*/