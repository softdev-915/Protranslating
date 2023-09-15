/* eslint-disable no-unused-expressions,class-forms-use-this */
/* global describe, it, before, beforeEach, after, afterEach 
const chai = require('chai');
const { Types: { ObjectId } } = require('mongoose');
require('mocha');

const expect = chai.expect;
const { buildSchema } = require('../../../components/database/mongo/schemas');
const { loadData } = require('../../../components/database/mongo/schemas/helper');

const mockSchema = (schema, paymentMethods) => {
  if (paymentMethods) {
    return loadData(schema, { PaymentMethod: paymentMethods });
  }
  return schema;
};

const nullLogger = require('../../../../../app/components/log/null-logger');

const PaymentMethodAPI = require('../../../../../app/endpoints/lsp/payment-method/payment-method-api');

const lspId = {
  _id: new ObjectId(),
};

const lspId2 = {
  _id: new ObjectId(),
};

const anotherUser = {
  email: 'test@anotherLsp.com',
  lsp: lspId2,
};

const currentUser = {
  email: 'test@protranslating.com',
  lsp: lspId,
};

const testConfig = {
  get() {

  },
  environment {
    return {};
  },
};

const paymentMethods = [{
  _id: new ObjectId(),
  name: 'Paypal',
  lspId,
}, {
  _id: new ObjectId(),
  name: 'Mastercard',
  lspId,
}, {
  _id: new ObjectId(),
  name: 'Check',
  lspId,
}];

describe('paymentMethodAPI', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
  }));

  it('should return an empty list', async () => {
    const paymentMethodAPI = new PaymentMethodAPI(nullLogger, {
      configuration: testConfig,
      user: currentUser,
      lspId,
    });
    paymentMethodAPI.logger = nullLogger;
    paymentMethodAPI.schema = schema;
    await mockSchema(schema, []);
    const result = await paymentMethodAPI.list({});
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(0);
  });

  it('should return a payment method when passing an id', async () => {
    const paymentMethodAPI = new PaymentMethodAPI(nullLogger, {
      configuration: testConfig,
      user: currentUser,
      lspId,
    });
    paymentMethodAPI.logger = nullLogger;
    paymentMethodAPI.schema = schema;
    const existingPaymentMethodId = paymentMethods[0]._id.toString();
    await mockSchema(schema, paymentMethods);
    const result = await paymentMethodAPI.list({ _id: existingPaymentMethodId });
    expect(result).to.exist;
    expect(result.list).to.exist;
    expect(result.list.length).to.eql(1);
    expect(result.list[0].id).to.equal(existingPaymentMethodId);
  });

  it('should create a payment method', async () => {
    const paymentMethodAPI = new PaymentMethodAPI(nullLogger, {
      configuration: testConfig,
      user: currentUser,
      lspId,
    });
    paymentMethodAPI.logger = nullLogger;
    paymentMethodAPI.schema = schema;
    await mockSchema(schema, []);
    const newPaymentMethod = {
      name: 'Paypal',
      _id: '',
      lspId,
    };
    const paymentMethodCreated = await paymentMethodAPI.create(newPaymentMethod);
    expect(paymentMethodCreated.name).to.eql(newPaymentMethod.name);
  });

  it('should create a payment method for another lsp even if another payment method with the same name already exist', async () => {
    const paymentMethodAPI = new PaymentMethodAPI(nullLogger, {
      configuration: testConfig,
      user: anotherUser,
      lspId2,
    });
    paymentMethodAPI.logger = nullLogger;
    paymentMethodAPI.schema = schema;
    await mockSchema(schema, paymentMethods);
    const newPaymentMethod = {
      name: 'Paypal',
      _id: '',
      lspId2,
    };
    const paymentMethodCreated = await paymentMethodAPI.create(newPaymentMethod);
    expect(paymentMethodCreated.name).to.eql(newPaymentMethod.name);
  });

  it('should update a payment method', async () => {
    const paymentMethodAPI = new PaymentMethodAPI(nullLogger, {
      configuration: testConfig,
      user: currentUser,
      lspId,
    });
    paymentMethodAPI.logger = nullLogger;
    paymentMethodAPI.schema = schema;
    await mockSchema(schema, paymentMethods);
    const updatePaymentMethod = {
      name: 'Paypal 2',
      _id: paymentMethods[0]._id.toString(),
    };
    const paymentMethodUpdated = await paymentMethodAPI.update(updatePaymentMethod);
    expect(paymentMethodUpdated.name).to.eql(updatePaymentMethod.name);
  });

  it('should append the deleted flag with true when deleting a payment method', async () => {
    const paymentMethodAPI = new PaymentMethodAPI(nullLogger, {
      configuration: testConfig,
      user: currentUser,
      lspId,
    });
    paymentMethodAPI.logger = nullLogger;
    paymentMethodAPI.schema = schema;
    await mockSchema(schema, paymentMethods);
    const deletePaymentMethod = {
      name: 'Mastercard',
      _id: paymentMethods[1]._id.toString(),
      deleted: true,
    };
    const paymentMethodUpdated = await paymentMethodAPI.update(deletePaymentMethod);
    expect(paymentMethodUpdated.name).to.eql(deletePaymentMethod.name);
    expect(paymentMethodUpdated.deleted).to.eql(true);
  });
});
*/