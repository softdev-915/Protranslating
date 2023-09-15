// Express WebServer
// -----------------------------

// Modules Dependencies:
//  - Assert (http://nodejs.org/api/assert.html)
//  - SuperAgent (http://visionmedia.github.io/superagent/)
const _ = require('lodash');
const assert = require('assert');
const moment = require('moment');
const fs = require('fs');
const superagent = require('superagent');

// Global Variables for the test case
const d = process.env.APP_URL;
const credentials = {
  username : process.env.E2E_USER,
  password : process.env.E2E_PASS,
};

// Global
let lspId = '';
let csrfToken = '';
let accountInfo = {};

// Mocks
let singleUserMock;

// Unit Tests
describe('List Users Tests', function() {

  before(function () {
    // Start agent
    agent = superagent.agent();
    // fileContents = fs.readFileSync('./mocks/delta.txt', 'utf8');
    singleUserMock = require('../mocks/expected-response-1.js');
  });

  describe('Authenticate', function () {
    it('POST /auth Initializes the proper login strategy', function(done) {
      agent
        .post(d+'/api/auth')
        .set('Content-Type', 'application/json')
        .set('lms-mock', 'true')
        .send({email: credentials.username, password: credentials.password })
        .then(function (res) {
          // Extract the csrf token
          csrfToken = _.get(res, 'body.data.csrfToken');
          let accounts = _.get(res, 'body.data.user.accounts');
          assert.ok(accounts.length >= 1, 'At least one account was expected')
          // Extract lspid
          lspId = _.get(accounts[0], 'lsp._id');
          // console.log(lspId);
          assert.ok(res.ok);
          done();
        });
    });

    it('GET /auth/me Returns the current user', function(done) {
      agent
        .get(d+'/api/auth/me')
        .then(function (res) {
          // console.log(res);
          // console.log(res.body);
          const currentEmail = _.get(res, 'body.data.user.email') || false;
          // console.log(currentEmail);
          assert.ok(res.ok);
          assert.equal(currentEmail, process.env.E2E_USER, 'Should be the expected user')
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });
  });

  describe('Authenticate', function () {
    it('GET /api/lsp/:lsp/users Filter duplicated account', function(done) {
      // curl 'http://192.168.1.10:8080/api/lsp/58f60d08963daf9a13ce1889/user?' -H 'Cookie: lms-session=s%3AU8HNrh0zboxNXEpX_1Jb61i8pmNzLlqo.K%2FPxWGxIvPcLUjaqCLHbIOWDBCCo%2BcmKrn7CFtMZzqU' -H 'lms-mock: false' -H 'Accept-Encoding: gzip, deflate' -H 'Accept-Language: en-US,en;q=0.9,ja;q=0.8,es;q=0.7,pl;q=0.6' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36' -H 'Accept: application/json, text/plain, */*' -H 'Referer: http://192.168.1.10:8080/users/?page=1&limit=10&filter=%7B%22__tz%22%3A-180,%22email%22%3A%22cortez.cristian%40gmail.co%22%7D' -H 'X-Requested-With: XMLHttpRequest' -H 'If-None-Match: W/"d1c-rCQT6qgXBBZ0emF4vud+GDvMFuQ"' -H 'Connection: keep-alive' -H 'Save-Data: on' -H 'lms-tz: -180' --compressed
      agent
        .get(d+`/api/lsp/${lspId}/user`)
        .query('params%5Bpage%5D=1')
        .query('params%5Blimit%5D=10')
        .query('params%5Bfilter%5D=%7B%22__tz%22%3A-180%2C%22email%22%3A%22cortez.cristian%40gmail.com%22%7D')
        .set('lms-tz', '-180')
        .then(function (res) {
          let total = _.get(res, 'body.data.total', 0);
          assert.ok(total >= 1, 'At least one user is needed to perform this test');
          let users = _.get(res, 'body.data.list');
          console.log(JSON.stringify(users));
          assert.deepEqual(users, singleUserMock, 'Failed to check user listed is exactly equal to the expected response');
          done();
        }).catch(function(err) {
          console.log(err);
          done(err);
        });
    });
  });

  after(function() {
  });

});
