const _ = require('lodash');
const moment = require('moment');
const validate = require('validate.js');
const passwordUtils = require('../../../utils/password');
const apiResponse = require('../../../components/api-response');
const { escapeRegexp } = require('../../../utils/regexp');
const { generateUserToast } = require('../toast/toast-helpers');
const fileUtils = require('../../../utils/file');
const UserVersionableDocument = require('../../../utils/document/user-versionable-document');
const configuration = require('../../../components/configuration');

const env = configuration.environment;
const DEFAULT_INACTIVE_NOTIFICATION = 'all';
const { RestError } = apiResponse;
const CONTACT_USER_TYPE = 'Contact';
const STAFF_USER_TYPE = 'Staff';
const VENDOR_USER_TYPE = 'Vendor';
const createUserToastForNewUser = (schema, userCreated) => schema.Toast.findActiveAllUsersToast(userCreated.lsp)
  .then((toasts) => {
    const userToasts = toasts.map((toast) => generateUserToast(toast, userCreated._id));
    return schema.UserToast.create(userToasts);
  });
const isEmailInvalid = validate.validators.email.bind(validate.validators.email);
const validateEmail = (u) => !isEmailInvalid(u.email) || (u.type === CONTACT_USER_TYPE && !u.email);
const validatePassword = (user, forceExist) => {
  const isContactWithNoEmail = user.email === '' && user.type === CONTACT_USER_TYPE;

  if (!user.password && isContactWithNoEmail) {
    return true;
  } if (user.password && passwordUtils.isValidPassword(user.password)) {
    return true;
  } if (!user.password && !forceExist) {
    return true;
  }
  return false;
};

const applyContactDetailChanges = (userChanges) => {
  if (userChanges.contactDetails) {
    if (_.isEmpty(userChanges.contactDetails.salesRep)) {
      userChanges.contactDetails.salesRep = undefined;
    }
    if (_.isEmpty(userChanges.contactDetails.leadSource)) {
      userChanges.contactDetails.leadSource = undefined;
    }
    return userChanges.contactDetails;
  }
  return undefined;
};
const mockDate = (value, timeUnit) => {
  if (_.isNil(value)) {
    return null;
  }
  const numberOfDays = value.slice(1);
  const now = moment.utc();
  const dateOperation = value.match('-') ? 'subtract' : 'add';
  return now[dateOperation](numberOfDays, timeUnit).toDate();
};

const assignMockData = (userInDb, mockedData) => {
  mockedData.forEach((mockObject) => {
    let mockedValue = mockObject.value;
    const fullParamName = mockObject.name;
    const nameDelimiter = fullParamName.lastIndexOf('-');
    const typeDelimiter = fullParamName.indexOf('-') + 1;
    const cleanFieldName = fullParamName.slice(nameDelimiter + 1);
    const fieldType = fullParamName.slice(typeDelimiter, nameDelimiter);

    if (fieldType === 'date') {
      if (mockObject.value !== 'null') {
        const dateUnit = mockObject.value.split('.');

        mockedValue = mockDate(dateUnit[0], dateUnit[1]);
      } else {
        mockedValue = null;
      }
    }
    userInDb[cleanFieldName] = mockedValue;
  });
  return userInDb;
};

const assignUserForSaving = (user, userChanges, authUser) => {
  const isTerminatedUserInDb = user.terminated;
  const dbVendorRates = _.cloneDeep(_.get(user, 'vendorDetails.rates'));
  Object.keys(userChanges).forEach((changedField) => {
    if (!_.isNil(userChanges[changedField])) {
      _.set(user, changedField, userChanges[changedField]);
    }
  });
  if (!_.isNil(userChanges.uiSettings)) {
    user.uiSettings = userChanges.uiSettings;
  }
  if (userChanges.type) {
    if (userChanges.type === CONTACT_USER_TYPE) {
      user.company = userChanges.company;
      user.projectManagers = userChanges.projectManagers;
      user.contactDetails = applyContactDetailChanges(userChanges);
    } else {
      user.catTools = userChanges.catTools;
      user.languageCombinations = userChanges.languageCombinations;
      user.abilities = userChanges.abilities;
      user.contactDetails = undefined;
    }
    if (userChanges.type === STAFF_USER_TYPE) {
      user.staffDetails = userChanges.staffDetails;
    }
    if (userChanges.type === VENDOR_USER_TYPE) {
      user.vendorDetails = _.set(userChanges.vendorDetails, 'rates', dbVendorRates);
    }
  }
  if (!_.isEmpty(_.get(userChanges, 'inactiveNotifications', []))) {
    user.inactiveNotifications = DEFAULT_INACTIVE_NOTIFICATION;
  }
  user.startLockEffectivePeriod = userChanges.isLocked ? moment.utc().toDate() : null;
  user.securityPolicy = user.isOverwritten ? _.get(user, 'securityPolicy') : undefined;

  user.updatedBy = authUser.email;
  if (userChanges.deleted) {
    user.deletedBy = authUser.email;
    user.deletedAt = new Date();
  } else {
    user.deletedAt = null;
  }
  if (isTerminatedUserInDb !== userChanges.terminated) {
    user.terminatedBy = authUser.email;
    user.terminatedAt = userChanges.terminated ? new Date() : null;
  }
  if (env.NODE_ENV !== 'PROD') {
    assignMockData(user, _.get(userChanges, 'mockData', []));
  }
  return user;
};

const filterGenerator = (userFilters) => {
  const keys = Object.keys(userFilters);
  const keysLen = keys.length;
  return (u) => {
    for (let i = 0; i < keysLen; i++) {
      if (userFilters[keys[i]] !== u[keys[i]]) {
        return false;
      }
    }
    return true;
  };
};

const applyFilters = (list, userFilters) => {
  let listClone = list.slice(0);

  if (userFilters) {
    if (userFilters.type) {
      listClone = listClone.filter(filterGenerator(userFilters));
    }
  }
  return listClone;
};

const userToSendFactory = () => ({
  email: '',
  secondaryEmail: '',
  roles: [],
  groups: [],
  company: null,
  projectManagers: [],
  abilities: [],
  catTools: [],
  languageCombinations: [],
  staffDetails: {},
  contactDetails: {},
  vendorDetails: {},
  inactiveNotifications: [],
  inactiveSecondaryEmailNotifications: true,
  forcePasswordChange: false,
  deleted: false,
  isLocked: false,
  isApiUser: false,
});

const assignUserForRestResponse = (userToSend, userInDb) => {
  const isDeleted = _.get(userInDb, 'deleted', false);
  const isTerminated = _.get(userInDb, 'terminated', false);
  const isLocked = _.get(userInDb, 'isLocked', false);
  const isApiUser = _.get(userInDb, 'isApiUser', false);
  const isForcedPasswordChange = _.get(userInDb, 'forcePasswordChange', false);

  // TODO: consider using _.extend() or Object.assign
  userToSend._id = userInDb._id;
  userToSend.email = userInDb ? userInDb.email : null;
  userToSend.secondaryEmail = userInDb ? userInDb.secondaryEmail : null;
  userToSend.readDate = userInDb.readDate;
  userToSend.firstName = userInDb.firstName;
  userToSend.middleName = userInDb.middleName;
  userToSend.lastName = userInDb.lastName;
  userToSend.roles = userInDb ? userInDb.roles : [];
  userToSend.groups = userInDb ? userInDb.groups : [];
  userToSend.company = userInDb ? userInDb.company : null;
  userToSend.lastLoginAt = userInDb.lastLoginAt;
  userToSend.passwordChangeDate = userInDb.passwordChangeDate;
  userToSend.forcePasswordChange = isForcedPasswordChange;
  userToSend.projectManagers = userInDb && _.isArray(userInDb.projectManagers)
    ? userInDb.projectManagers.map((pm) => ({
      value: _.get(pm, '_id', _.get(pm, 'value')),
      text: _.get(pm, 'text', `${pm.firstName} ${pm.lastName}`),
    })) : [];
  userToSend.abilities = userInDb.abilities || [];
  userToSend.catTools = userInDb.catTools || [];
  userToSend.securityPolicy = _.get(userInDb, 'securityPolicy');
  userToSend.accountSync = _.get(userInDb, 'accountSync');
  userToSend.isOverwritten = _.get(userInDb, 'isOverwritten');
  userToSend.languageCombinations = userInDb.languageCombinations || [];
  userToSend.staffDetails = userInDb.staffDetails;
  userToSend.contactDetails = userInDb.contactDetails;
  userToSend.vendorDetails = userInDb.vendorDetails;
  userToSend.inactiveNotifications = userInDb.inactiveNotifications;
  userToSend.inactiveSecondaryEmailNotifications = userInDb.inactiveSecondaryEmailNotifications;
  userToSend.type = userInDb ? userInDb.type : null;
  userToSend.typeName = userInDb.typeName ? userInDb.typeName : '';
  userToSend.rolesText = userInDb.rolesText ? userInDb.rolesText : '';
  userToSend.pmNames = userInDb.pmNames ? userInDb.pmNames : '';
  userToSend.companyName = userInDb.companyName ? userInDb.companyName : '';
  userToSend.groupsText = userInDb.groupsText ? userInDb.groupsText : '';
  userToSend.abilitiesText = userInDb.abilitiesText ? userInDb.abilitiesText : '';
  userToSend.languageCombinationsText = userInDb.languageCombinationsText ? userInDb.languageCombinationsText : '';
  userToSend.catToolsText = userInDb.catToolsText ? userInDb.catToolsText : '';
  userToSend.inactiveText = userInDb.inactiveText ? userInDb.inactiveText : '';
  userToSend.terminatedText = userInDb.terminatedText ? userInDb.terminatedText : '';
  userToSend.isLockedText = userInDb.isLockedText ? userInDb.isLockedText : '';
  userToSend.isApiUserText = _.get(userInDb, 'isApiUserText', '');
  userToSend.password = '';
  userToSend.hipaaText = userInDb.hipaaText;
  userToSend.taxFormText = userInDb.taxFormText;
  userToSend.salesRepText = userInDb.salesRepText;
  userToSend.hireDateText = userInDb.hireDateText;
  userToSend.currencyName = userInDb.currencyName;
  userToSend.escalatedText = userInDb.escalatedText;
  userToSend.mainPhoneText = userInDb.mainPhoneText;
  userToSend.fixedCostText = userInDb.fixedCostText;
  userToSend.leadSourceText = userInDb.leadSourceText;
  userToSend.phoneNumberText = userInDb.phoneNumberText;
  userToSend.nationalityText = userInDb.nationalityText;
  userToSend.wtFeeWaivedText = userInDb.wtFeeWaivedText;
  userToSend.minimumHoursText = userInDb.minimumHoursText;
  userToSend.ataCertifiedText = userInDb.ataCertifiedText;
  userToSend.billingTermsName = userInDb.billingTermsName;
  userToSend.certificationsText = userInDb.certificationsText;
  userToSend.priorityPaymentText = userInDb.priorityPaymentText;
  userToSend.competenceLevelsText = userInDb.competenceLevelsText;
  userToSend.internalDepartmentsText = userInDb.internalDepartmentsText;
  userToSend.deleted = isDeleted;
  userToSend.terminated = isTerminated;
  userToSend.terminatedAt = _.get(userInDb, 'terminatedAt', null);
  userToSend.isLocked = isLocked;
  userToSend.isApiUser = isApiUser;
  userToSend.readDate = userInDb.updatedAt;
  userToSend.createdAt = userInDb.createdAt;
  userToSend.updatedAt = userInDb.updatedAt;
  userToSend.restoredAt = userInDb.restoredAt;
  userToSend.deletedAt = userInDb.deletedAt;
  userToSend.createdBy = userInDb.createdBy;
  userToSend.updatedBy = userInDb.updatedBy;
  userToSend.restoredBy = userInDb.restoredBy;
  userToSend.deletedBy = userInDb.deletedBy;
  userToSend.useTwoFactorAuthentification = _.get(userInDb, 'useTwoFactorAuthentification', false);
  userToSend.preferences = userInDb.preferences;
  userToSend.siConnector = _.get(userInDb, 'siConnector');
  userToSend.monthlyApiQuota = _.get(userInDb, 'monthlyApiQuota');
  userToSend.monthlyConsumedQuota = _.get(userInDb, 'monthlyConsumedQuota');
  userToSend.lastApiRequestedAt = _.get(userInDb, 'lastApiRequestedAt');
};

const fileStorageGenerator = (user, fileStorageFacade, file) => {
  let ext = fileUtils.getExtension(file.name);

  if (ext.length) {
    ext = `${ext}`;
  }
  return fileStorageFacade.userHiringDocument(user._id.toString(), file, ext, file._id);
};

const hiringDocumentList = (user, fileStorageFacade) => {
  let userDetails;

  if (user.staffDetails) {
    userDetails = user.staffDetails;
  }
  if (user.vendorDetails) {
    userDetails = user.vendorDetails;
  }
  const rawFiles = userDetails.hiringDocuments;
  const files = UserVersionableDocument.buildFromArray(rawFiles);

  if (!files.length) {
    this.logger.info(`User ${user._id} has no files`);
    throw new RestError(404, { message: 'No documents available to download' });
  }
  return files.map((f) => {
    const fsf = fileStorageGenerator(user, fileStorageFacade, f);

    fsf.__file__name__ = f.name;
    return fsf;
  });
};

const buildUsernameRegexp = (filter) => {
  const names = [];

  if (filter.name) {
    const nameArray = filter.name.split(' ');
    const len = nameArray.length;

    if (len === 1) {
      const nameRegexp = new RegExp(`${escapeRegexp(nameArray[0])}.*`, 'i');

      names.push({
        firstName: nameRegexp,
        lastName: nameRegexp,
      });
    } else if (len === 2) {
      const name = {};

      if (nameArray[0]) {
        const firstNameRegexp = new RegExp(`${escapeRegexp(nameArray[0])}.*`, 'i');

        name.firstName = firstNameRegexp;
      }
      if (nameArray[1]) {
        const lastNameRegexp = new RegExp(`${escapeRegexp(nameArray[1])}.*`, 'i');

        name.lastName = lastNameRegexp;
      }
      if (name.firstName || name.lastName) {
        names.push(name);
      }
    } else if (len > 2) {
      nameArray.forEach((name) => {
        if (name) {
          const nameRegexp = new RegExp(`${escapeRegexp(name)}.*`, 'i');

          names.push({
            firstName: nameRegexp,
            lastName: nameRegexp,
          });
        }
      });
    }
  }
  return names;
};

const prefixedNameQuery = (nameQuery, prefixProps) => {
  let prefix = '';

  if (prefixProps) {
    prefix = `${prefixProps}.`;
  }
  const nameArray = nameQuery.split(' ');
  const len = nameArray.length;
  const query = {};

  if (len === 1) {
    if (nameArray[0]) {
      const nameRegexp = new RegExp(`${escapeRegexp(nameArray[0])}.*`, 'i');
      const firstNameQuery = {};
      const lastNameQuery = {};

      firstNameQuery[`${prefix}firstName`] = nameRegexp;
      lastNameQuery[`${prefix}lastName`] = nameRegexp;
      query.$or = [
        firstNameQuery,
        lastNameQuery,
      ];
    }
  } else if (len === 2) {
    if (nameArray[0]) {
      const firstNameRegexp = new RegExp(`${escapeRegexp(nameArray[0])}.*`, 'i');

      query.firstName = firstNameRegexp;
    }
    if (nameArray[1]) {
      const lastNameRegexp = new RegExp(`${escapeRegexp(nameArray[1])}.*`, 'i');

      query.lastName = lastNameRegexp;
    }
  } else if (len > 2) {
    const or = [];

    nameArray.forEach((name) => {
      if (name) {
        const nameRegexp = new RegExp(`${escapeRegexp(name)}.*`, 'i');
        const firstNameQuery = {};
        const lastNameQuery = {};

        firstNameQuery[`${prefix}firstName`] = nameRegexp;
        lastNameQuery[`${prefix}lastName`] = nameRegexp;
        or.push(firstNameQuery);
        or.push(lastNameQuery);
      }
    });
  }
  return query;
};

const buildNameQuery = (nameQuery) => {
  const nameArray = nameQuery.split(' ');
  const len = nameArray.length;
  const query = {};

  if (len === 1) {
    if (nameArray[0]) {
      const nameRegexp = new RegExp(`${escapeRegexp(nameArray[0])}.*`, 'i');

      query.$and = [];
      query.$and.push({
        $or: [
          { firstName: nameRegexp },
          { lastName: nameRegexp },
        ],
      });
    }
  } else if (len === 2) {
    if (nameArray[0]) {
      const firstNameRegexp = new RegExp(`${escapeRegexp(nameArray[0])}.*`, 'i');

      query.firstName = firstNameRegexp;
    }
    if (nameArray[1]) {
      const lastNameRegexp = new RegExp(`${escapeRegexp(nameArray[1])}.*`, 'i');

      query.lastName = lastNameRegexp;
    }
  } else if (len > 2) {
    const or = [];

    nameArray.forEach((name) => {
      if (name) {
        const nameRegexp = new RegExp(`${escapeRegexp(name)}.*`, 'i');

        or.push({ firstName: nameRegexp });
        or.push({ lastName: nameRegexp });
      }
    });
    if (or.length) {
      query.$and = _.get(query, '$and', []);
      query.$and.push({ $or: or });
    }
  }
  return query;
};

const addNameQuery = (filter, query) => {
  if (filter.name) {
    Object.assign(query, buildNameQuery(filter.name));
  }
};

module.exports = {
  hiringDocumentList,
  isEmailInvalid,
  validateEmail,
  validatePassword,
  assignUserForSaving,
  filterGenerator,
  applyFilters,
  createUserToastForNewUser,
  userToSendFactory,
  assignUserForRestResponse,
  addNameQuery,
  buildNameQuery,
  prefixedNameQuery,
  buildUsernameRegexp,
};
