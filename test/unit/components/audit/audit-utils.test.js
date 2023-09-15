/* eslint-disable no-unused-expressions,class-methods-use-this */
/* global describe, it, before, beforeEach, after, afterEach */
const chai = require('chai');

require('mocha');

const auditUtils = require('../../../../app/components/audit/audit-utils');

const { expect } = chai;
const mockRequest = (body) => {
  const req = {
    id: '2053ae93-f5af-4500-bf8d-934a556b3c22',
    url: '/api/auth',
    originalUrl: '/api/auth',
    baseUrl: '',
    headers: {
      'content-length': 0,
      cookie: '_gat=1; _ga=GA1.1.991064276.1487101547; lms-session=s%3AcRtIrSXQGPw5CegXzKc6YClqz-RajwAg.A1e81rgXqmzOSQSSIbnYH8XxNQDR%2ByQfxKJ8Ip5soeI',
      'accept-language': 'en,en-US;q=0.8,es;q=0.6,es-419;q=0.4,pt;q=0.2,pt-PT;q=0.2',
      'accept-encoding': 'gzip, deflate, sdch, br',
      referer: 'http://localhost:8080/home',
      'content-type': 'application/json;charset=utf-8',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest',
      origin: 'http://localhost:8080',
      accept: 'application/json, text/plain, */*',
      connection: 'close',
      host: 'localhost:8080',
    },
    method: 'DELETE',
    params: {},
    query: {},
    sessionID: 'cRtIrSXQGPw5CegXzKc6YClqz-RajwAg',
    httpVersion: '1.1',
    httpVersionMajor: 1,
    httpVersionMinor: 1,
  };
  if (body) {
    req.body = body;
    req.headers['content-length'] = JSON.stringify(body).length;
  }
  return req;
};

const mockResponse = (body) => {
  const res = {
    statusCode: 200,
    _headers: {
      'content-length': 0,
      'content-type': 'application/json',
      'x-request-id': '2053ae93-f5af-4500-bf8d-934a556b3c22',
      'x-dns-prefetch-control': 'off',
      'x-frame-options': 'SAMEORIGIN',
      'strict-transport-security': 'max-age=15552000; includeSubDomains',
      'x-download-options': 'noopen',
      'x-content-type-options': 'nosniff',
      'x-xss-protection': '1; mode=block',
      etag: 'W/\'a-oQDOV50e1MN2H/N8GYi+8w\'',
    },
    req: {
      url: '/api/auth',
      method: 'POST',
    },
  };
  if (body) {
    res.sentBody = JSON.stringify(body);
    res._headers['content-length'] = res.sentBody.length;
  }
  return res;
};

describe('Audit utils', () => {
  it('should correctly filter the request if no body is provided', () => {
    const mockedRequest = mockRequest();
    const filteredRequest = auditUtils.filterRequest(mockedRequest, ['password', 'creditCard'], true);
    expect(filteredRequest).to.eql(mockedRequest);
  });

  it('should correctly filter the response if no body is provided', () => {
    const mockedResponse = mockResponse();
    const filteredResponse = auditUtils.filterResponse(mockedResponse, ['password', 'creditCard'], true);
    expect(filteredResponse).to.eql({
      statusCode: mockedResponse.statusCode,
      headers: mockedResponse._headers,
      req: {
        method: mockedResponse.req.method,
        url: mockedResponse.req.url,
      },
    });
  });

  it('should not log the request\'s body of the content-type is not application/json', () => {
    const mockedRequest = mockRequest([23, 12, 42]);
    mockedRequest.headers['content-type'] = 'application/octect-stream';
    const filteredRequest = auditUtils.filterRequest(mockedRequest, ['password', 'creditCard'], true);
    const mockClone = { ...mockedRequest };
    delete mockClone.body;
    expect(filteredRequest).to.eql(mockClone);
  });

  it('should not log the response\'s body of the content-type is not application/json', () => {
    const mockedResponse = mockResponse([23, 12, 42]);
    mockedResponse._headers['content-type'] = 'application/octect-stream';
    const filteredResponse = auditUtils.filterResponse(mockedResponse, ['password', 'creditCard'], true);
    expect(filteredResponse).to.eql({
      statusCode: mockedResponse.statusCode,
      headers: mockedResponse._headers,
      req: {
        url: mockedResponse.req.url,
        method: mockedResponse.req.method,
      },
    });
  });

  it.skip('should replace request\'s sensitive data for "__private__" string', () => {
    const mockedRequest = mockRequest({ email: 'test@gmail.com', creditCard: '123412' });
    const filteredRequest = auditUtils.filterRequest(mockedRequest, ['password', 'creditCard'], true);
    const mockClone = { ...mockedRequest };
    mockClone.body = { email: 'test@gmail.com', creditCard: '__private__' };
    expect(filteredRequest).to.eql(mockClone);
  });

  it('should replace responses\'s sensitive data for "__private__" string', () => {
    const mockedResponse = mockResponse({ email: 'test@gmail.com', password: 'mySecretPassword' });
    const filteredResponse = auditUtils.filterResponse(mockedResponse, ['password', 'creditCard'], true);
    expect(filteredResponse).to.eql({
      statusCode: mockedResponse.statusCode,
      headers: mockedResponse._headers,
      req: {
        url: mockedResponse.req.url,
        method: mockedResponse.req.method,
      },
    });
  });

  it.skip('should replace request\'s deeply nested sensitive data for "__private__" string', () => {
    const reqBody = {
      status: {
        message: 'success',
        error: false,
        code: 200,
      },
      data: {
        user: {
          email: 'cool@email.com',
          password: 'coolpassword',
          keys: ['cool', 'guy'],
          creditCards: [{ creditCard: '13123' }, { creditCard: '1234123' }, { paypal: true }],
        },
      },
    };
    const mockedRequest = mockRequest(reqBody);
    const filteredRequest = auditUtils.filterRequest(mockedRequest, ['password', 'creditCard'], true);
    const mockClone = { ...mockedRequest };
    mockClone.body.data.user.password = '__private__';
    mockClone.body.data.user.creditCards = mockClone.body.data.user.creditCards.map((c) => {
      if (c.creditCard) {
        return { creditCard: '__private__' };
      }
      return c;
    });
    expect(filteredRequest).to.eql(mockClone);
  });
});
