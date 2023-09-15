const _ = require('lodash');
const Promise = require('bluebird');
const { isValidObjectId } = require('mongoose');
const { RestError } = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const UserApi = require('../user/user-api');
const {
  buildOfferDetailsAggregation,
  includesIso,
  buildProviderGridPipelines,
  getPoolingOfferNotificationsPipelines,
  getPoolingOfferNotificationsPipelinesWithoutPagination,
  buildProviderOffersAggregationPipelines,
  getProviderMatchingRateDetail,
} = require('./provider-pooling-offer-helpers');
const { provideTransaction } = require('../../../components/database/mongo/utils');
const { convertToObjectId, areObjectIdsEqual } = require('../../../utils/schema');
const { exportFactory } = require('../../../utils/pagination');
const { getRoles, hasRole } = require('../../../utils/roles');
const { CsvExport } = require('../../../utils/csvExporter');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const configuration = require('../../../components/configuration');
const ProviderPoolingOfferScheduler = require('../../../components/scheduler/provider-pooling-offer');

const MAX_PROVIDERS_PER_ROUND_AMOUNT = 25;
const NOT_EDITABLE_PROPS = [
  'request',
  'workflowId',
  'abilityId',
  'taskId',
  'languageCombination',
  'filesAmount',
  'referenceAmount',
  'notifiedProviders',
  'providersQueue',
];

const POPULATION_OPTIONS = [
  { path: 'abilityId', select: 'name' },
];
const OFFER_STATUS_CLOSED = 'Closed';
const OFFER_STATUS_OPEN = 'Open';
const createRow = doc => ({
  ID: _.get(doc, 'offerId', ''),
  'Language Combination': _.get(doc, 'languageCombination', ''),
  'Notification Sent': _.get(doc, 'isNotificationSent', ''),
  'Notification Sent Date and Time': _.get(doc, 'createdAt', ''),
  'Round No.': _.get(doc, 'roundNo', ''),
  'Offer Status': _.get(doc, 'status', ''),
  'Provider Address': _.get(doc, 'providerAddress', ''),
  'Provider ID': _.get(doc, 'providerId', ''),
  'Provider Name': _.get(doc, 'providerName', ''),
  'Provider Rate': _.get(doc, 'providerRate', ''),
  'Provider Task': _.get(doc, 'providerTaskName', ''),
  'Provider Task ID': _.get(doc, 'abilityId', ''),
  'Reason for Declining': _.get(doc, 'decliningReason', ''),
  'Request No': _.get(doc, 'requestNo', ''),
  'Response Status': _.get(doc, 'responseStatus', ''),
  'Created at': _.get(doc, 'createdAt', ''),
  'Created by': _.get(doc, 'createdBy', ''),
  'Updated at': _.get(doc, 'updatedAt', ''),
  'Updated by': _.get(doc, 'updatedBy', ''),
  'Deleted at': _.get(doc, 'deletedAt', ''),
  'Deleted by': _.get(doc, 'deletedBy', ''),
  'Restored at': _.get(doc, 'restoredAt', ''),
  'Restored by': _.get(doc, 'restoredBy', ''),
});

class ProviderPoolingOfferApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.logger = logger;
    this.configuration = _.get(options, 'configuration');
    this.flags = _.get(options, 'flags');
    this.concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'providerPoolingOffer',
      entityPromise: _id => this.getById(_id),
    });
  }

  async list(filters) {
    const paginationParams = this._getPaginationParams(filters);
    const pipelines = getPoolingOfferNotificationsPipelines(paginationParams);
    const list = await this.schema.ProviderPoolingOffer.aggregate(pipelines);
    return { list, total: list.length };
  }

  async export(filters) {
    const query = this._getQueryFilters(filters);
    const cursor = await exportFactory(
      this.schema.ProviderPoolingOffer,
      query,
      getPoolingOfferNotificationsPipelinesWithoutPagination(query),
      [],
      filters.__tz,
    );
    const list = [];
    await cursor.eachAsync(async (doc) => {
      const row = createRow(doc);
      list.push(row);
    });
    const csvExporter = new CsvExport(list, {
      schema: this.schema.ProviderPoolingOffer,
      lspId: this.lspId,
      configuration,
      logger: this.logger,
      filters: { query },
    });
    return csvExporter.export();
  }

  async getById(_id) {
    const offer = await this.schema.ProviderPoolingOffer.findOne({
      _id,
      lspId: this.lspId,
    })
      .populate(POPULATION_OPTIONS);
    return offer;
  }

  async _getOffer(query) {
    const offer = await this.schema.ProviderPoolingOffer.findOne({
      ...query,
      lspId: this.lspId,
    })
      .populate([
        { path: 'abilityId' },
        { path: 'languageCombination.ids' },
      ]);
    return offer;
  }

  async findProviders(filters) {
    const paginationParams = this._getPaginationParams(filters);
    const { requestId,
      workflowId,
      taskId,
      maxRate,
      translationUnitId,
      breakdownId,
      offerId,
      selectedProviders = [] } = filters;
    const request = await this._getOfferTaskData(requestId, workflowId, taskId);
    const aggregationParams = {
      lspId: this.lspId,
      companyId: _.get(request, 'company._id'),
      currencyId: _.get(request, 'quoteCurrency._id'),
      breakdownId,
      translationUnitId,
      competenceLevels: request.competenceLevels,
      maxRate,
      onlyActive: _.get(filters, 'onlyActive', false),
      selectedProviders: selectedProviders.map(provider => convertToObjectId(provider)),
      nin: _.get(filters, 'nin', []),
    };
    if (!_.isEmpty(offerId)) {
      const offer = await this._getOffer({ _id: convertToObjectId(offerId) });
      const ability = _.get(offer, 'abilityId', {});
      aggregationParams.abilityName = ability.name;
      if (ability.languageCombination) {
        const languages = _.get(offer, 'languageCombination.ids', []);
        if (languages.length >= 2) {
          aggregationParams.srcIso = languages[0].isoCode;
          aggregationParams.tgtIso = languages[1].isoCode;
          aggregationParams.languageCombination = `${languages[0].name} - ${languages[1].name}`;
        }
      }
    } else {
      const abilityName = _.get(request, 'workflow.task.ability');
      aggregationParams.abilityName = abilityName;
      const ability = await this._getAbility(abilityName);
      if (ability.languageCombination) {
        aggregationParams.srcIso = _.get(request, 'workflow.srcLang.isoCode');
        aggregationParams.tgtIso = _.get(request, 'workflow.tgtLang.isoCode');
        if (!_.isEmpty(aggregationParams.srcIso) && !_.isEmpty(aggregationParams.tgtIso)) {
          const [srcLang, targetLang] = await Promise.all(
            [aggregationParams.srcIso, aggregationParams.tgtIso]
              .map(lang => this.schema.Language.findOne({ isoCode: lang })
                .lean(),
              ),
          );
          aggregationParams.languageCombination = `${srcLang.name} - ${targetLang.name}`;
        }
      }
    }
    const pipelines = buildProviderGridPipelines(aggregationParams, paginationParams);
    const list = await this.schema.User.aggregate(pipelines);
    return { list, length: list.length };
  }

  async getNewOfferData({ requestId, workflowId, taskId, providerTaskId }) {
    const request = await this._getOfferTaskData(requestId, workflowId, taskId);
    const [ability, languageCombination] = await Promise.all([
      this._getAbility(request.workflow.task.ability),
      this._buildLanguageCombination(
        request.workflow.srcLang.isoCode, request.workflow.tgtLang.isoCode,
      )],
    );

    const { referenceAmount, filesAmount } = this._countLanguageCombinationFiles(
      request.languageCombinations,
      request.workflow.srcLang.isoCode,
      request.workflow.tgtLang.isoCode,
    );
    const firstInvoiceDetail = _.get(request, 'workflow.task.invoiceDetails[0]', {});
    const translationUnitId = _.get(firstInvoiceDetail, 'invoice.translationUnit._id');
    const breakdownId = _.get(firstInvoiceDetail, 'projectedCost.breakdown._id');
    const providerTask = _.find(request.workflow.task.providerTasks,
      pTask => areObjectIdsEqual(pTask._id, providerTaskId));
    if (_.isEmpty(providerTask)) {
      throw new RestError(400, { message: `Provider task with id ${providerTaskId} is not found` });
    }
    const projectedCost = await this._getProjectedCost({
      ability,
      translationUnit: translationUnitId,
      internalDepartment: _.get(request, 'internalDepartment._id'),
      breakdownId,
      sourceLanguage: _.get(request.workflow, 'srcLang.name'),
      targetLanguage: _.get(request.workflow, 'tgtLang.name'),
    });
    const newOfferData = {
      request: _.pick(request, ['_id', 'no']),
      abilityId: _.pick(ability, ['_id', 'name']),
      languageCombination,
      translationUnitId,
      referenceAmount,
      filesAmount,
      providerTaskInstructions: providerTask.instructions,
      maxRate: projectedCost,
      dueDate: _.get(providerTask, 'taskDueDate'),
    };
    if (isValidObjectId(breakdownId)) {
      newOfferData.breakdownId = breakdownId;
    }
    return newOfferData;
  }

  async getOfferTask(requestId, workflowId, taskId) {
    const request = await this._getOfferTaskData(requestId, workflowId, taskId);
    const task = _.get(request, 'workflow.task', {});
    return task;
  }

  async create(data) {
    const { NODE_ENV } = this.configuration.environment;
    const isProd = NODE_ENV === 'PROD';
    if (!isProd) {
      const mock = _.get(this, 'flags.mock', false);
      Object.assign(data, { mock });
    }
    Object.assign(data, { lspId: this.lspId });
    this._adjustProvidersAmount(data);
    const newOffer = new this.schema.ProviderPoolingOffer(data);
    this._setupQueue(newOffer);
    await provideTransaction(async (session) => {
      await newOffer.save({ session });
      await this._updateOfferWorkflow(newOffer, session);
    });
    return { _id: newOffer._id };
  }

  async edit(data) {
    this._adjustProvidersAmount(data);
    const offer = await this.schema.ProviderPoolingOffer.findOne({ _id: data._id });
    if (_.isNil(offer)) {
      throw new RestError(400, { message: `Offer with id ${data._id} is not found` });
    }
    offer.safeAssign(_.omit(data, NOT_EDITABLE_PROPS));
    this._setupQueue(offer);
    await provideTransaction(async (session) => {
      await offer.save({ session });
      await this._updateOfferWorkflow(offer, session);
      await offer.populate(POPULATION_OPTIONS);
    });
    return offer;
  }

  async sendOffer(query) {
    const offer = await this.schema.ProviderPoolingOffer.findOne(query);
    if (_.isNil(offer)) {
      throw new RestError(400, { message: `Offer ${JSON.stringify(query)} is not found` });
    }
    if (offer.isActive) {
      throw new RestError(400, { message: 'Active offer can\'t be sent again' });
    }
    const currentProvidersAmount = offer.selectedProviders.length;
    const desiredProvidersAmount = offer.roundsNo * offer.providersPerRoundNo;
    const missingProvidersAmount = desiredProvidersAmount - currentProvidersAmount;

    if (missingProvidersAmount > 0) {
      const { list } = await this.findProviders({
        requestId: offer.request._id,
        workflowId: offer.workflowId,
        taskId: offer.taskId,
        translationUnitId: offer.translationUnitId,
        breakdownId: offer.breakdownId,
        maxRate: offer.maxRate,
        nin: offer.selectedProviders.map(p => p._id),
        onlyActive: true,
        paginationParams: {
          page: 1,
          sort: offer.sortBy,
          skip: 0,
          limit: missingProvidersAmount,
        },
      });
      offer.selectedProviders.push(...list.map(provider => _.pick(provider, ['_id', 'rate'])));
      offer.providersQueue.push(...list.map(provider => provider._id));
    }
    offer.isActive = true;
    await offer.save();
  }

  async getProviderOffers(providerId) {
    const providerObjectId = convertToObjectId(providerId);
    const provider = await this.schema.User.findOneWithDeleted({ _id: providerObjectId });
    const userRoles = getRoles(this.user);
    if (_.isNil(provider)) {
      throw new RestError(404, { message: `Provider ${providerId} is not found` });
    }
    const providerRoles = getRoles(provider);
    const canReadAllOffers = hasRole('OFFER_READ_ALL', userRoles);
    const canReadOwnOffers = hasRole('OFFER_READ_OWN', userRoles);
    const canReadOffers = canReadAllOffers || (canReadOwnOffers && providerId === this.user._id);
    const showOffersTable = hasRole('TASK-DASHBOARD_READ_OWN', providerRoles) && hasRole('TASK-DASHBOARD_READ_OWN', userRoles) && canReadOffers;
    let providerOffers = [];
    if (showOffersTable) {
      const aggregationPipelines = buildProviderOffersAggregationPipelines(providerObjectId);
      providerOffers = await this.schema.ProviderPoolingOffer.aggregate(aggregationPipelines);
    }
    return { showOffersTable, providerOffers };
  }

  async _assignProvider(query, user) {
    const { requestId, workflowId, taskId, providerTaskId } = query;
    const dbRequest =
      await this.schema.Request.findOne({ _id: convertToObjectId(requestId), lspId: this.lspId });
    if (_.isEmpty(dbRequest)) {
      return;
    }
    const workflow = dbRequest.workflows.find(w => areObjectIdsEqual(w._id, workflowId));
    if (_.isEmpty(workflow)) {
      return;
    }
    const task = workflow.tasks.find(t => areObjectIdsEqual(t._id, taskId));
    if (_.isEmpty(task)) {
      return;
    }
    const providerTask = task.providerTasks.find(pt => areObjectIdsEqual(pt._id, providerTaskId));
    if (_.isEmpty(providerTask)) {
      return;
    }
    const ability = _.get(task, 'ability', '');
    const sourceLanguage = _.get(workflow, 'srcLang.isoCode', '');
    const targetLanguage = _.get(workflow, 'tgtLang.isoCode', '');
    const company = _.get(dbRequest, 'company');
    const internalDepartment = _.get(dbRequest, 'internalDepartment');
    const catTool = _.get(dbRequest, 'catTool');
    const provider = {
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      deleted: user.deleted,
      terminated: user.terminated,
      flatRate: _.get(user, 'vendorDetails.billingInformation.flatRate', false),
    };
    providerTask.billDetails.forEach((billDetail) => {
      const filters = {
        ability,
        breakdown: _.get(billDetail, 'breakdown.name', ''),
        translationUnit: _.get(billDetail, 'translationUnit.name', ''),
        sourceLanguage,
        targetLanguage,
        company,
        internalDepartment,
        catTool,
      };
      const rateDetail = getProviderMatchingRateDetail(filters, user.vendorDetails.rates);
      billDetail.unitPrice = _.get(rateDetail, 'price', 0);
    });

    providerTask.provider = provider;
    await this.schema.Request.updateWorkflowTotals(dbRequest);
    await dbRequest.save();
  }

  async acceptOffer({ offerId, providerId, offerUpdatedAt }) {
    const offer = await this.schema.ProviderPoolingOffer.findById(offerId);
    this._validateProviderCanRespondToOffer({ offer, providerId, offerId });
    offer.acceptedBy = providerId;
    offer.status = OFFER_STATUS_CLOSED;
    offer.isActive = false;
    await this.concurrencyReadDateChecker.failIfEntityUpdated(offer._id, offerUpdatedAt);
    const user = await this.schema.User.findById(providerId);
    if (_.isNil(user)) {
      throw new RestError(400, { message: `Provider ${providerId} is not found` });
    }

    await provideTransaction(async (session) => {
      await offer.save({ session });
      const query = { requestId: offer.request._id,
        workflowId: offer.workflowId,
        taskId: offer.taskId,
        providerTaskId: offer.providerTaskId };
      await this._assignProvider(query, user);
      await offer.populate([
        { path: 'acceptedBy', select: 'firstName lastName' },
        { path: 'notifiedProviders', select: 'email', options: { withDeleted: true } },
        ...POPULATION_OPTIONS,
      ]);
    });
    const scheduler = new ProviderPoolingOfferScheduler(this.configuration, this.schema);
    await Promise.all([
      scheduler.sendAcceptedNotification(offer),
      scheduler.sendClosedNotification(offer),
    ]);
    // Assign the task to the provider that accepted the offer
  }
  async _unassignProvider({ requestId, workflowId, taskId, providerTaskId }, providerId) {
    const dbRequest =
      await this.schema.Request.findOne({ _id: convertToObjectId(requestId), lspId: this.lspId });
    if (_.isEmpty(dbRequest)) {
      return;
    }
    const workflow = dbRequest.workflows.find(w => areObjectIdsEqual(w._id, workflowId));
    if (_.isEmpty(workflow)) {
      return;
    }
    const task = workflow.tasks.find(t => areObjectIdsEqual(t._id, taskId));
    if (_.isEmpty(task)) {
      return;
    }
    const providerTask = task.providerTasks.find(pt => areObjectIdsEqual(pt._id, providerTaskId));
    if (_.isEmpty(providerTask)) {
      return;
    }
    if (areObjectIdsEqual(providerId, _.get(providerTask, 'provider._id'))) {
      providerTask.billDetails.forEach((billDetail) => {
        billDetail.unitPrice = 0;
      });
      providerTask.provider = null;
      await this.schema.Request.updateWorkflowTotals(dbRequest);
      await dbRequest.save();
    }
  }
  async undoOfferAccept({ offerId, providerId }) {
    const offer = await this.schema.ProviderPoolingOffer.findById(offerId);
    this._assertProviderCanUndoOfferOperation({ offer, providerId, offerId }, true);
    offer.acceptedBy = undefined;
    offer.status = OFFER_STATUS_OPEN;
    offer.isActive = true;
    await this.schema.ProviderPoolingOffer.updateOne({ _id: offerId }, {
      $set: {
        status: OFFER_STATUS_OPEN,
        isActive: true,
      },
      $unset: { acceptedBy: 1 },
    });
    const query = { requestId: offer.request._id,
      workflowId: offer.workflowId,
      taskId: offer.taskId,
      providerTaskId: offer.providerTaskId };
    await this._unassignProvider(query, providerId);
  }

  async declineOffer({ offerId, providerId, decliningReason, offerUpdatedAt }) {
    const offer = await this.schema.ProviderPoolingOffer.findById(offerId);
    this._validateProviderCanRespondToOffer({ offer, providerId, offerId });
    offer.declinedBy.push({ providerId, decliningReason });
    await this.concurrencyReadDateChecker.failIfEntityUpdated(offer._id, offerUpdatedAt);
    await offer.save();
  }

  async undoOfferDecline({ offerId, providerId }) {
    const offer = await this.schema.ProviderPoolingOffer.findById(offerId);
    this._assertProviderCanUndoOfferOperation({ offer, providerId, offerId }, false);
    offer.declinedBy = offer.declinedBy.filter(v => !areObjectIdsEqual(v.providerId, providerId));
    await offer.save();
  }

  async undoOfferOperation(data, accepted = true) {
    if (accepted) {
      await this.undoOfferAccept(data);
      return;
    }
    await this.undoOfferDecline(data);
  }

  async closeOffer(query) {
    await this.schema.ProviderPoolingOffer.updateOne(query, { $set: {
      isActive: false,
      status: OFFER_STATUS_CLOSED,
    } });
  }

  async _getOfferTaskData(requestId, workflowId, taskId) {
    const aggregationPipelines = buildOfferDetailsAggregation(requestId, workflowId, taskId);
    const [request] = await this.schema.Request.aggregate(aggregationPipelines);

    if (_.isNil(request)) {
      throw new RestError(404, { message: `PPO data could not be retrieved. Request ${requestId} is not found` });
    }
    if (_.isNil(request.workflow)) {
      throw new RestError(404, { message: `PPO data could not be retrieved. Workflow ${workflowId} is not found` });
    }
    if (_.isNil(request.workflow.task)) {
      throw new RestError(404, { message: `PPO data could not be retrieved. Task ${taskId} is not found` });
    }
    return request;
  }

  async _buildLanguageCombination(src, target) {
    const [srcLanguage, targetLanguage] = await Promise.all([src, target]
      .map(lang => this.schema.Language.findOne({ isoCode: lang })
        .lean(),
      ),
    );
    if (_.isNil(srcLanguage) && _.isNil(targetLanguage)) {
      return { ids: [], text: '' };
    }
    if (_.isNil(srcLanguage) || _.isNil(targetLanguage)) {
      throw new RestError(404, { message: 'PPO data could not be retrieved. Incorrect language combination' });
    }
    return {
      ids: [srcLanguage._id, targetLanguage._id],
      text: `${srcLanguage.name} - ${targetLanguage.name}`,
    };
  }

  async _getAbility(abilityName) {
    const ability = await this.schema.Ability.findOne({ name: abilityName, lspId: this.lspId })
      .lean();

    if (_.isNil(ability)) {
      throw new RestError(404, { message: 'PPO data could not be retrieved. Incorrect ability' });
    }
    return ability;
  }

  _setupQueue(offer) {
    offer.providersQueue = _.orderBy(offer.selectedProviders, ['rate'], ['asc'])
      .map(provider => provider._id)
      .filter(_id => !offer.notifiedProviders.includes(_id));
  }

  _countLanguageCombinationFiles(languageCombinations, srcIso, tgtIso) {
    let referenceAmount = 0;
    let filesAmount = 0;
    const langComb = languageCombinations
      .find(c => includesIso(c.srcLangs, srcIso) && includesIso(c.tgtLangs, tgtIso));
    const documents = _.get(langComb, 'documents');
    if (_.isArray(documents)) {
      referenceAmount = documents.filter(d => d.isReference && !d.isInternal).length;
      filesAmount = documents.filter(d => !d.isReference && !d.isInternal).length;
    }
    return { referenceAmount, filesAmount };
  }

  async _getProjectedCost({
    ability,
    translationUnit,
    internalDepartment,
    breakdownId,
    sourceLanguage,
    targetLanguage }) {
    const isDepartmentRequired = ability.internalDepartmentRequired;
    const isLanguageCombinationRequired = ability.languageCombination;
    const userApi = new UserApi(this.logger, {
      user: this.user, lspId: this.lspId, configuration: this.configuration,
    });

    const filters = {
      ability: ability.name,
      translationUnit,
    };
    if (isDepartmentRequired) {
      filters.internalDepartment = internalDepartment;
    }
    if (isValidObjectId(breakdownId)) {
      filters.breakdown = breakdownId;
    }

    if (isLanguageCombinationRequired) {
      _.assign(filters, { sourceLanguage, targetLanguage });
    }
    return userApi.averageVendorRate(filters);
  }

  _getPaginationParams(query) {
    const paginationParams = _.get(query, 'paginationParams', {});
    const filters = Object.assign({
      sort: 'rate',
      limit: 10,
      skip: 0,
    }, paginationParams);
    filters.skip = (filters.page - 1) * filters.limit;
    if (!_.isEmpty(filters.filter)) {
      filters.filter = JSON.parse(filters.filter);
    }
    return filters;
  }

  _getQueryFilters(filters) {
    const paginationParams = _.get(filters, 'paginationParams');
    return _.assign({}, { lspId: this.lspId }, paginationParams);
  }

  _updateOfferWorkflow(offer, session) {
    return this.schema.Request.updateOne(
      { _id: convertToObjectId(offer.request._id) },
      { $set: {
        'workflows.$[workflow].tasks.$[task].providerTasks.$[providerTask].offer': offer._id,
        'workflows.$[workflow].tasks.$[task].providerTasks.$[providerTask].taskDueDate': offer.dueDate,
      } },
      {
        session,
        arrayFilters: [
          { 'workflow._id': convertToObjectId(offer.workflowId) },
          { 'task._id': convertToObjectId(offer.taskId) },
          { 'providerTask._id': convertToObjectId(offer.providerTaskId) },
        ],
      },
    );
  }

  _adjustProvidersAmount(data) {
    if (data.selectedProviders.length === 0) {
      return;
    }

    data.providersPerRoundNo = data.selectedProviders.length > MAX_PROVIDERS_PER_ROUND_AMOUNT
      ? MAX_PROVIDERS_PER_ROUND_AMOUNT
      : data.selectedProviders.length;
  }

  _assertProviderCanUndoOfferOperation({ offer, providerId, offerId }, hasAccepted = true) {
    const userRoles = getRoles(this.user);
    const canUpdateAllOffers = hasRole('OFFER_UPDATE_ALL', userRoles);
    const canUpdateOwnOffers = hasRole('OFFER_UPDATE_OWN', userRoles);
    const canUpdateOffers = canUpdateAllOffers ||
      (canUpdateOwnOffers && providerId === this.user._id);
    const offerActionName = hasAccepted ? 'accept' : 'decline';
    if (!canUpdateOffers) {
      throw new RestError(403, { message: `User ${this.user._id} is not authorized to undo offer ${offerActionName} for ${providerId}` });
    }

    if (_.isNil(offer)) {
      throw new RestError(404, { message: `Offer ${offerId} is not found` });
    }
    if (offer.isActive === hasAccepted) {
      throw new RestError(403, { message: `Provider ${providerId} cannot undo offer ${offerActionName} of the offer ${offerId} that is not active` });
    }
    if (hasAccepted) {
      const isOfferAlreadyAccepted = areObjectIdsEqual(offer.acceptedBy, providerId);
      if (!isOfferAlreadyAccepted || offer.status !== OFFER_STATUS_CLOSED) {
        throw new RestError(403, { message: `Provider ${providerId} didn't accept the offer ${offerId}` });
      }
      return;
    }
    const isOfferAlreadyDeclined = offer.declinedBy
      .find(provider => areObjectIdsEqual(provider.providerId, providerId));
    if (!isOfferAlreadyDeclined) {
      throw new RestError(403, { message: `Provider ${providerId} didn't decline the offer ${offerId}` });
    }
  }

  _validateProviderCanRespondToOffer(data) {
    const { offer, providerId, offerId } = data;
    const userRoles = getRoles(this.user);
    const canUpdateAllOffers = hasRole('OFFER_UPDATE_ALL', userRoles);
    const canUpdateOwnOffers = hasRole('OFFER_UPDATE_OWN', userRoles);
    const canUpdateOffers = canUpdateAllOffers ||
      (canUpdateOwnOffers && providerId === this.user._id);
    if (!canUpdateOffers) {
      throw new RestError(403, { message: `User ${this.user._id} is not authorized to accept offers for ${providerId}` });
    }

    if (_.isNil(offer)) {
      throw new RestError(404, { message: `Offer ${offerId} is not found` });
    }
    if (offer.isActive !== true) {
      throw new RestError(403, { message: `Provider ${providerId} cannot accept the offer ${offerId} that is not active` });
    }
    const isOfferAlreadyAccepted = areObjectIdsEqual(offer.acceptedBy, providerId);
    const isOfferAlreadyDeclined = offer.declinedBy
      .find(provider => areObjectIdsEqual(provider.providerId, providerId));
    if (isOfferAlreadyAccepted) {
      throw new RestError(403, { message: `Provider ${providerId} already accepted the offer ${offerId}` });
    }
    if (isOfferAlreadyDeclined) {
      throw new RestError(403, { message: `Provider ${providerId} already declined the offer ${offerId}` });
    }
  }
}

module.exports = ProviderPoolingOfferApi;
