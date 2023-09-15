const chai = require('chai');

require('mocha');
const { Types: { ObjectId } } = require('mongoose');
const nullLogger = require('../../../../app/components/log/null-logger');
const { buildSchema } = require('../../components/database/mongo/schemas');
const { loadData } = require('../../components/database/mongo/schemas/helper');
const cidrMiddlewareFactory = require('../../../../app/components/cidr/middleware');

const expect = chai.expect;
const mockRequest = (ip, url) => ({
  url,
  method: 'GET',
  connection: {
    remoteAddress: ip,
  },
});
const lspId = new ObjectId();
const company1 = {
  _id: new ObjectId(),
  lspId,
  name: 'Company 1',
  parentId: null,
  subParentId: null,
  subSubParentId: null,
  cidr: [],
};

const company2 = {
  _id: new ObjectId(),
  lspId,
  name: 'Company 2',
  parentId: null,
  subParentId: null,
  subSubParentId: null,
};

const company3 = {
  _id: new ObjectId(),
  lspId,
  name: 'Company 3',
  parentId: null,
  subParentId: null,
  subSubParentId: null,
  cidr: [{
    ip: '192.168.1.188/30', // will be converted to ipv6 by mongoose
    description: 'Test',
  }],
};

const languageCombinations = [{
  documents: [new ObjectId()],
  srcLangs: [{ name: 'Spanish', isoCode: 'SPA' }],
  tgtLangs: [{ name: 'English', isoCode: 'ENG' }],
}];

const request0 = {
  _id: new ObjectId(),
  lspId,
  languageCombinations,
  comments: 'Test comments',
};

const request1 = {
  _id: new ObjectId(),
  lspId,
  company: {
    _id: company1._id,
  },
  languageCombinations,
  comments: 'Test comments',
};

const request2 = {
  _id: new ObjectId(),
  lspId,
  company: {
    _id: company2._id,
  },
  languageCombinations,
  comments: 'Test comments',
};

const request3 = {
  _id: new ObjectId(),
  lspId,
  company: {
    _id: company3._id,
  },
  languageCombinations,
  comments: 'Test comments',
};

const mockData = schema => loadData(schema, {
  Company: [company1, company2, company3],
  Request: [request0, request1, request2, request3],
});

describe('CIDR middleware', () => {
  const clientIP = '192.168.1.190';
  const clientIPv6 = '0:0:0:0:0:ffff:c0a8:1be';
  let schema;
  beforeEach(() => buildSchema().then((s) => {
    schema = s;
    return mockData(s);
  }));

  it.skip('should ignore when URL does not match', (done) => {
    const req = mockRequest(clientIP, '/api/lsp/123/test/123/request/123/document');
    const cidrMiddleware = cidrMiddlewareFactory({
      schema,
      logger: nullLogger,
    });
    cidrMiddleware(req, null, (err) => {
      expect(err).to.not.exist;
      // expect(err.message).to.exist;
      done();
    });
  });

  it.skip('should fail if company does not exist', (done) => {
    const fakeId = new ObjectId().toString();
    const req = mockRequest(clientIP, `/api/lsp/${lspId}/company/${fakeId}/request/${request1._id}/document`);
    const cidrMiddleware = cidrMiddlewareFactory({
      schema,
      logger: nullLogger,
    });
    cidrMiddleware(req, null, (err) => {
      expect(err).to.exist;
      expect(err.code).to.eql(404);
      expect(err.message).to.eql(`Company ${fakeId} does not exist`);
      done();
    });
  });

  it.skip('should fail if request does not exist', (done) => {
    const fakeId = new ObjectId().toString();
    const req = mockRequest(clientIP, `/api/lsp/${lspId}/company/${request1.company._id}/request/${fakeId}/document`);
    const cidrMiddleware = cidrMiddlewareFactory({
      schema,
      logger: nullLogger,
    });
    cidrMiddleware(req, null, (err) => {
      expect(err).to.exist;
      expect(err.code).to.eql(404);
      expect(err.message).to.eql(`Request ${fakeId} does not exist`);
      done();
    });
  });

  it.skip('should allow if cidr array is empty', (done) => {
    const req = mockRequest(clientIP, `/api/lsp/${lspId}/company/${request1.company._id}/request/${request1._id}/document`);
    const cidrMiddleware = cidrMiddlewareFactory({
      schema,
      logger: nullLogger,
    });
    cidrMiddleware(req, null, (err) => {
      expect(err).to.not.exist;
      done();
    });
  });

  it.skip('should not allownot allow client IP if it is not in CIDR', (done) => {
    const wrongIP = '1.1.1.1';
    const req = mockRequest(wrongIP, `/api/lsp/${lspId}/company/${company3._id}/request/${request3._id}/document`);
    const cidrMiddleware = cidrMiddlewareFactory({
      schema,
      logger: nullLogger,
    });
    cidrMiddleware(req, null, (err) => {
      expect(err).to.exist;
      expect(err.code).to.eql(403);
      expect(err.message).to.eql(`Your IP "${wrongIP}" is not allowed to download files for this company`);
      done();
    });
  });

  it.skip('should not allow client IP if it is not in CIDR with IPv6', (done) => {
    const wrongIP = '0:0:0:0:0:ffff:101:101';
    const req = mockRequest(wrongIP, `/api/lsp/${lspId}/company/${company3._id}/request/${request3._id}/document`);
    const cidrMiddleware = cidrMiddlewareFactory({
      schema,
      logger: nullLogger,
    });
    cidrMiddleware(req, null, (err) => {
      expect(err).to.exist;
      expect(err.code).to.eql(403);
      expect(err.message).to.eql(`Your IP "${wrongIP}" is not allowed to download files for this company`);
      done();
    });
  });

  it.skip('should allow client IP if CIDR allow all rule is given', (done) => {
    const req = mockRequest('1.1.1.1', `/api/lsp/${lspId}/company/${company2._id}/request/${request2._id}/document`);
    const cidrMiddleware = cidrMiddlewareFactory({
      schema,
      logger: nullLogger,
    });
    cidrMiddleware(req, null, (err) => {
      expect(err).to.not.exist;
      done();
    });
  });

  it.skip('should allow client IP if CIDR allow all rule is given with IPV6', (done) => {
    const req = mockRequest(clientIPv6, `/api/lsp/${lspId}/company/${company2._id}/request/${request2._id}/document`);
    const cidrMiddleware = cidrMiddlewareFactory({
      schema,
      logger: nullLogger,
    });
    cidrMiddleware(req, null, (err) => {
      expect(err).to.not.exist;
      done();
    });
  });

  it.skip('should allow client IP if it is in CIDR', (done) => {
    const req = mockRequest(clientIP, `/api/lsp/${lspId}/company/${company3._id}/request/${request3._id}/document`);
    const cidrMiddleware = cidrMiddlewareFactory({
      schema,
      logger: nullLogger,
    });
    cidrMiddleware(req, null, (err) => {
      expect(err).to.not.exist;
      done();
    });
  });

  it.skip('should allow client IP if it is in CIDR with IPv6', (done) => {
    const req = mockRequest(clientIPv6, `/api/lsp/${lspId}/company/${company3._id}/request/${request3._id}/document`);
    const cidrMiddleware = cidrMiddlewareFactory({
      schema,
      logger: nullLogger,
    });
    cidrMiddleware(req, null, (err) => {
      expect(err).to.not.exist;
      done();
    });
  });
});
