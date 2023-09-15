const _ = require('lodash');
const moment = require('moment');
const { RestError } = require('../api-response');
const defaultLogger = require('../log/logger');
const configuration = require('../configuration');
const sessionUtils = require('./utils');
const mongoose = require('mongoose');
const bodyParserFunc = require('body-parser');

const { Types: { ObjectId } } = mongoose;
const envConfig = configuration.environment;
const TOAST_POLL_REGEXP = /\/api\/lsp\/[a-zA-Z0-9]+\/user\/[a-zA-Z0-9]+\/toast/i;
const TASK_POLL_REGEXP = /\/api\/lsp\/[a-zA-Z0-9]+\/task\/provider\/[a-zA-Z0-9]+/i;
const userEndpointRegexp = new RegExp(/lsp\/(.*?)\/user$/us);
// Should avoid refreshing the session when polling for toast and tasks
const shouldAvoidRefreshing = (req) => req.url.match(TOAST_POLL_REGEXP) || (req.url.match(TASK_POLL_REGEXP) && req.headers['lms-poll'] === 'true');

module.exports = async (req, res, next) => {
  if (req.session) {
    const maxInactivity = _.get(req, 'session.user.securityPolicy.timeoutInactivity');
    const now = moment.utc();
    const lastAccess = moment.utc(req.session.lastAccess);
    let lmsTz = _.get(req, 'headers.lms-tz');
    const mockLmsTz = _.get(req, 'flags.mockTz');

    if (mockLmsTz !== '00') {
      lmsTz = mockLmsTz;
    }
    const sessionLmsTz = _.get(req, 'session.lmsTz');
    const shouldResetTz = sessionLmsTz !== lmsTz && !_.isNil(lmsTz) && lmsTz !== '00';

    if (_.isNil(sessionLmsTz) || shouldResetTz) {
      req.session.lmsTz = lmsTz;
    }
    const diff = Math.abs(lastAccess.diff(now, 'minutes'));
    const user = _.get(req, 'session.user');
    const lsp = _.get(user, 'lsp', null);
    const lspId = !_.isNull(lsp, '_id', null) && lsp._id;
    const userId = _.get(user, '_id', null);
    let dbUser;
    let userSessions = [];
    let dbSessionsIds;
    // Case 1: User is being modified (terminated, locked or deleted) by another user
    const isUserUpdated = userEndpointRegexp.test(req.url) && req.method === 'PUT';
    const bodyParser = bodyParserFunc.json();
    if (isUserUpdated) {
      bodyParser(req, res, (err) => {
        const modifiedUser = req.body;
        const shouldInactivateUser = modifiedUser.isLocked ||
              modifiedUser.terminated ||
              modifiedUser.deleted;
        if (shouldInactivateUser) {
          // Remove active user sessions
          sessionUtils.updateUserSessions(lspId, modifiedUser._id, []);
        }
        if (err) next(err);
      });
    }

    // Case 2: User makes request itself - check it's session
    // Get user from DB
    try {
      if (userId && lspId) {
        const query = {
          lsp: new ObjectId(lspId),
          _id: new ObjectId(userId),
        };
        dbUser = await sessionUtils.getDbUser(query);
      }
    } catch (err) {
      defaultLogger.error(`Error getting user from DB: ${err}`);
      next(new RestError(403, { message: err }));
    }

    // Check user state
    if (dbUser) {
      userSessions = dbUser.userSessions;
      let currentUserSessionIndex;
      if (_.isArray(userSessions)) {
        currentUserSessionIndex = userSessions.findIndex(item => item.sessionId === req.sessionID);
      }
      // Update user's lastAccess
      if (currentUserSessionIndex > -1) {
        userSessions[currentUserSessionIndex].sessionUpdatedAt = req.session.lastAccess;
      }

      // Check if user blocked  (terminated, locked or inactivated)
      const isUserBlocked = dbUser.isLocked || dbUser.terminated || dbUser.deleted;
      // If user blocked then remove DB session and user sessions
      if (isUserBlocked) {
        userSessions = [];
        await sessionUtils.updateUserSessions(lspId, userId, userSessions);
        req.session.destroy();
        const message = 'User is blocked';
        return next(new RestError(401, { message }));
      }
    }

    // Search for nonexisting session and remove user session if not found
    const userSessionsIds = userSessions.map(item => item.sessionId);
    const query = {
      _id: {
        $in: userSessionsIds,
      },
    };
    const dbSessions = await sessionUtils.getDbSessions(query);
    if (_.isArray(dbSessions)) {
      dbSessionsIds = dbSessions.map(dbSession => dbSession._id);
    }
    userSessions = userSessions.filter(val => dbSessionsIds.includes(val.sessionId));

    // Check user inactivity and remove if >= maxInactivity
    if (diff >= maxInactivity) {
      if (_.get(user, 'email', '').match('session') || envConfig.NODE_ENV === 'PROD') {
        req.session.destroy();
        throw new RestError(401, { message: 'Session\'s inactivity period exceeded' });
      }
    }

    // Save to DB session and user sessions
    if (!shouldAvoidRefreshing(req)) {
      req.session.lastAccess = now.toISOString();
      try {
        req.session.save();
        await sessionUtils.updateUserSessions(lspId, userId, userSessions);
      } catch (err) {
        const message = _.get(err, 'message', err);

        defaultLogger.debug(`Failed to update session ${message}`);
      }
    }
  }
  next();
};
