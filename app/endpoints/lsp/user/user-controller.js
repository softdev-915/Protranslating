const _ = require('lodash');
const Promise = require('bluebird');
const { Types: { ObjectId }, isValidObjectId } = require('mongoose');
const { models: mongooseSchema } = require('../../../components/database/mongo');
const { createUserToastForNewUser } = require('./user-api-helper');
const requestUtils = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');
const configuration = require('../../../components/configuration');
const CloudStorage = require('../../../components/cloud-storage');
const UserAPI = require('./user-api');
const ProviderAPI = require('./provider-api');
const TaskAPI = require('../task/task-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const AuthCredentialsApi = require('../../auth/auth-credentials-api');
const SiConnectorAPI = require('../../../connectors/si/si-connector-api');
const BillAPI = require('../bill/bill-api');

const {
  fileContentDisposition, sendResponse, streamFile, RestError,
} = apiResponse;
const providerParamsExtractor = (req) => {
  const userFilters = {};
  const lspId = _.get(req, 'swagger.params.lspId.value');
  const requestId = _.get(req, 'swagger.params.requestId.value');

  if (requestId) {
    if (isValidObjectId(requestId)) {
      userFilters.requestId = new ObjectId(requestId);
    } else {
      throw new RestError(400, { message: `Invalid value for requestId: ${requestId}` });
    }
  }
  const workflowProviderTaskId = _.get(req, 'swagger.params.workflowProviderTaskId.value');

  if (workflowProviderTaskId) {
    const [workflowId, taskId, providerTaskId] = mongooseSchema.ProviderPool.disassemblyWorkflowTask(workflowProviderTaskId);

    if (isValidObjectId(workflowId)) {
      userFilters.workflowId = new ObjectId(workflowId);
    } else {
      throw new RestError(400, { message: `Invalid value for workflowId: ${workflowId}` });
    }
    if (isValidObjectId(taskId)) {
      userFilters.taskId = new ObjectId(taskId);
    } else {
      throw new RestError(400, { message: `Invalid value for taskId: ${taskId}` });
    }
    if (isValidObjectId(providerTaskId)) {
      userFilters.providerTaskId = new ObjectId(providerTaskId);
    } else {
      throw new RestError(400, { message: `Invalid value for providerTaskId: ${providerTaskId}` });
    }
  }
  userFilters.name = _.get(req, 'swagger.params.name.value');
  userFilters.ability = _.get(req, 'swagger.params.ability.value');
  userFilters.company = _.get(req, 'swagger.params.company.value');
  userFilters.schedulingCompany = _.get(req, 'swagger.params.schedulingCompany.value');
  userFilters.catTool = _.get(req, 'swagger.params.catTool.value');
  userFilters.language = _.get(req, 'swagger.params.language.value');
  userFilters.sourceLanguage = _.get(req, 'swagger.params.sourceLanguage.value');
  userFilters.targetLanguage = _.get(req, 'swagger.params.targetLanguage.value');
  userFilters.competenceLevels = _.get(req, 'swagger.params.competenceLevels.value');
  userFilters.deleted = _.get(req, 'swagger.params.deleted.value');
  if (_.isString(_.get(req, 'swagger.params.isSynced.value'))) {
    userFilters.isSynced = _.get(req, 'swagger.params.isSynced.value');
  }
  userFilters.terminated = _.get(req, 'swagger.params.terminated.value');
  userFilters.type = _.get(req, 'swagger.params.type.value');
  userFilters.limit = _.get(req, 'swagger.params.limit.value', 10);
  userFilters.skip = _.get(req, 'swagger.params.skip.value', 0);
  userFilters._id = _.get(req, 'swagger.params._id.value');
  userFilters.excludedProvidersAreExcluded = _.get(req, 'swagger.params.excludedProvidersAreExcluded.value');
  return { lspId, userFilters };
};

module.exports = {
  // used request-provider-controller
  providerParamsExtractor,
  async userExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new UserAPI(req.$logger, { user, configuration });
    const tz = _.get(req.session, 'lmsTz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'userExport', req });
    const file = await paginableApiDecorator.list(filters);

    streamFile(res, file);
  },
  async userList(req, res) {
    let response;
    const userFilters = {};
    const user = requestUtils.getUserFromSession(req);
    const userId = _.get(req, 'swagger.params.userId.value');
    const aggregate = _.get(req, 'swagger.params.aggregate.value');
    const informalType = _.get(req, 'swagger.params.informalType.value');
    const withDeleted = _.get(req, 'swagger.params.withDeleted.value');
    const attributes = _.get(req, 'swagger.params.attributes.value');
    const columns = _.get(req, 'swagger.params.columns.value');

    userFilters.type = _.get(req, 'swagger.params.type.value');
    if (userId) {
      userFilters._id = userId;
    }
    const tz = _.get(req.headers, 'lms-tz', '0');

    userFilters.__tz = tz;
    userFilters.columns = columns;
    const userAPI = new UserAPI(req.$logger, { user, configuration, mock: req.flags.mock });
    let users;
    if (aggregate === false) {
      users = await userAPI.nonPaginatedList({
        userId, informalType, withDeleted, attributes,
      });
    } else {
      const paginableApiDecorator = new PaginableAPIDecorator(userAPI, req, { listMethod: 'userList' });

      users = await paginableApiDecorator.list(userFilters);
    }
    if (userId) {
      if (users && users.length) {
        response = {
          user: users[0],
        };
      } else {
        throw new RestError(404, { message: `User ${userId} does not exist` });
      }
    } else {
      response = {
        list: users,
        total: users.length,
      };
    }
    return sendResponse(res, 200, response);
  },
  async updateProfileImage(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const file = _.get(req, 'swagger.params.data.value');
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userAPI = new UserAPI(req.$logger, {
      user,
      configuration,
      lspId,
      mock: req.flags.mock,
    });

    try {
      await userAPI.updateProfileImage(file.image);
    } catch (error) {
      throw new RestError(_.get(error, 'code', 500), { data: _.get(error, 'data'), message: _.get(error, 'message', 'User edition failed') });
    }
    return sendResponse(res, 200);
  },
  async providerList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const { lspId, userFilters } = providerParamsExtractor(req);

    if (!user.lsp) {
      throw new RestError(403, { message: `User has no access to lsp ${lspId}` });
    }
    const providerAPI = new ProviderAPI(req.$logger, {
      user,
      configuration,
    });
    const listData = await providerAPI.providerList(userFilters);
    return sendResponse(res, 200, listData);
  },
  async changePassword(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const { password, newPassword, repeatPassword } = _.get(req, 'swagger.params.data.value');
    const newPassConfig = {
      password,
      newPassword,
      repeatPassword,
    };
    const userAPI = new UserAPI(req.$logger, { user, configuration, mock: req.flags.mock });
    try {
      await userAPI.changePassword(user, newPassConfig);
    } catch (error) {
      throw new RestError(500, error);
    }
    return res.sendStatus(201);
  },

  async userCreate(req, res) {
    const {
      mock,
      shouldMockSiSyncFail,
      syncEntityOnCreation = true,
      shouldMockSiUserSyncFail,
      shouldMockSiDisabled,
      mockServerTime,
    } = req.flags;
    const { NODE_ENV } = configuration.environment;
    const isProd = NODE_ENV === 'PROD';
    const user = requestUtils.getUserFromSession(req);
    const newUser = _.get(req, 'swagger.params.data.value');
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userAPI = new UserAPI(
      req.$logger,
      {
        user, configuration, lspId, mock, shouldMockSiUserSyncFail,
      },
    );
    const siAPI = new SiConnectorAPI({
      mock,
      shouldMockSiSyncFail,
      shouldMockSiDisabled,
      mockServerTime,
    });
    try {
      const userCreated = await userAPI.userCreate(newUser);

      await createUserToastForNewUser(userAPI.schema, userCreated);
      return sendResponse(res, 200, { user: userCreated.userInAccount })
        .then(() => {
          if (syncEntityOnCreation || isProd) {
            return siAPI.syncUsers({ _id: userCreated.user._id });
          }
        });
    } catch (error) {
      const message = error.message || error;

      req.$logger.warn(`Error creating user toast for user. Error ${error}`);
      throw new RestError(_.get(error, 'code', 500), {
        message,
        stack: error.stack,
      });
    }
  },

  async userEditUiSettings(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const userUiSettings = _.get(req, 'swagger.params.data.value');
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userAPI = new UserAPI(req.$logger, {
      user,
      configuration,
      lspId,
      mock: _.get(req, 'flags.mock'),
    });
    const uiSettings = await userAPI.userEditUiSettings(userUiSettings);

    user.uiSettings = uiSettings;
    return sendResponse(res, 200, { uiSettings });
  },

  async userEdit(req, res) {
    const {
      mock,
      mockServerTime,
      shouldMockSiSyncFail,
      syncEntityOnCreation = true,
      shouldMockSiUserSyncFail,
      shouldMockSiAuthFail,
      shouldMockSiDisabled,
    } = req.flags;
    const user = requestUtils.getUserFromSession(req);
    const userToEdit = _.get(req, 'swagger.params.data.value');
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userAPI = new UserAPI(req.$logger, {
      user,
      configuration,
      lspId,
      mock,
      shouldMockSiUserSyncFail,
    });
    const siAPI = new SiConnectorAPI({
      mock,
      shouldMockSiSyncFail,
      shouldMockSiAuthFail,
      shouldMockSiUserSyncFail,
      shouldMockSiDisabled,
      mockServerTime,
    });
    let editedUser;

    try {
      editedUser = await userAPI.userEdit(userToEdit);
    } catch (error) {
      req.$logger.error(`Error serving zip file. Error: ${error}`);
      throw new RestError(_.get(error, 'code', 500), { data: _.get(error, 'data'), message: _.get(error, 'message', 'User edition failed') });
    }
    return sendResponse(res, 200, { user: editedUser.userInAccount })
      .then(() => {
        if (!syncEntityOnCreation) {
          return Promise.resolve();
        }
        if (editedUser.shouldUserSync) {
          return siAPI.syncUsers({ _id: editedUser.user._id });
        }
      });
  },

  async serveFile(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userId = _.get(req, 'swagger.params.userId.value');
    const documentId = _.get(req, 'swagger.params.documentId.value');
    const userAPI = new UserAPI(req.$logger, { user, configuration, lspId });
    const file = await userAPI.buildUserDocumentFilePath(userId, documentId, true);

    res.setHeader('Content-Disposition', fileContentDisposition(file.name));
    const cloudStorage = new CloudStorage(configuration);

    try {
      const cloudFile = await cloudStorage.gcsGetFile(file.path);

      cloudFile.createReadStream().pipe(res);
    } catch (error) {
      throw new RestError(404, { message: 'The file does not exist', stack: error.stack });
    }
  },
  async serveFilesZip(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userId = _.get(req, 'swagger.params.userId.value');
    const api = new UserAPI(req.$logger, { user, configuration, lspId });

    try {
      await api.zipFilesStream(user, userId, res);
    } catch (e) {
      const message = e.message || e;

      req.$logger.error(`Error serving zip file. Error: ${message}`);
      throw new RestError(500, { message: 'Error building zip file', stack: e.stack });
    }
  },
  async averageVendorRate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userAPI = new UserAPI(req.$logger, {
      user,
      configuration,
      lspId,
      mock: req.flags.mock,
    });
    const filters = {
      ability: _.get(req, 'swagger.params.ability.value'),
      breakdown: _.get(req, 'swagger.params.breakdown.value'),
      catTool: _.get(req, 'swagger.params.catTool.value'),
      sourceLanguage: _.get(req, 'swagger.params.sourceLanguage.value'),
      targetLanguage: _.get(req, 'swagger.params.targetLanguage.value'),
      translationUnit: _.get(req, 'swagger.params.translationUnit.value'),
      internalDepartment: _.get(req, 'swagger.params.internalDepartment.value'),
    };
    const averageVendorRate = await userAPI.averageVendorRate(filters);
    return sendResponse(res, 200, { averageVendorRate });
  },
  async retrieve2FADataURL(req, res) {
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const user = requestUtils.getUserFromSession(req);
    const authCredentialsApi = new AuthCredentialsApi({ logger: req.$logger });

    try {
      const dataURL = await authCredentialsApi.retrieve2FADataURL({ lspId, email: user.email });
      return sendResponse(res, 200, { dataURL });
    } catch (err) {
      const message = _.get(err, 'message', err);

      req.$logger.error(`Error retrieving OTP Auth URL. Error: ${message}`);
      throw new RestError(403, { message: 'Two-Factor Authentication is not available for this user', stack: err.stack });
    }
  },
  async toggle2FAState(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const { hotp, email } = _.get(req, 'swagger.params.credentials.value');
    const action = _.get(req, 'swagger.params.action.value');
    let state = false;

    try {
      if (action === 'enable') {
        state = true;
        const authCredentialsApi = new AuthCredentialsApi({
          logger: req.$logger,
          mock: req.flags.mock,
        });
        const verified = await authCredentialsApi.verifyHOTP({ email, lspId }, hotp);

        if (!verified) {
          throw new RestError(401, { message: 'Invalid code' });
        }
      }
      const userAPI = new UserAPI(req.$logger, { user, configuration, mock: req.flags.mock });

      await userAPI.toggle2FAState({ email, lsp: lspId }, state);
      if (user.email === email && lspId === _.get(user, 'lsp._id')) {
        _.set(req, 'session.user.useTwoFactorAuthentification', state);
      }
      return sendResponse(res, 200);
    } catch (err) {
      const message = _.get(err, 'message', err);

      req.$logger.error(`Failed to change 2FA state. Error: ${message}`);
      throw new RestError(401, { message: _.get(err, 'message', 'Failed to change 2FA state'), stack: err.stack });
    }
  },
  async retrieveVendorDashboardData(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    const dateFilterTotalAmountPosted = _.get(req, 'swagger.params.dateFilterTotalAmountPosted.value');
    const dateFilterTotalAmountPaid = _.get(req, 'swagger.params.dateFilterTotalAmountPaid.value');
    const taskAPI = new TaskAPI({
      user,
      log: req.$logger,
      configuration,
      mock: req.flags.mock,
    });
    const billAPI = new BillAPI({
      log: req.$logger,
      configuration,
      user,
    });
    const userAPI = new UserAPI(req.$logger, { user, configuration, mock: req.flags.mock });
    try {
      const [vendorTasksCount, totalAmounts, totalBalanceAmount] = await Promise.all([
        taskAPI.retrieveVendorTasksCount(),
        billAPI.retrieveVendorTotalAmounts(
          dateFilterTotalAmountPosted,
          dateFilterTotalAmountPaid,
          tz,
        ),
        userAPI.retrieveVendorTotalBalance(),
      ]);
      return sendResponse(res, 200, {
        ...vendorTasksCount,
        ...totalAmounts,
        totalBalanceAmount,
      });
    } catch (err) {
      const message = _.get(err, 'message', err);
      req.$logger.error(`Error retrieving vendor dashboard data. Error: ${message}`);
      throw new RestError(500, { message: _.get(err, 'message', 'Error retrieving vendor dashboard data'), stack: err.stack });
    }
  },
  async getRequestKpiData(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const userAPI = new UserAPI(req.$logger, { user, configuration, mock: req.flags.mock });
    try {
      const contactRequestsData = await userAPI.retrieveContactRequestsData();
      return sendResponse(res, 200, contactRequestsData);
    } catch (err) {
      const message = _.get(err, 'message', err);
      req.$logger.error(`Error retrieving contact dashboard data. Error: ${message}`);
      throw new RestError(500, { message: _.get(err, 'message', 'Error retrieving request KPI data'), stack: err.stack });
    }
  },

  async getInvoiceKpiData(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const userAPI = new UserAPI(req.$logger, { user, configuration, mock: req.flags.mock });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const datePeriod = _.get(req, 'swagger.params.datePeriod.value');
    const limit = _.get(req, 'swagger.params.limit.value');
    const page = _.get(req, 'swagger.params.page.value');
    try {
      const contactInvoicesData = await userAPI.retrieveContactInvoicesData(
        datePeriod,
        tz,
        { limit, page },
      );
      return sendResponse(res, 200, contactInvoicesData);
    } catch (err) {
      const message = _.get(err, 'message', err);
      req.$logger.error(`Error retrieving contact dashboard data. Error: ${message}`);
      throw new RestError(500, { message: _.get(err, 'message', 'Error retrieving contact dashboard data'), stack: err.stack });
    }
  },

  async getLanguageKpiData(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const userAPI = new UserAPI(req.$logger, { user, configuration, mock: req.flags.mock });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const sourceLanguage = _.get(req, 'swagger.params.sourceLanguage.value');
    const targetLanguage = _.get(req, 'swagger.params.targetLanguage.value');
    const datePeriod = _.get(req, 'swagger.params.datePeriod.value');
    const limit = _.get(req, 'swagger.params.limit.value');
    const page = _.get(req, 'swagger.params.page.value');
    try {
      const contactLanguagesData = await userAPI.retrieveContactLanguagesData(
        sourceLanguage,
        targetLanguage,
        datePeriod,
        tz,
        { limit, page },
      );
      return sendResponse(res, 200, contactLanguagesData);
    } catch (err) {
      const message = _.get(err, 'message', err);
      req.$logger.error(`Error retrieving contact dashboard data. Error: ${message}`);
      throw new RestError(500, { message: _.get(err, 'message', 'Error retrieving contact dashboard data'), stack: err.stack });
    }
  },
  async getUserIdByEmail(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userAPI = new UserAPI(req.$logger, {
      user,
      configuration,
      lspId,
      mock: req.flags.mock,
    });
    const email = _.get(req, 'swagger.params.email.value');
    try {
      const existingUserId = await userAPI.getUserIdByEmail({ email, lspId });
      if (_.isNil(existingUserId)) throw new RestError(404, { message: 'User not found' });
      return sendResponse(res, 200, { userId: existingUserId });
    } catch (err) {
      req.$logger.error(`Failed to get user by email: ${err}`);
      throw new RestError(500, { message: err.message || err });
    }
  },
  async getVendorRates(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userAPI = new UserAPI(req.$logger, {
      user,
      configuration,
      lspId,
      mock: req.flags.mock,
    });
    const filters = {
      userId: _.get(req, 'swagger.params.userId.value'),
      shouldDropDrafts: _.get(req, 'swagger.params.shouldDropDrafts.value'),
    };
    const rates = await userAPI.getVendorRates(filters);
    return sendResponse(res, 200, { rates });
  },
  async testRateIsDuplicate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userAPI = new UserAPI(req.$logger, {
      user,
      configuration,
      lspId,
      mock: req.flags.mock,
    });
    const filters = {
      userId: _.get(req, 'swagger.params.userId.value'),
      rate: _.get(req, 'swagger.params.rate.value'),
    };
    const isDuplicate = await userAPI.testRateIsDuplicate(filters);
    return sendResponse(res, 200, { isDuplicate });
  },
  async getDuplicatedVendorRates(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userAPI = new UserAPI(req.$logger, {
      user,
      configuration,
      lspId,
      mock: req.flags.mock,
    });
    const filters = {
      userId: _.get(req, 'swagger.params.userId.value'),
    };
    const rates = await userAPI.getDuplicateVendorRates(filters);
    return sendResponse(res, 200, { rates });
  },
  async saveVendorRate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userAPI = new UserAPI(req.$logger, {
      user,
      configuration,
      lspId,
      mock: req.flags.mock,
    });
    const filters = {
      userId: _.get(req, 'swagger.params.userId.value'),
      rate: _.get(req, 'swagger.params.rate.value'),
    };
    try {
      const rates = await userAPI.saveVendorRate(filters);
      return sendResponse(res, 200, { rates });
    } catch (error) {
      const message = error.message || error;
      req.$logger.error(`Failed to save a rate: ${message}`);
      throw new RestError(500, { message });
    }
  },
  async draftVendorRate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userAPI = new UserAPI(req.$logger, {
      user,
      configuration,
      lspId,
      mock: req.flags.mock,
    });
    const filters = {
      userId: _.get(req, 'swagger.params.userId.value'),
      rate: _.get(req, 'swagger.params.rate.value'),
    };
    try {
      const rates = await userAPI.draftVendorRate(filters);
      return sendResponse(res, 200, { rates });
    } catch (error) {
      req.$logger.error(`Failed to draft a rate: ${error}`);
      throw new RestError(500, { message: error.message || error });
    }
  },
  async pasteVendorRates(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userAPI = new UserAPI(req.$logger, {
      user,
      configuration,
      lspId,
      mock: req.flags.mock,
    });
    const filters = {
      userId: _.get(req, 'swagger.params.userId.value'),
      rates: _.get(req, 'swagger.params.rates.value'),
    };
    try {
      const rates = await userAPI.pasteVendorRate(filters);
      return sendResponse(res, 200, { rates });
    } catch (error) {
      req.$logger.error(`Failed to paste vendor rates: ${error}`);
      throw new RestError(500, { message: error.message || error });
    }
  },
  async deleteVendorRates(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const userAPI = new UserAPI(req.$logger, {
      user,
      configuration,
      lspId,
      mock: req.flags.mock,
    });
    const filters = {
      userId: _.get(req, 'swagger.params.userId.value'),
      rates: _.get(req, 'swagger.params.rates.value'),
    };
    try {
      const rates = await userAPI.deleteVendorRates(filters);
      return sendResponse(res, 200, { rates });
    } catch (error) {
      req.$logger.error(`Failed to delete vendor rates: ${error}`);
      throw new RestError(500, { message: error.message || error });
    }
  },

  async updateTimezone(req, res) {
    try {
      const user = requestUtils.getUserFromSession(req);
      const api = new UserAPI(req.$logger, { user, configuration });
      const timezone = _.get(req, 'swagger.params.data.value.timezone');
      await api.saveTimezone(timezone, req.sessionID);
      _.set(req, 'session.user.timeZone', { value: timezone, isAutoDetected: false });
      return sendResponse(res, 200);
    } catch (error) {
      req.$logger.error(`Failed to save timezone for the user: ${error}`);
      throw new RestError(500, { message: error.message || error });
    }
  },
};
