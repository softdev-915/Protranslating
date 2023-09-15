/* eslint-disable global-require */
const { Types: { ObjectId } } = require('mongoose');
const Promise = require('bluebird');
const QRCode = require('qrcode');
const moment = require('moment/moment');
const speakeasy = require('speakeasy');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const configuration = require('../../components/configuration');
const apiResponse = require('../../components/api-response');
const passwordUtils = require('../../utils/password');
const RecaptchaValidator = require('../../components/recaptcha');
const { asyncSome } = require('../../utils/arrays');
const { extractUserIp } = require('../../utils/request');
const SchemaAwareAPI = require('../schema-aware-api');
const sessionUtils = require('../../components/session/utils');
const Geolocation = require('../../components/geolocation');

const PASSWORD_EXPIRE_TEST_USERS = [
  'user2-session@sample.com',
  'user4-session@sample.com',
  'user6-session@sample.com',
  'user8-session@sample.com',
];
const { RestError } = apiResponse;
const DEFAULT_PASSWORDS_TO_KEEP_NUMBER = 2;
const toDataURL = Promise.promisify(QRCode.toDataURL);
const env = configuration.environment;

class AuthCredentialsApi extends SchemaAwareAPI {
  constructor(options) {
    super(options.logger, options);
    this.credentials = null;
    this.mock = _.get(options, 'mock', false);
    this.user = _.get(options, 'user', null);
    this.SALT_ROUND = env.PWD_SALT_ROUND;
    this.req = _.get(options, 'req', null);
  }

  set user(_user) {
    this._user = _user;
  }

  get user() {
    return this._user;
  }

  async failIfPasswordCompromised(password, lspId) {
    const compromisedPassword = await this.schema.CompromisedPassword
      .findOne({ password, lspId })
      .lean();
    if (!_.isNil(compromisedPassword)) {
      throw new Error([
        'Compromised Password!',
        'Your password was found on a list of commonly-used, expected, or compromised passwords.',
        'Please select password that differs from this one.',
      ].join(' '));
    }
  }

  async changePassword(credentials, isApiUser) {
    const {
      userId, email, lspId, newPassword,
    } = credentials;
    await this.failIfPasswordCompromised(newPassword, lspId);
    this.logger.info(`Resetting password for user: ${email}`);
    const userCredentials = await this.schema.LmsAuth.findOne({ userId, lspId });
    if (_.isNil(userCredentials)) {
      await this.createCredentials({ userId, email, lspId: new ObjectId(lspId) }, isApiUser);
    }
    const { hashedPassword } = await this.getValidPassword(credentials, isApiUser);
    return this.updateAuthCredentials({
      userId,
      email,
      lspId,
      hashedPassword,
    });
  }

  async getAuthSecurityPolicyCredentials(email, lspId) {
    let passwordCredentials;
    let userSecurityDetails;

    await Promise.map([
      () => this.schema.LmsAuth.findOne({ email, lspId: new ObjectId(lspId) })
        .then((auth) => {
          passwordCredentials = auth;
        })
        .catch((err) => {
          throw err;
        }),
      () => this.schema.User.getSecurityPolicy(email, lspId)
        .then((user) => {
          userSecurityDetails = user;
          if (_.isNil(userSecurityDetails)) {
            throw new RestError(401, { message: 'Unable to get user security policy' });
          }
        })
        .catch((err) => {
          throw err;
        }),
    ], (promise) => promise());
    return {
      passwordCredentials,
      userSecurityDetails,
    };
  }

  async ensureNoLockedAccount({ securityPolicy, userSecurityDetails }) {
    this.logger.info(`Validating account locking for user: ${this.user.id}`);
    const { lockEffectivePeriod } = securityPolicy;

    if (!_.get(this, 'user.isLocked', false)) {
      return false;
    }
    const { startLockEffectivePeriod } = userSecurityDetails;
    const lockEffectivePeriodDate = moment.utc(startLockEffectivePeriod);
    const finishLockEffectivePeriodDate = lockEffectivePeriodDate.add(lockEffectivePeriod, 'minutes');
    const isLockPeriodFinished = moment.utc().isAfter(finishLockEffectivePeriodDate);

    if (isLockPeriodFinished) {
      this.logger.info(`Unlocking user ${this.user.id} account`);
      await this.unlockUser();
      return true;
    }
    this.logger.info(`User ${this.user.id} account is locked for ${lockEffectivePeriod} minutes`);
    throw new RestError(401, { message: `Sorry you have been locked out for ${lockEffectivePeriod} minutes after several failed login attempts. Please try again later.` });
  }

  ensureNoExpiredPassword(securityPolicy) {
    const { passwordExpirationDays } = securityPolicy;
    const passwordChangeDate = moment(_.get(this, 'user.passwordChangeDate'));
    const isApiUser = _.get(this, 'user.isApiUser', false);
    const isPasswordExpireTestUser = PASSWORD_EXPIRE_TEST_USERS.some((u) => u === this.user.email);

    if (!isPasswordExpireTestUser && (_.isNil(passwordChangeDate) || isApiUser)) {
      return;
    }
    const daysSinceLastPasswordChange = moment.utc().diff(passwordChangeDate, 'days');

    if (daysSinceLastPasswordChange > passwordExpirationDays) {
      throw new RestError(401, { message: 'Sorry, your password has expired. Please reset your password' });
    }
  }

  ensureNoInactiveUser(email) {
    if (_.isNil(this.user)) {
      throw new RestError(401, { message: 'Invalid credentials' });
    }
    if (this.user.deleted || this.user.terminated) {
      this.logger.debug(`Failed authentication for user ${email}. User is terminated/deleted`);
      throw new RestError(401, { message: 'Bad credentials' });
    }
  }

  async validateRecaptcha(recaptcha, clientIP) {
    if (env.NODE_ENV === 'PROD') {
      const recaptchaValidator = new RecaptchaValidator(this.logger);
      try {
        await recaptchaValidator.validateV3(recaptcha, clientIP);
      } catch (e) {
        this.logger.warn(`Recaptcha validation failed: ${e}`);
        throw new RestError(400, { message: 'Recaptcha validation failed' });
      }
    }
  }

  isMockingAllowed() {
    return configuration.environment.IS_DEV && this.mock;
  }

  applyMockServerTime() {
    const mockedServerTime = _.get(this.req, 'flags.mockServerTime');
    if (!_.isEmpty(mockedServerTime)) {
      this.user.lastLoginAt = moment(mockedServerTime);
    }
  }

  applyMockTimezone() {
    const mockTimezone = _.get(this.req, 'flags.mockTimezone');
    if (!_.isEmpty(mockTimezone)) {
      this.user.lastTimeZone = { value: mockTimezone, isAutoDetected: true };
    }
  }

  async authenticateUser({
    email, lspId, password, recaptcha, clientIP,
  }, { populate }) {
    this.user = await this.schema.User.findOneAndPopulate({
      email, lsp: new ObjectId(lspId),
    }, populate);
    if (!this.user.useTwoFactorAuthentification && !this.user.isApiUser) {
      await this.validateRecaptcha(recaptcha, clientIP);
    }
    this.ensureNoInactiveUser(email);
    this.logger.info(`Authenticating user ${email}`);
    const {
      userSecurityDetails,
      passwordCredentials,
    } = await this.getAuthSecurityPolicyCredentials(email, lspId);
    const { securityPolicy } = userSecurityDetails;
    const { lockEffectivePeriod } = securityPolicy;
    this.user.securityPolicy = securityPolicy;
    if (PASSWORD_EXPIRE_TEST_USERS.some((user) => this.user.email === user)) {
      this.ensureNoExpiredPassword(securityPolicy);
    }
    if (this.isMockingAllowed()) {
      this.applyMockServerTime();
      this.applyMockTimezone();
    }
    await this.ensureNoLockedAccount({ userSecurityDetails, securityPolicy });
    this.ensureNoExpiredPassword(securityPolicy);
    const doPasswordsMatch = await bcrypt.compare(password, passwordCredentials.password);
    if (!doPasswordsMatch) {
      const updatedUser = await this.countFailedLoginAttempts();
      const { maxInvalidLoginAttempts } = securityPolicy;
      if (updatedUser.failedLoginAttempts > maxInvalidLoginAttempts) {
        await this.lockUser();
        throw new RestError(401, { message: `The maximum amount of login attempts has been exceeded. Please try again in ${Math.round(lockEffectivePeriod)} minutes.` });
      }
      throw new RestError(401, { message: 'Incorrect credentials' });
    }
    if (_.isEmpty(this.user.lastTimeZone)) {
      this.user.lastTimeZone = {
        value: _.get(this.req, 'headers.lms-timezone'),
        isAutoDetected: true,
      };
    }
    const userSessions = await this.createDataForUserSessions();
    try {
      await sessionUtils.updateUserSessions(lspId, this.user._id, userSessions);
    } catch (e) {
      const message = e.message || e;
      this.logger.error(`Error updating sessions for user with _id: $: ${message}`);
      throw e;
    }
    await this.unlockUser();
    return this.user;
  }

  async authenticateUserSaml({ email, lsp }, { populate }) {
    this.logger.debug(`SAML Auth: Authenticating user via SAML ${email} ${lsp}`);
    const dbUser = await this.schema.User.findOneAndPopulate({
      email, lsp: new ObjectId(lsp),
    }, populate);
    if (_.isNil(dbUser)) {
      this.logger.debug(`SAML Auth: Failed authentication for user ${email}. User was not found in the db`);
      throw new RestError(404, { message: 'User not found' });
    }
    if (_.isEmpty(dbUser.lastTimeZone)) {
      dbUser.lastTimeZone = {
        value: 'UTC',
        isAutoDetected: true,
      };
    }
    this.user = dbUser;
    dbUser.lastLoginAt = moment.utc().toDate();
    if (dbUser.terminated) {
      this.logger.debug(`SAML Auth: Failed authentication for user ${email}. User is terminated/deleted`);
      throw new RestError(403, { message: 'Bad credentials' });
    }
    if (dbUser.deleted) {
      dbUser.deleted = false;
    }
    await dbUser.save({ validateBeforeSave: false });
    const { userSecurityDetails } = await this.getAuthSecurityPolicyCredentials(email, lsp);
    const { securityPolicy } = userSecurityDetails;
    dbUser.securityPolicy = securityPolicy;
    this.logger.info(`SAML Auth: Authenticating user ${email}`);
    return dbUser;
  }

  async getValidPassword(credentials, isApiUser) {
    const {
      userId, email, lspId, newPassword,
    } = credentials;
    this.logger.info(`Validating password against security policy for user: ${email}`);
    const userSecurityPolicyDetails = await this.schema.User.getSecurityPolicy(email, lspId);
    const securityPolicy = _.get(userSecurityPolicyDetails, 'securityPolicy');

    if (_.isNil(securityPolicy)) {
      throw new RestError(401, { message: 'Unable to get user security policy' });
    }
    const passwordCredentials = await this.schema.LmsAuth.findOne({
      userId, lspId: new ObjectId(lspId),
    });
    const currentPassword = _.get(passwordCredentials, 'password', '');

    if (_.has(credentials, 'password') && _.has(credentials, 'repeatPassword')) {
      const doesCurrentPasswordMatch = await bcrypt.compare(
        credentials.password,
        passwordCredentials.password,
      );
      if (!doesCurrentPasswordMatch) {
        throw new RestError(401, { message: 'The password you have entered does not match your current one.' });
      }
    }
    const passwordHistory = _.get(passwordCredentials, 'passwordHistory', []);

    this.logger.info(`Checking password history for user: ${email}`);
    const isPasswordAlreadyUsed = await asyncSome(
      passwordHistory,
      (p) => bcrypt.compare(newPassword, p),
    );
    if (isPasswordAlreadyUsed && !isApiUser) {
      this.logger.error(`Failed upon validating password history for user: ${email}. Password already used`);
      throw new RestError(400, { message: 'Sorry, please choose a password that you have not used previously' });
    }
    try {
      passwordUtils.validateSecurityPolicy(securityPolicy, newPassword);
    } catch (err) {
      this.logger.error(`Failed upon validating password security policy for user: ${email}: Err: ${err}`);
      throw new RestError(400, { message: err.message });
    }
    this.logger.info('Generated hashed password');
    const hashedPassword = bcrypt.hashSync(newPassword, this.SALT_ROUND);

    this.logger.info(`Returning current and hashed password for user ${email}`);
    return { currentPassword, hashedPassword };
  }

  async createCredentials({
    userId, email, lspId, newPassword,
  }, isApiUser) {
    this.logger.info('Adding new credentials');
    try {
      this.logger.info(`Setting new password for user user: ${email}`);
      this.credentials = await this.schema.LmsAuth.updateOne(
        { userId, lspId: new ObjectId(lspId) },
        {
          $set: {
            userId, email, lspId: new ObjectId(lspId), updatedBy: _.get(this, 'user.email', 'SYSTEM'),
          },
        },
        { upsert: true },
      );
      if (!_.isEmpty(newPassword)) {
        const { hashedPassword } = await this.getValidPassword({
          userId, email, lspId, newPassword,
        }, isApiUser);

        this.logger.info(`Updating auth credentials for user ${email}`);
        await this.updateAuthCredentials({
          userId, email, lspId, hashedPassword,
        });
      }
      return this.credentials;
    } catch (e) {
      const message = e.message || e;

      this.logger.error(`Error setting password for user ${email}: ${message}`);
      throw new RestError(409, { message: `Error setting user password. ${message}` });
    }
  }

  async updateAuthCredentials(credentials) {
    const {
      userId, email, lspId, hashedPassword,
    } = credentials;
    const { securityPolicy } = await this.schema.User.getSecurityPolicy(email, lspId);
    const passwordsNumber = _.get(securityPolicy, 'numberOfPasswordsToKeep', DEFAULT_PASSWORDS_TO_KEEP_NUMBER);

    this.logger.info(`Updating user ${email} credentials. Lsp ${_.defaultTo(lspId, '').toString()}`);
    try {
      this.logger.info(`Setting new password for user user: ${email}`);
      const update = {
        $set: {
          password: hashedPassword,
          passwordChangeDate: moment.utc().toDate(),
          updatedBy: email,
        },
        $push: {
          passwordHistory: {
            $each: [hashedPassword],
            $slice: passwordsNumber * -1,
          },
        },
      };

      this.logger.info(`Updating lms_auth database for user ${email} credentials. Lsp ${_.defaultTo(lspId, '').toString()}`);
      await this.schema.LmsAuth.updateOne({ userId, lspId: new ObjectId(lspId) }, update);
      this.logger.info(`Updating lms.users collection for user ${email} credentials. Lsp ${_.defaultTo(lspId, '').toString()}`);
      const userUpdate = {
        $unset: { forgotPassword: '' },
        $set: {
          passwordChangeDate: moment.utc().toDate(),
          forcePasswordChange: false,
        },
      };

      await this.schema.User.updateOne({ email, lsp: new ObjectId(lspId) }, userUpdate);
    } catch (e) {
      const message = e.message || e;
      this.logger.error(`Error setting password for user ${email}: ${message}`);
      throw new RestError(409, { message: `Error setting user password. ${message}` });
    }
  }

  async lockUser() {
    this.logger.info(`Starting lock period for user ${this.user.id}`);
    try {
      await this.schema.User.findOneAndUpdate(
        { _id: this.user._id },
        {
          $set: {
            isLocked: true,
            startLockEffectivePeriod: moment.utc().toDate(),
            failedLoginAttempts: 0,
            userSessions: [],
          },
        },
      );
    } catch (e) {
      const message = e.message || e;

      this.logger.error(`Error locking user for user with _id: ${this.user.id}. ${message}`);
      throw e;
    }
  }

  async unlockUser() {
    this.logger.info(`Removing lock period for user ${this.user.id}`);
    try {
      await this.schema.User.findOneAndUpdate(
        { _id: this.user._id },
        {
          $set: {
            startLockEffectivePeriod: null,
            isLocked: false,
            failedLoginAttempts: 0,
            deleted: false,
            lastLoginAt: moment.utc().toDate(),
          },
        },
      );
    } catch (e) {
      const message = e.message || e;

      this.logger.error(`Error locking user for user with _id: $: ${message}`);
      throw e;
    }
  }

  getMockedLocation() {
    if (!this.isMockingAllowed()) {
      return;
    }
    const mockLocation = _.get(this.req, 'flags.mockLocation');
    if (_.isEmpty(mockLocation)) {
      return;
    }
    const [city, country] = `${mockLocation}`.split(',').map(_.trim);
    return { city, country };
  }

  getMockedIp() {
    return this.isMockingAllowed() ? _.get(this.req, 'flags.mockIp') : null;
  }

  getIp() {
    return _.defaultTo(this.getMockedIp(), extractUserIp(this.req));
  }

  async getLocation() {
    const mockedLocation = this.getMockedLocation();
    return !_.isEmpty(mockedLocation)
      ? mockedLocation
      : await (new Geolocation(this.getIp())).getCityAndCountry();
  }

  async createDataForUserSessions() {
    this.logger.info(`Create or update session data for user ${this.user._id}`);
    const { userSessions = [] } = this.user;
    const userAgent = this.req.get('user-agent');
    const cookie = _.get(this.req.headers, 'cookie', '0');
    const sessionsAreEqual = (item) => item.sessionId === this.req.sessionID;
    const currenUserSessionIndex = userSessions.findIndex(sessionsAreEqual);
    const location = await this.getLocation();
    if (currenUserSessionIndex > -1) {
      userSessions[currenUserSessionIndex].loggedAt = moment().utc();
    } else {
      userSessions.push({
        sessionId: this.req.sessionID,
        loggedAt: _.defaultTo(this.user.lastLoginAt, moment()),
        sessionUpdatedAt: this.req.session.lastAccess,
        timeZone: this.user.lastTimeZone,
        userAgent,
        originIP: this.getIp(),
        cookie,
        location,
      });
    }
    return userSessions;
  }

  async deleteUserSessions() {
    this.logger.info(`Delete session data for user ${this.user._id}`);
    const dbUser = await this.schema.User.findOneAndPopulate({
      email: this.user.email, lsp: new ObjectId(this.user.lsp._id),
    });
    const { userSessions = [] } = dbUser;
    const sessionsAreEqual = (item) => item.sessionId === this.req.sessionID;
    const currenUserSessionIndex = userSessions.findIndex(sessionsAreEqual);
    if (currenUserSessionIndex > -1) {
      userSessions.splice(currenUserSessionIndex, 1);
    }

    try {
      await this.schema.User.findOneAndUpdate(
        { _id: this.user._id },
        {
          $set: {
            userSessions,
          },
        },
      );
    } catch (e) {
      const message = e.message || e;
      this.logger.error(`Error updating sessions for user with _id: $: ${message}`);
      throw e;
    }
  }

  async countFailedLoginAttempts() {
    this.logger.info(`Counting failed login attempts for user for user ${this.user.id}`);
    try {
      const updatedUser = await this.schema.User.findOneAndUpdate(
        { _id: this.user._id },
        {
          $inc: { failedLoginAttempts: 1 },
        },

        { new: true },
      );
      return updatedUser;
    } catch (e) {
      const message = e.message || e;

      this.logger.error(`Error setting failed login attempts for user: ${message}`);
      throw e;
    }
  }

  async retrieve2FADataURL(query) {
    query.lspId = new ObjectId(query.lspId);
    const authCredentials = await this.schema.LmsAuth.findOne(query);

    if (_.isNil(authCredentials)) {
      throw new Error(`Auth credentials for user with email: ${query.email} and lspId: ${query.lspId} not found`);
    }
    if (_.isNil(authCredentials.secret) || _.isNil(authCredentials.otpAuthURL)) {
      const secret = speakeasy.generateSecret();

      authCredentials.secret = secret.base32;
      authCredentials.otpAuthURL = speakeasy.otpauthURL({
        secret: secret.base32,
        label: 'Protranslating.Portal',
        issuer: authCredentials.email,
        encoding: 'base32',
      });
      await authCredentials.save();
    }
    const dataURL = await toDataURL(authCredentials.otpAuthURL);
    return dataURL;
  }

  async verifyHOTP(user, hotp) {
    this.logger.info(`Verifying HOTP for user ${user.email}`);
    try {
      const lspId = _.get(user, 'lsp._id', user.lspId);
      const authCredentials = await this.schema.LmsAuth.findOne({
        email: user.email,
        lspId: new ObjectId(lspId),
      });
      const secret = _.get(authCredentials, 'secret');

      if (_.isNil(secret)) {
        return false;
      }
      const verified = speakeasy.totp.verify({
        secret, encoding: 'base32', token: hotp, window: 2,
      });
      const { HOTP_MOCK_VALUE, NODE_ENV } = env;
      const isProd = NODE_ENV === 'PROD';

      if (!isProd && !verified) {
        return hotp === HOTP_MOCK_VALUE;
      }
      return verified;
    } catch (e) {
      const message = e.message || e;

      this.logger.error(`Error verifying HOTP for user: ${message}`);
      throw e;
    }
  }
}

module.exports = AuthCredentialsApi;
