const _ = require('lodash');
const uuidV4 = require('uuid');
const { models: mongooseSchema } = require('../../components/database/mongo');
const apiResponse = require('../../components/api-response');
const AuthCredentialsApi = require('./auth-credentials-api');
const envConfiguration = require('../../components/configuration');
const { getRoles, hasRole } = require('../../utils/roles');

const { RestError } = apiResponse;
const populateOptions = {
  populate: [
    {
      path: 'company',
      populate: {
        path: 'salesRep',
        select: '_id firstName lastName email',
      },
    },
    {
      path: 'lsp',
      select: {
        _id: 1,
        logoImage: 1,
        securityPolicy: 1,
        description: 1,
        currencyExchangeDetails: 1,
        addressInformation: 1,
        name: 1,
        revenueRecognition: 1,
        phoneNumber: 1,
        url: 1,
        officialName: 1,
        supportsIpQuoting: 1,
        taxId: 1,
        mtSettings: 1,
        'pcSettings.lockedSegments': 1,
        'pcSettings.supportedFileFormats': 1,
      },
      populate: [
        { path: 'addressInformation.country' },
        { path: 'addressInformation.state' },
        { path: 'currencyExchangeDetails.base' },
        { path: 'currencyExchangeDetails.quote' },
        {
          path: 'pcSettings.supportedFileFormats',
          select: 'name extensions',
        },
      ],
    },
  ],
};

const selectFields = [
  'email',
  '_id',
  'lastLoginAt',
  'firstName',
  'middleName',
  'lastName',
  'lsp',
  'roles',
  'abilities',
  'inactiveNotifications',
  'groups',
  'type',
  'company',
  'profileImage',
  { internalDepartments: 'vendorDetails.internalDepartments' },
  { internalDepartments: 'staffDetails.internalDepartments' },
  'isApiUser',
  'isOverwritten',
  'forcePasswordChange',
  'currencyExchangeDetails',
  'securityPolicy',
  'uiSettings',
  'useTwoFactorAuthentification',
  'contactDetails',
  'preferences',
  'portalCatDefaultConfig',
  'portalTranslatorSettings',
  'location',
  'timeZone',
];
const CONTACT_TYPE = 'Contact';
const envConfig = envConfiguration.environment;
const getContactBillingDetails = (contact) => ({
  country: _.get(contact, 'contactDetails.billingAddress.country.code', ''),
  state: _.get(contact, 'contactDetails.billingAddress.state.code', ''),
  city: _.get(contact, 'contactDetails.billingAddress.city', ''),
  address1: _.get(contact, 'contactDetails.billingAddress.line1', ''),
  address2: _.get(contact, 'contactDetails.billingAddress.line2', ''),
  zipCode: _.get(contact, 'contactDetails.billingAddress.zip', ''),
  email: _.get(contact, 'contactDetails.billingEmail', ''),
});

class AuthAPI {
  constructor(logger, configuration, options, req) {
    this.logger = logger;
    this.schema = mongooseSchema;
    this.configuration = configuration;
    this.mock = _.get(options, 'mock', false);
    this.req = req;
  }

  getUserSessionData(userSessions = []) {
    const sessionData = userSessions.find(({ sessionId }) => this.req.sessionID === sessionId);
    return !_.isEmpty(sessionData) ? _.pick(sessionData, ['location', 'timeZone']) : {};
  }

  async prepareUser(dbUser) {
    const updatedUser = await this.schema.User.updateUserGroups(dbUser);

    dbUser.groups = updatedUser.groups;
    const plainUser = dbUser.toObject();
    const userSessionData = this.getUserSessionData(plainUser.userSessions);
    const userDefaultOptions = { timeZone: dbUser.lastTimeZone };
    Object.assign(plainUser, userDefaultOptions, userSessionData);
    const userRoles = getRoles(this.user);
    const canReadOwnPcSettings = hasRole('LSP-SETTINGS-CAT_READ_OWN', userRoles);
    const user = selectFields.reduce((userObj, field) => {
      if (_.isObject(field)) {
        const firstKey = _.first(Object.keys(field));

        userObj[firstKey] = _.get(plainUser, field[firstKey], null);
      } else {
        userObj[field] = _.get(plainUser, field, null);
      }
      return userObj;
    }, {});
    if (!canReadOwnPcSettings) {
      user.pcSettings = {};
    }
    return user;
  }

  async authenticateUserSaml({ email, lsp }) {
    this.logger.debug(`SAML Auth: Authenticating user via SAML ${email} ${lsp}`);
    const { logger, mock, req } = this;
    const authCredentialsApi = new AuthCredentialsApi({ logger, mock, req });
    try {
      const dbUser = await authCredentialsApi.authenticateUserSaml(
        { email, lsp },
        populateOptions,
      );
      return await this.prepareUser(dbUser);
    } catch (err) {
      if (_.isNumber(err.code)) {
        throw err;
      }
      this.logger.debug(`SAML Auth: Error authenticating user ${_.get(err, 'message', err)}`);
      throw new RestError(500, { message: `Unable to authenticate user: ${err}` });
    }
  }

  async authenticateUser(credentials) {
    const { logger, mock, req } = this;
    const authCredentialsApi = new AuthCredentialsApi({ logger, mock, req });
    try {
      const dbUser = await authCredentialsApi.authenticateUser(credentials, populateOptions);
      return this.prepareUser(dbUser);
    } catch (err) {
      if (_.isNumber(err.code)) {
        throw err;
      }
      this.logger.debug(
        `Error authenticating user ${_.get(err, 'message', err)}`,
      );
      throw new RestError(401, { message: `Unable to authenticate user: ${err}` });
    }
  }

  serializeUser(user) {
    const serializedUser = {
      _id: user._id,
      sessionUUID: uuidV4.v4(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      lastLoginAt: user.lastLoginAt,
      lsp: user.lsp,
      isOverwritten: user.isOverwritten,
      securityPolicy: user.securityPolicy,
      roles: user.roles,
      groups: user.groups,
      abilities: _.get(user, 'abilities'),
      type: user.type,
      profileImage: user.profileImage,
      company: user.company,
      timeout: envConfig.SESSION_TIMEOUT,
      internalDepartments: user.internalDepartments,
      uiSettings: _.get(user, 'uiSettings'),
      useTwoFactorAuthentification: _.get(user, 'useTwoFactorAuthentification', false),
      portalCatDefaultConfig: _.get(user, 'portalCatDefaultConfig'),
      portalTranslatorSettings: _.get(user, 'portalTranslatorSettings', {}),
      location: user.location,
      timeZone: user.timeZone,
    };

    if (user.type === CONTACT_TYPE) {
      serializedUser.billingDetails = getContactBillingDetails(user);
      serializedUser.preferences = _.defaultTo(user.preferences, {});
    }
    return serializedUser;
  }

  async getProfileImage(userId) {
    const user = await this.schema.User.findById(userId, 'profileImage');
    return _.get(user, 'profileImage');
  }
}
module.exports = AuthAPI;
