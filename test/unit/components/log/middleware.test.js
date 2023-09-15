/* eslint-disable no-unused-expressions,class-methods-use-this*/
/* global describe, it, before, beforeEach, after, afterEach */
const chai = require('chai');
require('mocha');

const middleware = require('../../../../app/components/log/middleware');

const expect = chai.expect;


describe('Logger Middleware', () => {
  it('should append a $logger property to the request', (done) => {
    const req = {};
    const res = { on: () => {} };
    middleware({ logLevel: () => 'info' })(req, res, () => {
      expect(req.$logger).to.exist;
      done();
    });
  });
});
