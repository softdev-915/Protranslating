/* eslint-disable no-unused-expressions */
/* global describe, it, before, beforeEach, after, afterEach */
const getenv = require('getenv');
const faker = require('faker');
require('mocha');

const mongo = require('../../app/components/database/mongo');
const UserService = require('../../app/components/database/mongo/services/user-service');

let userService = null;

const disconnect = (done) => { mongo.close().then(() => done()).catch(done); };

const createRandomUser = function () {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const randomNumber = faker.random.number();
  this.user = {
    firstName,
    lastName,
    email: `${firstName}.${lastName}_${randomNumber}@protranslating.com`,
  };
  const self = this;
  return userService.insert(this.user).then((result) => {
    self.user._id = result.ops[0]._id.toString();
  }).catch();
};

class DatabaseTestsuite {
  constructor(name) {
    const NODE_ENV = getenv('NODE_ENV');
    if (NODE_ENV !== 'DEV' && NODE_ENV !== 'TEST') {
      throw new Error(`Illegal attempt to run test with NODE_ENV: ${NODE_ENV}`);
    }
    this.name = name;
    this._it = [];
    this._skip = [];
    this.before();
    this.after();
    this.beforeEach();
    this.afterEach();
    this.it = (message, testFunc) => {
      this._it.push({ message, testFunc: testFunc.bind(this) });
    };
    this.it.skip = (message) => {
      this._skip.push({ message });
    };
  }

  createUser() {
    this._createUser = true;
  }

  run() {
    describe(this.name, () => {
      before(this._before.bind(this));
      beforeEach(this._beforeEach.bind(this));
      afterEach(this._afterEach.bind(this));
      after(this._after.bind(this));
      this._it.forEach((test) => {
        it(test.message, test.testFunc.bind(this));
      });
      this._skip.forEach((test) => {
        it.skip(test.message);
      });
    });
  }

  before(beforeFunc) {
    this._before = (done) => {
      mongo.connect().then(() => {
        userService = new UserService();
        userService.testData = true;
        if (beforeFunc) {
          const promise = beforeFunc.call(this);
          if (promise) {
            promise.then(() => done()).catch(done);
          } else {
            done();
          }
        } else {
          done();
        }
      }).catch(done);
    };
  }

  after(afterFunc) {
    this._after = (done) => {
      if (afterFunc) {
        const promise = afterFunc.call(this);
        if (promise) {
          promise.finally(() => {
            disconnect(done);
          });
        } else {
          disconnect(done);
        }
      } else {
        disconnect(done);
      }
    };
  }

  beforeEach(_beforeEach) {
    this._beforeEach = (done) => {
      if (this._createUser) {
        createRandomUser.call(this).then(() => {
          if (_beforeEach) {
            const promise = _beforeEach.call(this);
            if (promise) {
              promise.then(() => done()).catch(done);
            } else {
              done();
            }
          } else {
            done();
          }
        }).catch(done);
      } else if (_beforeEach) {
        _beforeEach.bind(this).then(() => done()).catch(done);
      }
    };
  }

  afterEach(_afterEach) {
    this._afterEach = (done) => {
      let error;
      if (_afterEach) {
        const promise = _afterEach.call(this);
        if (promise) {
          promise.catch((err) => { error = err; })
          .finally(() => (
            userService._removeTestData()
            .catch((err) => { error = err; })
            .finally(() => {
              done(error);
            })
          ));
        } else {
          userService._removeTestData()
            .catch((err) => { error = err; })
            .finally(() => {
              done(error);
            });
        }
      } else {
        userService._removeTestData().then(() => done()).catch(done);
      }
    };
  }
}

module.exports = DatabaseTestsuite;
