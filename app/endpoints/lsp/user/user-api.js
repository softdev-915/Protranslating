const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment-timezone');
const { Types: { ObjectId } } = require('mongoose');
const { RestError } = require('../../../components/api-response');
const { CsvExport } = require('../../../utils/csvExporter');
const UserUpsert = require('./user-upsert');
const SchemaAwareAPI = require('../../schema-aware-api');
const FileStorageFacade = require('../../../components/file-storage');
const VersionableFileStorage = require('../../../components/file-storage/versionable-file-storage-facade');
const AuthCredentialsApi = require('../../auth/auth-credentials-api');
const fileUtils = require('../../../utils/file');
const UserVersionableDocument = require('../../../utils/document/user-versionable-document');
const rolesUtils = require('../../../utils/roles');
const helper = require('./user-api-helper');
const { searchFactory, exportFactory } = require('../../../utils/pagination');
const CloudStorage = require('../../../components/cloud-storage');
const { _getExtraQueryParams, _getListQueryPipeline } = require('./user-aggregation-helpers');
const { convertToObjectId } = require('../../../utils/schema');
const { buildISODateQuery } = require('../../../components/database/mongo/query/date');
const configuration = require('../../../components/configuration');
const { generateEntityFieldsPathsMap } = require('../../../components/database/mongo/utils');
const { rateIsDuplicate } = require('../../../utils/rate');

const { NODE_ENV } = configuration.environment;
const VENDOR_USER_TYPE = 'Vendor';
const requestStatuses = [
  { key: 'requestsToBeProcessed', value: 'To be processed' },
  { key: 'requestsInProgress', value: 'In progress' },
  { key: 'requestsWaitingForQuote', value: 'Waiting for Quote' },
  { key: 'requestsWaitingForApproval', value: 'Waiting for approval' },
];
const { areObjectIdsEqual } = require('../../../utils/schema');

const VENDOR_DETAIL_FIELDS_MAP = {
  vendorDetails: {
    fields: ['vendorCompany', 'address'],
    billingInformation: {
      fields: ['paymentMethod', 'ptPayOrPayPal', 'priorityPayment', 'billsOnHold',
        'billingTerms', 'taxForm', 'form1099Type', 'form1099Box', 'taxId', 'currency', 'billPaymentNotes'],
    },
  },
};
const VENDOR_DETAIL_FIELDS_TO_TRIGGER_SYNC = generateEntityFieldsPathsMap(VENDOR_DETAIL_FIELDS_MAP);
const VENDOR_FIELDS_TO_TRIGGER_SYNC = ['email', 'firstName', 'middleName', 'lastName', 'terminated'].concat(VENDOR_DETAIL_FIELDS_TO_TRIGGER_SYNC);

class UserAPI extends SchemaAwareAPI {
  /**
   * @param {Object} logger
   * @param {Object} options
   */
  constructor(logger, options) {
    super(logger, options);
    this.logger = logger;
    this.configuration = _.get(options, 'configuration');
    this.FileStorageFacade = FileStorageFacade;
    this.VersionableFileStorage = VersionableFileStorage;
    this.authCredentialsApi = new AuthCredentialsApi({ logger });
    this.mock = _.get(options, 'mock', false);
    this.shouldMockSiUserSyncFail = _.get(options, 'shouldMockSiUserSyncFail');
    this.cloudStorage = new CloudStorage(this.configuration, this.logger);
  }

  /**
   * Returns the user list as a csv file
   * @param {Object} userFilters to filter the users returned.
   */
  async userExport(filters) {
    this.logger.debug(`User ${this.user.email} is retrieving a user list export file`);
    const SORT_USER_FIELDS = { firstName: 1, lastName: 1 };
    const extraQueryParams = _getExtraQueryParams();
    let query = { lsp: this.lspId };

    if (filters && filters._id) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    query.sort = _.get(filters, 'sort', SORT_USER_FIELDS);
    const pipeline = _getListQueryPipeline();
    const csvStream = await exportFactory(
      this.schema.UserSecondary,
      query,

      pipeline,
      extraQueryParams,
      filters.__tz,
    );

    this.logger.debug(`User ${this.user.email} is retrieved a user list export file`);
    const csvExporter = new CsvExport(csvStream, {
      schema: this.schema.UserSecondary,
      lspId: this.lspId,
      configuration: this.configuration,
      logger: this.logger,
      filters: query,
    });
    return csvExporter.export();
  }

  nonPaginatedList(params) {
    const query = {
      lsp: this.lspId,
    };

    if (params.userId) {
      Object.assign(query, {
        _id: new mongoose.Types.ObjectId(params.userId),
      });
    }
    const informalType = _.get(params, 'informalType');

    if (informalType && informalType !== 'projectManager') {
      throw new RestError(400, { message: 'Invalid informalType' });
    } else if (informalType === 'projectManager') {
      query.$or = [{
        lsp: this.lspId,
        groups: {
          $elemMatch: {
            roles: 'COMPANY_CREATE_ALL',
          },
        },
      }, {
        lsp: this.lspId,
        roles: 'COMPANY_CREATE_ALL',
      }];
    }
    const args = [query];
    const attributes = _.get(params, 'attributes');

    if (attributes) {
      args.push(attributes);
    }
    const promise = params.withDeleted
      ? this.schema.User.findWithDeleted(...args)
      : this.schema.User.find(...args);
    return promise;
  }

  /**
   * Returns the user's list.
   * @param {Object} userFilters to filter the users returned.
   * @param {String} userFilters.type the user type to filter.
   * @param {String} userFilters.userId the user's id to filter.
   */
  async userList(filters) {
    this.logger.debug(`User ${this.user.email} is retrieving its user lists`);
    const userRoles = rolesUtils.getRoles(this.user);
    const canReadStaffRates = rolesUtils.hasRole('STAFF-RATES_READ_ALL', userRoles);
    const columns = _.get(filters, 'columns');
    const excludeKeys = ['vendorDetails.rates'];
    if (!canReadStaffRates) {
      excludeKeys.push('staffDetails.rates');
    }
    let users;
    const SORT_USER_FIELDS = { firstName: 1, lastName: 1 };
    let query = {
      lsp: this.lspId,
    };

    if (filters && filters._id) {
      query._id = filters._id;
    }
    // TODO: remove this mess of grouping by email, is really not needed
    const list = [];
    const listIndexedByEmail = {};

    if (query._id) {
      users = [await this.schema.UserSecondary.findOneWithDeletedAndPopulate(query)];
      if (users.length) {
        const user = users[0];
        user.maskPIIValues(user);
      }
    } else {
      const pipeline = _getListQueryPipeline(columns);
      const extraQueryParams = _getExtraQueryParams();

      // Search all users
      query.sort = _.get(filters, 'sort', SORT_USER_FIELDS);
      query = Object.assign(query, _.get(filters, 'paginationParams', {}));
      users = await searchFactory({
        model: this.schema.UserSecondary,
        filters: query,
        extraPipelines: pipeline,
        extraQueryParams,
        utcOffsetInMinutes: filters.__tz,
      }).exec();
      users.forEach((u) => {
        u.abilities = _.get(u, 'abilities', []);
        u.catTools = _.get(u, 'catTools', []);
        u.companyName = _.get(u, 'companyName', '');
        u.companyId = _.get(u, 'companyId', '');
        u.groups = _.get(u, 'groups', []);
        u.languageCombinations = _.get(u, 'languageCombinations', []);
        u.roles = _.get(u, 'roles', []);
        u.deleted = _.get(u, 'deleted', false);
        u.terminated = _.get(u, 'terminated', false);
        u.isLocked = _.get(u, 'isLocked', false);
        u.isApiUser = _.get(u, 'isApiUser', false);
        u.type = _.get(u, 'type', null);
        u.projectManagers = _.get(u, 'projectManagers', []);
        // projectManagers needs some processing
        u.projectManagers = u.projectManagers.map((pm) => ({
          value: pm._id,
          text: `${pm.firstName} ${pm.lastName}`,
        }));
        // Exclude extra aggreagation keys
        excludeKeys.forEach((key) => _.unset(u, key));
        // _.omit(u, excludeKeys);
      });
      return users;
    }
    users.forEach((u) => {
      u.readDate = _.get(u, 'updatedAt');
      if (u.email) {
        // NOTE: temporary fix to complete records
        const haveLspId = _.get(u, 'lsp');

        if (!haveLspId) {
          u = _.extend(helper.userToSendFactory(), u);
        }
        listIndexedByEmail[u.email] = u;
      } else {
        // adds the users with no email
        const userToSend = helper.userToSendFactory();
        helper.assignUserForRestResponse(userToSend, u);
        list.push(userToSend);
      }
      // Exclude fields that user is not authorized to read
      excludeKeys.forEach((key) => _.unset(u, key));
    });
    Object.keys(listIndexedByEmail).forEach((k) => {
      const nonOneLoginUser = listIndexedByEmail[k];
      const userToSend = helper.userToSendFactory();
      helper.assignUserForRestResponse(userToSend, nonOneLoginUser);
      if (!userToSend.email) {
        userToSend.email = k;
      }
      list.push(userToSend);
    });
    const filteredList = helper.applyFilters(list, filters);

    this.logger.debug(`User ${this.user.email} retrieved its user lists`);
    return filteredList;
  }

  async userCreate(userProspect) {
    this.logger.debug(`User ${this.user.email} is creating new user ${_.get(userProspect, 'email', userProspect)}`);
    const userUpsert = new UserUpsert({
      logger: this.logger,
      schema: this.schema,
      userInSession: this.user,
      mock: this.mock,
      shouldMockSiUserSyncFail: this.shouldMockSiUserSyncFail,
      cryptoFactory: this.cryptoFactory,
      configuration: this.configuration,
      FileStorageFacade: this.FileStorageFacade,
      VersionableFileStorage: this.VersionableFileStorage,
    });
    const userCreated = await userUpsert.create(userProspect);

    this.logger.debug(`User ${this.user.email} is creating new user ${_.get(userCreated, '_id', userCreated)}`);
    return userCreated;
  }

  async updateProfileImage(image) {
    try {
      return this.schema.User.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(this.user._id) }, {
        $set: {
          profileImage: {
            file: image,
          },
        },
      });
    } catch (err) {
      const message = _.get(err, 'message', err);
      this.logger.error(`Error occurred upon updating user profile image. Err: ${message}`);
      throw new RestError(500, { message: `Error occurred upon updating user profile image. Err: ${message}` });
    }
  }

  async userEditUiSettings(uiSettings) {
    try {
      const userInDb = await this.schema.User.findOneWithDeleted({
        lsp: this.lspId,
        email: _.get(this, 'user.email'),
      });
      const userInDbObject = userInDb.toObject();

      userInDbObject.uiSettings = uiSettings;
      const userEdited = await this.userEdit(userInDbObject);
      return _.get(userEdited, 'user.uiSettings');
    } catch (err) {
      const message = _.get(err, 'message', err);
      this.logger.error(`Error occurred upon updating user UI settings. Err: ${message}`);
      throw new RestError(500, { message: 'Error occurred upon updating user UI settings' });
    }
  }

  async userEdit(user) {
    this.logger.debug(`User ${this.user.email} is editing user ${_.get(user, '_id', user)}`);
    let userEdited;
    const userInDb = await this.schema.User.findOneWithDeleted({ _id: user._id });

    try {
      const userUpsert = new UserUpsert({
        logger: this.logger,
        schema: this.schema,
        userInSession: this.user,
        mock: this.mock,
        shouldMockSiUserSyncFail: this.shouldMockSiUserSyncFail,
        configuration: this.configuration,
        FileStorageFacade: this.FileStorageFacade,
        VersionableFileStorage: this.VersionableFileStorage,
        userApi: this,
        userInDb,
      });
      userInDb.restoreMaskedValues(user, userInDb);
      userEdited = await userUpsert.update(user);
      userEdited.shouldUserSync = this.shouldVendorSync(user);
      await this.schema.User.postSave(userEdited.user, userUpsert.getUserModifications());
    } catch (e) {
      if (e instanceof RestError && e.code === 409 && e.data) {
        // when throwing 409 concurrency error,
        // the frontend expect the user in an special format
        // so we will overwrite the Rest Error thrown with the proper data.
        const expectedUser = {};
        let refreshedUser = e.data;

        if (_.get(e, 'data.toObject')) {
          refreshedUser = e.data.toObject();
        }
        helper.assignUserForRestResponse(expectedUser, refreshedUser);
        e.data = expectedUser;
      }
      throw e;
    }
    this.logger.debug(`User ${this.user.email} edited user ${_.get(user, '_id', user)}`);
    return userEdited;
  }

  async changePassword(user, passwordChange) {
    this.logger.debug(`User ${this.user.email} is changing password`);
    if (passwordChange.newPassword !== passwordChange.repeatPassword) {
      throw new RestError(400, { message: 'The "new password" does not match the "confirm new password".' });
    }
    if (passwordChange.password === passwordChange.newPassword) {
      throw new RestError(400, { message: 'The new password must be different than the old one' });
    }
    const credentials = Object.assign(passwordChange, {
      userId: new mongoose.Types.ObjectId(user._id),
      email: user.email,
      lspId: user.lsp._id,
    });
    return this.authCredentialsApi.changePassword(credentials);
  }

  async getUserIdByEmail(filters) {
    const user = await this.schema.User.findOneWithDeleted({
      lsp: filters.lspId,
      email: filters.email,
    }).select('_id').lean();
    return _.get(user, '_id', '');
  }

  async buildUserDocumentFilePath(userId, documentId) {
    const fileStorageFacade = new this.VersionableFileStorage(this.lspId, this.configuration, this.logger);
    const userInDb = await this.schema.User.findOneWithDeleted({ _id: userId, lsp: this.lspId });

    if (_.isNil(userInDb)) {
      throw new RestError(404, { message: `The user ${userInDb._id} does not exist` });
    }
    const userDetails = _.get(userInDb, 'staffDetails', _.get(userInDb, 'vendorDetails'));
    const documents = UserVersionableDocument.buildFromArray(userDetails.hiringDocuments);
    const document = documents.find((f) => f.getVersion(documentId));

    if (_.isNil(document)) {
      throw new RestError(404, { message: `The document ${document._id} does not exist` });
    }
    let extension = fileUtils.getExtension(document.name);

    if (extension.length) {
      extension = `${extension}`;
    }
    const file = fileStorageFacade.userHiringDocument(userId, document, extension, documentId);
    return {
      name: document.name,
      path: file.path,
    };
  }

  async zipFilesStream(user, userId, res) {
    const { lspId } = this;
    const query = {
      _id: userId,
      lsp: this.lspId,
    };
    const userInDb = await this.schema.User.findOneWithDeleted(query);

    if (!userInDb) {
      this.logger.info(`User ${userInDb._id} not found`);
      throw new RestError(404, { message: 'User not found' });
    }
    if ((userInDb.staffDetails && !userInDb.staffDetails.hiringDocuments.length)
      || (userInDb.vendorDetails && !userInDb.vendorDetails.hiringDocuments.length)) {
      this.logger.info(`User ${userInDb._id} does not have any documents.`);
      throw new RestError(404, { message: 'No documents available to download' });
    }
    const versionableFileStorageFacade = new this.VersionableFileStorage(lspId, this.configuration, this.logger);
    const files = helper.hiringDocumentList(userInDb, versionableFileStorageFacade);

    try {
      await this.cloudStorage.streamZipFile({ res, files, zipFileName: `${userInDb.id}.zip` });
    } catch (err) {
      const message = _.get(err, 'message', err);

      this.logger.error(`Error writing zip file. Error: ${message}`);
      throw new RestError(500, { message: 'Error generating zip file', stack: err.stack });
    }
  }

  async averageVendorRate(filters) {
    filters.lspId = this.lspId;
    try {
      const average = await this.schema.User.getVendorRateAverage(filters);
      return _.get(average, '[0].avgPrice', 0);
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error querying vendor rate average price. Error: ${message}`);
      throw new RestError(500, { message: 'Error requesting vendor rate average price', stack: err.stack });
    }
  }

  async toggle2FAState(query, state) {
    if (!this.isAllowedToChange2FAState(query)) {
      throw new RestError(403, { message: 'You are not allowed to change 2FA state for this user' });
    }
    await this.schema.User.updateOne(query, { $set: { useTwoFactorAuthentification: state } });
  }

  async userEditPortalMTSettings(portalMTSettings) {
    try {
      const userInDb = await this.schema.User.findOneWithDeleted({
        lsp: this.lspId,
        email: _.get(this, 'user.email'),
      });
      const userInDbObject = userInDb.toObject();
      const client = _.get(portalMTSettings, 'client');
      portalMTSettings.client = client !== '' ? new ObjectId(client) : null;
      userInDbObject.portalTranslatorSettings = portalMTSettings;
      const userEdited = await this.userEdit(userInDbObject);
      return _.get(userEdited, 'user.portalTranslatorSettings');
    } catch (err) {
      const message = _.get(err, 'message', err);
      this.logger.error(`Error occurred upon updating Portal Translator settings. Err: ${message}`);
      throw new RestError(500, { message: 'Error occurred upon updating Portal Translator settings' });
    }
  }

  isAllowedToChange2FAState(query) {
    const email = _.get(this, 'user.email');
    const lspId = _.get(this, 'user.lsp._id');

    if (email === query.email && lspId === query.lsp) {
      return true;
    }
    return this.user.has('USER_UPDATE_ALL');
  }

  async retrieveVendorTotalBalance() {
    try {
      const user = await this.findById(this.user._id)
        .select({ 'vendorDetails.totalBalance': 1 })
        .lean()
        .exec();
      return _.get(user, 'vendorDetails.totalBalance', 0);
    } catch (err) {
      const message = _.get(err, 'message', err);
      this.logger.error(`Error occurred upon retrieving vendor total balance Err: ${message}`);
      throw new RestError(500, { message: 'Error occurred upon retrieving vendor total balance' });
    }
  }

  async retrieveContactRequestsData() {
    try {
      const hasRequestReadCompanyRole = this.user.has('REQUEST_READ_COMPANY');
      const hasRequestReadOwnRole = this.user.has('REQUEST_READ_OWN');
      const lspId = _.get(this, 'user.lsp._id');
      const extraQuery = {};
      extraQuery.lspId = convertToObjectId(lspId);
      if (hasRequestReadCompanyRole) {
        const companyId = _.get(this, 'user.company._id');
        const companies = await this.schema.Company
          .getCompanyFamily(lspId, companyId, { childrenOnly: true });
        const companyIds = companies.map((company) => convertToObjectId(company._id));
        extraQuery['company._id'] = { $in: companyIds };
      } else if (hasRequestReadOwnRole) {
        extraQuery['contact._id'] = convertToObjectId(_.get(this, 'user._id'));
      } else {
        return null;
      }

      let data = await this.schema.Request.aggregate([
        { $match: { status: { $in: requestStatuses.map((status) => status.value) }, ...extraQuery } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      data = _.keyBy(data, '_id');
      const response = {};
      requestStatuses.forEach((status) => {
        response[status.key] = _.get(data, `["${status.value}"].count`, 0);
      });
      return response;
    } catch (err) {
      const message = _.get(err, 'message', err);
      this.logger.error(`Error occurred upon retrieving contact requests data Err: ${message}`);
      throw new RestError(500, { message: 'Error occurred upon retrieving contact requests data' });
    }
  }

  async retrieveContactInvoicesData(invoicesKpiDateFilter, tz, paginationParams) {
    try {
      const utcOffsetInMinutes = _.toNumber(tz);
      const hasInvoiceReadCompanyRole = this.user.has('INVOICE_READ_COMPANY');
      const hasInvoiceReadOwnRole = this.user.has('INVOICE_READ_OWN');
      const lspId = _.get(this, 'user.lsp._id');
      const query = {
        date: buildISODateQuery(invoicesKpiDateFilter, utcOffsetInMinutes),
        lspId: convertToObjectId(lspId),
      };
      if (hasInvoiceReadCompanyRole) {
        const companyId = _.get(this, 'user.company._id');
        const companies = await this.schema.Company.getCompanyFamily(
          lspId,
          companyId,
          { childrenOnly: true },
        );
        const companyIds = companies.map((company) => convertToObjectId(company._id));
        query.company = { $in: companyIds };
      } else if (hasInvoiceReadOwnRole) {
        query.contact = convertToObjectId(_.get(this, 'user._id'));
      }
      const response = await this.schema.ArInvoice.groupInvoicesTotalByCompanies(
        query,
        paginationParams,
      );
      return response;
    } catch (err) {
      const message = _.get(err, 'message', err);
      this.logger.error(`Error occurred upon retrieving contact invoices data Err: ${message}`);
      throw new RestError(500, { message: 'Error occurred upon retrieving contact invoices data' });
    }
  }

  async retrieveContactLanguagesData(
    sourceLanguage,
    targetLanguage,
    datePeriod,
    tz,
    paginationParams,
  ) {
    try {
      const utcOffsetInMinutes = _.toNumber(tz);
      const hasRequestReadCompanyRole = this.user.has('REQUEST_READ_COMPANY');
      const hasRequestReadOwnRole = this.user.has('REQUEST_READ_OWN');
      const lspId = _.get(this, 'user.lsp._id');
      const query = {};
      if (hasRequestReadCompanyRole) {
        const companyId = _.get(this, 'user.company._id');
        const companies = await this.schema.Company.getCompanyFamily(
          lspId,
          companyId,
          { childrenOnly: true },
        );
        const companyIds = companies.map((company) => convertToObjectId(company._id));
        query['company._id'] = { $in: companyIds };
      } else if (hasRequestReadOwnRole) {
        query['contact._id'] = convertToObjectId(_.get(this, 'user._id'));
      } else {
        return [];
      }
      return await this.schema.Request.getLanguageKpi(
        sourceLanguage,
        targetLanguage,
        lspId,
        datePeriod,
        utcOffsetInMinutes,
        query,
        paginationParams,
      );
    } catch (err) {
      const message = _.get(err, 'message', err);
      this.logger.error(`Error occurred upon retrieving language KPI data. Err: ${message}`);
      throw new RestError(500, { message: 'Error occurred upon retrieving contact invoices data' });
    }
  }

  findById(_id) {
    return this.schema.User.findOneWithDeleted({ _id });
  }

  findByIds(ids = []) {
    if (_.isEmpty(ids)) {
      return Promise.resolve([]);
    }
    return this.schema.User.findWithDeleted({ _id: { $in: ids } });
  }

  async getVendorRates(filters) {
    if (_.isNil(filters.userId)) {
      throw new RestError(400, { message: 'Invalid user id' });
    }
    const shouldDropDrafts = _.get(filters, 'shouldDropDrafts', true);
    const userRoles = rolesUtils.getRoles(this.user);
    try {
      const canReadVendorRates = rolesUtils.hasRole('VENDOR-RATES_READ_ALL', userRoles);
      if (!canReadVendorRates) {
        throw new Error('User doesn\'t have enough permissions to read vendor rates');
      }
      const match = {
        $match: {
          lsp: convertToObjectId(this.lspId),
          _id: convertToObjectId(filters.userId),
        },
      };
      if (shouldDropDrafts) {
        match.$match['vendorDetails.rates.isDrafted'] = { $ne: true };
      }
      const pipelines = [
        match,
        { $unwind: '$vendorDetails.rates' },
        { $sort: { 'vendorDetails.rates.isDrafted': -1 } },
        {
          $group: {
            _id: '$_id',
            rates: { $push: '$vendorDetails.rates' },
          },
        },
      ];
      const [userResponse] = await this.schema.User.aggregateWithDeleted(pipelines);
      const rates = _.get(userResponse, 'rates', []);
      if (!shouldDropDrafts) {
        const duplicatedRates = rates.filter((rate, index) => {
          const ratesToCompareWith = rates.slice(index + 1);
          return rateIsDuplicate(rate, ratesToCompareWith);
        }).map((rate) => rate._id);
        return rates.sort((left, right) => {
          const isLeftDuplicate = duplicatedRates.includes(left._id);
          const isRightDuplicate = duplicatedRates.includes(right._id);
          if (isLeftDuplicate && !isRightDuplicate) return -1;
          if (!isLeftDuplicate && isRightDuplicate) return 1;
          return 0;
        });
      }
      return rates;
    } catch (error) {
      const message = error.message || error;
      this.logger.error(`Error querying rates for user. Error: ${message}`);
      throw new RestError(500, { message: 'Error requesting rates of vendor', stack: error.stack });
    }
  }

  async saveVendorRate(filters) {
    if (_.isNil(filters.userId)) {
      throw new RestError(400, { message: 'Invalid user id' });
    }
    if (_.isNil(filters.rate)) {
      throw new RestError(400, { message: 'There\'s no rate to save' });
    }
    const { userId, rate } = filters;
    const userRoles = rolesUtils.getRoles(this.user);
    try {
      const isNewRate = !rate._id || _.isEmpty(rate._id);
      const canSaveRate = !isNewRate
        ? rolesUtils.hasRole('VENDOR-RATES_UPDATE_ALL', userRoles)
        : rolesUtils.hasRole('VENDOR-RATES_CREATE_ALL', userRoles);
      if (!canSaveRate) {
        throw new Error('User doesn\'t have enough permissions to save vendor rate');
      }
      const query = {
        lsp: convertToObjectId(this.lspId),
        _id: convertToObjectId(userId),
      };
      const dbUser = await this.schema.User.findOneWithDeleted(query, 'vendorDetails.rates').lean();
      const rates = _.get(dbUser, 'vendorDetails.rates', []);
      delete rate.updatedAt;
      delete rate.createdAt;
      rate.isDrafted = false;
      if (!isNewRate) {
        const rateIndex = rates.findIndex((r) => areObjectIdsEqual(r._id, rate._id));
        const ratesToCompare = rates.filter((r) => !areObjectIdsEqual(r._id, rate._id));
        const hasDuplicates = rateIsDuplicate(rate, ratesToCompare);
        if (hasDuplicates) throw new Error('Rate cannot be saved because it is duplicated');
        rates[rateIndex] = rate;
        await this.schema.User.findOneAndUpdateWithDeleted(query, {
          $set: {
            'vendorDetails.rates': rates,
          },
        });
        return {};
      }
      const hasDuplicates = rateIsDuplicate(rate, rates);
      if (hasDuplicates) throw new Error('Rate cannot be saved because it is duplicated');
      await this.schema.User.findOneAndUpdateWithDeleted(query, {
        $push: {
          'vendorDetails.rates': {
            $each: [rate],
            $position: 0,
          },
        },
      });
      return {};
    } catch (error) {
      const { message } = error;
      this.logger.error(`Error: ${message}`);
      throw new RestError(500, { message, stack: error.stack });
    }
  }

  async draftVendorRate(filters) {
    if (_.isNil(filters.userId)) {
      throw new RestError(400, { message: 'Invalid user id' });
    }
    if (_.isNil(filters.rate)) {
      throw new RestError(400, { message: 'There\'s no rate to draft' });
    }
    const { userId, rate } = filters;
    const userRoles = rolesUtils.getRoles(this.user);
    try {
      const isNewRate = !rate._id || _.isEmpty(rate._id);
      const canSaveRate = !isNewRate
        ? rolesUtils.hasRole('VENDOR-RATES_UPDATE_ALL', userRoles)
        : rolesUtils.hasRole('VENDOR-RATES_CREATE_ALL', userRoles);
      if (!canSaveRate) {
        throw new Error('User doesn\'t have enough permissions to save vendor rate');
      }
      const query = {
        lsp: convertToObjectId(this.lspId),
        _id: convertToObjectId(userId),
      };
      rate.isDrafted = true;
      if (!isNewRate) {
        const arrayFilters = [{ 'rate._id': convertToObjectId(rate._id) }];
        await this.schema.User.findOneAndUpdateWithDeleted(query, {
          $set: {
            'vendorDetails.rates.$[rate]': rate,
          },
        }, { arrayFilters });
        return {};
      }
      await this.schema.User.findOneAndUpdateWithDeleted(query, {
        $push: {
          'vendorDetails.rates': {
            $each: [rate],
            $position: 0,
          },
        },
      });
      return {};
    } catch (error) {
      const { message } = error;
      this.logger.error(`Error: ${message}`);
      throw new RestError(500, { message, stack: error.stack });
    }
  }

  async pasteVendorRate(filters) {
    if (_.isNil(filters.userId)) {
      throw new RestError(400, { message: 'Invalid user id' });
    }
    if (_.isNil(filters.rates)) {
      throw new RestError(400, { message: 'There\'re no rates to be pasted' });
    }
    const { userId, rates: newRates } = filters;
    const userRoles = rolesUtils.getRoles(this.user);
    try {
      const canPasteRates = rolesUtils.hasRole('VENDOR-RATES_CREATE_ALL', userRoles);
      if (!canPasteRates) {
        throw new Error('User doesn\'t have enough permissions to paste vendor rates');
      }
      const query = {
        lsp: convertToObjectId(this.lspId),
        _id: convertToObjectId(userId),
      };
      const dbUser = await this.schema.User.findOneWithDeleted(query, {
        'vendorDetails.rates': 1,
        'vendorDetails.internalDepartments': 1,
        abilities: 1,
        languageCombinations: 1,
        catTools: 1,
      }).populate('vendorDetails.internalDepartments').lean();
      const dbRates = _.get(dbUser, 'vendorDetails.rates', []);
      const userAbilities = _.get(dbUser, 'abilities', []);
      const userDepartments = _.get(dbUser, 'vendorDetails.internalDepartments', [])
        .map((d) => d.name);
      const userLanguageCombinations = _.get(dbUser, 'languageCombinations', []);
      const userCatTools = _.get(dbUser, 'catTools', []);
      newRates.forEach((rate) => {
        delete rate._id;
        rate.isDrafted = rateIsDuplicate(rate, dbRates);
        const validateRate = (userFields, rateField, callback) => {
          if (_.isNil(rateField) || _.isEmpty(rateField)) return;
          if (!userFields.includes(rateField)) {
            callback();
            rate.isDrafted = true;
          }
        };
        const rateAbility = _.get(rate, 'ability.name', '');
        validateRate(userAbilities, rateAbility, () => {
          delete rate.ability;
        });
        const rateCatTool = _.get(rate, 'catTool', '');
        validateRate(userCatTools, rateCatTool, () => {
          delete rate.catTool;
        });
        const rateDepartment = _.get(rate, 'internalDepartment.name', '');
        validateRate(userDepartments, rateDepartment, () => {
          delete rate.internalDepartment;
        });
        const rateSourceLanguage = _.get(rate, 'sourceLanguage.name', '');
        const rateTargetLanguage = _.get(rate, 'targetLanguage.name', '');
        if (_.isEmpty(rateSourceLanguage) || _.isEmpty(rateTargetLanguage)) return;
        const rateLanguageCombination = `${rateSourceLanguage} - ${rateTargetLanguage}`;
        validateRate(userLanguageCombinations, rateLanguageCombination, () => {
          delete rate.sourceLanguage;
          delete rate.targetLanguage;
        });
      });
      await this.schema.User.findOneAndUpdateWithDeleted(query, {
        $push: {
          'vendorDetails.rates': {
            $each: newRates,
            $position: 0,
          },
        },
      });
      return {
        message: 'Some entities were duplicated so the system marked them as drafts',
      };
    } catch (error) {
      const { message } = error;
      this.logger.error(`Error: ${message}`);
      throw new RestError(500, { message, stack: error.stack });
    }
  }

  async deleteVendorRates(filters) {
    if (_.isNil(filters.userId)) {
      throw new RestError(400, { message: 'Invalid user id' });
    }
    if (_.isNil(filters.rates)) {
      throw new RestError(400, { message: 'There\'re no rates to be deleted' });
    }
    const { userId, rates: ratesToDelete } = filters;
    const userRoles = rolesUtils.getRoles(this.user);
    try {
      const canDeleteRates = rolesUtils.hasRole('VENDOR-RATES_UPDATE_ALL', userRoles);
      if (!canDeleteRates) {
        throw new Error('User doesn\'t have enough permissions to delete vendor rates');
      }
      const query = {
        lsp: convertToObjectId(this.lspId),
        _id: convertToObjectId(userId),
      };
      await this.schema.User.findOneAndUpdateWithDeleted(query, {
        $pull: {
          'vendorDetails.rates': {
            _id: { $in: ratesToDelete },
          },
        },
      });
      return {};
    } catch (error) {
      const { message } = error;
      this.logger.error(`Error: ${message}`);
      throw new RestError(500, { message, stack: error.stack });
    }
  }

  async getDuplicateVendorRates(filters) {
    const { userId } = filters;
    const userRoles = rolesUtils.getRoles(this.user);
    try {
      const canReadRates = rolesUtils.hasRole('VENDOR-RATES_READ_ALL', userRoles);
      if (!canReadRates) {
        throw new Error('User doesn\'t have enough permissions to read vendor rates');
      }
      const query = {
        lsp: convertToObjectId(this.lspId),
        _id: convertToObjectId(userId),
      };
      const dbUser = await this.schema.User.findOneWithDeleted(query, 'vendorDetails.rates')
        .lean();
      const rates = _.get(dbUser, 'vendorDetails.rates', []);
      return rates.filter((rate, index) => {
        const ratesToCompareWith = rates.slice(index + 1);
        return rateIsDuplicate(rate, ratesToCompareWith);
      }).map((rate) => rate._id);
    } catch (error) {
      const { message } = error;
      this.logger.error(`Error: ${message}`);
      throw new RestError(500, { message, stack: error.stack });
    }
  }

  async testRateIsDuplicate(filters) {
    if (_.isNil(filters.userId)) {
      throw new RestError(400, { message: 'Invalid user id' });
    }
    const { userId } = filters;
    const userRoles = rolesUtils.getRoles(this.user);
    try {
      const canReadRates = rolesUtils.hasRole('VENDOR-RATES_READ_ALL', userRoles);
      if (!canReadRates) {
        throw new Error('User doesn\'t have enough permissions to read vendor rates');
      }
      const query = {
        lsp: convertToObjectId(this.lspId),
        _id: convertToObjectId(userId),
      };
      const dbUser = await this.schema.User.findOneWithDeleted(query, 'vendorDetails.rates').lean();
      const rates = _.get(dbUser, 'vendorDetails.rates', []);
      const ratesToCompareWith = rates
        .filter((rate) => !areObjectIdsEqual(rate._id, filters.rate._id));
      return rateIsDuplicate(filters.rate, ratesToCompareWith);
    } catch (error) {
      const { message } = error;
      this.logger.error(`Error: ${message}`);
      throw new RestError(500, { message, stack: error.stack });
    }
  }

  shouldVendorSync(user) {
    const isProduction = NODE_ENV === 'PROD';
    if (
      user.type !== VENDOR_USER_TYPE
      || (!isProduction && this.mock)
    ) {
      return true;
    }
    if (!isProduction) {
      VENDOR_FIELDS_TO_TRIGGER_SYNC.push('vendorDetails.hiringDocuments');
    }
    return _.get(user, 'modifications', []).some((field) => VENDOR_FIELDS_TO_TRIGGER_SYNC.includes(field));
  }

  async saveTimezone(timezone, sessionId) {
    if (!moment.tz.names().includes(timezone)) {
      throw new Error(`There are no such timezone "${timezone}"`);
    }
    const tzRecord = { value: timezone, isAutoDetected: false };
    await this.schema.User.updateOne(
      { _id: this.user._id, 'userSessions.sessionId': sessionId },
      { $set: { 'userSessions.$.timeZone': tzRecord, lastTimeZone: tzRecord } },
    );
  }
}

module.exports = UserAPI;
