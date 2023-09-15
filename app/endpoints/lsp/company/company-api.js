const mongoose = require('mongoose');
const { Promise } = require('bluebird');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const { searchFactory, exportFactory, buildPaginationQuery } = require('../../../utils/pagination');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { CsvExport } = require('../../../utils/csvExporter');
const { _isCompanyOnHierarchy } = require('../request/request-api-helper');
const { startsWithSafeRegexp } = require('../../../utils/regexp');
const { getRoles, hasRole } = require('../../../utils/roles');
const { validObjectId, salesRepPopulate, areObjectIdsEqual } = require('../../../utils/schema');
const { ipComplies } = require('../../../utils/security');
const { convertToMultipleCurrencies } = require('../../../utils/currency-exchange');

const { Types: { ObjectId }, isValidObjectId } = mongoose;
const { RestError } = apiResponse;
const CONTACT_USER_TYPE = 'Contact';
const POPULATE_COMPANY_FIELDS = [
  { path: 'salesRep', select: salesRepPopulate, options: { withDeleted: true } },
];
const USD_ISO_CODE = 'USD';
const EUR_ISO_CODE = 'EUR';
const GBP_ISO_CODE = 'GBP';
const SUPPORTED_CURRENCIES = [USD_ISO_CODE, EUR_ISO_CODE, GBP_ISO_CODE];
const DEFAULT_ENTITIES_CURRENCY_CODE_MAP = {
  wipo: USD_ISO_CODE,
  epo: EUR_ISO_CODE,
  nodb: USD_ISO_CODE,
};
const ENTITIES_SCHEMA_MAP = {
  wipo: 'IpWipoTranslationFee',
  epo: 'IpEpoTranslationFee',
  nodb: 'IpNodbTranslationFee',
};
const WIPO_TRANSLATION_RATE_LANG_MAP = {
  en: 'enTranslationRate',
  fr: 'frTranslationRate',
  de: 'deTranslationRate',
};
const EPO_TRANSLATION_RATE_LANG_MAP = {
  en: 'translationRate',
  fr: 'translationRateFr',
  de: 'translationRateDe',
};
class CompanyAPI extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.logger = logger;
    this.bucket = _.get(options, 'bucket');
    this.configuration = _.get(options, 'configuration');
    this.mock = _.get(options, 'mock', false);
  }

  async create(company) {
    delete company._id;
    const quoteCurrency = await this._getLocalCurrency();
    const defCompany = {
      name: '',
      inactive: false,
      status: '',
      industry: '',
      pursuitActive: false,
      customerTierLevel: '',
      website: '',
      primaryPhoneNumber: '',
      notes: '',
      mailingAddress: {},
      billingAddress: {},
      billingInformation: {
        quoteCurrency,
      },
      billingEmail: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };

    company = _.extend(defCompany, company);
    _.set(company, 'siConnector', {
      isMocked: this.mock,
      isSynced: false,
      error: null,
    });
    company.hierarchy = await this.createHierarchy(company);
    await this.validateCompanyNameAndHierarchy(company);
    await this.validateCompany(company);
    this._sanitizeFields(company);
    const newCompany = new this.schema.Company(company);

    try {
      await newCompany.save();
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Failed to save company, Error: ${message}`);
      throw new RestError(500, { message: 'Error updating company' });
    }
    const populatedCompany = await this._populateAfterFinish(newCompany);
    return populatedCompany;
  }

  async update(company) {
    const self = this;
    const roles = getRoles(this.user);
    const _id = new ObjectId(company._id);

    if (
      hasRole('COMPANY_UPDATE_OWN', roles)
      && !hasRole('COMPANY_UPDATE_ALL', roles)
      && !_isCompanyOnHierarchy(this.user, company)
      && this.user.email !== company.createdBy
    ) {
      this.logger.error(`User has no access to company: ${_id.toString()}`);
      throw new RestError(403, { message: 'You are not allowed to edit this company' });
    }
    const companyInDb = await this.schema.Company.findOneWithDeleted({ lspId: this.lspId, _id });
    await this.validateExcludedProviders(company, companyInDb.excludedProviders);
    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'company',
      entityPromise: () => self.getPopulated(this.user, { _id }),
    });
    await concurrencyReadDateChecker.failIfOldEntity(companyInDb);
    this._sanitizeFields(company);
    const currentParentId = _.get(companyInDb, 'parentCompany._id');

    await this.validateCompany(company);
    if (!_.isEmpty(_.get(company, 'billingInformation.rates', []))) {
      await this.schema.Company.updateRateLanguages(company);
    }
    if (!_.isNil(_.get(company, 'billingInformation')) && _.isNil(company.billingInformation.rates)) {
      const existingRates = _.get(companyInDb, 'billingInformation.rates', []);

      _.set(company, 'billingInformation.rates', existingRates);
    }
    if (this.mock) {
      _.set(company, 'siConnector.isMocked', true);
    }
    if (this.user.hasNot('COMPANY-SETTINGS-CAT_UPDATE_ALL')) {
      delete company.pcSettings;
    }
    if (_.get(company, 'isMandatoryExternalAccountingCode', false)) {
      const companyExternalAccountingCode = await this.schema.CompanyExternalAccountingCode.findOne({ 'company._id': company._id });
      if (!companyExternalAccountingCode) {
        _.set(company, 'isMandatoryExternalAccountingCode', false);
        throw new RestError(400, { message: 'Mandatory external accounting code can\'t be set' });
      }
    }
    try {
      companyInDb.safeAssign(company);
      const modifications = companyInDb.getModifications();
      if (modifications.includes('hierarchy')) {
        const isAllowedToChangeHierarchy = await this._checkIfHierarchyChangeAllowed(companyInDb, currentParentId);
        if (!isAllowedToChangeHierarchy) {
          throw new RestError(400, { message: 'Hierarchy for parent company can\'t be changed' });
        }
        companyInDb.hierarchy = await this.createHierarchy(companyInDb);
        await this.validateCompanyNameAndHierarchy(companyInDb);
      }

      await companyInDb.save();
      await this.schema.Company.postSave(companyInDb, modifications);
    } catch (err) {
      const message = err.message || err;
      let userFriendlyMessage = '';
      const isNotFound = message.match(/not found/);
      const errorCode = isNotFound ? 400 : 500;
      const errorKeys = _.keys(err.errors);

      _.forEach(errorKeys, (errorKey) => {
        if (errorKey.includes('.')) {
          userFriendlyMessage += `${err.errors[errorKey].message}. `;
        }
      });
      this.logger.debug(`User ${this.user.email}. Error while updating company: ${message}`);
      throw new RestError(errorCode, { message: userFriendlyMessage, stack: message });
    }
    const populatedCompany = await this._populateAfterFinish(companyInDb);
    return populatedCompany;
  }

  /**
   * Returns the company list as a csv file
   * @param {Object} companyFilters to filter the groups returned.
   */
  async companyExport(filters) {
    const SORT_COMPANY_FIELDS = _.get(filters, 'paginationParams.sort', { name: 1 });

    this.logger.debug(`User ${this.user.email} retrieved a notification list export file`);

    const query = { lspId: this.lspId, ..._.get(filters, 'paginationParams', {}) };

    query.sort = SORT_COMPANY_FIELDS;

    const { columns } = filters;
    const queryFilters = this._getQueryFilters(columns, query);
    const cursor = await exportFactory(
      this.schema.CompanySecondary,
      query,
      queryFilters.pipeline,
      queryFilters.extraQueryParams,
      filters.__tz,
    );
    const csvExporter = new CsvExport(cursor, {
      schema: this.schema.CompanySecondary,
      lspId: this.lspId,
      configuration: this.configuration,
      logger: this.logger,
      filters: query,
    });
    return csvExporter.export();
  }

  async isUploadingAllowedForIp(clientIP, companyId) {
    if (validObjectId(companyId)) {
      const _id = new ObjectId(companyId);
      const company = await this.schema.Company.findOne({ _id, lspId: this.lspId }, 'cidr');
      const cidr = _.get(company, 'cidr', []);

      if (!_.isNil(cidr) && !_.isEmpty(cidr)) {
        const rules = cidr.map((c) => c.subnet);
        return ipComplies(clientIP, rules);
      }
      return true;
    }
    throw new RestError(400, { message: 'Invalid ObjectID' });
  }

  async retrieveById(filters) {
    const roles = getRoles(this.user);
    const canReadBillingInformation = hasRole('COMPANY-BILLING_READ_OWN', roles);
    const findQuery = {
      lspId: this.lspId,
      _id: { $in: filters.ids },
    };

    await this.addCompanyFiltering(findQuery);
    const projection = {
      _id: 1,
      name: 1,
      hierarchy: 1,
      'parentCompany.name': 1,
      'parentCompany.parentCompany.name': 1,
      'parentCompany.parentCompany.parentCompany.name': 1,
      billingInformation: 1,
      retention: 1,
      cidr: 1,
      contact: 1,
      status: 1,
      pursuitActive: 1,
      industry: 1,
      customerTierLevel: 1,
      website: 1,
      primaryPhoneNumber: 1,
      notes: 1,
      mailingAddress: 1,
      billingAddress: 1,
      billingEmail: 1,
      'salesRep.firstName': 1,
      'salesRep.middleName': 1,
      'salesRep.lastName': 1,
      'salesRep.lsp': this.lspId,
      'salesRep.deleted': 1,
      'salesRep.terminated': 1,
      'salesRep.type': 1,
    };

    if (!canReadBillingInformation) {
      projection.billingInformation = 0;
    }
    const companies = await this.schema.CompanySecondary.find(findQuery)
      .populate(POPULATE_COMPANY_FIELDS).select(projection);
    return {
      list: companies,
      total: companies.length,
    };
  }

  async getCompanyRates(id) {
    let company;
    const query = { lspId: this.lspId, _id: id };

    try {
      company = await this.schema.CompanySecondary.findOne(query).select('billingInformation').lean();
      if (!company) {
        throw new RestError(404, { message: `Company ${id} does not exist` });
      }
    } catch (err) {
      const message = err || err.message;

      this.logger.debug(`User ${this.user.email}. Error while getting company rates: ${message}`);
      throw new RestError(404, { message: `Error getting company rates ${message}` });
    }
    return _.get(company, 'billingInformation.rates', []);
  }

  async getCompanySsoSettings(id) {
    let ssoSettings;
    try {
      ssoSettings = await this.schema.CompanySecondary.getSsoSettings(id, this.lspId);
    } catch (err) {
      const message = err || err.message;
      this.logger.debug(`User ${this.user.email}. Error while getting company sso settings: ${message}`);
      throw new RestError(404, { message: `Error getting company sso settings ${message}` });
    }
    return ssoSettings;
  }

  async getIpRates(id, entityName, language) {
    let entityIpRates = [];
    const isIndirectTranslationInvolved = entityName === 'wipo' && language !== 'en';
    const query = { companyId: id, entity: entityName, languageCode: language };
    const companyIpRates = await this.schema.IpRates.findOne(query).lean().exec();
    const newIpRates = _.get(companyIpRates, 'rates', []);
    const currentEntity = ENTITIES_SCHEMA_MAP[entityName];
    const translationFees = await this.schema[currentEntity].find({ country: { $ne: 'English Translation' } })
      .sort({ country: 1 }).lean().exec();
    if (isIndirectTranslationInvolved) {
      const englishTranslationFee = await this.schema.IpWipoTranslationFee.find({ country: 'English Translation' })
        .lean().exec();
      translationFees.push(englishTranslationFee[0]);
    }

    if (_.isNil(translationFees) || _.isEmpty(translationFees)) {
      throw new RestError(404, {
        message: `Translation fees for ${entityName} retreival failed`,
      });
    }
    entityIpRates = translationFees
      .map((fee) => (this._getIpEntitiesFields(entityName, fee, language)));
    const defaultCompanyCurrencyCode = _.isEmpty(newIpRates)
      ? DEFAULT_ENTITIES_CURRENCY_CODE_MAP[entityName] : companyIpRates.defaultCompanyCurrencyCode;
    let baseCurrencyCode;
    const ipWipoCountries = await this.schema.IpWipoCountry.find({ iq: true }).lean().exec();
    const currencies = await this._getIpCurrencies();
    const exchangeRates = _.get(this.user, 'lsp.currencyExchangeDetails', []);
    entityIpRates.forEach((rate) => {
      if (isIndirectTranslationInvolved) {
        const targetCountry = ipWipoCountries.find((c) => c.name.trim() === rate.country);
        rate.deDirectIq = _.get(targetCountry, 'deDirectIq', true);
        rate.frDirectIq = _.get(targetCountry, 'frDirectIq', true);
      }
      if (!_.isEmpty(newIpRates)) {
        baseCurrencyCode = companyIpRates.defaultCompanyCurrencyCode;
        const newEntityRate = newIpRates.find((r) => r.country === rate.country);
        if (!_.isNil(newEntityRate)) {
          rate.translationRate = { [baseCurrencyCode]: newEntityRate.translationRate || '0.00' };
          rate.agencyFee = { [baseCurrencyCode]: newEntityRate.agencyFee || '0.00' };
          rate.areRatesFromCompany = true;
        }
      } else {
        baseCurrencyCode = rate.currencyCode;
      }
      const translationRateValue = rate.translationRate[baseCurrencyCode];
      const agencyFeeValue = rate.agencyFee[baseCurrencyCode];
      rate.translationRate = convertToMultipleCurrencies({
        currencies,
        baseCurrencyCode,
        feeValue: translationRateValue,
        exchangeRates,
        stringifyResult: true,
      });
      rate.agencyFee = convertToMultipleCurrencies({
        currencies,
        baseCurrencyCode,
        feeValue: agencyFeeValue,
        exchangeRates,
        stringifyResult: true,
      });
    });
    return _.defaultTo({ defaultCompanyCurrencyCode, entityIpRates }, {});
  }

  async updateIpRates(id, entityName, language, newRates, defaultCompanyCurrencyCode) {
    try {
      const newIpRates = newRates.payload.map((rate) => ({
        country: rate.country,
        agencyFee: rate.agencyFee,
        translationRate: rate.translationRate,
      }));
      const query = { companyId: id, entity: entityName, languageCode: language };

      await this.schema.IpRates.findOneAndUpdate(query, {
        defaultCompanyCurrencyCode,
        rates: newIpRates,
      }, { upsert: true });
    } catch (err) {
      const message = err || err.message;

      this.logger.debug(`User ${this.user.email}. Error while updating company ip rates: ${message}`);
      throw new RestError(404, { message: `Error updating company ip rates ${message}` });
    }
  }

  async resetIpRates(id, entityName, language) {
    const query = { companyId: id, entity: entityName, languageCode: language };
    const defaultCompanyCurrencyCode = entityName === 'epo' ? 'EUR' : 'USD';
    let entityRates = [];

    try {
      const rates = await this.schema.IpRates.updateMany(query, {
        $set: { defaultCompanyCurrencyCode, rates: [] },
      }, { new: true });

      if (!rates) {
        throw new RestError(404, { message: `Company rates ${id} does not exist` });
      }
      entityRates = _.get(rates, entityName, []);
    } catch (err) {
      const message = err || err.message;

      this.logger.debug(`User ${this.user.email}. Error while resetting company ip rates: ${message}`);
      throw new RestError(404, { message: `Error resetting company ip rates ${message}` });
    }
    return _.isEmpty(entityRates);
  }

  async nameList(params) {
    const query = { lspId: this.lspId };
    const { paginationParams } = params;
    let companies = [];
    let findWithoutDeleted = false;
    await this.addCompanyFiltering(query);
    if (_.isString(paginationParams.filter)) {
      const jsonFilters = JSON.parse(paginationParams.filter);

      if (jsonFilters.hierarchy) {
        _.assign(query, { hierarchy: startsWithSafeRegexp(jsonFilters.hierarchy) });
      }
      query.$and = [];
      if (!_.isNil(jsonFilters.excludeByIdInHierarchy)) {
        const companyToExclude = await this.schema.CompanySecondary
          .findOneWithDeleted({ _id: new ObjectId(jsonFilters.excludeByIdInHierarchy) });

        if (!_.isNil(companyToExclude)) {
          query.$and.push({ hierarchy: { $not: new RegExp(_.escapeRegExp(companyToExclude.name), 'i') } });
        }
      }
      if (!_.isNil(jsonFilters.deleted)) {
        findWithoutDeleted = jsonFilters.deleted;
      }
      if (!_.get(jsonFilters, 'allCompanyLevels', true)) {
        query.$and.push({ hierarchy: { $not: /^.*:.*:.*:.*$/ } });
      }
      const isSyncedFilter = _.get(jsonFilters, 'isSynced', jsonFilters.isSyncedText);

      if (!_.isNil(isSyncedFilter)) {
        query.$and.push({ 'siConnector.isSynced': JSON.parse(isSyncedFilter) });
      }
      if (!_.isNil(_.get(jsonFilters, 'srFileLanguage'))) {
        const descriptors = await this.schema.PortalcatSrDescriptor.find({ 'language.isoCode': jsonFilters.srFileLanguage, companyId: { $ne: null } });
        const companiesIds = descriptors.map((descriptor) => descriptor.companyId);
        if (companiesIds.length > 0) {
          query.$and.push({ _id: { $in: companiesIds } });
        }
      }
      if (query.$and.length === 0) {
        delete query.$and;
      }
    }
    const { limit, skip } = buildPaginationQuery(paginationParams);
    if (findWithoutDeleted) {
      companies = await this.schema.CompanySecondary.find(query)
        .select(params.select)
        .limit(limit)
        .skip(skip)
        .sort({ hierarchy: 1 })
        .lean();
    } else {
      companies = await this.schema.CompanySecondary.findWithDeleted(query)
        .select(params.select)
        .limit(limit)
        .skip(skip)
        .sort({ hierarchy: 1 })
        .lean();
    }
    return { list: companies, total: companies.length };
  }

  async list(filters) {
    const SORT_COMPANY_FIELDS = _.get(filters, 'paginationParams.sort', { name: 1 });
    const query = { lspId: this.lspId, ..._.get(filters, 'paginationParams', {}) };

    query.sort = SORT_COMPANY_FIELDS;
    const { columns } = filters;
    const queryFilters = this._getQueryFilters(columns, query);

    await this.addCompanyFiltering(query);
    let companies = [];

    companies = await searchFactory({
      model: this.schema.CompanySecondary,
      filters: query,
      extraPipelines: queryFilters.pipeline,
      extraQueryParams: queryFilters.extraQueryParams,
      utcOffsetInMinutes: filters.__tz,
    }).exec();
    return {
      list: companies,
      total: companies.length,
    };
  }

  async getCompanyBalance(_id) {
    const company = await this.schema.Company.findOne({ _id });

    if (_.isNil(company)) {
      throw new RestError(500, { message: `Could not find company ${_id}` });
    }
    const updatedCompany = await this.schema.Company.consolidateBalance(company._id);
    return updatedCompany.balanceInformation;
  }

  async getCompanySalesRep(companyId) {
    if (validObjectId(companyId)) {
      const _id = new ObjectId(companyId);
      const query = {
        _id,
        lspId: this.lspId,
      };
      const POPULATE_OPTIONS = [
        {
          path: 'salesRep',
          select: salesRepPopulate,
          options: { withDeleted: true },
        },
      ];
      const company = await this.schema.Company
        .findOne(query)
        .select({ salesRep: 1 })
        .populate(POPULATE_OPTIONS);

      if (company === null) {
        throw new RestError(404, { message: `Company: ${companyId} was not found` });
      }
      return _.get(company, 'salesRep', null);
    }
    throw new RestError(400, { message: 'Invalid ObjectID' });
  }

  async getCompanyAvailableTimeToDeliver(companyId) {
    if (!validObjectId(companyId)) {
      throw new RestError(400, { message: 'Invalid ObjectID' });
    }
    const _id = new ObjectId(companyId);
    const query = {
      _id,
      lspId: this.lspId,
    };
    const companyAvailableTimeToDeliver = await this.schema.Company
      .findOne(query)
      .select({ availableTimeToDeliver: 1 })
      .lean();
    if (companyAvailableTimeToDeliver === null) {
      throw new RestError(404, { message: `Company: ${companyId} was not found` });
    }
    return companyAvailableTimeToDeliver;
  }

  async getPopulated(user, options) {
    const roles = getRoles(user);
    const isNotAContact = this.user.type
      && this.user.type !== CONTACT_USER_TYPE;
    const canReadAll = hasRole('COMPANY_READ_ALL', roles);
    const canReadQuote = ['QUOTE_READ_OWN', 'QUOTE_READ_COMPANY'].some((role) => hasRole(role, roles));
    const canReadOwnBillingInformation = hasRole('COMPANY-BILLING_READ_OWN', roles);
    const canReadPcSettings = ['COMPANY-SETTINGS-CAT_READ_ALL', 'COMPANY-SETTINGS-CAT_UPDATE_ALL']
      .some((role) => hasRole(role, roles));
    // eslint-disable-next-line max-len
    const canReadBillingInformation = ((canReadAll || canReadOwnBillingInformation) && isNotAContact) || canReadQuote;
    const _id = new ObjectId(options._id);
    const select = _.get(options, 'select');
    const query = {
      _id,
      lspId: this.lspId,
    };

    await this.addCompanyFiltering(query);
    const populate = [
      { path: 'mailingAddress.country' },
      { path: 'mailingAddress.state' },
      { path: 'billingAddress.country' },
      { path: 'billingAddress.state' },
      { path: 'salesRep', select: salesRepPopulate, options: { withDeleted: true } },
      { path: 'pcSettings.lockedSegments.segmentsToLock', select: 'name' },
    ];
    const company = await this.schema.CompanySecondary.getPopulatedCompany(query, populate, select);
    if (_.isNil(company)) {
      throw new RestError(404, { message: 'Company not found or you don\'t have the rights to access this company' });
    }
    const hasChild = await this.schema.CompanySecondary.hasChild(company._id);
    const populatedCompany = company.toJSON({ deleted: true });
    Object.assign(populatedCompany, {
      hasChild,
      readDate: company.readDate,
    });
    if (!canReadBillingInformation && !canReadAll) {
      delete populatedCompany.billingInformation;
    }
    if (!canReadPcSettings) {
      delete company.pcSettings;
    }
    return company;
  }

  async getPublicInfo(companyId) {
    const query = {
      _id: companyId,
      lspId: this.lspId,
    };
    const company = await this.schema.Company
      .findOne(query)
      .select('name allowCopyPasteInPortalCat')
      .lean();
    if (_.isNil(company)) {
      throw new RestError(404, { message: 'Company not found' });
    }
    return company;
  }

  async getIndustry(companyId) {
    const company = await this.schema.Company.findOne({
      _id: companyId,
      lspId: this.lspId,
    }).select('industry').lean();
    if (_.isNil(company)) throw new RestError(404, { message: 'Company not found' });
    return company;
  }

  async createHierarchy(company, level = 0) {
    if (++level > 4) {
      throw new RestError(400, { message: 'Maximum hierarchy level reached' });
    }
    const projection = ['_id', 'hierarchy', 'name', 'status', 'securityPolicy', 'parentCompany'];
    const parentId = _.get(company, 'parentCompany._id');

    if (_.isNil(parentId)) {
      return company.name;
    }
    const parent = await this.schema.Company
      .findOneWithDeleted({ _id: new ObjectId(parentId) });

    company.parentCompany = _.pick(parent, projection);
    const hierarchy = await this.createHierarchy(company.parentCompany);

    if (_.isNil(hierarchy)) {
      throw new RestError(400, 'Invalid hieararchy');
    }
    return `${hierarchy} : ${company.name}`;
  }

  async validateCompany(company) {
    if (!_.isEmpty(company.retention)) {
      const { days, hours, minutes } = company.retention;

      if (days < 0 || hours < 0 || minutes < 0) {
        throw new RestError(400, { message: 'Company retention configuration is invalid' });
      }
    }
    if (!_.isEmpty(_.get(company, 'salesRep'))) {
      await this._validateSalesRep(company.salesRep);
    }
  }

  checkIfProviderIsADuplicate(excludedProviders, providerId) {
    const matches = _.filter(
      excludedProviders,
      (p) => p.user.userId === providerId,
    );
    return matches.length >= 2;
  }

  async validateExcludedProviders(company, excludedProvidersInDb) {
    const excludedProviders = _.get(company, 'excludedProviders');
    if (_.isEmpty(excludedProviders)) {
      return;
    }
    await Promise.map(excludedProviders, (provider) => {
      const providerId = provider.user.userId;
      _.map(excludedProvidersInDb, (p) => {
        if (provider.isNew && providerId === p.user.userId.toString()) {
          throw new RestError(400, { message: `Provider ${provider.user.name} is already excluded.` });
        }
      });
      const isADuplicate = this.checkIfProviderIsADuplicate(excludedProviders, providerId);
      if (isADuplicate) {
        throw new RestError(400, { message: `Cannot add duplicate providers. ${provider.user.name} is a duplicate.` });
      }
    });
  }

  async validateCompanyNameAndHierarchy(company) {
    const hierarchy = _.get(company, 'hierarchy');

    if (_.isNil(hierarchy)) {
      throw new RestError(400, { message: 'Invalid company hierarchy' });
    }
    const hierarchyArray = hierarchy.split(':').map((name) => name.trim());

    if (hierarchyArray.length > 4 || _.uniq(hierarchyArray).length !== hierarchyArray.length) {
      throw new RestError(400, { message: 'Invalid company hierarchy' });
    }
    const query = {
      lspId: this.lspId,
      name: new RegExp(`^${_.escapeRegExp(company.name)}$`, 'i'),
      _id: { $ne: company._id },
    };
    const sameNameCompany = await this.schema.Company.findOneWithDeleted(query);
    if (!_.isNil(sameNameCompany) && sameNameCompany._id.toString() !== _.get(company, '_id', '').toString()) {
      throw new RestError(400, { message: `Company with name ${company.name} already exists` });
    }
  }

  async _getIpCurrencies() {
    const { currencyExchangeDetails } = this.user.lsp;
    const currencyExchangeDetailsColQuery = {
      $in: currencyExchangeDetails.map(({ quote }) => new ObjectId(_.get(quote, '_id', quote))),
    };
    const currencies = await this.schema.Currency.find({ _id: currencyExchangeDetailsColQuery });
    return _.defaultTo(currencies, []).filter((c) => SUPPORTED_CURRENCIES.includes(c.isoCode));
  }

  _getIpEntitiesFields(entityName, dbFee, language) {
    const wipoTranslationRateLangAwareField = WIPO_TRANSLATION_RATE_LANG_MAP[language];
    const epoTranslationRateLangAwareField = EPO_TRANSLATION_RATE_LANG_MAP[language];
    const ipEntitiesFieldsMap = {
      wipo: (fee) => ({
        country: fee.country,
        translationRate: {
          [fee.currencyCode]: fee[wipoTranslationRateLangAwareField] || '0.00',
        },
        translationRateDefault: fee[wipoTranslationRateLangAwareField] || '0.00',
        agencyFee: {
          [fee.currencyCode]: fee.agencyFeeFlat || '0.00',
        },
        agencyFeeDefault: fee.agencyFeeFlat || '0.00',
        currencyCode: fee.currencyCode,
        areRatesFromCompany: false,
      }),
      epo: (fee) => ({
        country: fee.country,
        translationRate: {
          [fee.currencyCode]: fee[epoTranslationRateLangAwareField] || '0.00',
        },
        translationRateDefault: fee[epoTranslationRateLangAwareField] || '0.00',
        agencyFee: {
          [fee.currencyCode]: fee.agencyFeeFixed || '0.00',
        },
        agencyFeeDefault: fee.agencyFeeFixed || '0.00',
        currencyCode: fee.currencyCode,
        areRatesFromCompany: false,
      }),
      nodb: (fee) => ({
        country: fee.country,
        translationRate: {
          [fee.currencyCode]: fee.translationRate || '0.00',
        },
        translationRateDefault: fee.translationRate || '0.00',
        agencyFee: {
          [fee.currencyCode]: fee.agencyFee || '0.00',
        },
        agencyFeeDefault: fee.agencyFee || '0.00',
        currencyCode: fee.currencyCode,
        areRatesFromCompany: false,
      }),
    };
    return ipEntitiesFieldsMap[entityName](dbFee);
  }

  _sanitizeFields(company) {
    const roles = getRoles(this.user);
    const canUpdateBillingInformation = hasRole('COMPANY-BILLING_UPDATE_OWN', roles)
      || hasRole('COMPANY-BILLING_UPDATE_ALL', roles);
    const canUpdateCIDR = hasRole('COMPANY-SECURITY_UPDATE_ALL', roles);

    if (!_.isEmpty(company.cidr) && !canUpdateCIDR) {
      delete company.cidr;
    }
    const canUpdateRetentionPolicy = hasRole('COMPANY-DOC-RET-TIME_UPDATE_ALL', roles);

    if (!canUpdateRetentionPolicy) {
      delete company.retention;
    }
    if (!_.isEmpty(company.billingInformation) && !canUpdateBillingInformation) {
      delete company.billingInformation;
    }
    if (!hasRole('COMPANY_UPDATE_ALL', roles)) {
      delete company.pcSettings;
    }
    if (!company.salesRep || _.isEmpty(company.salesRep)) {
      company.salesRep = undefined;
    }
    if (!_.isNil(company.billingInformation)) {
      if (!canUpdateBillingInformation) {
        delete company.billingInformation;
      }
      if (_.isEmpty(_.get(company, 'billingInformation.paymentMethod'))) {
        company.billingInformation.paymentMethod = null;
      }
      if (_.isEmpty(_.get(company, 'billingInformation.billingTerm'))) {
        company.billingInformation.billingTerm = null;
      }
    }
    if (_.isEmpty(_.get(company, 'parentCompany', ''))) {
      company.parentCompany = null;
    }
    if (company.mailingAddress) {
      if (!company.mailingAddress.country || _.isEmpty(company.mailingAddress.country)) {
        delete company.mailingAddress.country;
      }
      if (!company.mailingAddress.state || _.isEmpty(company.mailingAddress.state)) {
        delete company.mailingAddress.state;
      }
    }
    if (company.billingAddress) {
      if (!company.billingAddress.country || _.isEmpty(company.billingAddress.country)) {
        delete company.billingAddress.country;
      }
      if (!company.billingAddress.state || _.isEmpty(company.billingAddress.state)) {
        delete company.billingAddress.state;
      }
    }
    if (!_.isNil(_.get(company, 'billingInformation.rates'))) {
      const { rates } = company.billingInformation;

      rates.forEach((rate) => {
        rate.rateDetails.forEach((rateDetail) => {
          if (_.isEmpty(rateDetail.breakdown)) {
            delete rateDetail.breakdown;
          }
        });
      });
    }
    if (!company.isOverwritten) {
      company.securityPolicy = undefined;
    }
    if (!_.isNil(company.parentCompany)
      && !_.get(company, 'areSsoSettingsOverwritten', false)) {
      company.ssoSettings = undefined;
    }
  }

  async _validateSalesRep(salesRepId) {
    if (!isValidObjectId(salesRepId)) {
      throw new RestError(400, { message: 'Invalid Sales Rep' });
    }
    const user = await this.schema.User.findOneWithDeleted({
      _id: salesRepId,
      lsp: this.lspId,
    });

    if (!user) {
      throw new RestError(400, { message: 'Invalid Sales Rep' });
    }
  }

  async _populateAfterFinish(company) {
    const query = { _id: company._id, lspId: this.lspId };
    return this.schema.Company.getPopulatedCompany(query);
  }

  getHierarchyPipelineAndModifyQueryFilter(query) {
    let { filter = {} } = query;
    if (typeof filter === 'string') {
      filter = JSON.parse(filter);
    }
    if (_.isEmpty(filter.hierarchy) || !filter.isSubCompaniesSearch) {
      return null;
    }
    delete filter.isSubCompaniesSearch;
    query.filter = JSON.stringify(filter);
    return {
      $match: {
        hierarchy: { $regex: `(?:^|\\s)${filter.hierarchy}\\s:` },
      },
    };
  }

  _getQueryFilters(columns, query) {
    const pipeline = [
      {
        $addFields: {
          inactiveText: {
            $switch: {
              branches: [
                { case: { $eq: ['$deleted', true] }, then: 'true' },
                { case: { $eq: ['$deleted', false] }, then: 'false' },
              ],
              default: '',
            },
          },
          isOverwrittenText: {
            $switch: {
              branches: [
                { case: { $eq: ['$isOverwritten', true] }, then: 'false' },
                { case: { $eq: ['$isOverwritten', false] }, then: 'true' },
              ],
              default: '',
            },
          },
          mandatoryRequestContactText: { $toString: '$mandatoryRequestContact' },
        },
      },
      {
        $lookup: {
          from: 'countries',
          localField: 'billingAddress.country',
          foreignField: '_id',
          as: 'countryName',
        },
      },
      {
        $lookup: {
          from: 'states',
          localField: 'billingAddress.state',
          foreignField: '_id',
          as: 'stateName',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'salesRep',
          foreignField: '_id',
          as: 'salesRep',
        },
      },
      {
        $lookup: {
          from: 'billingTerms',
          localField: 'billingInformation.billingTerm',
          foreignField: '_id',
          as: 'billingTerm',
        },
      },
      {
        $lookup: {
          from: 'paymentMethods',
          localField: 'billingInformation.paymentMethod',
          foreignField: '_id',
          as: 'paymentMethod',
        },
      },
      {
        $addFields: {
          cityName: '$billingAddress.city',
          countryName: '$countryName.name',
          stateName: '$stateName.name',
          salesRep: {
            $arrayElemAt: ['$salesRep', 0],
          },
        },
      },
      {
        $addFields: {
          salesRepName: {
            $concat: [
              '$salesRep.firstName',
              ' ',
              '$salesRep.lastName',
            ],
          },
          billingTermName: '$billingTerm.name',
          paymentMethodName: '$paymentMethod.name',
        },
      },
      {
        $addFields: {
          internalDepartmentNames: {
            $reduce: {
              input: '$internalDepartments',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$internalDepartments', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this.name'] },
                  else: { $concat: ['$$value', ', ', '$$this.name'] },
                },
              },
            },
          },
        },
      },
    ];
    const hierarchyPipeline = this.getHierarchyPipelineAndModifyQueryFilter(query);

    if (!_.isEmpty(hierarchyPipeline)) {
      pipeline.push(hierarchyPipeline);
    }
    const cleanStage = {
      $project: {
        billingTerm: 0,
        paymentMethod: 0,
        'billingInformation.rates': 0,
      },
    };

    if (_.isString(columns) && !_.isEmpty(columns)) {
      cleanStage.$project = columns
        .split(' ')
        .filter((key) => _.isNil(Object.keys(cleanStage.$project).find((k) => k === key)))
        .reduce((ac, en) => _.assign(ac, { [en]: 1 }), {});
    }
    pipeline.push(cleanStage);

    const extraQueryParams = [
      'inactiveText',
      'isOverwrittenText',
      'salesRepName',
      'cityName',
      'countryName',
      'stateName',
      'billingTermName',
      'billingInformation.notes',
      'paymentMethodName',
      'internalDepartmentNames',
      'mandatoryRequestContactText',
      'siConnector.isSynced', 'siConnector.connectorEndedAt', 'siConnector.error',
    ];
    return {
      pipeline,
      extraQueryParams,
    };
  }

  async addCompanyFiltering(query) {
    const roles = getRoles(this.user);
    const isContact = this.user.type === CONTACT_USER_TYPE;
    const canReadOwn = hasRole('COMPANY_READ_OWN', roles);
    const canReadAll = hasRole('COMPANY_READ_ALL', roles);
    const canReadCompanyFromHierarchy = hasRole('COMPANY_READ_COMPANY', roles);
    const canReadBillingInformation = hasRole('COMPANY-BILLING_READ_OWN', roles);
    const userCompanyId = new ObjectId(_.get(this, 'user.company._id'));

    if (!canReadAll) {
      if (isContact) {
        if (canReadCompanyFromHierarchy) {
          const companyFamily = await this.schema.Company.getCompanyFamily(
            this.lspId,
            userCompanyId,
          );
          const companiesId = companyFamily.map((_company) => _company._id);

          query._id = { $in: [userCompanyId, ...companiesId] };
        } else if (canReadOwn) {
          query._id = userCompanyId;
        }
      } else if (canReadBillingInformation) {
        query.salesRep = new ObjectId(this.user._id);
      }
    }
  }

  async _checkIfHierarchyChangeAllowed(company, currentParentId) {
    const hasChild = await this.schema.Company.hasChild(_.get(company, '_id'));

    if (!hasChild) {
      return true;
    }
    if (_.isEmpty(company.parentCompany)) {
      if (company.name === company.hierarchy) {
        return true;
      }
      return !company.isModified('parentCompany');
    }
    const parentId = new ObjectId(_.get(company, 'parentCompany._id'));
    return parentId.equals(currentParentId);
  }

  async _getLocalCurrency() {
    const lsp = await this.schema.Lsp.findById(this.lspId);
    const localCurrency = lsp.currencyExchangeDetails.find((e) => areObjectIdsEqual(e.base, e.quote) && e.quotation === 1);
    return this.schema.Currency.findById(localCurrency.base);
  }
}

module.exports = CompanyAPI;
