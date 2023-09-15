const _ = require('lodash');
const mongoose = require('mongoose');
const { models: mongooseSchema } = require('../components/database/mongo');
const rolesUtils = require('../utils/roles');
const { provideTransaction } = require('../components/database/mongo/utils');
const configuration = require('../components/configuration');

class SchemaAwareAPI {
  /**
   * @param {Object} logger the logger to use
   * @param {Object} options optional configuration.
   * @param {Object} options.user the user that is using the api
   * @param {Object} options.flags the req.flags object
   */
  constructor(logger, options) {
    this.logger = logger;
    this.provideTransaction = provideTransaction;
    this.flags = _.get(options, 'flags', {});
    this.origin = _.get(options, 'origin');
    const user = _.get(options, 'user');
    this.isProd = this.flags.mockProduction || configuration.isProd;

    if (!_.isNil(user)) {
      this.user = user;
      Object.assign(this.user, {
        hasAll: (roles) => {
          const userRoles = rolesUtils.getRoles(this.user);
          const rolesToCheck = _.castArray(roles);
          return rolesToCheck.every(role => rolesUtils.hasRole(role, userRoles));
        },
        has: (roles) => {
          const userRoles = rolesUtils.getRoles(this.user);
          const rolesToCheck = _.castArray(roles);
          return rolesToCheck.some(role => rolesUtils.hasRole(role, userRoles));
        },
        hasNot: (roles) => {
          const userRoles = rolesUtils.getRoles(this.user);
          const rolesToCheck = _.castArray(roles);
          return rolesToCheck.every(role => !rolesUtils.hasRole(role, userRoles));
        },
        is: type => _.get(this.user, 'type') === type,
      });
    }
    this.schema = mongooseSchema;
  }

  get lspId() {
    const user = _.get(this, 'user');

    if (user) {
      try {
        const lspId = _.get(user, 'lsp._id');
        return new mongoose.Types.ObjectId(lspId);
      } catch (err) {
        const message = err.message || err;

        throw new Error(message);
      }
    }
    throw new Error('Could not get user lspId. User is not defined');
  }

  isTestingUser() {
    const user = _.get(this, 'user');
    return !_.isNil(user.email.match('@sample.com|@test.com'));
  }
}

module.exports = SchemaAwareAPI;
