const mongoose = require('mongoose');
const _ = require('lodash');
const mongooseDelete = require('mongoose-delete');
const Promise = require('bluebird');
const { validObjectId } = require('../../../../utils/schema');
const transactionHelper = require('../plugins/transaction-helper');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const siConnectorPlugin = require('../plugins/si-connector');
const { csvVirtualParser } = require('../../../../utils/csvExporter');
const { bigJsToNumber, decimal128ToNumber } = require('../../../../utils/bigjs');
const { validateCIDR, parseIP } = require('../../../../utils/security/ip');
const importModulePlugin = require('../plugins/import-module');
const humanInterval = require('human-interval');

const { Schema } = mongoose;
const { ObjectId } = Schema;
const findEntityByType = (row, type) => {
  const entity = row.entries.find((en) => en.type === type);
  return _.assign({ own: 0, consolidated: 0 }, entity);
};

const isValidSecurityPolicy = (securityPolicy) => {
  if (!_.isNil(securityPolicy)) {
    if (Object.keys(securityPolicy).some((field) => _.isNil(securityPolicy[field]))) {
      securityPolicy = null;
    }
  }
  return !_.isNil(securityPolicy);
};

const getSecurityPolicyFromCompany = (company) => {
  let securityPolicy = _.get(company, 'securityPolicy', null)
  || _.get(company, 'parentCompany.securityPolicy', null);
  if (!_.isNil(securityPolicy) && _.isFunction(securityPolicy.toObject)) {
    securityPolicy = securityPolicy.toObject();
  }
  return securityPolicy;
};

const getEntityMatchQuery = (type) => {
  const query = {
    $and: [
      { $in: ['$company', '$$company_ids'] },
      { $ne: ['$status', 'Paid'] },
      { $ne: ['$voidDetails.isVoided', true] },
    ],
  };

  if (!_.isNil(type)) {
    query.$and.push({ $eq: ['$type', type] });
  }
  return query;
};

const balanceAccountingEntityTypeSchema = {
  own: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  consolidated: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
};

const getTotalByCurrencies = (collection, entity, companyId, type) => [
  {
    $lookup: {
      from: collection,
      let: {
        company_ids: '$ids',
      },
      pipeline: [{ $match: { $expr: getEntityMatchQuery(type) } }],
      as: entity,
    },
  },
  {
    $unwind: `$${entity}`,
  },
  {
    $group: {
      _id: `$${entity}.accounting.currency.isoCode`,
      rows: { $push: { balance: `$${entity}.accounting.balance`, company: `$${entity}.company` } },
    },
  },
  {
    $project: {
      balance: {
        $reduce: {
          input: '$rows',
          initialValue: { own: 0, consolidated: 0, type: '' },
          in: {
            own: {
              $add: ['$$value.own',
                {
                  $cond: {
                    if: {
                      $eq: ['$$this.company', new mongoose.Types.ObjectId(companyId)],
                    },
                    then: { $toDouble: '$$this.balance' },
                    else: 0,
                  },
                },
              ],
            },
            consolidated: { $add: ['$$value.consolidated', { $toDouble: '$$this.balance' }] },
            type: type || entity,
          },
        },
      },
    },
  },
];

const availableTimeToDeliverValidator = function (timeToDeliver) {
  return _.isEmpty(timeToDeliver) || _.isFinite(humanInterval(timeToDeliver.toLowerCase()));
};

const BalanceInformationSchema = new Schema({
  currency: String,
  invoice: balanceAccountingEntityTypeSchema,
  credit: balanceAccountingEntityTypeSchema,
  debit: balanceAccountingEntityTypeSchema,
  advance: balanceAccountingEntityTypeSchema,
  balance: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  consolidatedBalance: {
    type: mongoose.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
});

const CIDRSchema = new Schema({
  ip: {
    type: String,
    validate: {
      validator: validateCIDR,
      message: '{VALUE} is not a valid CIDR',
    },
  },
  subnet: {
    type: String,
    validate: {
      validator: validateCIDR,
      message: '{VALUE} is not a valid CIDR',
    },
  },
  description: String,
}, { _id: false });

const RateDetailSchema = new Schema({
  price: Number,
  internalDepartment: {
    type: Schema.ObjectId,
    ref: 'InternalDepartment',
  },
  breakdown: {
    type: Schema.ObjectId,
    ref: 'Breakdown',
  },
  currency: {
    type: Schema.ObjectId,
    ref: 'Currency',
    required: true,
  },
  translationUnit: {
    type: Schema.ObjectId,
    ref: 'TranslationUnit',
  },
}, { _id: false });

const RateLanguageSchema = new Schema({
  name: {
    type: String,
  },
  isoCode: {
    type: String,
  },
  cultureCode: String,
});

const RateSchema = new Schema({
  sourceLanguage: {
    type: RateLanguageSchema,
  },
  targetLanguage: {
    type: RateLanguageSchema,
  },
  ability: {
    type: String,
    required: true,
  },
  rateDetails: [RateDetailSchema],
}, { timestamps: true });

RateSchema.path('ability').validate({
  validator(name) {
    const billingInformation = this.parent();
    const company = billingInformation.parent();
    const lspId = _.get(company, 'lspId');
    return mongoose.models.Ability.findOne({ name, lspId }).then((ability) => ability !== null);
  },
  message: 'Ability {VALUE} was not found in the database',
});

RateDetailSchema.path('breakdown').validate({
  validator(_id) {
    const rate = this.parent();
    const billingInformation = rate.parent();
    const { lspId } = billingInformation.parent();

    if (validObjectId(_id)) {
      const breakdownId = _id.toString();

      if (!_.isNil(breakdownId)) {
        return mongoose.models.Breakdown.findOne({ _id, lspId })
          .then((breakdown) => breakdown !== null);
      }
    }
    return true;
  },
  message: 'Breakdown {VALUE} was not found in the database',
});

RateDetailSchema.path('currency').validate({
  validator(_id) {
    const rate = this.parent();
    const billingInformation = rate.parent();
    const { lspId } = billingInformation.parent();
    return mongoose.models.Currency.findOne({ _id, lspId }).then((currency) => currency !== null);
  },
  message: 'Currency {VALUE} was not found in the database',
});

RateDetailSchema.path('translationUnit').validate({
  validator(_id) {
    const rate = this.parent();
    const billingInformation = rate.parent();
    const { lspId } = billingInformation.parent();

    if (validObjectId(_id)) {
      const translationUnitId = _id.toString();

      if (!_.isEmpty(translationUnitId)) {
        return mongoose.models.TranslationUnit.findOne({ _id, lspId })
          .then((translationUnit) => translationUnit !== null);
      }
    }
    return true;
  },
  message: 'Translation unit {VALUE} was not found in the database',
});

RateDetailSchema.path('internalDepartment').validate({
  validator(_id) {
    const rate = this.parent();
    const billingInformation = rate.parent();
    const { lspId } = billingInformation.parent();

    if (validObjectId(_id)) {
      const internalDepartmentId = _id.toString();

      if (!_.isNil(internalDepartmentId)) {
        return mongoose.models.InternalDepartment.findOne({ _id, lspId })
          .then((internalDepartment) => internalDepartment !== null);
      }
    }
    return true;
  },
  message: 'Internal Department {VALUE} was not found in the database',
});

const BillingInformationSchema = new Schema({
  quoteCurrency: {
    _id: {
      type: Schema.ObjectId,
      ref: 'Currency',
    },
    name: String,
    isoCode: String,
  },
  purchaseOrderRequired: {
    type: Boolean,
    default: false,
  },
  billingTerm: {
    type: Schema.ObjectId,
    ref: 'BillingTerm',
  },
  paymentMethod: {
    type: Schema.ObjectId,
    ref: 'PaymentMethod',
  },
  onHold: {
    type: Boolean,
    default: false,
  },
  onHoldReason: {
    type: String,
    default: '',
  },
  grossProfit: Number,
  notes: String,
  rates: {
    type: [RateSchema],
    required: false,
  },
}, { _id: false });

BillingInformationSchema.pre('validate', function () {
  this.paymentMethod = _.get(this, 'paymentMethod', undefined);
  this.billingTerm = _.get(this, 'billingTerm', undefined);
});

BillingInformationSchema.path('paymentMethod').validate({
  async: true,
  validator(_id) {
    const company = this.parent();
    const lspId = _.get(company, 'lspId');

    if (!_.isNil(_id)) {
      return mongoose.models.PaymentMethod
        .findOne({ _id, lspId }).then((paymentMethod) => paymentMethod !== null);
    }
    return Promise.resolve(true);
  },
  message: 'Payment method {VALUE} was not found in the database',
});

BillingInformationSchema.path('billingTerm').validate({
  async: true,
  validator(_id) {
    const company = this.parent();
    const lspId = _.get(company, 'lspId');

    if (!_.isNil(_id)) {
      return mongoose.models.BillingTerm
        .findOne({ _id, lspId }).then((billingTerm) => billingTerm !== null);
    }
    return Promise.resolve(true);
  },
  message: 'Billing term {VALUE} was not found in the database',
});

const ExcludedProviderUserSchema = new Schema({
  userId: { type: ObjectId, ref: 'User' },
  name: String,
  type: String,
  notes: String,
}, { _id: false });

const ExcludedProviderSchema = new Schema({
  user: ExcludedProviderUserSchema,
}, { _id: false });

const RetentionSchema = new Schema({
  days: Number,
  hours: Number,
  minutes: Number,
}, { _id: false });

const AddressSchema = new Schema({
  line1: String,
  line2: String,
  city: String,
  country: { type: ObjectId, ref: 'Country' },
  state: { type: ObjectId, ref: 'State' },
  zip: String,
}, { _id: false });

const PasswordComplexitySchema = new Schema({
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
});

const SecurityPolicySchema = new Schema({
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
    type: PasswordComplexitySchema,
  },
});

const MtSettingsLanguageCombination = new Schema({
  srcLang: {
    type: String,
    required: true,
  },
  tgtLang: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  mtEngine: {
    type: ObjectId,
    ref: 'MtEngine',
    required: true,
  },
  isPortalMt: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const SSOSettingsSchema = new Schema({
  isSSOEnabled: Boolean,
  certificate: String,
  issuerMetadata: String,
  entryPoint: String,
}, { _id: false });

const ParentCompanySchema = new Schema({
  _id: {
    type: ObjectId,
    ref: 'Company',
  },
  hierarchy: String,
  name: String,
  status: String,
  securityPolicy: SecurityPolicySchema,
  parentCompany: {
    _id: {
      type: ObjectId,
      ref: 'Company',
    },
    hierarchy: String,
    name: String,
    status: String,
    securityPolicy: SecurityPolicySchema,
    parentCompany: {
      _id: {
        type: ObjectId,
        ref: 'Company',
      },
      hierarchy: String,
      name: String,
      status: String,
      securityPolicy: SecurityPolicySchema,
    },
  },
});

function validateSAMLFields(value) {
  const useSSO = _.get(this, 'isSSOEnabled', false);
  return !useSSO || !_.isEmpty(value);
}

SSOSettingsSchema.path('certificate').validate({
  validator: validateSAMLFields,
  message: 'Certificate is required if Use SSO is active',
});

SSOSettingsSchema.path('issuerMetadata').validate({
  validator: validateSAMLFields,
  message: 'Issuer metadata is required if Use SSO is active',
});

SSOSettingsSchema.path('entryPoint').validate({
  validator: validateSAMLFields,
  message: 'Entry point is required if Use SSO is active',
});

const CompanySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  parentCompany: {
    type: ParentCompanySchema,
    default: {},
  },
  hierarchy: { type: String, default: '' },
  isParent: {
    type: Boolean,
    default: false,
  },
  billingInformation: {
    type: BillingInformationSchema,
  },
  balanceInformation: {
    type: [BalanceInformationSchema],
    default: [{
      invoice: {
        own: 0,
        consolidated: 0,
      },
      credit: {
        own: 0,
        consolidated: 0,
      },
      debit: {
        own: 0,
        consolidated: 0,
      },
      advance: {
        own: 0,
        consolidated: 0,
      },
      balance: 0,
      consolidatedBalance: 0,
    }],
  },
  retention: {
    type: RetentionSchema,
    default: {
      days: 2555, // 7 x 365 (7 years)
      hours: 0,
      minutes: 0,
    },
  },
  cidr: {
    type: [CIDRSchema],
    default: [{
      ip: '0.0.0.0/0',
      subnet: '0:0:0:0:0:0:0:0/0',
      description: 'All IPv4',
    }, {
      ip: '0:0:0:0:0:0:0:0/0',
      subnet: '0:0:0:0:0:0:0:0/0',
      description: 'All IPv6',
    }],
  },
  contact: {
    type: ObjectId,
    ref: 'User',
  },
  salesRep: {
    type: ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['Prospecting', 'Won', 'Lost'],
    default: 'Prospecting',
  },
  pursuitActive: Boolean,
  dataClassification: {
    type: String,
    enum: ['Public', 'Confidential', 'Restricted'],
    default: 'Public',
  },
  industry: String,
  customerTierLevel: {
    type: String,
    enum: ['1', '2', '3', 'Lead-No Language Need', 'Partner'],
  },
  availableTimeToDeliver: [{
    type: String,
    validate: {
      validator: availableTimeToDeliverValidator,
      message: 'available time to deliver should be human readable intervals"',
    },
  }],
  website: String,
  primaryPhoneNumber: String,
  notes: String,
  mailingAddress: AddressSchema,
  billingAddress: AddressSchema,
  billingEmail: String,
  serviceAgreement: { type: Boolean, default: false },
  internalDepartments: [{
    _id: { type: Schema.ObjectId, ref: 'InternalDepartment' },
    name: String,
  }],
  locations: {
    type: [{
      _id: { type: Schema.ObjectId, ref: 'Location' },
      name: String,
    }],
    default: [],
  },
  excludedProviders: [ExcludedProviderSchema],
  mandatoryRequestContact: { type: Boolean, default: true },
  isMandatoryExternalAccountingCode: { type: Boolean, default: false },
  serviceAgreementText: {
    type: String,
    default: '',
  },
  locationsText: {
    type: String,
    default: '',
  },
  purchaseOrderRequiredText: {
    type: String,
    default: '',
  },
  grossProfitText: {
    type: String,
    default: '',
  },
  onHoldText: {
    type: String,
    default: '',
  },
  securityPolicy: {
    type: SecurityPolicySchema,
  },
  isOverwritten: {
    type: Boolean,
    default: true,
  },
  pcSettings: {
    mtThreshold: {
      type: Number,
      min: 0,
      max: 100,
    },
    lockedSegments: {
      includeInClientStatistics: {
        type: Boolean,
        default: false,
      },
      includeInProviderStatistics: {
        type: Boolean,
        default: true,
      },
      segmentsToLock: [{ type: ObjectId, ref: 'Breakdown' }],
      newConfirmedBy: String,
    },
  },
  areSsoSettingsOverwritten: {
    type: Boolean,
    default: false,
  },
  ssoSettings: SSOSettingsSchema,
  mtSettings: {
    useMt: {
      type: Boolean,
      default: false,
    },
    languageCombinations: [MtSettingsLanguageCombination],
  },
  allowCopyPasteInPortalCat: {
    type: Boolean,
    default: true,
  },
}, {
  collection: 'companies',
  timestamps: true,
});

// Part of the concurrency check
CompanySchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

CompanySchema.path('securityPolicy').validate({
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

CompanySchema.statics
  .getPopulatedCompany = async function (query, POPULATE_COMPANY_FIELDS, projection) {
    let company;

    if (!_.isNil(POPULATE_COMPANY_FIELDS)) {
      let dbQuery = this.findOneWithDeleted(query, projection);
      if (_.isNil(projection)) {
        dbQuery = dbQuery.select('-billingInformation.rates');
      }
      company = await dbQuery.populate(POPULATE_COMPANY_FIELDS);
    } else {
      company = await this.findOneWithDeleted(query, projection);
    }
    if (!_.isNil(company)) {
      company.securityPolicy = await this.getSecurityPolicy(company, query.lspId);
      company.ssoSettings = await this.getSsoSettings(company._id, query.lspId);
    }
    return company;
  };

CompanySchema.statics.getSecurityPolicy = async function (company, lsp) {
  let securityPolicy = getSecurityPolicyFromCompany(company);
  const companyId = _.get(company, '_id', company);

  if (!isValidSecurityPolicy(securityPolicy) && validObjectId(companyId)) {
    const lspId = _.get(lsp, '_id', lsp);
    const query = { _id: companyId, lspId };
    const projection = { securityPolicy: 1, parentCompany: 1 };

    company = await this.findOneWithDeleted(query).select(projection);
    securityPolicy = getSecurityPolicyFromCompany(company);
    if (!_.isNil(securityPolicy)) {
      if (Object.keys(securityPolicy).some((field) => _.isEmpty(securityPolicy[field]))) {
        securityPolicy = null;
      }
    }
  }
  if (!isValidSecurityPolicy(securityPolicy)) {
    securityPolicy = await mongoose.models.Lsp.getSecurityPolicy(lsp);
  }
  return securityPolicy;
};

CompanySchema.statics.setCsvTransformations = (csvBuilderInstance) => {
  csvVirtualParser.parseTimeStamps(csvBuilderInstance);
  return csvBuilderInstance
    .virtual('Inactive', item => (item.inactiveText || ''))
    .virtual('Using Default Policies', item => _.get(item, 'isOverwrittenText', ''))
    .virtual('Company status', item => (item.status || ''))
    .virtual('Creator', item => (item.createdBy || ''))
    .virtual('Created', item => (item.createdAt || ''))
    .virtual('Updated', item => (item.updatedAt || ''))
    .virtual('Updater', item => (item.updatedBy || ''))
    .virtual('Restorer', item => (item.restoredBy || ''))
    .virtual('Restored', item => (item.restoredAt || ''))
    .virtual('Sales rep', item => _.defaultTo(_.get(item, 'salesRepName', ''), ''))
    .virtual('Country', item => _.get(item, 'countryName[0]', ''))
    .virtual('State', item => _.get(item, 'stateName[0]', ''))
    .virtual('Industry', item => (item.industry || ''))
    .virtual('Form Of Payment', item => _.get(item, 'paymentMethodName[0]', ''))
    .virtual('City', item => _.get(item, 'cityName', ''))
    .virtual('Account On Hold', item => _.get(item, 'accountOnHoldText', ''))
    .virtual('Gross Profit %', item => _.get(item, 'grossProfitText', ''))
    .virtual('Billing Notes', item => _.get(item, 'billingInformation.notes', ''))
    .virtual('Billing email', item => _.get(item, 'billingEmail', ''))
    .virtual('Billing Terms', item => _.get(item, 'billingTerms', ''))
    .virtual('Primary phone number', item => _.get(item, 'primaryPhoneNumber', ''))
    .virtual('Pursuit active', item => _.get(item, 'pursuiteActive', ''))
    .virtual('Customer tier level', item => _.get(item, 'customerTierLevel', ''))
    .virtual('LSP Internal Departments', item => _.get(item, 'internalDepartmentNames', ''))
    .virtual('Mandatory Request Contact', item => _.defaultTo(_.get(item, 'mandatoryRequestContactText', ''), ''))
    .virtual('Hierarchy', item => _.defaultTo(_.get(item, 'hierarchy', ''), ''))
    .virtual('Mandatory External Accounting Code', item => _.get(item, 'isMandatoryExternalAccountingCode', false));
};

CompanySchema.statics.getExportOptions = () => ({
  headers: [
    'Name',
    'Hierarchy',
    'Creator',
    'Created',
    'Updater',
    'Updated',
    'Inactive',
    'Restorer',
    'Restored',
    'Locations',
    'Service Agreement',
    'Company Notes',
    'Company status',
    'Purchase Order Required',
    'Billing Terms',
    'Form Of Payment',
    'Account On Hold',
    'Gross Profit %',
    'Billing Notes',
    'Industry',
    'Pursuit active',
    'Customer tier level',
    'Primary phone number',
    'Sales rep',
    'City',
    'State',
    'Country',
    'Billing email',
    'Created By',
    'Updated At',
    'LSP Internal Departments',
    'Using Default Policies',
    'Mandatory Request Contact',
    'Mandatory External Accounting Code',
  ],
  alias: {
    Name: 'name',
    Locations: 'locationsText',
    'Company Notes': 'notes',
    'Company status': 'status',
    'Service Agreement': 'serviceAgreementText',
    'Purchase Order Required': 'purchaseOrderRequiredText',
    'Billing Terms': 'billingTermName',
    'Form Of Payment': 'paymentMethodName',
    'Account On Hold': 'onHoldText',
    'Gross Profit %': 'grossProfitText',
    'Billing Notes': 'billingInformation.notes',
    'LSP Internal Departments': 'internalDepartmentNames',
  },
});

// Allow virtuals to be converted to JSON
CompanySchema.set('toJSON', { virtuals: true });

CompanySchema.plugin(mongooseDelete, { overrideMethods: 'all' });
CompanySchema.plugin(transactionHelper);
CompanySchema.plugin(metadata);
CompanySchema.plugin(lspData);
CompanySchema.plugin(modified);
CompanySchema.plugin(siConnectorPlugin);
CompanySchema.plugin(importModulePlugin);

CompanySchema.pre('save', function (next) {
  const self = this;

  if (self.cidr) {
    self.cidr.forEach((c) => {
      c.subnet = parseIP(c.ip).address;
      return c;
    });
  }
  next();
});

CompanySchema.pre('save', function (next) {
  this.serviceAgreementText = this.serviceAgreement.toString();
  this.locationsText = this.locations.map((l) => l.name).join(', ');
  this.onHoldText = _.get(this, 'billingInformation.onHold', '').toString();
  this.grossProfitText = _.get(this, 'billingInformation.grossProfit', '').toString();
  this.purchaseOrderRequiredText = _.get(this, 'billingInformation.purchaseOrderRequired', '').toString();
  next();
});

CompanySchema.statics.getSsoSettings = async function (companyId, lspId) {
  const company = await mongoose.models.Company
    .findOneWithDeleted({
      _id: new mongoose.Types.ObjectId(companyId),
      lspId: new mongoose.Types.ObjectId(lspId),
    }, {
      _id: 1, ssoSettings: 1, parentCompany: 1, areSsoSettingsOverwritten: 1,
    });
  if (!_.isNil(_.get(company, 'parentCompany'))
    && !_.get(company, 'areSsoSettingsOverwritten', false)) {
    const ssoSettings = await mongoose.models.Company
      .getSsoSettings(company.parentCompany._id, lspId);
    _.set(company, 'ssoSettings', ssoSettings);
  }
  return _.get(company, 'ssoSettings', null);
};

CompanySchema.statics.updateRateLanguages = async function (company) {
  if (!_.isEmpty(_.get(company, 'billingInformation.rates'))) {
    await Promise.mapSeries(company.billingInformation.rates, async (rate) => {
      let language;

      if (!_.isEmpty(_.get(rate, 'sourceLanguage.isoCode'))) {
        language = await mongoose.models.Language.findOne({ isoCode: rate.sourceLanguage.isoCode });
        if (!_.isNil(language)) {
          rate.sourceLanguage = _.pick(language, ['_id', 'name', 'isoCode']);
        }
      }
      if (!_.isEmpty(_.get(rate, 'targetLanguage.isoCode'))) {
        language = await mongoose.models.Language.findOne({ isoCode: rate.targetLanguage.isoCode });
        if (!_.isNil(language)) {
          rate.targetLanguage = _.pick(language, ['_id', 'name', 'isoCode']);
        }
      }
    });
  }
};

CompanySchema.statics.postSave = async function (company, modifiedFields) {
  const requestCompanyFields = [
    'name',
    'cidr',
    'internalDepartments',
    'hierarchy',
    'allowCopyPasteInPortalCat',
    'mtSettings',
    'pcSettings',
  ];
  if (modifiedFields.some(field => requestCompanyFields.includes(field))) {
    await mongoose.models.Request.updateMany({
      'company._id': company._id,
      lspId: company.lspId,
    }, {
      $set: requestCompanyFields.reduce((obj, key) => {
        obj[`company.${key}`] = company[key];
        return obj;
      }, {}),
    });
  }
  if (modifiedFields.indexOf('name') !== -1) {
    await Promise.all([
      mongoose.models.Request.updateMany({
        'partners._id': company._id,
        lspId: company.lspId,
      }, {
        $set: {
          'partners.$.name': company.name,
        },
      }),
      mongoose.models.Request.updateMany({
        'schedulingCompany._id': company._id,
        lspId: company.lspId,
      }, {
        $set: {
          'schedulingCompany.name': company.name,
        },
      }),
      mongoose.models.Request.updateMany({
        'insuranceCompany._id': company._id,
        lspId: company.lspId,
      }, {
        $set: {
          'insuranceCompany.name': company.name,
        },
      }),
      mongoose.models.User.updateRateEmbeddedEntities(company, 'staffDetails', 'company'),
      mongoose.models.User.updateRateEmbeddedEntities(company, 'vendorDetails', 'company'),
      mongoose.models.CompanyExternalAccountingCode.updateMany({
        'company._id': company._id,
        lspId: company.lspId,
      }, {
        $set: {
          'company.name': company.name,
        },
      }),
    ]);
  }
};

CompanySchema.statics.getCompanyFamily = async function (
  lspId,
  companyId,
  { childrenOnly = false } = {},
) {
  const company = await this.findOneWithDeleted({ _id: companyId });
  const matchCompany = new RegExp(_.get(company, 'name'));
  const query = {
    lspId,
  };

  if (childrenOnly) {
    Object.assign(query, {
      $and: [
        {
          $or: [
            { _id: companyId },
            { 'parentCompany._id': companyId },
            { 'parentCompany.parentCompany._id': companyId },
            { 'parentCompany.parentCompany.parentCompany._id': companyId },
          ],
        }],
    });
  } else {
    Object.assign(query, {
      $and: [
        {
          $or: [
            { _id: companyId },
            { hierarchy: matchCompany },
          ],
        },
      ],
    });
  }
  const companyFamily = await this.find(query).lean();
  return companyFamily;
};

CompanySchema.statics.hasChild = async function (id) {
  const query = { $or: [{ 'parentCompany._id': id }, { 'parentCompany._id': id.toString() }] };
  const child = await this.findOne(query);
  return !_.isNil(child);
};

CompanySchema.statics.updateInternalDepartments = function (entity) {
  if (entity) {
    const query = {
      lspId: entity.lspId,
      'internalDepartments._id': entity._id,
    };
    return this.updateMany(query, { $set: { 'internalDepartments.$.name': entity.name } });
  }
  return Promise.resolve();
};

CompanySchema.statics.getCompanyAncestors = function (companyInDb) {
  if (!_.isNil(companyInDb.parentCompany)) {
    return [
      _.get(companyInDb, 'parentCompany.parentCompany.parentCompany'),
      _.get(companyInDb, 'parentCompany.parentCompany'),
      _.get(companyInDb, 'parentCompany'),
    ].filter(company => !_.isEmpty(company) && !_.isNil(company._id));
  }
  return [];
};

CompanySchema.statics.lockCompanyHierarchy = async function (_id, session) {
  const companyInDb = await this.findOne({ _id }, { name: 1, parentCompany: 1 }, { session });
  const parentCompanies = this.getCompanyAncestors(companyInDb);
  return Promise.mapSeries([...parentCompanies, companyInDb], company =>
    this.lockDocument({ _id: company._id }, session),
  );
};

CompanySchema.statics.consolidateBalance = async function (_id, session) {
  let mainCompanyToUpdate;
  const options = { new: true };

  if (session) {
    options.session = session;
  }
  const companyId = new mongoose.Types.ObjectId(_id);
  const companyInDb = await this.findOne({ _id: companyId }, { name: 1, parentCompany: 1 });
  const parentCompanies = this.getCompanyAncestors(companyInDb);
  const companiesToUpdate = [companyInDb, ...parentCompanies];

  await Promise.map(companiesToUpdate, async (company) => {
    if (_.isNil(company) || _.isEmpty(company)) return;
    const pipelines = [
      {
        $match: {
          $or: [
            { hierarchy: new RegExp(`${_.escapeRegExp(company.name)} :`, 'i') },
            { name: company.name },
          ],
        },
      },
      { $group: { _id: 'null', ids: { $push: '$_id' } } },
      {
        $facet: {
          advances: getTotalByCurrencies('arAdvances', 'Advance', company._id),
          invoices: getTotalByCurrencies('arInvoices', 'Invoice', company._id),
          creditMemos: getTotalByCurrencies('arAdjustments', 'creditMemo', company._id, 'Credit Memo'),
          debitMemos: getTotalByCurrencies('arAdjustments', 'debitMemo', company._id, 'Debit Memo'),
        },
      },
      {
        $project: {
          entity: { $concatArrays: ['$advances', '$invoices', '$creditMemos', '$debitMemos'] },
        },
      },
      { $unwind: '$entity' },
      {
        $group: {
          _id: '$entity._id',
          entries: { $push: '$entity.balance' },
        },
      },
    ];
    const aggregationResult = await this.aggregate(pipelines).session(session);
    const balance = aggregationResult.map((row) => {
      const invoice = findEntityByType(row, 'Invoice');
      const credit = findEntityByType(row, 'Credit Memo');
      const debit = findEntityByType(row, 'Debit Memo');
      const advance = findEntityByType(row, 'Advance');
      return {
        currency: row._id,
        invoice,
        credit,
        debit,
        advance,
        balance: (invoice.own + debit.own) - (advance.own + credit.own),
        consolidatedBalance: (invoice.consolidated + debit.consolidated)
            - (advance.consolidated + credit.consolidated),
      };
    });
    const updatedCompany = await this.findOneAndUpdate(
      { _id: company._id },
      {
        $set: { balanceInformation: balance },
      },
      options,
    );

    if (company._id.toString() === _id.toString()) {
      mainCompanyToUpdate = updatedCompany;
    }
    if (_.isNil(updatedCompany)) {
      throw new Error('Failed to update company balance');
    }
  });
  return mainCompanyToUpdate;
};

BalanceInformationSchema.set('toJSON', {
  transform: (doc, obj) => {
    _.keys(obj).forEach((topField) => {
      obj[topField] = decimal128ToNumber(obj[topField]);
      if (_.isObject(obj[topField])) {
        _.keys(obj[topField]).forEach((nestedField) => {
          obj[topField][nestedField] = decimal128ToNumber(obj[topField][nestedField]);
        });
      }
    });
    return obj;
  },
});

CompanySchema.index({ _id: 1, 'billingInformation.rates._id': 1 }, { unique: true });

module.exports = CompanySchema;
