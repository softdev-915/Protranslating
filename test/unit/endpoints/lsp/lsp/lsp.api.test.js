/* eslint-disable no-unused-expressions,class-methods-use-this */
/* global describe, it, before, beforeEach, after, afterEach */
const _ = require('lodash');
const chai = require('chai');
const faker = require('faker');
const mongoose = require('mongoose');

require('mocha');

const { expect } = chai;
const mockConf = require('../../../../../app/components/configuration');
const LspAPI = require('../../../../../app/endpoints/lsp/lsp/lsp-api');
const nullLogger = require('../../../../../app/components/log/null-logger');
const { buildSchema } = require('../../../components/database/mongo/schemas');
const { loadData } = require('../../../components/database/mongo/schemas/helper');

const mockSchema = (schema, data) => loadData(schema, {
  User: _.get(data, 'users', []),
  Lsp: _.get(data, 'lsps', []),
});

const mockUser = (templateUser, lspId) => {
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
const lspId1 = new mongoose.Types.ObjectId();
const lspId2 = new mongoose.Types.ObjectId();
const env = mockConf.environment;
const emailConnectionString = env.EMAIL_CONNECTION_STRING;
const lspList = [{
  name: 'Lsp 1',
  _id: lspId1,
  addressInformation: {},
  emailConnectionString,
  pcSettings: { mtThreshold: 0 },
}, {
  name: 'Lsp 2',
  _id: lspId2,
  addressInformation: {},
  emailConnectionString,
  pcSettings: { mtThreshold: 0 },
}];

describe('LSP API', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
  }));

  it.skip('should list the lsp list for a given user', async () => {
    const user1 = mockUser({ email: 'user@lsp.com' }, lspId1);
    const user2 = mockUser({ email: 'user@lsp.com' }, lspId2);
    await mockSchema(schema, { lsps: lspList });
    await mockSchema(schema, { users: [user1, user2] });
    const lspAPI = new LspAPI({
      configuration: mockConf,
      user: user1,
      logger: nullLogger,
    });
    const response = await lspAPI.list('user@lsp.com');
    expect(response).to.exist;
    expect(response.list).to.exist;
    expect(response.list.length).to.eql(2);
    expect(response.list[0].name).to.eql('Lsp 1');
    expect(response.list[1].name).to.eql('Lsp 2');
  });

  it.skip('should list the lsp list even if users are deleted', async () => {
    const user1 = mockUser({ email: 'user@lsp.com' }, lspId1);
    const user2 = mockUser({ email: 'user@lsp.com', deleted: true }, lspId2);
    await mockSchema(schema, { lsps: lspList });
    await mockSchema(schema, { users: [user1, user2] });
    const lspAPI = new LspAPI({
      user: user1,
      configuration: mockConf,
      logger: nullLogger,
    });
    const response = await lspAPI.list('user@lsp.com');
    expect(response).to.exist;
    expect(response.list).to.exist;
    expect(response.list.length).to.eql(2);
  });

  it.skip('should not lsps from terminated users', async () => {
    const user1 = mockUser({ email: 'user@lsp.com' }, lspId1);
    const user2 = mockUser({ email: 'user@lsp.com', terminated: true }, lspId2);
    await mockSchema(schema, { lsps: lspList });
    await mockSchema(schema, { users: [user1, user2] });
    const lspAPI = new LspAPI({
      user: user1,
      configuration: mockConf,
      logger: nullLogger,
    });
    const response = await lspAPI.list('user@lsp.com');
    expect(response).to.exist;
    expect(response.list).to.exist;
    expect(response.list.length).to.eql(1);
  });

  it.skip('should retrieve the current lsp', async () => {
    const user1 = mockUser({ email: 'user@lsp.com' }, lspId1);
    await mockSchema(schema, { lsps: lspList });
    await mockSchema(schema, { users: [user1] });
    const lspAPI = new LspAPI({
      configuration: mockConf,
      user: user1,
      logger: nullLogger,
    });
    const response = await lspAPI.lspDetail();
    expect(response).to.exist;
    expect(response).to.exist;
    expect(response._id.toString()).to.eql(lspId1.toString());
  });

  it.skip('should not retrieve an lsp different than the one in the session', async () => {
    const user1 = mockUser({ email: 'user@lsp.com' }, lspId1);
    const user2 = mockUser({ email: 'user@lsp.com', terminated: true }, lspId2);
    await mockSchema(schema, {
      lsps: [{
        lspId: lspId1,
        name: 'Protranslating',
        emailConnectionString,
        pcSettings: { mtThreshold: 0 },
      }, {
        lspId: lspId2,
        name: 'PTI',
        emailConnectionString,
        pcSettings: { mtThreshold: 0 },
      }],
    });
    await mockSchema(schema, { users: [user1, user2] });
    const lspAPI = new LspAPI({
      configuration: mockConf,
      user: user2,
      logger: nullLogger,
    });
    const response = await lspAPI.lspDetail();
    expect(response).to.not.exist;
  });
});
