const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const _ = require('lodash');
const moment = require('moment');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const { validObjectId } = require('../../../../utils/schema');
const importModulePlugin = require('../plugins/import-module');
const piiPlugin = require('../plugins/pii-plugin');
const { generateEntityFieldsPathsMap } = require('../utils');

const { Schema } = mongoose;
const { ObjectId } = Schema;
const LSP_PII = {
  fields: ['taxId'],
  paymentGateway: {
    fields: ['key', 'secret'],
  },
};
const PC_SUPPORTED_EXTENSIONS = ['.mqxliff', '.docx', '.xlsx', '.pptx', '.html', '.xliff', '.idml', '.txt'];
const CurrencyExchangeSchema = new Schema({
  base: {
    type: ObjectId, ref: 'Currency',
  },
  quote: {
    type: ObjectId, ref: 'Currency',
  },
  quotation: {
    type: Number,
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
}, { _id: false });
const LspSchema = new Schema({
  name: {
    type: String,
    index: true,
    unique: true,
  },
  logoImage: {
    base64Image: String,
  },
  vendorPaymentPeriodStartDate: {
    type: Date,
    set: (value) => moment.utc(value).toDate(),
    required: true,
  },
  pcSettings: {
    mtEngine: { type: ObjectId, ref: 'MtEngine' },
    mtThreshold: {
      type: Number,
      required() {
        return this.ns === 'false';
      },
      min: 0,
      max: 100,
    },
    supportedFileFormats: [{ type: ObjectId, ref: 'DocumentType' }],
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
  addressInformation: {
    line1: String,
    line2: String,
    city: String,
    country: { type: ObjectId, ref: 'Country' },
    state: { type: ObjectId, ref: 'State' },
    zip: String,
  },
  securityPolicy: {
    type: {
      passwordExpirationDays: {
        type: Number,
        default: 60,
        validate: {
          validator(value) {
            return value > 0;
          },
          message: 'Password expiration days number should be greater than 0',
        },
      },
      numberOfPasswordsToKeep: {
        type: Number,
        default: 2,
        validate: {
          validator(value) {
            return value > 0;
          },
          message: 'Number of passwords to keep should be greater than 0',
        },
      },
      minPasswordLength: {
        type: Number,
        default: 10,
        validate: {
          validator(value) {
            return value > 0;
          },
          message: 'Password length should be greater than 0',
        },
      },
      maxInvalidLoginAttempts: {
        type: Number,
        default: 2,
        validate: {
          validator(value) {
            return value > 0;
          },
          message: 'Invaild login attempts number should be greater than 0',
        },
      },
      lockEffectivePeriod: {
        type: Number,
        default: 15,
        validate: {
          validator(value) {
            return value > 0;
          },
          message: 'Lock effective period should be greater than 0',
        },
      },
      timeoutInactivity: {
        type: Number,
        default: 30,
        validate: {
          validator(value) {
            return value > 0;
          },
          message: 'Timeout inactivity should be greater than 0',
        },
      },
      passwordComplexity: {
        lowerCaseLetters: {
          type: Boolean,
          default: true,
        },
        upperCaseLetters: {
          type: Boolean,
          default: true,
        },
        specialCharacters: {
          type: Boolean,
          default: true,
        },
        hasDigitsIncluded: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  currencyExchangeDetails: [CurrencyExchangeSchema],
  description: String,
  emailConnectionString: {
    type: String,
    required: true,
  },
  customQuerySettings: {
    type: {
      reportCache: { type: Number },
    },
  },
  financialEntityPrefix: {
    type: String,
    required: true,
  },
  phoneNumber: String,
  url: String,
  taxId: String,
  fax: String,
  revenueRecognition: {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  paymentGateway: {
    name: String,
    id: String,
    key: String,
    secret: String,
    account: String,
    isProduction: Boolean,
  },
  lspAccountingPlatformLocation: { type: String, required: true },
  timezone: { type: String, required: true },
  officialName: String,
  supportsIpQuoting: {
    type: Boolean,
    default: false,
  },
  autoTranslateSettings: {
    type: {
      minimumConfidenceLevel: {
        type: Number,
        min: 0,
        max: 1,
      },
      fileOutput: {
        type: String,
        enum: ['Unformatted TXT', 'Unformatted PDF'],
      },
    },
    default: {
      minimumConfidenceLevel: 0,
      fileOutput: 'Unformatted TXT',
    },
  },
  mtSettings: {
    useMt: {
      type: Boolean,
      default: false,
    },
    languageCombinations: [MtSettingsLanguageCombination],
  },
}, {
  collection: 'lsp',
  timestamps: true,
});

LspSchema.plugin(mongooseDelete, { overrideMethods: true });
LspSchema.plugin(metadata);
LspSchema.plugin(modified);
LspSchema.plugin(importModulePlugin);
LspSchema.plugin(piiPlugin);

LspSchema.statics.PATHS_TO_MASK = generateEntityFieldsPathsMap(LSP_PII);
LspSchema.statics.getSecurityPolicy = async function (lsp) {
  let securityPolicy = _.get(lsp, 'securityPolicy', null);
  if (!_.isNil(securityPolicy)) {
    if (Object.keys(securityPolicy).some((field) => _.isEmpty(securityPolicy[field]))) {
      securityPolicy = null;
    }
  }
  if (_.isNil(securityPolicy)) {
    const lspId = _.get(lsp, '_id', lsp);

    if (validObjectId(lspId)) {
      lsp = await this.findOne({ _id: lspId }, 'securityPolicy');
      securityPolicy = _.get(lsp, 'securityPolicy', null);
    }
  }
  return securityPolicy;
};

LspSchema.path('currencyExchangeDetails').validate({
  validator(value) {
    const hasDuplicates = _(value.toObject())
      .groupBy((details) => `${details.base}-${details.quote}`)
      .some((group) => group.length > 1);
    return !hasDuplicates;
  },
  message: 'Currency exchange detail list contains duplicated data',
});

LspSchema.path('pcSettings.supportedFileFormats').validate({
  async validator(value = []) {
    const docTypes = await mongoose.models.DocumentType.find({
      _id: value,
    });
    return docTypes.every(({ extensions = '' }) => PC_SUPPORTED_EXTENSIONS
      .some((extension) => extensions.includes(extension)));
  },
  message: 'Unsupported file type',
});

LspSchema.path('securityPolicy').validate({
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

LspSchema.statics.getExchangeDetails = async function (lspId, currencyId) {
  const populateFields = [
    { path: 'currencyExchangeDetails.base' },
    { path: 'currencyExchangeDetails.quote' },
  ];
  const lsp = await this.findOne({ _id: lspId }).select('currencyExchangeDetails').populate(populateFields);
  const rateDetails = _.get(lsp, 'currencyExchangeDetails', [])
    .find((rate) => rate.quote._id.toString() === currencyId.toString());
  return rateDetails;
};

LspSchema.statics.getLocationId = async function (lspId) {
  const lsp = await this.findOne({ _id: lspId }).select('lspAccountingPlatformLocation');

  if (_.isNil(lsp)) {
    throw new Error(`Lsp with _id ${lspId} was not found`);
  }
  return lsp.lspAccountingPlatformLocation;
};
module.exports = LspSchema;
