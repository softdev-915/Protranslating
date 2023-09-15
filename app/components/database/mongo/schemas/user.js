const mongoose = require('mongoose');
const Promise = require('bluebird');
const moment = require('moment');
const _ = require('lodash');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const siConnectorPlugin = require('../plugins/si-connector');
const importModulePlugin = require('../plugins/import-module');
const piiPlugin = require('../plugins/pii-plugin');
const { sanitizeHTML } = require('../../../../utils/security/html-sanitize');
const { csvVirtualParser } = require('../../../../utils/csvExporter');
const { userLspPopulate, validObjectId, convertToObjectId } = require('../../../../utils/schema');
const { decimal128ToNumber } = require('../../../../utils/bigjs');
const transactionHelper = require('../plugins/transaction-helper');
const configuration = require('../../../configuration');
const ApplicationCrypto = require('../../../crypto');
const { validateEmail } = require('../validators');
const { generateEntityFieldsPathsMap } = require('../utils');

const envConfig = configuration.environment;
const applicationCrypto = new ApplicationCrypto(envConfig.CRYPTO_KEY_PATH);
const IS_PRODUCTION = _.get(envConfig, 'NODE_ENV') === 'PROD';
const DEFAULT_API_USER_MIN_PASSWORD_LENGTH = 256;
const E2E_TEST_INACTIVE_USER = 'lms46v1@sample.com';
const VENDOR_USER_TYPE = 'Vendor';
const STAFF_USER_TYPE = 'Staff';
const CONTACT_USER_TYPE = 'Contact';
const DEFAULT_QA_WARNING_MESSAGES_COLOR = '#F6B26B';
const DEFAULT_QA_ERROR_MESSAGES_COLOR = '#FF0000';
const DEFAULT_INLINE_USER_TAGS_COLOR = '#c2561a';
const DEFAULT_INLINE_SYSTEM_TAGS_COLOR = '#0000FF';
const ELIGIBLE_TAX_FORM = '1099 Eligible';
const USER_PII = {
  vendorDetails: {
    billingInformation: {
      fields: ['taxId'],
    },
  },
};

const buildAvgRateMatchStage = (filters, abilityInDb) => {
  const matchStage = {
    rateDetails: {
      $elemMatch: {
        'breakdown._id': filters.breakdown
          ? convertToObjectId(filters.breakdown)
          : null,

        'translationUnit._id': filters.translationUnit
          ? convertToObjectId(filters.translationUnit)
          : null,
      },
    },
  };

  if (filters.ability) {
    matchStage['ability.name'] = filters.ability;
  }

  if (abilityInDb.languageCombination) {
    if (filters.sourceLanguage) {
      matchStage['sourceLanguage.name'] = filters.sourceLanguage;
    }
    if (filters.targetLanguage) {
      matchStage['targetLanguage.name'] = filters.targetLanguage;
    }
  }

  if (abilityInDb.internalDepartmentRequired) {
    if (filters.internalDepartment) {
      matchStage['internalDepartment._id'] = convertToObjectId(filters.internalDepartment);
    }
  }
  return matchStage;
};

const buildAvgRateMapStage = (matchPipelines) => ({
  input: '$vendorDetails.rates',
  as: 'rate',
  in: {
    $filter: {
      input: '$$rate.rateDetails',
      as: 'rateDetail',
      cond: {
        $and: [
          ...Object.keys(_.omit(matchPipelines, 'rateDetails'))
            .map((key) => ({ $eq: [`$$rate.${key}`, matchPipelines[key]] })),
          ...Object.keys(matchPipelines.rateDetails.$elemMatch)
            .map((key) => ({ $eq: [`$$rateDetail.${key}`, matchPipelines.rateDetails.$elemMatch[key]] })),

        ],
      },
    },
  },
}
);

const DEFAULT_USER_PROJECTION = {
  _id: 1,
  email: 1,
  secondaryEmail: 1,
  lsp: 1,
  type: 1,
  roles: 1,
  groups: 1,
  deleted: 1,
  terminated: 1,
  terminatedAt: 1,
  isLocked: 1,
  isApiUser: 1,
  firstName: 1,
  middleName: 1,
  abilities: 1,
  lastName: 1,
  catTools: 1,
  company: 1,
  lastLoginAt: 1,
  passwordChangeDate: 1,
  profileImage: 1,
  projectManagers: 1,
  contactDetails: 1,
  vendorDetails: 1,
  staffDetails: 1,
  languageCombinations: 1,
  securityPolicy: 1,
  accountSync: 1,
  isOverwritten: 1,
  inactiveNotifications: 1,
  inactiveSecondaryEmailNotifications: 1,
  forcePasswordChange: 1,
  updatedAt: 1,
  uiSettings: 1,
  preferences: 1,
  siConnector: 1,
  useTwoFactorAuthentification: 1,
  internalDepartmentsText: 1,
  minimumHoursText: 1,
  salesRepText: 1,
  leadSourceText: 1,
  hipaaText: 1,
  ataCertifiedText: 1,
  escalatedText: 1,
  fixedCostText: 1,
  priorityPaymentText: 1,
  wtFeeWaivedText: 1,
  portalTranslatorSettings: 1,
  monthlyApiQuota: 1,
  monthlyConsumedQuota: 1,
  lastApiRequestedAt: 1,
};

const buildDefaultPopulate = () => [{
  path: 'projectManagers',
  select: userLspPopulate(),
  options: { withDeleted: true },
}, {
  path: 'contactDetails.salesRep',
  select: userLspPopulate(),
  options: { withDeleted: true },
}, {
  path: 'contactDetails.leadSource',
}, {
  path: 'vendorDetails.billingInformation.taxForm',
}, {
  path: 'vendorDetails.competenceLevels',
}, {
  path: 'vendorDetails.registrationCountries',
  select: '_id name',
},
{
  path: 'staffDetails.competenceLevels',
},
{
  path: 'company',
  select: '_id name hierarchy',
  options: { withDeleted: true },
}];

const commonStaffVendorProps = [
  'competenceLevels',
  'phoneNumber',
  'approvalMethod',
  'hireDate',
  'ofac',
  'rates',
  'hiringDocuments',
  'internalDepartments',
];
const departmentRelatedStaffBasedOnRoles = (departments = []) => ([{
  'staffDetails.internalDepartments': {
    $in: departments,
  },
}, {
  'vendorDetails.internalDepartments': {
    $in: departments,
  },
}]);

const userWithRoles = (roles) => ([{
  roles: {
    $in: roles,
  },
},
{
  groups: {
    $elemMatch: {
      roles: {
        $in: roles,
      },
    },
  },
}]);

const activityOwnerRolesCondition = (creatorEmail, creatorRolesWithAllSuffix, creatorRolesWithOwnSuffix, activityDepartments) => ({
  email: creatorEmail,
  $or: [{
    $or: userWithRoles(creatorRolesWithAllSuffix),
  }, {
    $and: [{
      $or: departmentRelatedStaffBasedOnRoles(activityDepartments),
    }, {
      $or: userWithRoles(creatorRolesWithOwnSuffix),
    }],
  }],
});

const activityNotOwnerRolesCondition = (creatorEmail, userRolesWithAllSuffix, userRolesWithDepartmentSuffix, activityDepartments) => {
  const notOwnerCondition = {
    email: {
      $ne: creatorEmail,
    },
    $or: userWithRoles(userRolesWithAllSuffix),
  };

  if (_.get(userRolesWithDepartmentSuffix, 'length')) {
    notOwnerCondition.$or.push({
      $and: [{
        $or: departmentRelatedStaffBasedOnRoles(activityDepartments),
        roles: {
          $in: userRolesWithDepartmentSuffix,
        },
      }],
    });
  }
  return notOwnerCondition;
};

const setStaffVendorCommonProps = (targetProps, srcProps) => {
  commonStaffVendorProps.forEach((k) => {
    if (_.has(srcProps, k)) {
      targetProps[k] = srcProps[k];
    }
  });
};

const entityValidator = function (_id, modelName, lspId) {
  if (_.isNil(lspId)) {
    const firstParent = this.parent();
    const secondParent = firstParent.parent();

    if (_.get(secondParent, 'lsp')) {
      lspId = secondParent.lsp;
    } else {
      const thirdParent = secondParent.parent();

      lspId = _.get(thirdParent, 'lsp');
    }
  }
  if (!validObjectId(_id)) {
    return Promise.resolve(false);
  }
  if (lspId) {
    return mongoose.models[modelName].findOne({ _id, lspId }).then((found) => found !== null);
  }
  return Promise.resolve(false);
};
const { Schema } = mongoose;
const RateLanguageSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  isoCode: {
    type: String,
    required: true,
  },
}, { _id: false });

const RateSchema = new Schema({
  sourceLanguage: {
    type: RateLanguageSchema,
  },
  targetLanguage: {
    type: RateLanguageSchema,
  },
  ability: {
    _id: { type: Schema.ObjectId, ref: 'Ability' },
    name: String,
    languageCombination: {
      type: Boolean,
      default: false,
    },
  },
  internalDepartment: {
    _id: { type: Schema.ObjectId, ref: 'InternalDepartment' },
    name: String,
  },
  company: {
    _id: {
      type: Schema.ObjectId,
      validate: {
        validator(_id) {
          if (validObjectId(_id)) {
            return entityValidator.bind(this)(_id, 'Company');
          }
          return true;
        },
        message: (props) => `${props.value} is not a valid company!`,
      },
    },
    name: String,
  },
  catTool: {
    type: String,
  },
  isDrafted: {
    type: Boolean,
  },
  rateDetails: [{
    price: Number,
    breakdown: {
      _id: { type: Schema.ObjectId, ref: 'Breakdown', default: null },
      name: String,
    },
    currency: {
      _id: { type: Schema.ObjectId, ref: 'Currency' },
      name: String,
    },
    translationUnit: {
      _id: { type: Schema.ObjectId, ref: 'TranslationUnit', default: null },
      name: String,
    },
  }],
}, { timestamps: true });

const GroupSchema = new Schema({
  name: {
    type: String,
  },
  lspId: {
    type: Schema.ObjectId,
    ref: 'Lsp',
  },
  roles: [String],
});

const ProfileImage = new Schema({
  file: String,
  extension: String,
  mime: String,
}, { _id: false });

const TimeZoneType = {
  value: String,
  isAutoDetected: Boolean,
};

const UserSessionSchema = new Schema({
  sessionId: String,
  loggedAt: {
    type: Date,
    default: null,
  },
  sessionUpdatedAt: {
    type: Date,
    default: null,
  },
  timeZone: {
    type: TimeZoneType,
  },
  userAgent: String,
  originIP: String,
  cookie: String,
  location: {
    type: {
      city: String,
      country: String,
    },
  },
}, { _id: false });

const UserBillingInformationSchema = new Schema({
  paymentMethod: {
    type: Schema.ObjectId,
    ref: 'PaymentMethod',
  },
  wtCountry: {
    type: Schema.ObjectId,
    ref: 'Country',
    default: null
  },
  fixedCost: {
    type: Boolean,
    default: false,
  },
  ptPayOrPayPal: {
    type: String,
    default: '',
  },
  priorityPayment: {
    type: Boolean,
    default: false,
  },
  billsOnHold: {
    type: Boolean,
    default: false,
  },
  flatRate: {
    type: Boolean,
    default: false,
  },
  hasMonthlyBill: {
    type: Boolean,
    default: false,
  },
  billCreationDay: Number,
  form1099Type: {
    type: String,
    default: '',
  },
  form1099Box: {
    type: String,
    default: '',
  },
  flatRateAmount: {
    type: Number,
    default: 0,
  },
  wtFeeWaived: {
    type: Boolean,
    default: false,
  },
  billingTerms: {
    type: Schema.ObjectId,
    ref: 'BillingTerm',
  },
  paymentFrequency: Number,
  taxForm: [{
    type: Schema.ObjectId,
    ref: 'TaxForm',
  }],
  taxId: {
    type: String,
    get: (taxId) => (!_.isEmpty(taxId) ? applicationCrypto.decrypt(taxId) : ''),
    set: (taxId) => (!_.isEmpty(taxId) ? applicationCrypto.encrypt(taxId) : ''),
  },
  currency: {
    type: Schema.ObjectId,
    ref: 'Currency',
  },
  billPaymentNotes: String,
}, {
  _id: false,
  toJSON: { getters: true },
  toObject: { getters: true },
});

const AddressSchema = new Schema({
  line1: String,
  line2: String,
  city: String,
  country: {
    _id: Schema.ObjectId,
    name: String,
    code: String,
  },
  state: {
    _id: Schema.ObjectId,
    name: String,
    code: String,
    country: Schema.ObjectId,
  },
  zip: String,
}, { _id: false });

const ContactBillingAddressSchema = new Schema({
  line1: {
    type: String,
    required: true,
  },
  line2: String,
  city: {
    type: String,
    required: true,
  },
  country: {
    _id: { type: Schema.ObjectId, ref: 'Country', required: true },
    name: String,
    code: String,
  },
  state: {
    _id: Schema.ObjectId,
    name: String,
    code: String,
    country: Schema.ObjectId,
  },
  zip: {
    type: String,
    required: true,
  },
}, { _id: false });

const UserHiringDocumentSchema = new Schema({
  name: String,
  fileType: {
    type: String,
    enum: [
      'Agreement/Disclosure',
      'CV/Resume/Certification',
      'Technical Evaluation',
      'Tax Form',
      'Audit/Escalation Form',
      'Change of Information',
      'Other',
    ],
  },
  uploadDate: Date,
  mime: String,
  encoding: String,
  size: Number,
}, { timestamps: true });

const StaffDetailsSchema = new Schema({
  outlier: {
    type: Boolean,
    default: false,
  },
  competenceLevels: [{
    type: Schema.ObjectId,
    ref: 'CompetenceLevel',
  }],
  internalDepartments: [{
    type: Schema.ObjectId,
    ref: 'InternalDepartment',
  }],
  remote: Boolean,
  phoneNumber: String,
  jobTitle: String,
  approvalMethod: String,
  hireDate: Date,
  ofac: {
    type: String,
    enum: ['N/A', 'Clear', 'Blocked'],
    default: 'N/A',
  },
  comments: String,
  fileType: String,
  hiringDocuments: [[UserHiringDocumentSchema]],
  rates: {
    type: [RateSchema],
    default: [],
  },
}, { _id: false });

const VendorDetailsSchema = new Schema({
  type: {
    type: String,
  },
  outlier: {
    type: Boolean,
    default: false,
  },
  vendorCompany: {
    type: String,
    trim: true,
  },
  minHours: {
    type: Number,
  },
  ataCertified: {
    type: Boolean,
    default: false,
  },
  escalated: {
    type: Boolean,
    default: false,
  },
  turnOffOffers: {
    type: Boolean,
    default: false,
  },
  competenceLevels: [{
    type: Schema.ObjectId,
    ref: 'CompetenceLevel',
  }],
  internalDepartments: [{
    type: Schema.ObjectId,
    ref: 'InternalDepartment',
  }],
  phoneNumber: String,
  address: AddressSchema,
  nationality: {
    type: Schema.ObjectId,
    ref: 'Country',
  },
  approvalMethod: String,
  hireDate: Date,
  ofac: {
    type: String,
    enum: ['N/A', 'Clear', 'Blocked'],
    default: 'N/A',
  },
  billingInformation: UserBillingInformationSchema,
  hiringDocuments: [[UserHiringDocumentSchema]],
  rates: {
    type: [RateSchema],
    default: [],
  },
  certifications: {
    type: [{
      _id: { type: Schema.ObjectId, ref: 'Certification' },
      name: String,
      expirationDate: { type: Date, default: null },
    }],
    default: [],
  },
  hipaa: { type: Boolean, default: false },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Not Selected'],
    default: 'Not Selected',
  },
  minimumHours: { type: Number, default: 0 },
  originCountry: {
    _id: { type: Schema.ObjectId, ref: 'Country', default: null },
    name: { type: String, default: '' },
  },
  vendorStatus: {
    type: String,
    enum: ['Pending Review', 'Reviewed', 'Approved', 'Not Approved', 'Relationship ended by LSP', 'Relationship ended by Vendor'],
    default: 'Approved',
  },
  isLawyer: Boolean,
  isPracticing: Boolean,
  isBarRegistered: Boolean,
  registrationCountries: [{
    type: Schema.ObjectId,
    ref: 'Country',
  }],
  billBalance: { type: Number, default: 0 },
  totalBalance: { type: Number, default: 0 },
  debitMemoAvailable: {
    type: Number,
    default: 0,
  },
  creditMemoAvailable: {
    type: Number,
    default: 0,
  },
}, {
  _id: false,
  toJSON: { getters: true },
  toObject: { getters: true },
});

const MainPhoneSchema = new Schema({
  number: {
    type: String,
    required: [true, 'User main phone number required'],
  },
  ext: String,
}, {
  _id: false,
  timestamps: true,
});

const ContactDetailsSchema = new Schema({
  linkedInUrl: String,
  mainPhone: {
    type: MainPhoneSchema,
    required: true,
  },
  officePhone: {
    type: String,
  },
  mobilePhone: {
    type: String,
  },
  homePhone: {
    type: String,
  },
  jobTitle: String,
  billingEmail: {
    type: String,
    required: true,
  },
  contactStatus: {
    type: String,
    enum: ['Lead', 'Prospect', 'Customer', 'Reviewer'],
    default: 'Lead',
  },
  qualificationStatus: {
    type: String,
    enum: ['Contacting', 'Identifying', 'Lost', 'No Current Need', 'Won'],
    default: 'Identifying',
  },
  leadSource: {
    type: Schema.ObjectId,
    ref: 'LeadSource',
    validate: {
      validator(_id) {
        const user = this.parent();
        const lspId = _.get(user, 'lsp._id', null);
        const isValidId = mongoose.isValidObjectId(_id);

        if (!isValidId && _id !== '') {
          throw new Error(`Invalid ObjectId ${_id} for lead Source entity`);
        }
        if (_id && lspId) {
          return mongoose.models.LeadSource.findOne({ _id, lspId })
            .then((found) => found !== null);
        }
        return true;
      },
    },
  },
  companyTierLevel: {
    type: String,
    enum: ['1', '2', '3', 'Lead-No Language Need'],
    default: '1',
  },
  mailingAddress: AddressSchema,
  billingAddress: ContactBillingAddressSchema,
  salesRep: {
    type: Schema.ObjectId,
    ref: 'User',
    validate: {
      validator(_id) {
        const user = this.parent();
        const lspId = _.get(user, 'lsp._id', null);
        const isValidId = mongoose.isValidObjectId(_id);

        if (!isValidId && _id !== '') {
          throw new Error(`Invalid ObjectId ${_id} for User entity`);
        }
        if (_id && lspId) {
          return mongoose.models.User.findOne({ _id, lsp: lspId })
            .then((found) => found !== null);
        }
        return true;
      },
    },
  },
}, {
  _id: false,
});

const UserUiSettingDefaultValue = {
  catUiSettings: {
    inlineUserTags: {
      color: DEFAULT_INLINE_USER_TAGS_COLOR,
    },
    inlineSystemTags: {
      color: DEFAULT_INLINE_SYSTEM_TAGS_COLOR,
    },
    qaErrorMessages: {
      color: DEFAULT_QA_ERROR_MESSAGES_COLOR,
    },
    qaWarningMessages: {
      color: DEFAULT_QA_WARNING_MESSAGES_COLOR,
    },
  },
};

const UserUiSettingSchema = new Schema(
  {
    catUiSettings: {
      inlineUserTags: { color: String },
      inlineSystemTags: { color: String },
      qaErrorMessages: { color: String },
      qaWarningMessages: { color: String },
    },
  },
  {
    _id: false,
  },
);

const PortalTranslatorSettingsSchema = new Schema({
  sourceLanguage: {
    type: String,
  },
  targetLanguage: {
    type: String,
  },
  isGeneral: {
    type: Boolean,
  },
  industry: {
    type: String,
  },
  client: {
    type: Schema.ObjectId,
    ref: 'Company',
  },
  maxSuggestions: {
    type: Number,
  },
  isDisplayGeneral: {
    type: Boolean,
  },
  isDisplayIndustry: {
    type: Boolean,
  },
  isDisplayClient: {
    type: Boolean,
  },
  segmentationType: {
    type: String,
    enum: ['Client', 'LSP'],
  },
  segmentationCompany: {
    _id: {
      type: Schema.ObjectId,
      ref: 'Company',
    },
    name: String,
    hierarchy: {
      type: String,
    },
  },
}, {
  _id: false,
});

const UserSchema = new Schema({
  email: {
    type: String,
    validate: validateEmail,
  },
  firstName: String,
  middleName: String,
  lastName: String,
  secondaryEmail: {
    type: String,
    validate: validateEmail,
  },
  inactiveSecondaryEmailNotifications: {
    type: Boolean,
    default: true,
  },
  lsp: {
    type: Schema.ObjectId,
    ref: 'Lsp',
  },
  profileImage: ProfileImage,
  roles: [String],
  groups: [GroupSchema],
  failedLoginAttempts: { type: Number, default: 0 },
  startLockEffectivePeriod: { type: Date, default: null },
  passwordChangeDate: {
    type: Date,
    default: null,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  lastTimeZone: {
    type: TimeZoneType,
  },
  userSessions: [UserSessionSchema],
  type: {
    type: String,
    enum: ['Staff', 'Vendor', 'Contact', 'Unknown'],
    default: 'Unknown',
  },
  company: {
    type: Schema.ObjectId,
    ref: 'Company',
  },
  projectManagers: [{
    type: Schema.ObjectId,
    ref: 'User',
  }],
  abilities: [{
    type: String,
  }],
  isOverwritten: {
    type: Boolean,
    default: true,
  },
  securityPolicy: {
    type: {
      passwordExpirationDays: {
        type: Number,
        validate: {
          validator(value) {
            return value > 0;
          },
          message: 'Password expiration days number should be greater than 0',
        },
      },
      numberOfPasswordsToKeep: {
        type: Number,
        validate: {
          validator(value) {
            return value > 0;
          },
          message: 'Number of passwords to keep should be greater than 0',
        },
      },
      minPasswordLength: {
        type: Number,
        validate: {
          validator(value) {
            return value > 0;
          },
          message: 'Password length should be greater than 0',
        },
      },
      maxInvalidLoginAttempts: {
        type: Number,
        validate: {
          validator(value) {
            return value > 0;
          },
          message: 'Invaild login attempts number should be greater than 0',
        },
      },
      lockEffectivePeriod: {
        type: Number,
        validate: {
          validator(value) {
            return value > 0;
          },
          message: 'Lock effective period should be greater than 0',
        },
      },
      timeoutInactivity: {
        type: Number,
        validate: {
          validator(value) {
            return value > 0;
          },
          message: 'Timeout inactivity should be greater than 0',
        },
      },
      passwordComplexity: {
        type: {
          lowerCaseLetters: {
            type: Boolean,
          },
          upperCaseLetters: {
            type: Boolean,
          },
          specialCharacters: {
            type: Boolean,
          },
          hasDigitsIncluded: {
            type: Boolean,
          },
        },
        default: null,
      },
    },
  },
  languageCombinations: [String],
  catTools: [{
    type: String,
  }],
  staffDetails: StaffDetailsSchema,
  vendorDetails: VendorDetailsSchema,
  contactDetails: ContactDetailsSchema,
  forcePasswordChange: {
    type: Boolean,
    default: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  isApiUser: {
    type: Boolean,
    default: false,
  },
  terminated: {
    type: Boolean,
    default: false,
  },
  terminatedBy: {
    type: String,
    default: null,
  },
  terminatedAt: {
    type: Date,
    default: null,
  },
  inactiveNotifications: {
    type: [String],
    default: [],
  },
  forgotPassword: {
    code: String,
    creation: Date,
  },
  certificationsText: {
    type: String,
    default: '',
  },
  nationalityText: {
    type: String,
    default: '',
  },
  mainPhoneText: {
    type: String,
    default: '',
  },
  internalDepartmentsText: {
    type: String,
    default: '',
  },
  minimumHoursText: {
    type: String,
    default: '',
  },
  hireDateText: {
    type: String,
    default: '',
  },
  phoneNumberText: {
    type: String,
    default: '',
  },
  taxFormText: {
    type: String,
    default: '',
  },
  salesRepText: {
    type: String,
    default: '',
  },
  leadSourceText: {
    type: String,
    default: '',
  },
  hipaaText: {
    type: String,
    default: '',
  },
  ataCertifiedText: {
    type: String,
    default: '',
  },
  escalatedText: {
    type: String,
    default: '',
  },
  fixedCostText: {
    type: String,
    default: '',
  },
  priorityPaymentText: {
    type: String,
    default: '',
  },
  wtFeeWaivedText: {
    type: String,
    default: '',
  },
  uiSettings: {
    type: UserUiSettingSchema,
    default: UserUiSettingDefaultValue,
  },
  useTwoFactorAuthentification: {
    type: Boolean,
    default: false,
  },
  preferences: Schema.Types.Mixed,
  portalCatDefaultConfig: Schema.Types.Mixed,
  portalTranslatorSettings: PortalTranslatorSettingsSchema,
  monthlyApiQuota: {
    type: Number,
    default: 10000000,
  },
  monthlyConsumedQuota: {
    type: Number,
    default: 0,
  },
  lastApiRequestedAt: {
    type: Date,
    default: null,
  },
  shouldMockSiUserSyncFail: {
    type: Boolean,
  },
}, {
  collection: 'users',
  timestamps: true,
});

// Part of the basic check
UserSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

UserSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Allow virtuals to be converted to JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

const validateVendorEntities = (user) => {
  const promises = [];
  const billingInformation = _.get(user, 'vendorDetails.billingInformation');
  const paymentMethodId = _.get(billingInformation, 'paymentMethod');
  const isVendorEscalated = _.get(user, 'vendorDetails.escalated');

  if (isVendorEscalated || user.terminated) {
    // Do not modify it to _.set, because it triggers encryption of taxId for the second time
    user.vendorDetails.turnOffOffers = true;
  }
  if (!_.isNil(paymentMethodId)) {
    promises.push(() => entityValidator(new mongoose.Types.ObjectId(paymentMethodId), 'PaymentMethod', user.lsp)
      .then((isFound) => {
        if (!isFound) {
          throw new Error(`Payment method with _id: ${paymentMethodId} was not found`);
        }
      }));
  }
  const billingTermId = _.get(billingInformation, 'billingTerms');

  if (!_.isNil(billingTermId)) {
    promises.push(() => entityValidator(new mongoose.Types.ObjectId(billingTermId), 'BillingTerm', user.lsp)
      .then((isFound) => {
        if (!isFound) {
          throw new Error(`Billing term ${billingTermId} was not found`);
        }
      }));
  }
  const currencyId = _.get(billingInformation, 'currency');

  if (!_.isNil(currencyId)) {
    promises.push(() => entityValidator(new mongoose.Types.ObjectId(currencyId), 'Currency', user.lsp)
      .then((isFound) => {
        if (!isFound) {
          throw new Error(`Currency ${currencyId} was not found`);
        }
      }));
  }
  const taxForms = _.get(billingInformation, 'taxForm', []);
  const form1099Type = _.get(billingInformation, 'form1099Type', '');
  const form1099Box = _.get(billingInformation, 'form1099Box', '');

  if (taxForms.length > 0) {
    const taxFormIdList = taxForms.map((tf) => new mongoose.Types.ObjectId(tf));

    promises.push(() => mongoose.models.TaxForm.find({
      _id: { $in: taxFormIdList },
      lspId: user.lsp,
    }, { _id: 1, name: 1 })
      .then((found) => {
        if (found.some((f) => f.name === ELIGIBLE_TAX_FORM)) {
          if (_.isEmpty(form1099Type) || _.isEmpty(form1099Box)) {
            throw new Error('Missing mandatory fields "Form 1099 Type/Box"');
          }
        }
        if (found.length !== taxFormIdList.length) {
          const deletedTaxForms = taxFormIdList.filter((t) => _.isNil(found.find((f) => f._id.toString() === t.toString()))).map((t) => t.toString());

          throw new Error(`The following tax form records were not found in the database: ${deletedTaxForms.join(', ')}`);
        }
      }));
  }
  return promises;
};

const validateAllUsersEntities = (user) => {
  const promises = [];

  promises.push(() => {
    if (_.get(user, 'abilities.length', 0) > 0) {
      const abilities = user.abilities.toObject();
      return mongoose.models.Ability.find({
        name: { $in: abilities },
        lspId: user.lsp,
      }, { _id: 1, name: 1 }).lean()
        .then((abilitiesFound) => {
          if (abilitiesFound.length !== user.abilities.length) {
            const deletedAbilities = abilities.filter((a) => _.isNil(abilitiesFound.find((af) => af.name === a)));

            throw new Error(`The following abilities were not found in the database: ${deletedAbilities.join(', ')}`);
          }
        });
    }
  });
  return promises;
};
const validateVendorStaffEntities = (user, userDetailsField) => {
  const promises = [];

  promises.push(() => {
    const competenceLevels = _.get(user, `${userDetailsField}.competenceLevels`, []);

    if (competenceLevels.length > 0) {
      const competenceLevelIdList = competenceLevels.map((cl) => new mongoose.Types.ObjectId(cl));
      return mongoose.models.CompetenceLevel.find({
        _id: { $in: competenceLevelIdList },
        lspId: user.lsp,
      }, { _id: 1 })
        .then((found) => {
          if (found.length !== competenceLevelIdList.length) {
            const deletedCompetenceLevels = competenceLevelIdList.filter((c) => _.isNil(found.find((f) => f._id.toString() === c.toString()))).map((c) => c.toString());

            throw new Error(`The following competence levels (_id's) were not found in the database: ${deletedCompetenceLevels.join(', ')}`);
          }
        });
    }
  });
  promises.push(() => {
    const internalDepartments = _.get(user, `${userDetailsField}.internalDepartments`, []);

    if (internalDepartments.length > 0) {
      const internalDepartmentIdList = internalDepartments.map((cl) => new mongoose.Types.ObjectId(cl));
      return mongoose.models.InternalDepartment.find({
        _id: { $in: internalDepartmentIdList },
        lspId: user.lsp,
      }, { _id: 1 })
        .then((found) => {
          if (found.length !== internalDepartmentIdList.length) {
            const deletedInternalDepartments = internalDepartmentIdList.filter((i) => _.isNil(found.find((f) => f._id.toString() === i.toString()))).map((i) => i.toString());

            throw new Error(`The following internal department (_id's) records were not found in the database: ${deletedInternalDepartments.join(', ')}`);
          }
        });
    }
  });
  return promises;
};

const buildSetUpdateForUser = (user, entityFieldName) => ({
  [`${entityFieldName}.firstName`]: user.firstName,
  [`${entityFieldName}.middleName`]: user.middleName,
  [`${entityFieldName}.lastName`]: user.lastName,
  [`${entityFieldName}.email`]: _.get(user, 'email', ''),
  [`${entityFieldName}.deleted`]: _.get(user, 'deleted', false),
  [`${entityFieldName}.terminated`]: _.get(user, 'terminated', false),
});

UserSchema.pre('save', async function (next) {
  let userDetailsField;
  let promises = [];

  if (!_.isNil(this.type) && !_.isEmpty(this.type)) {
    if (this.type === STAFF_USER_TYPE) {
      userDetailsField = 'staffDetails';
    } else {
      userDetailsField = 'vendorDetails';
    }
    promises = promises.concat(validateAllUsersEntities(this));
    if (this.type === VENDOR_USER_TYPE) {
      promises = promises.concat(validateVendorEntities(this));
    }
    if (this.type !== CONTACT_USER_TYPE) {
      promises = promises.concat(validateVendorStaffEntities(this, userDetailsField));
    }
    await Promise.map(promises, (promise) => promise());
  }
  next();
});

UserSchema.pre('save', function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  if (this.type === VENDOR_USER_TYPE) {
    if (this.staffDetails) {
      setStaffVendorCommonProps(this.vendorDetails, this.staffDetails);
    }
    this.staffDetails = undefined;
    if (_.get(this, 'vendorDetails.billingInformation.billPaymentNotes')) {
      this.vendorDetails.billingInformation.billPaymentNotes = sanitizeHTML(this.vendorDetails.billingInformation.billPaymentNotes);
    }
  }
  if (this.type === STAFF_USER_TYPE) {
    if (this.vendorDetails) {
      setStaffVendorCommonProps(this.staffDetails, this.vendorDetails);
    }
    this.vendorDetails = undefined;
    if (_.get(this, 'staffDetails.comments')) {
      this.staffDetails.comments = sanitizeHTML(this.staffDetails.comments);
    }
  }
  next();
});

UserSchema.pre('save', function (next) {
  this.phoneNumberText = _.get(this, 'staffDetails.phoneNumber', '')
    || _.get(this, 'vendorDetails.phoneNumber', '');
  this.hipaaText = _.get(this, 'vendorDetails.hipaa', '').toString();
  this.escalatedText = _.get(this, 'vendorDetails.escalated', false).toString();
  this.ataCertifiedText = _.get(this, 'vendorDetails.ataCertified', '').toString();
  this.fixedCostText = _.get(this, 'vendorDetails.billingInformation.fixedCost', '').toString();
  this.wtFeeWaivedText = _.get(this, 'vendorDetails.billingInformation.wtFeeWaived', '').toString();
  this.priorityPaymentText = _.get(this, 'vendorDetails.billingInformation.priorityPayment', '').toString();
  next();
});
UserSchema.statics.PATHS_TO_MASK = generateEntityFieldsPathsMap(USER_PII);
UserSchema.statics.updateUserGroups = async function (user) {
  let updatedUser = user;

  if (!_.isEmpty(user.groups)) {
    const updatedUserGroups = [];

    await Promise.map((user.groups), async (group) => {
      const groupInDb = await mongoose.models.Group.findOne({ _id: group._id });

      if (!_.isNil(groupInDb)) {
        updatedUserGroups.push(groupInDb);
      }
    });
    if (!_.isEmpty(updatedUserGroups)) {
      updatedUser = await mongoose.models.User.findOneAndUpdate(
        { _id: user._id },
        { $set: { groups: updatedUserGroups } },
        { new: true },
      );
    }
  }
  if (!_.isNil(updatedUser)) {
    return updatedUser;
  }
  return user;
};

UserSchema.statics.getSecurityPolicy = async function (email, lsp, user) {
  let dbUser;

  if (!_.isNil(user)) {
    dbUser = user;
  } else {
    const projection = 'type isApiUser company securityPolicy failedLoginAttempts startLockEffectivePeriod useTwoFactorAuthentification';

    dbUser = await mongoose.models.User.findOneWithDeleted({ email, lsp }, projection).populate('lsp company');
  }
  let securityPolicy = _.get(dbUser, 'securityPolicy');
  const userLsp = _.get(dbUser, 'lsp');
  const userCompany = _.get(dbUser, 'company');
  const userType = _.get(dbUser, 'type');
  let getSecurityPolicyPromise;

  if (!dbUser.isOverwritten || _.isEmpty(securityPolicy)) {
    if (userType === CONTACT_USER_TYPE) {
      getSecurityPolicyPromise = mongoose.models.Company.getSecurityPolicy(userCompany, userLsp);
    } else {
      getSecurityPolicyPromise = mongoose.models.Lsp.getSecurityPolicy(userLsp);
    }
    try {
      securityPolicy = await getSecurityPolicyPromise;
    } catch (err) {
      throw new Error(`Failed to parse security policy. User id: ${dbUser.id} ${err}`);
    }
  }
  if (dbUser.isApiUser) {
    securityPolicy.minPasswordLength = DEFAULT_API_USER_MIN_PASSWORD_LENGTH;
  }
  return {
    startLockEffectivePeriod: _.get(dbUser, 'startLockEffectivePeriod'),
    failedLoginAttempts: _.get(dbUser, 'failedLoginAttempts'),
    securityPolicy,
  };
};

UserSchema.statics.postSave = async function (user, modifiedFields) {
  const commonFields = ['email', 'firstName', 'middleName', 'deleted', 'terminated', 'lastName'];
  const requestProviderTriggerFields = ['terminated', 'deleted', 'vendorDetails.escalated'];
  const requestContactTriggerFields = commonFields.concat(['company', 'projectManagers', 'contactDetails.salesRep']);
  const nonCancelledCompletedQuery = [
    { status: { $ne: 'cancelled' } },
    { status: { $ne: 'completed' } },
  ];
  let promises = [];

  if (modifiedFields.find((field) => requestProviderTriggerFields.includes(field))) {
    promises.push(mongoose.models.Request.updateWorkflowProviders(user));
  }
  const setUpdateForSalesRep = buildSetUpdateForUser(user, 'salesRep');

  if (modifiedFields.find((field) => commonFields.includes(field))) {
    const salesPromises = [];
    const setUpdateForOtherContact = buildSetUpdateForUser(user, 'otherContact');
    const setUpdateForSchedulingContact = buildSetUpdateForUser(user, 'schedulingContact');

    salesPromises.push(
      mongoose.models.Request.updateMany({
        'salesRep._id': user._id,
        $and: nonCancelledCompletedQuery,
      }, {
        $set: setUpdateForSalesRep,
      }),
      mongoose.models.Request.updateMany({
        'projectManagers._id': user._id,
        $and: nonCancelledCompletedQuery,
      }, {
        $set: {
          'projectManagers.$.firstName': user.firstName,
          'projectManagers.$.middleName': user.middleName,
          'projectManagers.$.lastName': user.lastName,
          'projectManagers.$.email': _.get(user, 'email', ''),
          'projectManagers.$.deleted': _.get(user, 'deleted', false),
          'projectManagers.$.terminated': _.get(user, 'terminated', false),
        },
      }),
      mongoose.models.Request.updateMany({
        'otherContact._id': user._id,
        $and: nonCancelledCompletedQuery,
      }, {
        $set: setUpdateForOtherContact,
      }),
      mongoose.models.Request.updateMany({
        'schedulingContact._id': user._id,
        $and: nonCancelledCompletedQuery,
      }, {
        $set: setUpdateForSchedulingContact,
      }),
    );
    promises = promises.concat(salesPromises);
  }
  if (modifiedFields.some((field) => requestContactTriggerFields.includes(field))) {
    const setUpdateForContact = buildSetUpdateForUser(user, 'contact');

    Object.assign(setUpdateForContact, {
      'contact.company': _.get(user, 'company', undefined),
      'contact.projectManagers': _.get(user, 'projectManagers', []),
    });
    const update = { $set: setUpdateForContact };
    const hasSalesRep = !_.isNil(user.contactDetails?.salesRep);

    if (!hasSalesRep) {
      update.$set.salesRep = {};
    }
    if (modifiedFields.includes('contactDetails.salesRep') && hasSalesRep) {
      const salesRepInDb = await this.findOneWithDeleted(
        { _id: user.contactDetails.salesRep },
        {
          _id: 1,
          firstName: 1,
          middleName: 1,
          lastName: 1,
          email: 1,
          deleted: 1,
          terminated: 1,
        },
      );

      if (!_.isNil(salesRepInDb)) {
        const setUpdateSalesRepForUser = buildSetUpdateForUser(salesRepInDb, 'salesRep');

        Object.assign(update.$set, setUpdateSalesRepForUser, {
          'salesRep._id': salesRepInDb.id,
        });
      }
    }
    promises.push(
      mongoose.models.Request.updateMany({
        'contact._id': user._id,
        $and: nonCancelledCompletedQuery,
      }, update),
    );
  }
  await Promise.map(promises, (promise) => promise, { concurrency: 1 });
};

UserSchema.plugin(mongooseDelete, { overrideMethods: 'all' });
UserSchema.plugin(metadata);
UserSchema.plugin(modified);
UserSchema.plugin(siConnectorPlugin);
UserSchema.plugin(importModulePlugin);
UserSchema.plugin(transactionHelper);
UserSchema.plugin(piiPlugin);
UserSchema.index({ email: 1, lsp: 1 }, { unique: true });
UserSchema.index({ _id: 1, 'vendorDetails.rates._id': 1 }, { unique: true });

UserSchema.path('securityPolicy').validate({
  validator({ passwordComplexity }) {
    if (_.isNil(passwordComplexity)) {
      return true;
    }
    if (Object.keys(passwordComplexity).every((field) => passwordComplexity[field] === false)) {
      return false;
    }
  },
  message: 'Password can not be empty',
});

UserSchema.statics.setCsvTransformations = (csvBuilderInstance) => {
  csvVirtualParser.parseTimeStamps(csvBuilderInstance);
  return csvBuilderInstance
    .virtual('ID', (item) => (item._id || ''))
    .virtual('Email', (item) => (item.email || ''))
    .virtual('First Name', (item) => (item.firstName || ''))
    .virtual('Last Name', (item) => (item.lastName || ''))
    .virtual('Roles', (item) => (item.rolesText || ''))
    .virtual('User Type', (item) => (item.type || ''))
    .virtual('Company', (item) => (item.companyName || ''))
    .virtual('Project Managers', (item) => (item.pmNames || ''))
    .virtual('Abilities', (item) => (item.abilitiesText || ''))
    .virtual('Tools', (item) => (item.catToolsText || ''))
    .virtual('Languages', (item) => (item.languageCombinationsText || ''))
    .virtual('Groups', (item) => (item.groupsText || ''))
    .virtual('Last Login At', (item) => (item.lastLoginAt || ''))
    .virtual('Password Change Date', (item) => _.defaultTo(item.passwordChangeDate, ''))
    .virtual('Inactive', (item) => (item.inactiveText || ''))
    .virtual('Terminated', (item) => (item.terminatedText || ''))
    .virtual('Terminated By', (item) => _.get(item, 'terminatedBy', ''))
    .virtual('Terminated At', (item) => _.get(item, 'terminatedAt', ''))
    .virtual('Locked', (item) => (item.isLockedText || ''))
    .virtual('OFAC', (item) => (_.get(item, 'vendorDetails.ofac', '')
      || _.get(item, 'staffDetails.ofac', '')))
    .virtual('Certifications', (item) => (item.certificationsText || ''))
    .virtual('HIPAA', (item) => (item.hipaaText || ''))
    .virtual('ATA Certified', (item) => (item.ataCertifiedText || ''))
    .virtual('Gender', (item) => (_.get(item, 'vendorDetails.gender', '')))
    .virtual('Minimum Hours', (item) => (item.minimumHoursText || ''))
    .virtual('Escalated', (item) => (item.escalatedText || ''))
    .virtual('Main Phone', (item) => (item.mainPhoneText || ''))
    .virtual('Comments', (item) => _.get(item, 'staffDetails.comments', ''))
    .virtual('Vendor Type', (item) => _.get(item, 'vendorDetails.type', ''))
    .virtual('Vendor Company', (item) => _.get(item, 'vendorDetails.vendorCompany', ''))
    .virtual('Competence Levels', (item) => _.get(item, 'competenceLevelsText', ''))
    .virtual('LSP Internal Departments', (item) => _.get(item, 'internalDepartmentsText', ''))
    .virtual('Phone Number', (item) => _.get(item, 'phoneNumberText', ''))
    .virtual('Address 1', (item) => _.get(item, 'vendorDetails.address.line1', ''))
    .virtual('City', (item) => _.get(item, 'vendorDetails.address.city', ''))
    .virtual('State', (item) => _.get(item, 'vendorDetails.address.state.name', ''))
    .virtual('Zip', (item) => _.get(item, 'vendorDetails.address.zip', ''))
    .virtual('Country', (item) => _.get(item, 'vendorDetails.address.country.name', ''))
    .virtual('Nationality', (item) => _.get(item, 'nationalityText', ''))
    .virtual('Country Of Origin', (item) => _.get(item, 'vendorDetails.originCountry.name', ''))
    .virtual('Approval Method', (item) => _.get(item, 'vendorDetails.approvalMethod', ''))
    .virtual('Hire Date', (item) => _.get(item, 'hireDateText', ''))
    .virtual('Payment Method', (item) => _.get(item, 'paymentMethodName', ''))
    .virtual('Fixed Cost', (item) => _.get(item, 'fixedCostText', ''))
    .virtual('PT Pay/Paypal/Veem', (item) => _.get(item, 'vendorDetails.billingInformation.ptPayOrPayPal', ''))
    .virtual('WT Fee Waived', (item) => _.get(item, 'wtFeeWaivedText', ''))
    .virtual('Synced', (item) => _.get(item, 'isSyncedText', 'false'))
    .virtual('Sync Error', (item) => _.get(item, 'syncError', ''))
    .virtual('Last Sync Date', (item) => _.get(item, 'connectorEndedAt', ''))
    .virtual('Priority Pay', (item) => _.get(item, 'priorityPaymentText', ''))
    .virtual('Billing Terms', (item) => _.get(item, 'billingTermsName', ''))
    .virtual('Tax Form', (item) => _.get(item, 'taxFormText', ''))
    .virtual('Form 1099 Type', (item) => _.get(item, 'vendorDetails.billingInformation.form1099Type', ''))
    .virtual('Form 1099 Box', (item) => _.get(item, 'vendorDetails.billingInformation.form1099Box', ''))
    .virtual('Currency', (item) => _.get(item, 'currencyName', ''))
    .virtual('Bill Payment Notes', (item) => _.get(item, 'vendorDetails.billingInformation.billPaymentNotes', ''))
    .virtual('Contact Status', (item) => _.get(item, 'contactDetails.contactStatus', ''))
    .virtual('Qualification Status', (item) => _.get(item, 'contactDetails.qualificationStatus', ''))
    .virtual('Job Title', (item) => _.get(item, 'contactDetails.jobTitle', ''))
    .virtual('Sales Rep', (item) => _.get(item, 'salesRepText', ''))
    .virtual('Company Tier Level', (item) => _.get(item, 'contactDetails.companyTierLevel', ''))
    .virtual('Lead Source', (item) => _.get(item, 'leadSourceText', ''))
    .virtual('Security Policy', (item) => _.get(item, 'securityPolicy', ''))
    .virtual('Using Default Policies', (item) => _.get(item, 'isOverwritten', ''))
    .virtual('Is Api User', (item) => _.get(item, 'isApiUser', ''))
    .virtual('Lawyer', (item) => _.get(item, 'isLawyer', ''))
    .virtual('Practicing', (item) => _.get(item, 'isPracticing', ''))
    .virtual('Bar Registration', (item) => _.get(item, 'isBarRegistered', ''))
    .virtual('Country of Registration', (item) => _.get(item, 'registrationCountries', ''))
    .virtual('Vendor Bill Balance', (item) => _.get(item, 'vendorDetails.billBalance', ''))
    .virtual('Flat Rate', (item) => _.get(item, 'flatRateText', ''))
    .virtual('Remote', (item) => _.get(item, 'remoteText', ''))
    .virtual('Vendor Debit Memo Available', (item) => _.get(item, 'vendorDetails.debitMemoAvailable', ''))
    .virtual('Vendor Credit Memo Available', (item) => _.get(item, 'vendorDetails.creditMemoAvailable', ''))
    .virtual('Vendor Total Balance', (item) => _.get(item, 'vendorDetails.totalBalance', ''))
    .virtual('Vendor Status', (item) => _.get(item, 'vendorDetails.vendorStatus', ''))
    .virtual('Created By', (item) => _.get(item, 'createdBy', ''))
    .virtual('Created At', (item) => _.get(item, 'createdAt', ''))
    .virtual('Updated By', (item) => _.get(item, 'updatedBy', ''))
    .virtual('Updated At', (item) => _.get(item, 'updatedAt', ''))
    .virtual('Deleted By', (item) => _.get(item, 'deletedBy', ''))
    .virtual('Deleted At', (item) => _.get(item, 'deletedAt', ''))
    .virtual('Restored By', (item) => _.get(item, 'restoredBy', ''))
    .virtual('Restored At', (item) => _.get(item, 'restoredAt', ''));
};

UserSchema.statics.getExportOptions = () => ({
  headers: ['ID', 'Email', 'First Name', 'Last Name', 'Roles', 'User Type', 'Company', 'Security Policy',
    'Project Managers', 'Abilities', 'Tools', 'Languages', 'Groups', 'Password Change Date', 'Last Login At',
    'OFAC', 'Certifications', 'Minimum Hours', 'HIPAA', 'ATA Certified', 'Gender', 'Escalated',
    'Main Phone', 'Comments', 'Vendor Type', 'Vendor Company', 'Vendor Status', 'Competence Levels', 'LSP Internal Departments',
    'Phone Number', 'Address 1', 'City', 'State', 'Zip', 'Country', 'Nationality', 'Country Of Origin',
    'Approval Method', 'Locked', 'Form 1099 Type', 'Form 1099 Box', 'Fixed Cost', 'Hire Date', 'PT Pay/Paypal/Veem',
    'WT Fee Waived', 'Priority Pay', 'Flat Rate', 'Billing Terms', 'Tax Form', 'Payment Method',
    'Currency', 'Bill Payment Notes', 'Vendor Debit Memo Available', 'Vendor Credit Memo Available', 'Vendor Bill Balance', 'Vendor Total Balance', 'Contact Status', 'Is Api User',
    'Qualification Status', 'Job Title', 'Sales Rep', 'Company Tier Level', 'Synced', 'Sync Error', 'Last Sync Date', 'Lead Source', 'Using Default Policies',
    'Created By', 'Created At', 'Updated By', 'Updated At', 'Inactive', 'Terminated', 'Terminated By', 'Terminated At', 'Restored By', 'Restored At', 'Remote'],
});

UserSchema.statics.findOneAndPopulate = function (query, population, select, cb) {
  let properCallback = cb;
  let cursor = this.findOneWithDeleted(query);

  if (population) {
    cursor = cursor.populate(population);
  }
  if (typeof select === 'function') {
    properCallback = select;
  } else if (select) {
    cursor = cursor.select(select);
  }
  return cursor.exec(properCallback);
};

// Inactive users based on lastLogin date. This is used by the scheduler 'inactivate-user'
UserSchema.statics.inactivateUsers = function (inactivityPeriod, mock, lspId, cb) {
  const sinceDate = moment.utc().subtract(inactivityPeriod, 'd').toDate();
  const deleteQuery = {
    lsp: lspId,
    $or: [{
      $and: [
        { createdAt: { $lt: sinceDate } },
        {
          $or: [
            { lastLoginAt: null },
            { lastLoginAt: { $exists: false } },
          ],
        },
      ],
    },
    { lastLoginAt: { $lt: sinceDate } }],
  };

  // Avoid soft-deleting other test users when running inactivate-user-scheduler-test test
  if (mock === '1') {
    deleteQuery.email = E2E_TEST_INACTIVE_USER;
  }
  return this.updateMany(
    deleteQuery,
    {
      $set: {
        deleted: true,
        userSessions: [],
      },
    },
    { multi: true },
  ).exec(cb);
};

UserSchema.statics.updateRateEmbeddedEntities = function (
  entity,
  userTypeDetailsPropName,
  propName,
  session,
) {
  const query = {
    lsp: entity.lspId,
    [`${userTypeDetailsPropName}.rates`]: {
      $elemMatch: {
        [`${propName}._id`]: entity._id,
      },
    },
  };
  const update = {
    $set: {
      [`${userTypeDetailsPropName}.rates.$[rate].${propName}.name`]: entity.name,
    },
  };
  const options = {
    upsert: false,
    arrayFilters: [
      {
        [`rate.${propName}._id`]: entity._id,
      },
    ],
    timestamps: false,
  };
  if (!_.isNil(session)) {
    return this.updateMany(query, update, options).session(session);
  }
  return this.updateMany(query, update, options);
};

UserSchema.statics.updateRateDetailEmbeddedEntities = function (
  entity,
  userTypeDetailsPropName,
  propName,
) {
  const query = {
    lsp: entity.lspId,
    [`${userTypeDetailsPropName}.rates`]: {
      $elemMatch: {
        [`rateDetails.${propName}._id`]: entity._id,
      },
    },
  };
  const update = {
    $set: {
      [`${userTypeDetailsPropName}.rates.$[].rateDetails.$[rateDetail].${propName}.name`]: entity.name,
    },
  };
  const options = {
    upsert: false,
    arrayFilters: [
      {
        [`rateDetail.${propName}._id`]: entity._id,
      },
    ],
  };
  return this.updateMany(query, update, options);
};

// Users which must receive the activity created notification.
// This is used by the schedulers user-feedback-create-for-auditor, user-feedback-update-for-auditor
UserSchema.statics.getUsersWhichMustReceiveActivityCreateUpdateNotificationLeaned = function (action, activity, creatorRoles, readerRoles, updaterRoles = { all: [], own: [], department: [] }) {
  const activityDepartments = _.get(activity, 'feedbackDetails.internalDepartments', []);
  const USER_ROLES_WITH_ALL_SUFFIX = action === 'update' ? [...readerRoles.all, ...updaterRoles.all] : readerRoles.all;
  const USER_ROLES_WITH_DEPARTMENT_SUFFIX = action === 'update' ? [...readerRoles.department, ...updaterRoles.department, ...readerRoles.own, ...updaterRoles.own] : readerRoles.department;
  const CREATOR_ROLES_WITH_OWN_SUFFIX = action === 'update' ? [...updaterRoles.own, ...updaterRoles.department, ...readerRoles.department] : creatorRoles.own;
  const CREATOR_ROLES_WITH_ALL_SUFFIX = action === 'update' ? updaterRoles.all : creatorRoles.all;
  const findQuery = {
    lsp: activity.lspId,
    terminated: false,
    deleted: false,
    $or: [
      activityOwnerRolesCondition(
        activity.createdBy,
        CREATOR_ROLES_WITH_ALL_SUFFIX,
        CREATOR_ROLES_WITH_OWN_SUFFIX,
        activityDepartments,
      ),
      activityNotOwnerRolesCondition(
        activity.createdBy,
        USER_ROLES_WITH_ALL_SUFFIX,
        USER_ROLES_WITH_DEPARTMENT_SUFFIX,
        activityDepartments,
      ),
    ],
  };
  return this.find(findQuery).lean();
};

UserSchema.statics.findOneWithDeletedAndPopulate = async function (query, lspId, cb) {
  const user = await this.findOneWithDeleted(query, DEFAULT_USER_PROJECTION)
    .populate(buildDefaultPopulate(lspId))
    .exec(cb);
  const { securityPolicy } = await this.getSecurityPolicy(user.email, user.lsp, user);

  user.securityPolicy = securityPolicy;
  if (cb) {
    return cb(user);
  }
  return user;
};

UserSchema.statics.validateConsumedApiQuota = async function ({
  _id, lsp, email, mockFlags,
}) {
  const {
    lastApiRequestedAt,
    monthlyApiQuota,
    monthlyConsumedQuota,
  } = await this.findOne({ _id, lsp }, {
    lastApiRequestedAt: 1,
    monthlyApiQuota: 1,
    monthlyConsumedQuota: 1,
  });
  const now = moment.utc();
  const lastApiRequestedAtDate = moment(lastApiRequestedAt);
  const consumedQuota = !IS_PRODUCTION
    ? _.get(mockFlags, 'mockMonthlyConsumedQuota', monthlyConsumedQuota)
    : monthlyConsumedQuota;

  if (now.isAfter(lastApiRequestedAtDate, 'month') || now.isAfter(lastApiRequestedAtDate, 'year')) {
    return this.findOneAndUpdate({ _id, lsp }, {
      $set: {
        monthlyConsumedQuota: 0,
        lastApiRequestedAt: moment.utc().toDate(),
      },
    });
  }
  if (monthlyApiQuota > consumedQuota || (email === 'e2e@sample.com' && !IS_PRODUCTION)) {
    return this.findOneAndUpdate({ _id, lsp }, {
      $inc: { monthlyConsumedQuota: 1 },
      $set: { lastApiRequestedAt: moment.utc().toDate() },
    });
  }
  const err = new Error('The user has exceeded API quota limit. Please consider billing.');
  err.code = 429;
  throw err;
};

UserSchema.statics.findWithDeletedAndPopulate = function (query, cb) {
  let projection;

  if (_.get(query, 'lsp')) {
    projection = DEFAULT_USER_PROJECTION;
    const cursor = this.findWithDeleted(query)
      .populate(buildDefaultPopulate(query.lsp))
      .select(projection);
    return cursor.sort({ firstName: 1, lastName: 1 }).exec(cb);
  }
  return Promise.resolve();
};

UserSchema.statics.getVendorRateAverage = async function (filters, cb) {
  const abilityInDb = await mongoose.models.Ability.findOneWithDeleted({
    lspId: filters.lspId,
    name: filters.ability,
  });

  if (_.isNil(abilityInDb)) {
    return [{
      avgPrice: 0,
    }];
  }

  const matchStage = buildAvgRateMatchStage(filters, abilityInDb);
  const mapStage = buildAvgRateMapStage(matchStage);
  const pipelines = [
    {
      $match: {
        lsp: filters.lspId,
        type: VENDOR_USER_TYPE,
        'vendorDetails.billingInformation.hasMonthlyBill': false,
        'vendorDetails.outlier': false,
        'vendorDetails.rates': {
          $elemMatch: matchStage,
        },
      },
    },
    {
      $project: {
        rates: {
          $map: mapStage,
        },
      },
    },
    {
      $project: {
        rates: {
          $filter: {
            input: '$rates',
            as: 'rate',
            cond: {
              $ne: [{ $size: '$$rate' }, 0],
            },
          },
        },
      },
    },
    {
      $project: {
        desiredRateDetail: { $arrayElemAt: [{ $arrayElemAt: ['$rates', 0] }, 0] },
      },
    },
    {
      $group: {
        _id: null,
        avgPrice: {
          $avg: '$desiredRateDetail.price',
        },
      },
    },
  ];
  return this.aggregate(pipelines);
};

UserSchema.statics.consolidateVendorBalance = async function (vendorId, session) {
  const options = {};

  if (!_.isNil(session)) {
    options.session = session;
  }
  const pipelines = [
    {
      $match: { _id: convertToObjectId(vendorId) },
    },
    {
      $lookup: {
        from: 'bills',
        let: {
          vendorId: '$_id',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$vendor', '$$vendorId'] },
                  { $gte: ['$balance', 0] },
                ],
              },
            },
          },
        ],
        as: 'bills',
      },
    },
    {
      $lookup: {
        from: 'billAdjustments',
        let: {
          vendorId: '$_id',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$vendor', '$$vendorId'] },
                  { $gt: ['$adjustmentBalance', 0] },
                ],
              },
            },
          },
        ],
        as: 'adjustments',
      },
    },
    {
      $addFields: {
        billTotal: {
          $reduce: {
            input: '$bills',
            initialValue: 0,
            in: { $add: ['$$value', '$$this.balance'] },
          },
        },
        memoAvailable: {
          $reduce: {
            input: '$adjustments',
            initialValue: { credit: 0, debit: 0 },
            in: {
              credit: {
                $add: ['$$value.credit', {
                  $cond: [
                    { $eq: ['$$this.type', 'Credit Memo'] }, '$$this.adjustmentBalance', 0,
                  ],
                }],
              },
              debit: {
                $add: ['$$value.debit', {
                  $cond: [
                    { $eq: ['$$this.type', 'Debit Memo'] }, '$$this.adjustmentBalance', 0,
                  ],
                }],
              },
            },
          },
        },
      },
    },
    {
      $project: {
        billTotal: 1,
        creditMemoAvailable: '$memoAvailable.credit',
        debitMemoAvailable: '$memoAvailable.debit',
        totalBalance: { $subtract: [{ $add: ['$billTotal', '$memoAvailable.credit'] }, '$memoAvailable.debit'] },
      },
    },
  ];
  let aggregationResult;

  if (!_.isNil(options.session)) {
    aggregationResult = await this.aggregateWithDeleted(pipelines).session(session);
  } else {
    aggregationResult = await this.aggregateWithDeleted(pipelines);
  }
  const defaultBalanceInformation = {
    billTotal: 0,
    creditMemoAvailable: 0,
    debitMemoAvailable: 0,
    totalBalance: 0,
  };
  let balanceInformation = _.get(aggregationResult, 0);

  if (_.isNil(balanceInformation) || _.isEmpty(balanceInformation)) {
    balanceInformation = defaultBalanceInformation;
  }
  const {
    billTotal, creditMemoAvailable, debitMemoAvailable, totalBalance,
  } = balanceInformation;
  const vendorQuery = { _id: new mongoose.Types.ObjectId(vendorId) };
  const vendorInDb = await this.findOneWithDeleted(vendorQuery, { 'vendorDetails.totalBalance': 1 });
  return this.findOneAndUpdateWithDeleted(
    {
      _id: vendorQuery._id,
      'vendorDetails.totalBalance': vendorInDb.vendorDetails.totalBalance,
    },
    {
      $set: {
        'vendorDetails.billBalance': decimal128ToNumber(billTotal),
        'vendorDetails.creditMemoAvailable': decimal128ToNumber(creditMemoAvailable),
        'vendorDetails.debitMemoAvailable': decimal128ToNumber(debitMemoAvailable),
        'vendorDetails.totalBalance': decimal128ToNumber(totalBalance),
      },
    },
    options,
  );
};

RateSchema.pre('save', function (next) {
  const doc = this;
  const vendorDetails = this.parent();
  const user = vendorDetails.parent();
  const lspId = _.get(user, 'lsp._id', null);

  // Ensure mandatory fields were filled based on the selected ability
  if (!_.isNil(doc.ability)) {
    return mongoose.models.Ability.findOne({ name: doc.ability.name, lspId })
      .then((abilityFound) => {
        const languageCombinationRequired = _.get(abilityFound, 'languageCombination', false);
        const isMissingLanguageCombination = languageCombinationRequired
          && (_.isEmpty(_.get(doc, 'sourceLanguage', '')) || _.isEmpty(_.get(doc, 'targetLanguage', '')));

        if (isMissingLanguageCombination) {
          throw new Error('Language combination is mandatory field');
        }
        doc.ability = _.pick(abilityFound, ['_id', 'name', 'languageCombination']);
      });
  }
  next();
});

module.exports = UserSchema;
