const { AsyncLocalStorage } = require('async_hooks');
const { getUserFromSession } = require('./utils/request');

const asyncLocalStorage = new AsyncLocalStorage();
const runAsyncStorage = (req, res, next) => asyncLocalStorage.run({ user: getUserFromSession(req) }, next);

module.exports = {
  asyncLocalStorage,
  runAsyncStorage,
};
