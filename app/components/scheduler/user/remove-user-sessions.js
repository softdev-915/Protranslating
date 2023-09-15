const _ = require('lodash');
const logger = require('../../log/logger');
const { models: mongooseSchema } = require('../../database/mongo');
const sessionUtils = require('../../session/utils');

class RemoveUserSessionsScheduler {
  constructor(schedulerName, configuration, additionalOptions) {
    this.schedulerName = schedulerName;
    this.additionalOptions = additionalOptions;
    this.logger = logger;
    this.configuration = configuration;
    this.schema = mongooseSchema;
  }

  run(job, done) {
    this.logger.debug('About to inactivate users based on lastLoginAt date');
    const lspId = _.get(job, 'attrs.data.lspId');
    sessionUtils.getDbSessions({}, '_id').then((dbSessions) => {
      const query = {
        lsp: lspId,
        $and: [{ userSessions: { $ne: null } }, { userSessions: { $ne: [] } }],
      };
      sessionUtils.getDbUsers(query, 'userSessions').then((activeUsers) => {
        activeUsers.forEach((user) => {
          const userSessionsToKeep = [];
          user.userSessions.forEach((userSession) => {
            const userSessionId = userSession.sessionId;
            const dbSessionIds = dbSessions.map((dbSession) => dbSession._id);
            if (dbSessionIds.includes(userSessionId)) {
              userSessionsToKeep.push(userSession);
            }
          });
          // Keep only active user sessions
          return sessionUtils.updateUserSessions(lspId, user._id, userSessionsToKeep);
        });
      });

      this.logger.debug('Inactivate-user scheduler finished');
      done();
    })
      .catch((err) => {
        this.logger.warn(`Error running inactivate-user scheduler: ${err}`);
        done(err);
      });
  }
}

module.exports = RemoveUserSessionsScheduler;
