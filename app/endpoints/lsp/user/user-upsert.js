const _ = require('lodash');
const mongoose = require('mongoose');
const Promise = require('bluebird');
const { assignUserForSaving, assignUserForRestResponse, userToSendFactory } = require('./user-api-helper');
const { compareVersionableFileArray } = require('../../../utils/document/document-helper');
const AuthCredentialsApi = require('../../auth/auth-credentials-api');
const UserVersionableDocument = require('../../../utils/document/user-versionable-document');
const CloudStorage = require('../../../components/cloud-storage');
const { RestError } = require('../../../components/api-response');
const rolesUtils = require('../../../utils/roles');
const fileUtils = require('../../../utils/file');
const configuration = require('../../../components/configuration');

const CONTACT_USER_TYPE = 'Contact';
const CONTACT_CREATE_ALL = 'CONTACT_CREATE_ALL';
const USER_CREATE_ALL = 'USER_CREATE_ALL';
const ERR_USER_UPDATE = 'Error updating user';
const ERR_USER_UPDATE_EMAIL = 'Error updating user email';
const INVALID_PM_ROLES = [
  'USER', 'STAFF', 'VENDOR', 'ABILITY', 'AUDIT', 'GROUP',
  'ROLE', 'NOTIFICATION', 'SCHEDULER', 'TASK-FINAL-FILE',
];
/**
 * @class UserUpsert
 *
 */
class UserUpsert {
  constructor(options) {
    this.logger = options.logger;
    this.schema = options.schema;
    this.userInSession = options.userInSession;
    this.mock = options.mock;
    this.shouldMockSiUserSyncFail = options.shouldMockSiUserSyncFail;
    this.cryptoFactory = options.cryptoFactory;
    this.configuration = options.configuration || configuration;
    this.FileStorageFacade = options.FileStorageFacade;
    this.VersionableFileStorage = options.VersionableFileStorage;
    const userRoles = rolesUtils.getRoles(this.userInSession);

    this.canChangeEmail = rolesUtils.hasRole('USER-EMAIL_UPDATE_ALL', userRoles);
    this.lsp = this.userInSession.lsp;
    this.lspId = _.get(this.lsp, '_id', this.lsp);
    this.userInDb = _.get(options, 'userInDb', null);
    this.changeEmail = false;
    this.isUpdate = false;
    this.userModifications = [];
    this.cloudStorage = new CloudStorage(this.configuration, this.logger);
    this.userApi = _.get(options, 'userApi');
    this.authCredentialsApi = new AuthCredentialsApi({ logger: this.logger });
  }

  getUserModifications() {
    return this.userModifications;
  }

  async create(user) {
    this._validateEmail(user);
    _.set(user, 'siConnector', {
      isMocked: this.mock,
      isSynced: false,
      error: null,
    });
    if (user.email) {
      const existingUser = await this.schema.User.findOneWithDeleted({
        email: user.email,
        lsp: this.lspId,
      });

      if (existingUser) {
        throw new RestError(409, { message: `User with email "${user.email}" already exists` });
      }
    }
    if (user.password) {
      await this.authCredentialsApi.failIfPasswordCompromised(user.password, this.lspId);
    }
    try {
      user.lsp = this.lspId;
      this.userInDb = new this.schema.User(user);
      await this._setUser(user);
      await this.userInDb.save(user);
    } catch (e) {
      const message = _.get(e, 'message', e);
      this.logger.error(`Error creating user: ${message}`);
      if (!(e instanceof RestError)) {
        throw new RestError(500, { message, stack: e.stack });
      }
      throw e;
    }
    try {
      const credentials = {
        userId: this.userInDb._id,
        lspId: this.userInDb.lsp,
        email: this.userInDb.email,
        newPassword: user.password,
      };
      await this.authCredentialsApi.createCredentials(credentials, user.isApiUser);
    } catch (e) {
      this.logger.error(`Error creating user password in mongo: ${e}`);
      throw e;
    }
    const populatedUser = await this._populateAfterFinish();
    return populatedUser;
  }

  async update(user) {
    this.isUpdate = true;
    this._validateEmail(user);
    this._validateEmailChange(user);
    try {
      if (this.mock) {
        _.set(user, 'siConnector.isMocked', true);
      }
      await this._setUser(user);
    } catch (e) {
      this.logger.error(`Error editing user: ${e}`);
      if (!(e instanceof RestError)) {
        throw new RestError(500, { message: ERR_USER_UPDATE, stack: e.stack });
      }
      throw e;
    }

    try {
      this.userModifications = this.userInDb.getModifications();
      await this.userInDb.save(user);
    } catch (e) {
      const errMessage = _.get(e, 'message', e);

      this.logger.error(`Error editing user in mongo: ${errMessage}`);
      throw e;
    }
    if (!_.isEmpty(user.password)) {
      const credentials = {
        userId: new mongoose.Types.ObjectId(user._id),
        email: user.email,
        lspId: this.lspId,
        newPassword: user.password,
      };
      const isTestUser = this.userInDb.email.match(/@sample.com|@test.com/);
      const isApiUser = _.get(this, 'userInDb.isApiUser', false) || isTestUser;
      await this.authCredentialsApi.changePassword(credentials, isApiUser);
    }
    const populatedUser = await this._populateAfterFinish();
    return populatedUser;
  }

  async _changeUserEmail(user) {
    const targetUser = await this.schema.User.findOneWithDeleted({
      email: user.email,
      lsp: _.get(this.userInSession, 'lsp._id'),
    });

    if (!_.isEmpty(targetUser)) {
      throw new RestError(409, { message: `User with email ${targetUser.email} already exists` });
    }
  }

  async _validateCatTool(catTools) {
    if (catTools && catTools.length) {
      const dbCatTools = await this.schema.CatTool.find({
        lspId: this.lspId,
        name: { $in: catTools },
      });

      if (dbCatTools.length !== catTools.length) {
        const message = 'Some CAT tools don\'t exist';

        this.logger.error(message);
        throw new RestError(400, { message });
      }
    }
  }

  async _validateGroups(groupsToAdd) {
    let dbGroups = [];

    if (groupsToAdd && groupsToAdd.length > 0) {
      const userRoles = rolesUtils.getRoles(this.userInSession);

      if (userRoles.includes(CONTACT_CREATE_ALL) && !userRoles.includes(USER_CREATE_ALL)) {
        groupsToAdd.forEach((g) => {
          if (g.roles.some((r) => INVALID_PM_ROLES.includes(r.replace(/_.*/, '')))) {
            throw new RestError(400, { message: 'Not authorized to add group.' });
          }
        });
      }
      const groupsQuery = {
        _id: { $in: groupsToAdd.map((g) => g._id) },
        lspId: this.lspId,
      };

      dbGroups = await this.schema.Group.find(groupsQuery);
    }
    this.userInDb.groups = dbGroups;
  }

  async _validateCompany(user) {
    const companyInDb = await this.schema.Company.findOne({
      _id: user.company,
      lspId: this.lspId,
    });

    if (_.isNil(companyInDb)) {
      throw new RestError(400, { message: `Company ${user.company} does not exist` });
    }
    if (_.get(companyInDb, 'ssoSettings.isSSOEnabled', false) && this.userInDb.forcePasswordChange) {
      throw new RestError(400, { message: "User can't have Force Password Change flag if selected company use SSO." });
    }
    this.userInDb.company = companyInDb._id;
  }

  async _setUser(user) {
    const { NODE_ENV } = this.configuration.environment;
    await Promise.map([
      () => {
        if (!_.isEmpty(_.get(user, 'catTools'))) {
          return this._validateCatTool(user.catTools);
        }
      },
      () => {
        if (!_.isEmpty(_.get(user, 'groups'))) {
          return this._validateGroups(user.groups);
        }
      },
      () => {
        if (this.changeEmail) {
          return this._changeUserEmailInLmsAuth(user);
        }
      },
      () => {
        if (user.type === CONTACT_USER_TYPE && !_.isEmpty(user.company)) {
          return this._validateCompany(user);
        }
      },
    ], (promise) => promise()).catch((err) => {
      throw err;
    });
    if (user.staffDetails || this.userInDb.staffDetails || user.vendorDetails) {
      // add, edit or delete user documents
      // needs to be done if the user had staff or vendor details or the new
      // user has also staff or vendor details. This is done in order to
      // guarantee that files are added or deleted (if user's type changes).
      try {
        if (user.staffDetails || this.userInDb.staffDetails) {
          await this._processUserDocuments(
            this.userInDb,
            this.userInDb.staffDetails,

            user.staffDetails,

            this.userInDb.vendorDetails,
          );
        }
        if (user.vendorDetails || this.userInDb.vendorDetails) {
          await this._processUserDocuments(
            this.userInDb,
            this.userInDb.vendorDetails,

            user.vendorDetails,

            this.userInDb.staffDetails,
          );
        }
      } catch (err) {
        this.logger.error(`Error handling ${user.email}'s documents. Error: ${err.message}`);
        throw new RestError(500, { message: 'Error handling user documents. Please delete and upload the documents again', stack: err.stack });
      }
    }
    assignUserForSaving(this.userInDb, user, this.userInSession);
    if (_.isBoolean(this.shouldMockSiUserSyncFail) && NODE_ENV !== 'PROD') {
      this.userInDb.shouldMockSiUserSyncFail = this.shouldMockSiUserSyncFail;
    }
    return this.userInDb;
  }

  async _populateAfterFinish() {
    // Populates the user in order to return the same response as the GET request would do.
    const query = { _id: this.userInDb._id };
    const populatedUser = await this.schema.User.findOneWithDeletedAndPopulate(query, this.lspId);
    const userToSend = userToSendFactory();
    assignUserForRestResponse(userToSend, populatedUser);
    return { user: populatedUser, userInAccount: userToSend };
  }

  _processUserDocuments(user, originalUserDetails, newUserDetails, availableDetails) {
    const userId = user._id.toString();
    const { lspId } = this;
    // When user type changes from staff to vendor or viceversa, documents have
    // to be kept in the account. Available files are pre-existing files in the
    // DB. If there are available files, use them as the "original" files.
    const availableFiles = _.get(availableDetails, 'hiringDocuments', []);
    const originalFiles = _.get(originalUserDetails, 'hiringDocuments', availableFiles);
    const newFiles = _.get(newUserDetails, 'hiringDocuments', []);
    const comparison = compareVersionableFileArray(originalFiles, newFiles);

    // eslint-disable-next-line max-len
    this.logger.debug(`There are ${comparison.missing.length} files to delete and ${comparison.added.length} to be added`);
    const filePromises = [];
    const versionableNewDocuments = UserVersionableDocument.buildFromArray(newFiles);
    const versionableOriginalDocuments = UserVersionableDocument.buildFromArray(originalFiles || []);
    const fileStorage = new this.FileStorageFacade(lspId, this.configuration, this.logger);
    const versionableFileStorage = new this.VersionableFileStorage(lspId, this.configuration, this.logger);

    comparison.missing.forEach((f) => {
      const fileId = f._id || f;
      const doc = versionableOriginalDocuments.find((d) => (d.getVersion(fileId) ? d.getVersion(fileId)._id === fileId : false));
      const extension = fileUtils.getExtension(doc.name);
      const file = versionableFileStorage.userHiringDocument(userId, doc, extension, fileId, true);

      this.logger.debug(`Queuing delete "${file.path}"`);
      // Push bucket removal promise
      const prefixRegex = /[a-zA-Z0-9]{24}\/user_hiring_files\/[a-zA-Z0-9]{24,}/;

      filePromises.push(() => this.cloudStorage.deleteFile(file.path, prefixRegex));
    });
    comparison.added.forEach((f) => {
      const fileId = f._id || f;
      const doc = versionableNewDocuments
        .find((d) => (d.getVersion(fileId) ? d.getVersion(fileId)._id === fileId : false));
      const extension = fileUtils.getExtension(doc.name);
      // Move files on the cloud here
      const prospect = fileStorage
        .userHiringDocumentProspect(f.userId, doc.getVersion(fileId), extension, true);
      const destination = versionableFileStorage
        .userHiringDocument(userId, doc, extension, fileId, true);

      this.logger.debug(`From "${prospect.path}" to "${destination.path}"`);
      const prefixRegex = /[a-zA-Z0-9]{24}\/user_hiring_files\/([a-zA-Z0-9]{24,}|undefined)/;

      filePromises.push(() => this.cloudStorage
        .moveFile(prospect.path, destination.path, prefixRegex));
      filePromises.push(() => this.schema.UserDocumentProspect.deleteOne({
        _id: fileId,
      }));
    });
    return Promise.mapSeries(filePromises, (f) => f()
      .catch((err) => {
        // If failed to delete file ignore the error
        if (_.get(err, 'message', '').match('failed to delete')) {
          return Promise.resolve();
        }
        throw err;
      }));
  }

  async _changeUserEmailInLmsAuth(user) {
    const query = {
      email: user.oldEmail,
      lspId: this.lspId,
    };

    try {
      await this.schema.LmsAuth.updateOne(query, { $set: { email: user.email } }, { upsert: true });
    } catch (e) {
      throw new RestError(500, { message: ERR_USER_UPDATE_EMAIL });
    }
  }

  _validateEmailChange(user) {
    if (user.email && user.oldEmail && user.email !== user.oldEmail) {
      if (!this.canChangeEmail) {
        throw new RestError(403, { message: 'You are not authorized to change user\'s email' });
      }
      this.changeEmail = true;
    }
  }

  _validateEmail(user) {
    if ((!user.email || !user.email.trim()) && user.type !== CONTACT_USER_TYPE) {
      throw new RestError(400, { message: 'Only contacts are allowed to not have emails' });
    }
  }
}

module.exports = UserUpsert;
