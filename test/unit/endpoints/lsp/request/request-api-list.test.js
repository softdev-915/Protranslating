/* eslint-disable no-useless-escape */
/* eslint-disable quotes */
/* eslint-disable no-unused-expressions,class-methods-use-this */
/* global describe, it, before, beforeEach, after, afterEach */

const Promise = require('bluebird');
const chai = require('chai');
const faker = require('faker');
const sinon = require('sinon');
const mongoose = require('mongoose');

require('mocha');

const nullLogger = require('../../../../../app/components/log/null-logger');

const { expect } = chai;

const mockConf = require('../../../../../app/components/configuration');
const RequestAPI = require('../../../../../app/endpoints/lsp/request/request-api');
const { buildSchema } = require('../../../components/database/mongo/schemas');
const { loadData } = require('../../../components/database/mongo/schemas/helper');

const mockSchema = (schema, data) => loadData(schema, {
  Request: data.requests,
}).then(() => {
  schema.Company.getCompanyFamily = sinon.spy(() => Promise.resolve(data.otherCompanys));
});

const mockRequestSchemaFind = (requestAPI) => {
  requestAPI.schema.Request.find = sinon.spy(() => ({
    populate: () => {},
    sort: () => {},
    exec: () => new Promise((resolve) => {
      resolve([]);
    }),
  }));
  return requestAPI;
};

const mockRequestAPI = (schema, data, user) => {
  const defaultUser = { email: 'email@protranslating.com' };
  const apiUser = user || defaultUser;
  const requestAPI = new RequestAPI({
    user: apiUser,
    configuration: mockConf,
    log: nullLogger,
    mock: false,
  });
  requestAPI.cidrCheck = () => true;
  return mockSchema(schema, data).then(() => {
    requestAPI.schema = schema;
    return requestAPI;
  });
};

const mockUser = (templateUser) => {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const randomNumber = faker.random.number();
  const email = `${firstName}.${lastName}_${randomNumber}@protranslating.com`;
  const lspId = new mongoose.Types.ObjectId();
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

describe('RequestAPI.list', () => {
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
  }));

  it.skip('should fail if user has no proper roles', (done) => {
    let requestAPI;
    const user = mockUser();
    mockRequestAPI(schema, { requests: [] }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.list(['started']);
    })
      .then(() => {
        done('Should have failed');
      }).catch((err) => {
        expect(err).to.exist;
        expect(err.code).to.eql(403);
        expect(err.message).to.eql('You have not privileges to access this resource');
        done();
      });
  });

  it.skip('should return empty if user has role REQUEST_READ_OWN and no company ', (done) => {
    let requestAPI;
    const account = { roles: ['REQUEST_READ_OWN'] };
    const user = mockUser(account);
    mockRequestAPI(schema, { requests: [] }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.list(['started']);
    })
      .then((requestList) => {
        expect(requestList).to.exist;
        expect(requestList.list).to.eql([]);
        expect(requestList.total).to.eql(0);
        done();
      }).catch(done);
  });

  it.skip('should return only the request created by logged in user for users with REQUEST_READ_OWN role', (done) => {
    let requestAPI;
    const testCompany = { _id: 'companyId' };
    const filterParams = {
      statuses: ['started'],
    };
    const account = { roles: ['REQUEST_READ_OWN'], company: testCompany };
    const user = mockUser(account);
    const lspId = user.lsp._id;
    mockRequestAPI(schema, { requests: [] }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.list(filterParams);
    })
      .then((requestList) => {
        expect(requestList).to.exist;
        expect(Array.isArray(requestList.list)).to.be.true;
        expect(requestList.list.length).to.eql(0);
        expect(requestList.total).to.eql(0);
        expect(requestAPI.schema.Request.aggregate.firstCall).to.exist;
        const { firstCall } = requestAPI.schema.Request.aggregate;
        expect(firstCall.args.length).to.eql(1);
        expect(firstCall.args[0][0]).to.eql({
          $match: {
            status: {
              $in: filterParams.statuses,
            },
            contact: user._id,
            lspId,
          },
        });
        done();
      }).catch(done);
  });

  it.skip('should return request for other companys if user has role REQUEST_READ_CUSTOMER', (done) => {
    let requestAPI;
    const testCompany = { _id: new mongoose.Types.ObjectId('594d871a796666b233da1262') };
    const otherCompanys = [{ _id: new mongoose.Types.ObjectId('594d871a796666b233da1263') }, { _id: new mongoose.Types.ObjectId('594d871a796666b233da1264') }];
    const filterParams = {
      statuses: ['started'],
    };
    const account = { roles: ['REQUEST_READ_OWN', 'REQUEST_READ_CUSTOMER'], company: testCompany };
    const user = mockUser(account);
    const lspId = user.lsp._id;
    mockRequestAPI(schema, { requests: [], otherCompanys }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.list(filterParams);
    })
      .then((requestList) => {
        expect(requestList).to.exist;
        expect(Array.isArray(requestList.list)).to.be.true;
        expect(requestList.list.length).to.eql(0);
        expect(requestList.total).to.eql(0);
        expect(requestAPI.schema.Request.aggregate.firstCall).to.exist;
        const { firstCall } = requestAPI.schema.Request.aggregate;
        expect(firstCall.args.length).to.eql(1);
        expect(firstCall.args[0][0]).to.eql({
          $match: {
            lspId,
            status: {
              $in: filterParams.statuses,
            },
            contact: user._id,
          },
        });
        done();
      }).catch(done);
  });

  // this should be re-enabled after refactor
  it.skip('should paginate request list returning page number 2 with 3 results', (done) => {
    let requestAPI;
    const filterParams = {
      paginationParams: {
        page: 2,
        limit: 3,
      },
    };
    const account = { roles: ['REQUEST_READ_ALL'] };
    const companyId = new mongoose.Types.ObjectId();
    const user = mockUser(account);
    const lspId = user.lsp._id;
    const requestsStored = [
      {
        lspId,
        _id: '507f1f77bcf86cd799439011',
        company: companyId.toString(),
        documents: [],
        title: 'Request page 1',
      },
      {
        lspId,
        _id: '507f1f77bcf86cd799439012',
        company: companyId.toString(),
        documents: [],
        title: 'Request page 1',
      },
      {
        lspId,
        _id: '507f1f77bcf86cd799439013',
        company: companyId.toString(),
        documents: [],
        title: 'Request page 1',
      },
      {
        lspId,
        _id: '507f1f77bcf86cd799439014',
        company: companyId.toString(),
        documents: [],
        title: 'Request page 2',
      },
      {
        lspId,
        _id: '507f1f77bcf86cd799439015',
        company: companyId.toString(),
        documents: [],
        title: 'Request page 2',
      },
      {
        lspId,
        _id: '507f1f77bcf86cd799439016',
        company: companyId.toString(),
        documents: [],
        title: 'Request page 2',
      },
    ];
    mockRequestAPI(schema, { requests: requestsStored, otherCompanys: [] }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.list(filterParams);
    })
      .then((requestList) => {
        expect(requestList).to.exist;
        expect(requestList.list.length).to.eql(3);
        expect(requestList.total).to.eql(3);
        expect(requestAPI.schema.Request.find.firstCall).to.exist;
        const { firstCall } = requestAPI.schema.Request.find;
        expect(firstCall.args.length).to.eql(1);
        expect(firstCall.args[0]).to.eql({
          lspId,
        });
        done();
      }).catch(done);
  });

  it.skip('should search return the proper searching criteria to filter requests by matching title "Request"', (done) => {
    let requestAPI;
    const filterParams = {
      q: 'Request',
    };
    const account = { roles: ['REQUEST_READ_ALL'] };
    const user = mockUser(account);
    const lspId = user.lsp._id;
    mockRequestAPI(schema, { mockFind: true, requests: [], otherCompanys: [] }, user)
      .then((reqAPI) => {
        requestAPI = mockRequestSchemaFind(reqAPI);
        return requestAPI.list(filterParams);
      })
      .then(() => {
        expect(requestAPI.schema.Request.find.firstCall).to.exist;
        const { firstCall } = requestAPI.schema.Request.find;
        expect(firstCall.args.length).to.eql(2);
        expect(firstCall.args[0]).to.eql({
          lspId,
          $text: {
            $search: "\"Request\"",
            $language: 'none',
            $caseSensitive: false,
          },
        });
        done();
      }).catch(done);
  });

  it.skip('should search return the proper searching criteria to filter requests by matching exact string', (done) => {
    let requestAPI;
    const filterParams = {
      q: '"Sample Inc." Yonel progress',
    };
    const account = { roles: ['REQUEST_READ_ALL'] };
    const user = mockUser(account);
    const lspId = user.lsp._id;
    mockRequestAPI(schema, { mockFind: true, requests: [], otherCompanys: [] }, user)
      .then((reqAPI) => {
        requestAPI = mockRequestSchemaFind(reqAPI);
        return requestAPI.list(filterParams);
      })
      .then(() => {
        expect(requestAPI.schema.Request.find.firstCall).to.exist;
        const { firstCall } = requestAPI.schema.Request.find;
        expect(firstCall.args.length).to.eql(2);
        expect(firstCall.args[0]).to.eql({
          lspId,
          $text: {
            $search: '\"Sample Inc.\" Yonel progress',
            $language: 'none',
            $caseSensitive: false,
          },
        });
        done();
      }).catch(done);
  });

  it.skip('should return all request for users with REQUEST_READ_ALL role', (done) => {
    let requestAPI;
    const filterParams = {
      statuses: ['started'],
    };
    const account = { roles: ['REQUEST_READ_ALL'] };
    const user = mockUser(account);
    const lspId = user.lsp._id;
    mockRequestAPI(schema, { requests: [], otherCompanys: [] }, user).then((reqAPI) => {
      requestAPI = reqAPI;
      return requestAPI.list(filterParams);
    })
      .then((requestList) => {
        expect(requestList).to.exist;
        expect(Array.isArray(requestList.list)).to.be.true;
        expect(requestList.list.length).to.eql(0);
        expect(requestList.total).to.eql(0);
        expect(requestAPI.schema.Request.aggregate.firstCall).to.exist;
        const { firstCall } = requestAPI.schema.Request.aggregate;
        expect(firstCall.args.length).to.eql(1);
        expect(firstCall.args[0][0]).to.eql({
          $match: {
            lspId,
            status: {
              $in: filterParams.statuses,
            },
          },
        });
        done();
      }).catch(done);
  });
});
