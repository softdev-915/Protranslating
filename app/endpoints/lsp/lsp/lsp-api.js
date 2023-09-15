// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const _ = require('lodash');
const { Types: { ObjectId }, isValidObjectId } = require('mongoose');
const apiResponse = require('../../../components/api-response');
const FilePathFactory = require('../../../components/file-storage/file-path-factory');
const FileStorageFacade = require('../../../components/file-storage');
const ApplicationCrypto = require('../../../components/crypto');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { environment } = require('../../../components/configuration');
const SchemaAwareAPI = require('../../schema-aware-api');

const { RestError } = apiResponse;
const LSP_DETAIL_FIELDS_TO_POPULATE = [
  'addressInformation.country',
  'addressInformation.state',
  { path: 'pcSettings.mtEngine', select: 'mtProvider' },
  { path: 'pcSettings.supportedFileFormats', select: 'name extensions' },
  { path: 'pcSettings.lockedSegments.segmentsToLock', select: 'name' },
  { path: 'currencyExchangeDetails.base', select: 'isoCode', options: { withDeleted: true } },
  { path: 'currencyExchangeDetails.quote', select: 'isoCode', options: { withDeleted: true } },
];

class LspAPI extends SchemaAwareAPI {
  constructor(options) {
    super(options.logger, options);
    this.FileStorageFacade = FileStorageFacade;
    this.FilePathFactory = FilePathFactory;
    this.options = options;
    this.mock = _.get(options, 'mock', false);
    this.environment = _.get(options, 'configuration.environment', environment);
    this.logger.debug('LSP CONSTRUCTOR API FINISHED');
  }

  /**
  * Returns the lsp list for a given user
  * @param {String} User's email
  */
  async list(email) {
    let lspList = [];
    const lspSelectionFields = '_id name description logoImage officialName';

    try {
      if (email) {
        const lspEmailSelectionFields = `${lspSelectionFields} securityPolicy mtSettings`;
        const usersWithLsp = await this.schema.User
          .findWithDeleted(
            { email, lsp: { $exists: true }, terminated: { $ne: true } },
            {
              lsp: 1, forcePasswordChange: 1, isApiUser: 1, useTwoFactorAuthentification: 1,
            },
          )
          .populate({ path: 'lsp', model: 'Lsp', select: lspEmailSelectionFields })
          .populate({ path: 'company', model: 'Company', select: '_id lspId' });
        if (Array.isArray(usersWithLsp) && !_.isEmpty(usersWithLsp)) {
          const company = _.get(usersWithLsp, '[0].company');
          const isApiUser = _.get(usersWithLsp, '[0].isApiUser');
          let ssoSettings = { isSSOEnabled: false };
          if (!isApiUser && !_.isNil(company)) {
            const { _id, lspId } = company;
            const settings = await mongoose.models.Company.getSsoSettings(_id, lspId);
            if (!_.isNil(ssoSettings)) {
              ssoSettings = {
                isSSOEnabled: _.get(settings, 'isSSOEnabled', false),
                entryPoint: _.get(settings, 'entryPoint', ''),
              };
            }
          }
          lspList = usersWithLsp.map((user) => ({
            name: user.lsp.name,
            description: user.lsp.name,
            securityPolicy: user.lsp.securityPolicy,
            _id: user.lsp._id,
            forcePasswordChange: user.forcePasswordChange,
            logoImage: user.lsp.logoImage,
            officialName: _.get(user, 'lsp.officialName', ''),
            ssoSettings,
            mtSettings: user.lsp.mtSettings,
            useTwoFactor: user.useTwoFactorAuthentification,
          }));
        }
      } else {
        lspList = await this.schema.Lsp.find({}, lspSelectionFields);
      }
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error while retrieving lsp list for user with email: ${email}. Error: ${message}`);
      throw new RestError(404, { message, stack: err.stack });
    }
    return {
      list: lspList,
      total: lspList.length,
    };
  }

  async lspDetail() {
    try {
      const lsp = await this.schema.Lsp.findOne({ _id: this.lspId })
        .populate(LSP_DETAIL_FIELDS_TO_POPULATE);
      if (this.user.hasNot(['LSP-SETTINGS-SMTP_UPDATE_OWN', 'LSP-SETTINGS-SMTP_READ_OWN'])) {
        delete lsp.emailConnectionString;
      } else {
        const emailConnectionString = _.get(lsp, 'emailConnectionString');
        if (!_.isNil(emailConnectionString)) {
          const { CRYPTO_KEY_PATH } = this.environment;
          const applicationCrypto = new ApplicationCrypto(CRYPTO_KEY_PATH);

          lsp.emailConnectionString = applicationCrypto.decrypt(emailConnectionString);
        }
      }
      lsp.maskPIIValues(lsp);
      const lspObject = lsp.toObject();
      if (this.user.hasNot(['LSP-SETTINGS-CAT_UPDATE_OWN', 'LSP-SETTINGS-CAT_READ_OWN'])) {
        delete lspObject.pcSettings;
      }
      return lspObject;
    } catch (err) {
      this.logger.error(err);
      const message = err.message || err;

      this.logger.error(`Error while retrieving lsp for user with email: ${this.user.email}. Error: ${message}`);
      throw new RestError(404, { message: err, stack: err.stack });
    }
  }

  async update(lsp) {
    const lspInDB = await this.schema.Lsp.findOne({ _id: this.lspId });
    const emailConnectionStringEncrypted = lspInDB.emailConnectionString;
    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'lsp',
    });
    await concurrencyReadDateChecker.failIfOldEntity(lspInDB);
    lspInDB.restoreMaskedValues(lsp, lspInDB);
    if (!this.user.has('LSP-SETTINGS-ACCT_UPDATE_OWN')) {
      lsp.lspAccountingPlatformLocation = lspInDB.lspAccountingPlatformLocation;
      lsp.revenueRecognition = lspInDB.revenueRecognition;
    }
    if (!this.user.has('LSP-SETTINGS-CAT_UPDATE_OWN')) {
      lsp.pcSettings = lspInDB.pcSettings;
    }
    if (!_.has(lsp, 'logoImage') || this.mock) {
      lsp.logoImage = lspInDB.logoImage;
    } else if (lsp.logoImage.base64Image === '') {
      lsp.logoImage = null;
    }
    if (this.user.hasNot('LSP-SETTINGS-CAT_UPDATE_OWN')) {
      lsp.pcSettings = lspInDB.pcSettings;
    }
    lspInDB.safeAssign(lsp);
    if (!this.user.has('LSP-SETTINGS-SMTP_UPDATE_OWN')) {
      lspInDB.emailConnectionString = emailConnectionStringEncrypted;
    } else if (!_.isEmpty(lspInDB.emailConnectionString)) {
      const { CRYPTO_KEY_PATH } = this.environment;
      const applicationCrypto = new ApplicationCrypto(CRYPTO_KEY_PATH);
      lspInDB.emailConnectionString = applicationCrypto.encrypt(lspInDB.emailConnectionString);
    }
    try {
      await lspInDB.save();
      const lspDetail = await this.lspDetail();
      return lspDetail;
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error updating lsp: ${lsp._id}. Error: ${message}`);
      throw new RestError(500, err);
    }
  }

  async findLspsById(lspIds) {
    let lspList = [];
    const isAllIdsValid = _.every(lspIds, (lspId) => isValidObjectId(lspId));

    if (!isAllIdsValid) {
      this.logger.error(`Error while retrieving lsp for user with email: ${_.get(this, 'user.email')}. Lsp Ids are not valid`);
      throw new RestError(400, { message: 'Lsp Ids is not valid' });
    }
    const findQuery = {
      _id: {
        $in: _.map(lspIds, (lspId) => new ObjectId(lspId)),
      },
    };

    try {
      lspList = await this.schema.Lsp.find(findQuery, '_id name description');
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error while retrieving lsp list for user with email: ${_.get(this, 'user.email')}. Error: ${message}`);
      throw new RestError(404, { message, stack: err.stack });
    }
    return {
      list: lspList,
      total: lspList.length,
    };
  }
}

module.exports = LspAPI;
