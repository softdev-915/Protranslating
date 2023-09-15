const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');
const { v4: uuidV4 } = require('uuid');
const apiResponse = require('../../../components/api-response');
const EmailQueue = require('../../../components/email/templates');
const { models: mongooseSchema } = require('../../../components/database/mongo');
const UserAPI = require('../../lsp/user/user-api');
const { validObjectId } = require('../../../utils/schema');
const AuthCredentialsApi = require('../auth-credentials-api');

const { RestError } = apiResponse;
const FORGOT_PASSWORD_PATH = 'reset-password';
const FORGOT_PASSWORD_NAME = 'forgotPassword';

class ForgotPasswordAPI {
  constructor(logger, configuration, mockFlag = false) {
    this.mockFlag = mockFlag;
    this.logger = logger;
    this.schema = mongooseSchema;
    this.configuration = configuration;
    this.userAPI = new UserAPI(logger, { configuration });
    this.emailQueue = new EmailQueue(this.logger, this.schema, this.configuration);
    this.authCredentialsApi = new AuthCredentialsApi({ logger: this.logger });
  }

  async createCode(email, lspId) {
    let userInDb;

    if (!validObjectId(lspId)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    try {
      userInDb = await this.schema.User.findOneWithDeleted({
        email,
        lsp: new mongoose.Types.ObjectId(lspId),
      }, '_id type deleted terminated isLocked firstName middleName lastName email lsp forgotPassword');
    } catch (e) {
      this.logger.info(`User ${email} from lspId: ${lspId} could not be found`);
      throw new RestError(404, { message: 'User was not found' });
    }
    const isTerminated = _.get(userInDb, 'terminated', false);
    const isLocked = _.get(userInDb, 'isLocked', false);

    if (_.isNil(userInDb) || isTerminated || isLocked) {
      this.logger.info(`${isTerminated ? 'Terminated' : 'Locked'} or non existing user ${email} attempted to regenerate the password`);
      if (isLocked) {
        throw new RestError(404, { message: 'User is locked' });
      }
      throw new RestError(404, { message: 'User was not found' });
    }
    const forgotScheduler = await this.schema.Scheduler.findOne({
      name: FORGOT_PASSWORD_NAME,
      lspId: userInDb.lsp,
    });

    if (!forgotScheduler) {
      this.logger.error(`There is no email template for name "${FORGOT_PASSWORD_NAME}"`);
      throw new RestError(503, { message: 'Failed to send email to user' });
    }
    const now = moment.utc().toDate();
    const forgotPassword = {
      code: uuidV4(),
      creation: now,
    };

    userInDb.forgotPassword = forgotPassword;
    await userInDb.save({ validateBeforeSave: false });
    const path = EmailQueue.serverURL(this.configuration, FORGOT_PASSWORD_PATH);
    const user = _.pick(userInDb, ['firstName', 'middleName', 'lastName', 'email', 'lsp']);
    const emailContext = { user, code: forgotPassword.code, path };

    await this.emailQueue.send({
      templateName: FORGOT_PASSWORD_NAME,
      context: emailContext,
      mock: this.mockFlag,
      lspId: userInDb.lsp,
    });

    return forgotPassword;
  }

  async setNewPassword(credentials) {
    const forgotPasswordQuery = { 'forgotPassword.code': credentials.code };
    const now = moment.utc().toDate();
    const user = await this.schema.User.findOneWithDeleted(forgotPasswordQuery, '_id type lsp email forcePasswordChange forgotPassword securityPolicy');

    if (!user) {
      this.logger.info('Could not locate reset password code');
      throw new RestError(403, { message: 'Invalid reset password code' });
    }
    const minutesPassed = Math.abs(moment.utc(user.forgotPassword.creation).diff(now, 'minutes'));

    if (minutesPassed >= 15) {
      this.logger.info(`The user ${user.email}, provided a wrong reset password code`);
      throw new RestError(409, { message: 'The reset password code has expired, generate a new one' });
    }
    if (credentials.password.toLowerCase() === user.email.toLowerCase()) {
      this.logger.info('The new password provided by the user contains the email address');
      throw new RestError(400, { message: 'Invalid password cannot be email' });
    }
    const newPasswordCredentials = {
      userId: new mongoose.Types.ObjectId(user._id),
      email: user.email,
      lspId: user.lsp,
      newPassword: credentials.password,
    };

    this.logger.info(`About to change user ${user.email} password provided by the user contains the email address`);
    await this.authCredentialsApi.changePassword(newPasswordCredentials);
    await this.schema.User.findOneAndUpdateWithDeleted({
      email: user.email,
      lsp: user.lsp,
    }, {
      $set: {
        isLocked: false,
        startLockEffectivePeriod: null,
        deleted: false,
        lastLoginAt: null,
      },
    });
  }
}

module.exports = ForgotPasswordAPI;
