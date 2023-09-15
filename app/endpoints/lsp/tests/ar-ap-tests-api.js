
const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const { forEachProviderTask, forEachTask } = require('../request/workflow-helpers');
const UserUpsert = require('../user/user-upsert');
const SchemaAwareApi = require('../../schema-aware-api');
const VariableRateBillCreator = require('../../../components/bill-creator/variable-rate-bill-creator');
const { areObjectIdsEqual } = require('../../../utils/schema');
const configuration = require('../../../components/configuration');
const FileStorageFacade = require('../../../components/file-storage');
const VersionableFileStorage = require('../../../components/file-storage/versionable-file-storage-facade');
const applicationCryptoFactory = require('../../../components/crypto');

const LANGUAGE_FRENCH_NAME = 'French (France)';
const SOURCE_LANGUAGE_ISO_CODE = 'ENG';
const targetLanguageisoCodes = [
  'FR-FR',
  'GER',
  'SPA-EU',
  'ITA',
  'KOR',
  'JPN',
  'RUS',
  'NOB',
  'POL',
  'SWE',
];
let ratesLanguages;
const companiesBreakdownToRateMap = {
  Repetitions: 0.03,
  '101%': 0.03,
  '100%': 0.03,
  '95-99%': 0.11,
  '85-94%': 0.11,
  '75-84%': 0.11,
  '50-74%': 0.12,
  'No match': 0.15,
};

const vendorsBreakdownToRateMap = {
  '95-99%': 0.06,
  '85-94%': 0.06,
  '75-84%': 0.07,
  '50-74%': 0.09,
  'No match': 0.09,
};

class ArApTestsApi extends SchemaAwareApi {
  async purgeTestData(requestNumbers) {
    const requests = await this.schema.Request.find({
      no: { $in: requestNumbers },
    })
      .populate({ path: 'contact.projectManagers', select: 'firstName' })
      .lean();
    if (_.isEmpty(requests) || !_.get(this.flags, 'mock', false)) {
      return;
    }
    const schemasToOperationsMap = new Map([
      [this.schema.Company, []],
      [this.schema.User, []],
      [this.schema.LmsAuth, []],
    ]);
    await Promise.map(requests, async (request) => {
      schemasToOperationsMap.get(this.schema.Company).push(
        this._getDeleteCompanyOperation(request.company._id),
      );
      await this.schema.ArInvoice.deleteMany({ company: request.company._id });
      const { userIds } = this._getDeleteUserIds(request);
      schemasToOperationsMap.get(this.schema.LmsAuth).push({
        deleteMany: {
          filter: {
            userId: {
              $in: userIds,
            },
          },
        },
      });
      schemasToOperationsMap.get(this.schema.User).push({
        deleteMany: {
          filter: {
            _id: {
              $in: userIds,
            },
          },
        },
      });
      await this.schema.Request.deleteMany({
        'workflows.tasks.providerTasks.provider._id': { $in: userIds },
      });
      await this.schema.Bill.deleteMany({
        vendor: { $in: userIds },
        'siConnector.isMocked': true,
      });
    });
    await Promise.map(
      schemasToOperationsMap.entries(),
      ([schema, operations]) => {
        if (!_.isEmpty(operations)) {
          schema.bulkWrite(operations);
        }
      });
  }

  async createTestRequests({
    quantity, mockBills = false, isE2e, paymentMethod: paymentMethodIndex,
  }) {
    const mock = _.get(this.flags, 'mock', false);
    const entityPrefix = _.get(this.flags, 'arApScriptEntityPrefix', 'lms-188');
    if (!mock) {
      return;
    }
    await this._retrieveRatesLanguages();
    let entityNamePrefix = `${entityPrefix}_man_`;
    if (isE2e) {
      entityNamePrefix = `${entityPrefix}_e2e_`;
    }
    const uniquePrefix = `${entityNamePrefix}${moment.utc().format('Y-MM-DDTHHmmss')}_`;
    const department = await this._upsertInternalDepartment(uniquePrefix, 'Document Translations');
    const breakdowns = await this._upsertBreakdowns(
      ['Repetitions', '101%', '100%', '95-99%', '85-94%', '75-84%', '50-74%', 'No match'],
    );
    const units = await this._upsertUnits(['Words', 'Hours']);
    const abilities = await this._upsertAbilities(
      uniquePrefix,
      [
        { name: 'Link Check', glAccountNo: 40500 },
        { name: 'Translation', glAccountNo: 40010 },
        { name: 'Editing', glAccountNo: 40350 },
        { name: 'QA Full memoQ', glAccountNo: 40500 },
      ],
    );
    const expenseAccounts = await this._upsertExpenseAccounts(
      uniquePrefix,
      ['50010', '50350', '50500'],
    );
    await this._upsertAbilityExpenseAccounts([
      { ability: abilities[1], expenseAccount: expenseAccounts[0] },
      { ability: abilities[2], expenseAccount: expenseAccounts[1] },
      { ability: abilities[0], expenseAccount: expenseAccounts[2] },
      { ability: abilities[3], expenseAccount: expenseAccounts[2] },
    ]);
    const paymentMethodsNames = ['EFT', 'Wire Transfer', 'Veem'];
    const paymentMethods = await this._upsertPaymentMethods(paymentMethodsNames);
    let paymentMethod;
    if (!_.isNil(paymentMethodIndex)) {
      paymentMethod = paymentMethods[+paymentMethodIndex];
    }
    const companies = await this._upsertCompanies(
      entityNamePrefix,
      {
        wordsUnit: units[0],
        hoursUnit: units[1],
        breakdowns,
        department,
      },
    );
    const staff = await this._upsertStaffUsers(entityNamePrefix, { department });
    const contacts = await this._upsertContactUsers(
      entityNamePrefix,
      [
        { name: 'contact1', company: companies[0], projectManager: staff, group: 'COMPANY_MANAGER', state: 'Corse' },
        { name: 'contact2', company: companies[1], projectManager: staff, group: 'COMPANY_STAFF', state: 'Bretagne' },
      ],
    );
    const vendors = await this._upsertVendorUsers(
      entityNamePrefix,
      {
        department,
        breakdowns: breakdowns.slice(3),
        wordsUnit: units[0],
        hoursUnit: units[1],
      },
      [
        { name: 'vendor1', paymentMethod: paymentMethod || paymentMethods[0], minimumChargeLangs: ['English - French (France)'] },
        { name: 'vendor2', paymentMethod: paymentMethod || paymentMethods[0] },
        { name: 'vendor3', paymentMethod: paymentMethod || paymentMethods[1] },
        { name: 'vendor4', paymentMethod: paymentMethod || paymentMethods[1] },
        { name: 'vendor5', paymentMethod: paymentMethod || paymentMethods[2] },
        { name: 'vendor6', paymentMethod: paymentMethod || paymentMethods[2] },
      ],
    );
    const [requestsOfType1, requestsOfType2] = await Promise.mapSeries([
      {
        title: 'request1',
        staff,
        company: companies[0],
        department,
        contact: contacts[0],
        breakdowns,
        wordsUnit: units[0],
        hoursUnit: units[1],
        providers: vendors,
        minChargedLang: 'FR-FR',
        buildRequestWorkflows: this._buildRequest1Workflows.bind(this),
      },
      {
        title: 'request2',
        staff,
        company: companies[1],
        department,
        contact: contacts[1],
        breakdowns,
        wordsUnit: units[0],
        hoursUnit: units[1],
        providers: vendors,
        minChargedLang: 'FR-FR',
        buildRequestWorkflows: this._buildRequest2Workflows.bind(this),
      },
    ], params => this._createRequests(uniquePrefix, quantity, params));
    const bills = await this._createBills({
      providers: vendors,
      requests: requestsOfType1.concat(requestsOfType2),
      mockBills,
    });
    return {
      companies: companies.map(company => _.pick(company, ['_id', 'name'])),
      users: _.flatten([staff, contacts, vendors]).map(user => _.pick(user, ['_id', 'email', 'firstName', 'lastName'])),
      requestsOfType1: requestsOfType1.map(request => _.pick(request, ['_id', 'no', 'purchaseOrder'])),
      requestsOfType2: requestsOfType2.map(request => _.pick(request, ['_id', 'no', 'purchaseOrder'])),
      numOfBillsCreated: bills.length,
    };
  }
  async _retrieveRatesLanguages() {
    const languagesFromDb = await this.schema.Language.find({
      isoCode: { $in: targetLanguageisoCodes.concat(SOURCE_LANGUAGE_ISO_CODE) },
    }).lean();

    const sourceLanguage = languagesFromDb.find(language =>
      language.isoCode === SOURCE_LANGUAGE_ISO_CODE);

    const targetLanguages = languagesFromDb.filter(language =>
      language.isoCode !== SOURCE_LANGUAGE_ISO_CODE);

    ratesLanguages = targetLanguages.map(language => ({
      sourceLanguage: sourceLanguage, targetLanguage: language,
    }));
  }
  _convertToDbLanguageCombination(languageCombination) {
    const { sourceLanguage, targetLanguage } = languageCombination;
    return {
      text: `${sourceLanguage.name} - ${targetLanguage.name}`,
      value: [sourceLanguage, targetLanguage].map(language => ({
        _id: language._id,
        value: language.isoCode,
        text: language.name,
      })),
    };
  }
  async _upsertInternalDepartment(entityNamePrefix, name) {
    let department = await this._findDepartment(name);
    if (_.isNil(department)) {
      department = await this.schema.InternalDepartment.create({
        name,
        lspId: this.lspId,
        createdBy: this.user.email,
        accountingDepartmentId: `${entityNamePrefix}${name}`,
      });
    }
    return department;
  }

  _upsertBreakdowns(names) {
    return Promise.mapSeries(names, async (name) => {
      let breakdown = await this._findBreakdown(name);
      if (_.isNil(breakdown)) {
        breakdown = await this.schema.Breakdown.create({
          name,
          lspId: this.lspId,
          createdBy: this.user.email,
        });
      }
      return breakdown;
    });
  }

  _upsertUnits(names) {
    return Promise.mapSeries(names, async (name) => {
      let unit = await this._findUnit(name);
      if (_.isNil(unit)) {
        unit = await this.schema.TranslationUnit.create({
          name,
          lspId: this.lspId,
          createdBy: this.user.email,
        });
      }
      return unit;
    });
  }

  async _upsertRevenueAccounts(entityNamePrefix, no) {
    let account = await this._findAccount(no);
    if (_.isNil(account)) {
      account = await this.schema.Account.create({
        no,
        name: `${entityNamePrefix}revenue account ${no}`,
        lspId: this.lspId,
        createdBy: this.user.email,
      });
    }
    return account;
  }

  _upsertAbilities(entityNamePrefix, abilitiesInfo) {
    return Promise.mapSeries(abilitiesInfo, async ({ name, glAccountNo }) => {
      const ability = await this._findAbility(name);
      if (_.isNil(ability)) {
        const revenueAccount = await this._upsertRevenueAccounts(entityNamePrefix, glAccountNo);
        return this.schema.Ability.create({
          name,
          glAccountNo: revenueAccount.no,
          languageCombination: false,
          catTool: false,
          competenceLevelRequired: false,
          companyRequired: false,
          internalDepartmentRequired: false,
          lspId: this.lspId,
          createdBy: this.user.email,
        });
      } else if (_.isEmpty(ability.glAccountNo)) {
        const revenueAccount = await this._upsertRevenueAccounts(entityNamePrefix, glAccountNo);
        return this.schema.Ability.findOneAndUpdate(
          { _id: ability._id },
          { glAccountNo: revenueAccount.no },
          { new: true },
        ).lean();
      }
      return ability;
    });
  }

  _upsertExpenseAccounts(entityNamePrefix, numbers) {
    return Promise.map(numbers, async (number) => {
      let account = await this._findExpenseAccount(number);
      if (_.isNil(account)) {
        account = await this.schema.ExpenseAccount.create({
          name: `${entityNamePrefix}expense account ${number}`,
          lspId: this.lspId,
          createdBy: this.user.email,
          number,
          costType: 'Variable',
        });
      }
      return account;
    });
  }

  _upsertAbilityExpenseAccounts(accountsInfo) {
    return Promise.map(accountsInfo, async ({ expenseAccount, ability }) => {
      let abilityExpenseAccount =
        await this._findAbilityExpenseAccount(expenseAccount._id, ability._id);
      if (_.isNil(abilityExpenseAccount)) {
        abilityExpenseAccount = await this.schema.AbilityExpenseAccount.create({
          lspId: this.lspId,
          createdBy: this.user.email,
          expenseAccount: expenseAccount._id,
          ability: ability._id,
        });
      }
      return abilityExpenseAccount;
    });
  }

  _upsertPaymentMethods(names) {
    return Promise.map(names, async (name) => {
      let method = await this._findPaymentMethod(name);
      if (_.isNil(method)) {
        method = await this.schema.PaymentMethod.create({
          name,
          lspId: this.lspId,
        });
      }
      return method;
    });
  }

  async _upsertCompanies(
    entityNamePrefix,
    { wordsUnit, hoursUnit, breakdowns, department },
  ) {
    const translationAbility = await this._findAbility('Translation');
    const company = await this._upsertCompany({
      name: `${entityNamePrefix}Company`,
      hierarchy: `${entityNamePrefix}Company`,
      wordsUnit,
      hoursUnit,
      breakdowns,
      department,
      isParent: true,
    });
    await this._upsertMinimumCharges({ company, translationAbility });
    const subCompany = await this._upsertCompany({
      name: `${entityNamePrefix}Sub-Company`,
      hierarchy: `${company.name} : ${entityNamePrefix}Sub-Company`,
      wordsUnit,
      hoursUnit,
      breakdowns,
      department,
      isParent: false,
      parentCompany: company,
    });
    await this._upsertMinimumCharges({ company: subCompany, translationAbility });
    return [company, subCompany];
  }

  async _upsertCompany({
    name,
    hierarchy,
    wordsUnit,
    hoursUnit,
    breakdowns,
    department,
    isParent = false,
    parentCompany,
  }) {
    const company = await this._findCompany(name);
    const [
      country,
      currency,
      billingTerm,
    ] = await Promise.map([
      this._findCountry('United States'),
      this._findCurrency('USD'),
      this._findBillingTerm('Net 30'),
    ], res => res);
    const companyObject = this._buildCompanyObject({
      name,
      hierarchy,
      country,
      currency,
      billingTerm,
      wordsUnit,
      hoursUnit,
      breakdowns,
      department,
      isParent,
      parentCompany: !_.isNil(parentCompany)
        ? _.pick(parentCompany, ['_id', 'hierarchy', 'name', 'status', 'securityPolicy', 'parentCompany'])
        : null,
    });
    if (_.isNil(company)) {
      return this.schema.Company.create(companyObject);
    }
    return this.schema.Company.findOneAndUpdate({ _id: company._id }, companyObject, { new: true });
  }

  async _upsertMinimumCharges({ company, translationAbility }) {
    const minimumCharge = {
      company: _.pick(company, ['_id', 'hierarchy', 'name']),
      ability: _.pick(translationAbility, ['_id', 'name']),
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const minimumChargesToInsert = [];
    const languageCombination = ratesLanguages.find(lanComb =>
      lanComb.targetLanguage.name === LANGUAGE_FRENCH_NAME);
    const languageCombinationsWithMinCharge = [
      {
        languageCombinations: [this._convertToDbLanguageCombination(languageCombination)],
        minCharge: 50,
      },
      {
        languageCombinations: ratesLanguages
          .filter(({ targetLanguage: { isoCode } }) => isoCode !== 'FR-FR')
          .map(lanComb => this._convertToDbLanguageCombination(lanComb)),
        minCharge: 32,
        deleted: true,
      },
    ];
    await Promise.map(
      languageCombinationsWithMinCharge,
      async ({ languageCombinations, minCharge, deleted }) => {
        const minimumChargeInDb = await this.schema.CompanyMinimumCharge.findOne({
          'company._id': company._id,
          languageCombinations,
          lspId: this.lspId,
        });
        const minimumChargeObj = Object.assign({}, minimumCharge, {
          languageCombinations,
          minCharge,
          deleted,
        });
        if (_.isNil(minimumChargeInDb)) {
          minimumChargesToInsert.push(minimumChargeObj);
        } else {
          await this.schema.CompanyMinimumCharge.findOneAndUpdate(
            { _id: minimumChargeInDb._id },
            minimumChargeObj,
          );
        }
      },
    );
    return this.schema.CompanyMinimumCharge.insertMany(minimumChargesToInsert);
  }

  async _upsertStaffUsers(entityNamePrefix, { department }) {
    const email = `${entityNamePrefix}staff@email.com`;
    let staff = await this._findUser(email);
    const staffObj = Object.assign(
      this._buildUserObject(),
      {
        groups: [await this._findGroup('LSP_PM')],
        email,
        type: 'Staff',
        firstName: 'ar-ap-test',
        middleName: '',
        lastName: `${entityNamePrefix}staff`,
        staffDetails: {
          internalDepartments: [_.pick(department, ['_id', 'name'])],
          remote: false,
          phoneNumber: '',
          jobTitle: '',
          approvalMethod: 'Experience & Education',
          hireDate: moment.utc().format(),
          comments: '',
        },
      },
    );
    const mock = _.get(this.flags, 'mock', false);
    const userUpsert = new UserUpsert({
      logger: this.logger,
      schema: this.schema,
      userInSession: this.user,
      mock,
      userInDb: staff,
      cryptoFactory: applicationCryptoFactory,
      configuration,
      FileStorageFacade,
      VersionableFileStorage,
    });
    if (_.isNil(staff)) {
      staff = await userUpsert.create(staffObj);
      return staff.user;
    }
    _.set(staffObj, '_id', staff._id);
    staff = await userUpsert.update(staffObj);
    return staff.user;
  }

  _upsertContactUsers(entityNamePrefix, contactsInfo) {
    return Promise.mapSeries(contactsInfo, async (contactInfo) => {
      const group = await this._findGroup(contactInfo.group);
      const country = await this._findCountry('France');
      const state = await this._findState(country._id, contactInfo.state);
      const email = `${entityNamePrefix}${contactInfo.name}@email.com`;
      let dbContact = await this._findUser(email);
      const billingTerm = await this._findBillingTerm('Net 30');
      const contact = Object.assign(
        this._buildUserObject(),
        {
          groups: [group],
          email,
          type: 'Contact',
          firstName: 'ar-ap-test',
          middleName: '',
          lastName: `${entityNamePrefix}${contactInfo.name}`,
          company: contactInfo.company._id,
          projectManagers: [contactInfo.projectManager._id],
          contactDetails: {
            qualificationStatus: 'Identifying',
            linkedInUrl: '',
            mainPhone: {
              number: '123123123',
              ext: '',
            },
            mailingAddress: {
              line1: '',
              line2: '',
              city: '',
              zip: '',
            },
            billingAddress: {
              line1: `${entityNamePrefix}address`,
              line2: '',
              city: 'Lion',
              zip: '3456',
              country: _.pick(country, ['_id', 'name']),
              state: _.pick(state, ['_id', 'name', 'code', 'country']),
            },
            billingEmail: email,
          },
          billingInformation: {
            billingTerm: billingTerm._id,
          },
        },
      );
      const mock = _.get(this.flags, 'mock', false);
      const userUpsert = new UserUpsert({
        logger: this.logger,
        schema: this.schema,
        userInSession: this.user,
        mock,
        userInDb: dbContact,
        cryptoFactory: applicationCryptoFactory,
        configuration,
        FileStorageFacade,
        VersionableFileStorage,
      });
      if (_.isNil(dbContact)) {
        dbContact = await userUpsert.create(contact);
        return dbContact.user;
      }
      _.set(contact, '_id', dbContact._id);
      dbContact = await userUpsert.update(contact);
      return dbContact.user;
    });
  }

  async _upsertVendorUsers(
    entityNamePrefix,
    { department, breakdowns, wordsUnit, hoursUnit },
    vendorsInfo,
  ) {
    return Promise.mapSeries(vendorsInfo, async (vendorInfo) => {
      const email = `${entityNamePrefix}${vendorInfo.name}@email.com`;
      let dbVendor = await this._findUser(email);
      const [
        group,
        competenceLevel,
        country,
        currency,
        billingTerm,
        translationAbility,
        editingAbility,
        qaAbility,
        linkCheckAbility,
        taxForm,
      ] = await Promise.map([
        this._findGroup('LSP_VENDOR'),
        this._findCompetenceLevel('General/Other 1'),
        this._findCountry('France'),
        this._findCurrency('USD'),
        this._findBillingTerm('Net 30'),
        this._findAbility('Translation'),
        this._findAbility('Editing'),
        this._findAbility('QA Full memoQ'),
        this._findAbility('Link Check'),
        this._findTaxForm('1099 Eligible'),
      ], res => res);
      const state = await this._findState(country._id, 'Grand-Est');
      const vendor = Object.assign(
        this._buildUserObject(),
        {
          groups: [group],
          email,
          type: 'Vendor',
          firstName: 'ar-ap-test',
          middleName: '',
          lastName: `${entityNamePrefix}${vendorInfo.name}`,
          abilities: ['Translation', 'Editing', 'QA Full memoQ', 'Link Check'],
          languageCombinations: ratesLanguages.map(
            ({ sourceLanguage: { name: sourceName }, targetLanguage: { name: targetName } }) => `${sourceName} - ${targetName}`,
          ),
          catTools: ['MemoQ'],
        },
        this._buildVendorDetails(
          entityNamePrefix,
          {
            vendorInfo,
            competenceLevel,
            department,
            country,
            state,
            currency,
            billingTerm,
            taxForm,
            translationAbility,
            editingAbility,
            qaAbility,
            linkCheckAbility,
            breakdowns,
            wordsUnit,
            hoursUnit,
          },
        ),
      );
      const mock = _.get(this.flags, 'mock', false);
      const userUpsert = new UserUpsert({
        logger: this.logger,
        schema: this.schema,
        userInSession: this.user,
        mock,
        userInDb: dbVendor,
        cryptoFactory: applicationCryptoFactory,
        configuration,
        FileStorageFacade,
        VersionableFileStorage,
      });
      if (_.isNil(dbVendor)) {
        dbVendor = await userUpsert.create(vendor);
      } else {
        _.set(vendor, '_id', dbVendor._id);
        dbVendor = await userUpsert.update(vendor);
      }
      dbVendor = dbVendor.user;
      if (!_.isNil(vendorInfo.minimumChargeLangs)) {
        await this._upsertVendorMinimunCharges({
          vendor: dbVendor,
          languageCombinations: vendorInfo.minimumChargeLangs,
        });
      }
      return dbVendor;
    });
  }

  async _upsertVendorMinimunCharges({ vendor, languageCombinations }) {
    const languageCombinationsDbFormat = languageCombinations.map((textLanguageCombination) => {
      const targetLanguageName = textLanguageCombination.split(' - ')[1];
      const languageCombination = ratesLanguages.find(lanComb =>
        lanComb.targetLanguage.name === targetLanguageName);
      return this._convertToDbLanguageCombination(languageCombination);
    });
    let minimumCharge = await this.schema.VendorMinimumCharge.findOne({
      vendor: vendor._id,
      languageCombinations: languageCombinationsDbFormat,
      lspId: this.lspId,
    });
    if (_.isNil(minimumCharge)) {
      const ability = await this._findAbility('Translation');
      minimumCharge = this.schema.VendorMinimumCharge.create({
        vendor: vendor._id,
        ability: _.pick(ability, ['_id', 'name']),
        languageCombinations: languageCombinationsDbFormat,
        rate: 15,
        lspId: this.lspId,
        createdBy: this.user.email,
      });
    }
    return minimumCharge;
  }

  async _createRequests(
    entityNamePrefix,
    quantity,
    {
      title,
      staff,
      company,
      department,
      contact,
      breakdowns,
      wordsUnit,
      hoursUnit,
      providers,
      minChargedLang,
      buildRequestWorkflows,
    },
  ) {
    const competence = await this._findCompetenceLevel('General/Other 1');
    const currency = await this._findCurrency('USD');
    const params = {
      entityNamePrefix,
      title,
      staff,
      company,
      department,
      contact,
      breakdowns,
      wordsUnit,
      hoursUnit,
      providers,
      minChargedLang,
      competence,
      currency,
      buildRequestWorkflows,
    };
    const requestObjects = _.range(quantity).map(() => {
      const requestNo = `R${moment.utc().format('YYMMDD')}-${moment.utc().format('HHmmssSSS')}-ar-ap-test`;
      return this._buildRequestObject({
        ...params,
        requestNo,
      });
    });
    const { ops: requests } = await mongoose.connection.db.collection('requests').insertMany(requestObjects);
    await this._updateWorkflowsTotals(requests);
    return requests;
  }

  async _updateWorkflowsTotals(requests) {
    const requestUpdateOperations = [];
    const requestToUpdate = new this.schema.Request(requests[0]);
    requestToUpdate.markModified('workflows');
    await this.schema.Request.updateWorkflowTotals(requestToUpdate);
    requests[0] = requestToUpdate.toObject();

    requests.forEach((request, requestIndex) => {
      const requestWithTotals = requests[0];
      if (requestIndex > 0) {
        forEachTask(requests[requestIndex], ({ workflow, task, workflowIndex, taskIndex }) => {
          const workflowWithTotals = requestWithTotals.workflows[workflowIndex];
          const taskWithTotals = workflowWithTotals.tasks[taskIndex];
          task.invoiceDetails.forEach((invoiceDetail, invoiceDetailIndex) => {
            const invoiceDetailWithTotals = taskWithTotals.invoiceDetails[invoiceDetailIndex];
            Object.assign(invoiceDetail.invoice, {
              unitPrice: invoiceDetailWithTotals.invoice.unitPrice,
              foreignUnitPrice: invoiceDetailWithTotals.invoice.foreignUnitPrice,
              total: invoiceDetailWithTotals.invoice.total,
              foreignTotal: invoiceDetailWithTotals.invoice.foreignTotal,
            });
          });
          Object.assign(task, {
            minCharge: taskWithTotals.minCharge,
            foreignMinCharge: taskWithTotals.foreignMinCharge,
            total: taskWithTotals.total,
            foreignTotal: taskWithTotals.foreignTotal,
          });
          Object.assign(workflow, {
            subtotal: workflowWithTotals.subtotal,
            projectedCostTotal: workflowWithTotals.projectedCostTotal,
            foreignSubtotal: workflowWithTotals.foreignSubtotal,
          });
        });
        Object.assign(request, {
          exchangeRate: requestWithTotals.exchangeRate,
          foreignProjectedCostTotal: requestWithTotals.foreignProjectedCostTotal,
          invoiceTotal: requestWithTotals.invoiceTotal,
          foreignInvoiceTotal: requestWithTotals.foreignInvoiceTotal,
          foreignBillTotal: requestWithTotals.foreignBillTotal,
          projectedCostTotal: requestWithTotals.projectedCostTotal,
          projectedCostGp: requestWithTotals.projectedCostGp,
          billTotal: requestWithTotals.billTotal,
          billGp: requestWithTotals.billGp,
        });
      }
      requestUpdateOperations.push({
        updateOne: {
          filter: { _id: request._id },
          update: { $set: requests[requestIndex] },
        },
      });
    });
    return this.schema.Request.bulkWrite(requestUpdateOperations);
  }

  async _createBills({ providers, requests, mockBills }) {
    const billsToCreate = [];
    const lsp = await this._findLsp();
    await Promise.mapSeries(providers, async (provider) => {
      const variableRateBillCreator = new VariableRateBillCreator(
        this.schema,
        lsp,
        null,
        this.flags,
      );
      const vendorRequests = requests.filter(
        request => request.workflows.some(
          workflow => workflow.tasks.some(
            task => task.providerTasks.some(
              (providerTask) => {
                const providerTaskProviderId = _.get(providerTask, 'provider._id');
                return areObjectIdsEqual(providerTaskProviderId, provider._id);
              },
            ),
          ),
        ),
      );
      await Promise.map(
        vendorRequests,
        async (request) => {
          await Promise.mapSeries(request.workflows, async (workflow) => {
            await Promise.mapSeries(workflow.tasks, async (task) => {
              await Promise.mapSeries(task.providerTasks, async (providerTask) => {
                providerTask.provider = provider;
                workflow.langCombination = `${workflow.srcLang.name} ${workflow.tgtLang.name}`;
                const bill = await variableRateBillCreator.buildBillSchema({
                  request,
                  workflow,
                  task,
                  providerTask,
                });
                _.set(bill, 'siConnector.isMocked', mockBills);
                billsToCreate.push(bill);
              });
            });
          });
        },
      );
    });
    const createdBills = await this.schema.Bill.insertMany(billsToCreate);
    await this._updateVendorBalances(createdBills);
    return createdBills;
  }

  async _updateVendorBalances(createdBills) {
    const processedVendors = [];
    await Promise.map(createdBills, async (bill) => {
      if (processedVendors.includes(bill.vendor.toString())) {
        return;
      }
      processedVendors.push(bill.vendor.toString());
      await this.schema.User.lockDocument({ _id: bill.vendor });
      await this.schema.User.consolidateVendorBalance(bill.vendor);
    },
    { concurrency: 10 });
  }

  _buildRequest1Workflows({
    breakdowns,
    wordsUnit,
    hoursUnit,
    providers,
    minChargedLang,
  }) {
    return ratesLanguages.map(({ sourceLanguage, targetLanguage }) => ({
      projectedCostTotal: 0,
      tasks: [
        {
          status: 'Approved',
          minCharge: targetLanguage.isoCode === minChargedLang ? 50 : 0,
          foreignMinCharge: targetLanguage.isoCode === minChargedLang ? 50 : 0,
          total: targetLanguage.isoCode === minChargedLang ? 50 : 0,
          foreignTotal: targetLanguage.isoCode === minChargedLang ? 50 : 0,
          invoiceDetails: breakdowns.map((breakdown) => {
            const priceKey =
              Object.keys(companiesBreakdownToRateMap).find(key => breakdown.name.includes(key));
            const unitPrice = companiesBreakdownToRateMap[priceKey];
            return {
              projectedCost: {
                breakdown: _.pick(breakdown, ['_id', 'name']),
                translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                unitPrice: 0,
                quantity: 100,
              },
              invoice: {
                pdfPrintable: false,
                foreignUnitPrice: unitPrice,
                breakdown: _.pick(breakdown, ['_id', 'name']),
                translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                unitPrice,
                quantity: 100,
                isInvoiced: false,
              },
            };
          }),
          providerTasks: [
            {
              files: [],
              taskDueDate: moment.utc().add(2, 'weeks').format(),
              status: 'approved',
              notes: '',
              minCharge: targetLanguage.isoCode === minChargedLang ? 15 : 0,
              quantity: [{ amount: 0, units: '' }],
              billDetails: breakdowns.map((breakdown) => {
                const priceKey =
                  Object.keys(vendorsBreakdownToRateMap).find(key => breakdown.name.includes(key));
                let unitPrice = _.get(vendorsBreakdownToRateMap, priceKey, 0);
                let quantity = 0;
                let total = 0;
                if (['Repetitions', '100%', 'No match'].includes(breakdown.name)) {
                  unitPrice = 1;
                  quantity = 1;
                  total = 1;
                }
                return {
                  breakdown: _.pick(breakdown, ['_id', 'name']),
                  translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                  unitPrice,
                  quantity,
                  currency: { _id: null, name: '' },
                  total,
                };
              }),
              priorityStatus: 'pending',
              provider: targetLanguage.isoCode === minChargedLang
                ? {
                  _id: providers[0]._id,
                  deleted: providers[0].deleted,
                  terminated: providers[0].terminated,
                  name: `${providers[0].firstName} ${providers[0].lastName}`,
                  flatRate: providers[0].vendorDetails.billingInformation.flatRate,
                }
                : {
                  _id: providers[1]._id,
                  deleted: providers[1].deleted,
                  terminated: providers[1].terminated,
                  name: `${providers[1].firstName} ${providers[1].lastName}`,
                  flatRate: providers[1].vendorDetails.billingInformation.flatRate,
                },
            },
          ],
          ability: 'Translation',
          description: '',
        },
        {
          status: 'Approved',
          minCharge: targetLanguage.isoCode === minChargedLang ? 50 : 0,
          foreignMinCharge: targetLanguage.isoCode === minChargedLang ? 50 : 0,
          total: targetLanguage.isoCode === minChargedLang ? 50 : 0,
          foreignTotal: targetLanguage.isoCode === minChargedLang ? 50 : 0,
          invoiceDetails: breakdowns.map((breakdown) => {
            const priceKey =
              Object.keys(companiesBreakdownToRateMap).find(key => breakdown.name.includes(key));
            let unitPrice = companiesBreakdownToRateMap[priceKey];
            let quantity = 0;
            if (['Repetitions', '100%', 'No match'].includes(breakdown.name)) {
              unitPrice = 1;
              quantity = 1;
            }
            return {
              projectedCost: {
                breakdown: _.pick(breakdown, ['_id', 'name']),
                translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                unitPrice: 0,
                quantity,
              },
              invoice: {
                pdfPrintable: false,
                foreignUnitPrice: unitPrice,
                breakdown: _.pick(breakdown, ['_id', 'name']),
                translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                unitPrice,
                quantity,
                isInvoiced: false,
              },
            };
          }),
          providerTasks: [
            {
              files: [],
              taskDueDate: moment.utc().add(2, 'weeks').format(),
              status: 'approved',
              notes: '',
              minCharge: targetLanguage.isoCode === minChargedLang ? 15 : 0,
              quantity: [{ amount: 0, units: '' }],
              billDetails: breakdowns.map((breakdown) => {
                const priceKey =
                  Object.keys(vendorsBreakdownToRateMap).find(key => breakdown.name.includes(key));
                const unitPrice = _.get(vendorsBreakdownToRateMap, priceKey, 0);
                let quantity = 0;
                if (['Repetitions', '100%', 'No match'].includes(breakdown.name)) {
                  quantity = 1;
                }
                return {
                  breakdown: _.pick(breakdown, ['_id', 'name']),
                  translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                  unitPrice,
                  quantity,
                  currency: { _id: null, name: '' },
                  total: 0,
                };
              }),
              priorityStatus: 'pending',
              provider: {
                _id: providers[2]._id,
                deleted: providers[2].deleted,
                terminated: providers[2].terminated,
                name: `${providers[2].firstName} ${providers[2].lastName}`,
                flatRate: providers[2].vendorDetails.billingInformation.flatRate,
              },
            },
          ],
          ability: 'Translation',
          description: '',
        },
        {
          status: 'Approved',
          minCharge: 0,
          foreignMinCharge: 0,
          total: 0,
          foreignTotal: 0,
          invoiceDetails: [
            {
              projectedCost: {
                translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                unitPrice: 0,
                quantity: 65,
              },
              invoice: {
                pdfPrintable: false,
                foreignUnitPrice: 0,
                translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                unitPrice: 0.04,
                quantity: 65,
                isInvoiced: false,
              },
            },
          ],
          providerTasks: [
            {
              files: [],
              taskDueDate: moment.utc().add(2, 'weeks').format(),
              status: 'approved',
              notes: '',
              minCharge: 0,
              quantity: [{ amount: 0, units: '' }],
              billDetails: [
                {
                  translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                  unitPrice: 0.02,
                  quantity: 65,
                  currency: { _id: null, name: '' },
                  total: 0,
                },
              ],
              priorityStatus: 'future',
              provider: {
                _id: providers[3]._id,
                deleted: providers[3].deleted,
                terminated: providers[3].terminated,
                name: `${providers[3].firstName} ${providers[3].lastName}`,
                flatRate: providers[3].vendorDetails.billingInformation.flatRate,
              },
            },
          ],
          ability: 'Editing',
          description: '',
        },
        {
          status: 'Approved',
          minCharge: 0,
          foreignMinCharge: 0,
          total: 0,
          foreignTotal: 0,
          invoiceDetails: [
            {
              projectedCost: {
                translationUnit: _.pick(hoursUnit, ['_id', 'name']),
                unitPrice: 0,
                quantity: 0.25,
              },
              invoice: {
                pdfPrintable: false,
                foreignUnitPrice: 0,
                translationUnit: _.pick(hoursUnit, ['_id', 'name']),
                unitPrice: 45,
                quantity: 0.25,
                isInvoiced: false,
              },
            },
          ],
          providerTasks: [
            {
              files: [],
              taskDueDate: moment.utc().add(2, 'weeks').format(),
              status: 'approved',
              notes: '',
              minCharge: 0,
              quantity: [{ amount: 0, units: '' }],
              billDetails: [
                {
                  translationUnit: _.pick(hoursUnit, ['_id', 'name']),
                  unitPrice: 25,
                  quantity: 0.25,
                  currency: { _id: null, name: '' },
                  total: 0,
                },
              ],
              priorityStatus: 'future',
              provider: {
                _id: providers[4]._id,
                deleted: providers[4].deleted,
                terminated: providers[4].terminated,
                name: `${providers[4].firstName} ${providers[4].lastName}`,
                flatRate: providers[4].vendorDetails.billingInformation.flatRate,
              },
            },
          ],
          ability: 'QA Full memoQ',
          description: '',
        },
        {
          status: 'Approved',
          minCharge: 0,
          foreignMinCharge: 0,
          total: 0,
          foreignTotal: 0,
          invoiceDetails: [
            {
              projectedCost: {
                translationUnit: _.pick(hoursUnit, ['_id', 'name']),
                unitPrice: 0,
                quantity: 55,
              },
              invoice: {
                pdfPrintable: false,
                foreignUnitPrice: 0,
                translationUnit: _.pick(hoursUnit, ['_id', 'name']),
                unitPrice: 55,
                quantity: 0.25,
                isInvoiced: false,
              },
            },
          ],
          providerTasks: [
            {
              files: [],
              taskDueDate: moment.utc().add(2, 'weeks').format(),
              status: 'approved',
              notes: '',
              minCharge: 0,
              quantity: [{ amount: 0, units: '' }],
              billDetails: [
                {
                  translationUnit: _.pick(hoursUnit, ['_id', 'name']),
                  unitPrice: 30,
                  quantity: 0.25,
                  currency: { _id: null, name: '' },
                  total: 0,
                },
              ],
              priorityStatus: 'future',
              provider: {
                _id: providers[5]._id,
                deleted: providers[5].deleted,
                terminated: providers[5].terminated,
                name: `${providers[5].firstName} ${providers[5].lastName}`,
                flatRate: providers[5].vendorDetails.billingInformation.flatRate,
              },
            },
          ],
          ability: 'Link Check',
          description: '',
        },
      ],
      srcLang: sourceLanguage,
      tgtLang: targetLanguage,
      description: '',
      workflowDueDate: moment.utc().add(2, 'weeks').format(),
    }));
  }

  _buildRequest2Workflows({
    breakdowns,
    wordsUnit,
    hoursUnit,
    providers,
    minChargedLang,
  }) {
    return ratesLanguages.map(({ sourceLanguage, targetLanguage }) => ({
      projectedCostTotal: 0,
      tasks: [
        {
          status: 'Approved',
          minCharge: targetLanguage.isoCode === minChargedLang ? 50 : 0,
          foreignMinCharge: targetLanguage.isoCode === minChargedLang ? 50 : 0,
          total: targetLanguage.isoCode === minChargedLang ? 50 : 0,
          foreignTotal: targetLanguage.isoCode === minChargedLang ? 50 : 0,
          invoiceDetails: breakdowns.map((breakdown) => {
            const priceKey =
              Object.keys(companiesBreakdownToRateMap).find(key => breakdown.name.includes(key));
            const unitPrice = companiesBreakdownToRateMap[priceKey];
            return {
              projectedCost: {
                breakdown: _.pick(breakdown, ['_id', 'name']),
                translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                unitPrice: 0,
                quantity: 12,
              },
              invoice: {
                pdfPrintable: false,
                foreignUnitPrice: unitPrice,
                breakdown: _.pick(breakdown, ['_id', 'name']),
                translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                unitPrice,
                quantity: 12,
                isInvoiced: false,
              },
            };
          }),
          providerTasks: [
            {
              files: [],
              taskDueDate: moment.utc().add(2, 'weeks').format(),
              status: 'approved',
              notes: '',
              minCharge: targetLanguage.isoCode === minChargedLang ? 15 : 0,
              quantity: [{ amount: 0, units: '' }],
              billDetails: breakdowns.map((breakdown) => {
                const priceKey =
                  Object.keys(vendorsBreakdownToRateMap).find(key => breakdown.name.includes(key));
                const unitPrice = _.get(vendorsBreakdownToRateMap, priceKey, 0);
                return {
                  breakdown: _.pick(breakdown, ['_id', 'name']),
                  translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                  unitPrice,
                  quantity: 12,
                  currency: { _id: null, name: '' },
                  total: 0,
                };
              }),
              priorityStatus: 'pending',
              provider: {
                _id: providers[2]._id,
                deleted: providers[2].deleted,
                terminated: providers[2].terminated,
                name: `${providers[2].firstName} ${providers[2].lastName}`,
                flatRate: providers[2].vendorDetails.billingInformation.flatRate,
              },
            },
          ],
          ability: 'Translation',
          description: '',
        },
        {
          status: 'Approved',
          minCharge: 0,
          foreignMinCharge: 0,
          total: 0,
          foreignTotal: 0,
          invoiceDetails: [
            {
              projectedCost: {
                translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                unitPrice: 0,
                quantity: 65,
              },
              invoice: {
                pdfPrintable: false,
                foreignUnitPrice: 0,
                translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                unitPrice: 0.04,
                quantity: 65,
                isInvoiced: false,
              },
            },
          ],
          providerTasks: [
            {
              files: [],
              taskDueDate: moment.utc().add(2, 'weeks').format(),
              status: 'approved',
              notes: '',
              minCharge: 0,
              quantity: [{ amount: 0, units: '' }],
              billDetails: [
                {
                  translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                  unitPrice: 0.02,
                  quantity: 65,
                  currency: { _id: null, name: '' },
                  total: 0,
                },
              ],
              priorityStatus: 'future',
              provider: {
                _id: providers[3]._id,
                deleted: providers[3].deleted,
                terminated: providers[3].terminated,
                name: `${providers[3].firstName} ${providers[3].lastName}`,
                flatRate: providers[3].vendorDetails.billingInformation.flatRate,
              },
            },
          ],
          ability: 'Editing',
          description: '',
        },
        {
          status: 'Approved',
          minCharge: 0,
          foreignMinCharge: 0,
          total: 0,
          foreignTotal: 0,
          invoiceDetails: [
            {
              projectedCost: {
                translationUnit: _.pick(hoursUnit, ['_id', 'name']),
                unitPrice: 0,
                quantity: 0.25,
              },
              invoice: {
                pdfPrintable: false,
                foreignUnitPrice: 0,
                translationUnit: _.pick(hoursUnit, ['_id', 'name']),
                unitPrice: 45,
                quantity: 0.25,
                isInvoiced: false,
              },
            },
          ],
          providerTasks: [
            {
              files: [],
              taskDueDate: moment.utc().add(2, 'weeks').format(),
              status: 'approved',
              notes: '',
              minCharge: 0,
              quantity: [{ amount: 0, units: '' }],
              billDetails: [
                {
                  translationUnit: _.pick(hoursUnit, ['_id', 'name']),
                  unitPrice: 25,
                  quantity: 0.25,
                  currency: { _id: null, name: '' },
                  total: 0,
                },
              ],
              priorityStatus: 'future',
              provider: {
                _id: providers[4]._id,
                deleted: providers[4].deleted,
                terminated: providers[4].terminated,
                name: `${providers[4].firstName} ${providers[4].lastName}`,
                flatRate: providers[4].vendorDetails.billingInformation.flatRate,
              },
            },
          ],
          ability: 'QA Full memoQ',
          description: '',
        },
        {
          status: 'Approved',
          minCharge: 0,
          foreignMinCharge: 0,
          total: 0,
          foreignTotal: 0,
          invoiceDetails: [
            {
              projectedCost: {
                translationUnit: _.pick(hoursUnit, ['_id', 'name']),
                unitPrice: 0,
                quantity: 55,
              },
              invoice: {
                pdfPrintable: false,
                foreignUnitPrice: 0,
                translationUnit: _.pick(hoursUnit, ['_id', 'name']),
                unitPrice: 55,
                quantity: 0.25,
                isInvoiced: false,
              },
            },
          ],
          providerTasks: [
            {
              files: [],
              taskDueDate: moment.utc().add(2, 'weeks').format(),
              status: 'approved',
              notes: '',
              minCharge: 0,
              quantity: [{ amount: 0, units: '' }],
              billDetails: [
                {
                  translationUnit: _.pick(hoursUnit, ['_id', 'name']),
                  unitPrice: 30,
                  quantity: 0.25,
                  currency: { _id: null, name: '' },
                  total: 0,
                },
              ],
              priorityStatus: 'future',
              provider: {
                _id: providers[5]._id,
                deleted: providers[5].deleted,
                terminated: providers[5].terminated,
                name: `${providers[5].firstName} ${providers[5].lastName}`,
                flatRate: providers[5].vendorDetails.billingInformation.flatRate,
              },
            },
          ],
          ability: 'Link Check',
          description: '',
        },
      ],
      srcLang: sourceLanguage,
      tgtLang: targetLanguage,
      description: '',
      workflowDueDate: moment.utc().add(2, 'weeks').format(),
    }));
  }

  _findCountry(name) {
    return this.schema.Country.findOneWithDeleted({ name });
  }

  _findState(country, name) {
    return this.schema.State.findOneWithDeleted({ country, name });
  }

  _findCurrency(isoCode) {
    return this.schema.Currency.findOneWithDeleted({ isoCode, lspId: this.lspId });
  }

  _findBillingTerm(name) {
    return this.schema.BillingTerm.findOneWithDeleted({ name, lspId: this.lspId });
  }

  _findAbility(name) {
    return this.schema.Ability.findOneWithDeleted({ name, lspId: this.lspId });
  }

  _findGroup(name) {
    return this.schema.Group.findOneWithDeleted({ name, lspId: this.lspId });
  }

  _findCompetenceLevel(name) {
    return this.schema.CompetenceLevel.findOneWithDeleted({ name, lspId: this.lspId });
  }

  _findPaymentMethod(name) {
    return this.schema.PaymentMethod.findOneWithDeleted({ name, lspId: this.lspId });
  }

  _findTaxForm(name) {
    return this.schema.TaxForm.findOneWithDeleted({ name, lspId: this.lspId });
  }

  _findBreakdown(name) {
    return this.schema.Breakdown.findOneWithDeleted({ name, lspId: this.lspId });
  }

  _findDepartment(name) {
    return this.schema.InternalDepartment.findOneWithDeleted({ name, lspId: this.lspId });
  }

  _findUnit(name) {
    return this.schema.TranslationUnit.findOneWithDeleted({ name, lspId: this.lspId });
  }

  _findCompany(name) {
    return this.schema.Company.findOneWithDeleted({ name, lspId: this.lspId });
  }

  _findUser(email) {
    return this.schema.User.findOneWithDeleted({ email, lsp: this.lspId });
  }

  _findAccount(no) {
    return this.schema.Account.findOneWithDeleted({ no, lspId: this.lspId });
  }

  _findExpenseAccount(number) {
    return this.schema.ExpenseAccount.findOneWithDeleted({ number, lspId: this.lspId });
  }

  _findLsp() {
    return this.schema.Lsp.findOneWithDeleted({ _id: this.lspId });
  }

  _findAbilityExpenseAccount(expenseAccount, ability) {
    return this.schema.AbilityExpenseAccount.findOneWithDeleted({
      expenseAccount,
      ability,
      lspId: this.lspId,
    });
  }

  _buildRequestObject({
    requestNo,
    breakdowns,
    wordsUnit,
    hoursUnit,
    providers,
    minChargedLang,
    entityNamePrefix,
    title,
    competence,
    currency,
    department,
    company,
    contact,
    staff,
    buildRequestWorkflows,
  }) {
    return {
      no: requestNo,
      title: `${entityNamePrefix}Automated Script ${title}`,
      competenceLevels: [_.pick(competence, ['_id', 'name'])],
      recipient: '',
      rooms: 0,
      atendees: 0,
      expectedStartDate: '',
      expectedDurationTime: 0,
      deliveryDate: moment.utc().add(2, 'weeks').format(),
      internalComments: '',
      comments: '<p>none</p>',
      requireQuotation: false,
      late: false,
      rush: false,
      departmentNotes: '',
      poRequired: true,
      adjuster: '',
      memo: '',
      invoiceCompany: '',
      invoiceContact: '',
      assignmentStatus: '',
      deliveryMethod: '',
      requestType: '',
      schedulingCompany: '',
      schedulingContact: '',
      schedulingStatus: '',
      location: {
        _id: null,
        name: '',
        address: '',
        suite: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: '',
      },
      insuranceCompany: '',
      purchaseOrder: `${entityNamePrefix}Automated Script`,
      catTool: '',
      languageCombinations: [
        {
          tgtLangs: ratesLanguages.map(({ targetLanguage }) => targetLanguage),
          srcLangs: [
            {
              name: 'English',
              isoCode: 'ENG',
            },
          ],
        },
      ],
      receptionDate: '',
      actualStartDate: '',
      actualDeliveryDate: '',
      quoteCurrency: _.pick(currency, ['_id', 'isoCode']),
      internalDepartment: _.pick(department, ['_id', 'name']),
      company: _.pick(company, ['_id', 'cidr', 'hierarchy', 'status', 'name', 'internalDepartments', 'quoteCurrency']),
      contact: _.pick(contact, ['_id', 'projectManagers', 'inactiveNotifications', 'deleted', 'terminated', 'email', 'firstName', 'middleName', 'lastName', 'company']),
      sourceDocumentsList: '',
      repSignOff: false,
      status: 'Completed',
      isQuoteApproved: false,
      exchangeRate: 1,
      otherCC: [],
      bucketPrefixes: [],
      requestInvoiceStatus: 'Not Invoiced',
      deleted: false,
      lspId: this.lspId,
      quoteDueDate: Date.now(),
      localCurrency: currency,
      partners: [],
      opportunityNo: null,
      projectManagers: [_.pick(staff, ['_id', 'deleted', 'terminated', 'email', 'firstName', 'middleName', 'lastName'])],
      softwareRequirements: [],
      documentTypes: [],
      turnaroundTime: '',
      ipPatent: null,
      invoices: [],
      finalDocuments: [],
      bills: [],
      createdAt: moment().toDate(),
      createdBy: this.user.email,
      updatedBy: this.user.email,
      workflows: buildRequestWorkflows({
        breakdowns,
        wordsUnit,
        hoursUnit,
        providers,
        minChargedLang,
      }),
    };
  }

  _buildUserObject() {
    return {
      password: 'dskdsjkdsjkdsdjksfnjdfndjksnfjkdsfkjsdn@U#@^&E@()&#@(U*@U#(*#$*#$&)@#*)$(#*@$)*$#)(*)$*#$))#$$#($)*$)(#*)*#$*$)($*)*$)($)*KEDKI#O@#*(#_)$#_KR#*()*)(#*@(#*@)#(@#_(@@#(*@(*(@**($#($#*($(#$**($#(#$*(*$#(*$($#($($#(*IJKEJLFJDJHJFHJKLJDHFJKLHRFUVHHrDx6VXE^w7CHSr+2PGEYaED7QaGypQZ$cr#@!',
      securityPolicy: {
        passwordExpirationDays: 60,
        numberOfPasswordsToKeep: 2,
        minPasswordLength: 10,
        maxInvalidLoginAttempts: 2,
        lockEffectivePeriod: 15,
        timeoutInactivity: 30,
        passwordComplexity: {
          lowerCaseLetters: true,
          upperCaseLetters: true,
          specialCharacters: true,
          hasDigitsIncluded: true,
        },
      },
      isOverwritten: false,
      preferences: {
        preferredLanguageCombination: '',
      },
      failedLoginAttempts: 0,
      startLockEffectivePeriod: null,
      lastLoginAt: null,
      projectManagers: [],
      forcePasswordChange: false,
      isLocked: false,
      isApiUser: true,
      terminated: false,
      terminatedAt: null,
      inactiveNotifications: [],
      certificationsText: '',
      nationalityText: '',
      mainPhoneText: '',
      internalDepartmentsText: '',
      minimumHoursText: '',
      hireDateText: '',
      phoneNumberText: '',
      taxFormText: '',
      salesRepText: '',
      leadSourceText: '',
      hipaaText: '',
      ataCertifiedText: '',
      escalatedText: 'false',
      fixedCostText: '',
      priorityPaymentText: '',
      wtFeeWaivedText: '',
      uiSettings: {
        catUiSettings: {
          inlineUserTags: {
            color: '#F9CB9C',
          },
          inlineSystemTags: {
            color: '#0000FF',
          },
          qaErrorMessages: {
            color: '#FF0000',
          },
          qaWarningMessages: {
            color: '#F6B26B',
          },
        },
      },
      useTwoFactorAuthentification: false,
      siConnector: {
        isSynced: true,
        error: null,
        isMocked: true,
      },
      lsp: this.lspId,
      updatedBy: this.user.email,
      createdBy: this.user.email,
      abilities: [],
      languageCombinations: [],
      catTools: [],
    };
  }

  _buildVendorDetails(
    entityNamePrefix,
    {
      vendorInfo,
      competenceLevel,
      department,
      country,
      state,
      currency,
      billingTerm,
      taxForm,
      translationAbility,
      editingAbility,
      qaAbility,
      linkCheckAbility,
      breakdowns,
      wordsUnit,
      hoursUnit,
    },
  ) {
    return {
      vendorDetails: {
        type: 'V3',
        competenceLevels: [competenceLevel._id],
        internalDepartments: [_.pick(department, ['_id', 'name'])],
        minHours: 0,
        phoneNumber: '234234234',
        address: {
          line1: `${entityNamePrefix}address`,
          line2: '',
          city: 'Paris',
          zip: '3456',
          country: _.pick(country, ['_id', 'name']),
          state: _.pick(state, ['_id', 'name', 'code', 'country']),
        },
        approvalMethod: 'Technical Evaluation',
        hireDate: moment.utc().format(),
        billingInformation: {
          paymentMethod: vendorInfo.paymentMethod._id,
          currency: currency._id,
          billingTerms: billingTerm._id,
          taxForm: [taxForm._id],
          form1099Type: 'MISC',
          form1099Box: '3 - Other Income',
          taxId: '12-3456789',
        },
        minimumHours: null,
        originCountry: null,
        vendorStatus: 'Approved',
        rates: _.flatten(ratesLanguages.map(({ sourceLanguage, targetLanguage }) => ([
          {
            ability: translationAbility,
            sourceLanguage,
            targetLanguage,
            internalDepartment: null,
            catTool: 'MemoQ',
            minimumCharge: 0,
            rateDetails: breakdowns.map((breakdown) => {
              const priceKey =
                Object.keys(vendorsBreakdownToRateMap).find(key => breakdown.name.includes(key));
              const price = vendorsBreakdownToRateMap[priceKey];
              return {
                breakdown: _.pick(breakdown, ['_id', 'name']),
                price,
                translationUnit: _.pick(wordsUnit, ['_id', 'name']),
                currency: _.pick(currency, ['_id', 'name']),
              };
            }),
          },
          {
            ability: editingAbility,
            sourceLanguage,
            targetLanguage,
            internalDepartment: null,
            catTool: 'MemoQ',
            minimumCharge: 0,
            rateDetails: [{
              price: 0.02,
              translationUnit: _.pick(wordsUnit, ['_id', 'name']),
              currency: _.pick(currency, ['_id', 'name']),
            }],
          },
          {
            ability: qaAbility,
            sourceLanguage,
            targetLanguage,
            internalDepartment: null,
            catTool: 'MemoQ',
            minimumCharge: 0,
            rateDetails: [{
              price: 25,
              translationUnit: _.pick(hoursUnit, ['_id', 'name']),
              currency: _.pick(currency, ['_id', 'name']),
            }],
          },
          {
            ability: linkCheckAbility,
            sourceLanguage,
            targetLanguage,
            internalDepartment: null,
            catTool: 'MemoQ',
            minimumCharge: 0,
            rateDetails: [{
              price: 30,
              translationUnit: _.pick(hoursUnit, ['_id', 'name']),
              currency: _.pick(currency, ['_id', 'name']),
            }],
          },
        ]))),
      },
    };
  }

  _buildCompanyObject({
    name,
    hierarchy,
    country,
    currency,
    billingTerm,
    wordsUnit,
    hoursUnit,
    breakdowns,
    department,
    isParent,
    parentCompany,
  }) {
    return {
      name,
      hierarchy,
      parentCompany: _.isNil(parentCompany) ? null : parentCompany,
      status: 'Won',
      industry: 'Automotive',
      pursuitActive: false,
      customerTierLevel: '1',
      website: '',
      primaryPhoneNumber: '',
      notes: '',
      mailingAddress: {
        line1: '',
        line2: '',
        city: '',
        zip: '',
        country: _.get(country, '_id'),
      },
      billingAddress: {
        line1: '',
        line2: '',
        city: '',
        zip: '',
        country: _.get(country, '_id'),
      },
      billingEmail: '',
      billingInformation: {
        grossProfit: 0,
        quoteCurrency: currency,
        billingTerm,
        rates: _.flatten(ratesLanguages.map(({ sourceLanguage, targetLanguage }) =>
          this._buildRatesObjects({
            sourceLanguage,
            targetLanguage,
            wordsUnit,
            hoursUnit,
            currency,
            breakdowns,
          }))),
      },
      internalDepartments: [department],
      isOverwritten: false,
      pcSettings: {
        mtThreshold: 75,
      },
      lspId: this.lspId,
      isParent,
      retention: {
        days: 2555,
        hours: 0,
        minutes: 0,
      },
      serviceAgreement: false,
      mandatoryRequestContact: true,
      serviceAgreementText: 'false',
      locationsText: '',
      purchaseOrderRequiredText: 'false',
      grossProfitText: '0',
      onHoldText: 'false',
      siConnector: {
        isSynced: true,
        error: null,
        isMocked: true,
      },
      createdBy: this.user.email,
    };
  }

  _buildRatesObjects({
    sourceLanguage, targetLanguage, wordsUnit, hoursUnit, currency, breakdowns,
  }) {
    return [
      {
        sourceLanguage,
        targetLanguage,
        ability: 'Link Check',
        rateDetails: [
          {
            breakdown: null,
            price: 55,
            translationUnit: _.get(hoursUnit, '_id'),
            currency: _.get(currency, '_id'),
          },
        ],
      },
      {
        sourceLanguage,
        targetLanguage,
        ability: 'QA Full memoQ',
        rateDetails: [
          {
            price: 45,
            translationUnit: _.get(hoursUnit, '_id'),
            currency: _.get(currency, '_id'),
            breakdown: null,
          },
        ],
      },
      {
        sourceLanguage,
        targetLanguage,
        ability: 'Editing',
        rateDetails: [
          {
            price: 0.04,
            translationUnit: _.get(wordsUnit, '_id'),
            currency: _.get(currency, '_id'),
            breakdown: null,
          },
        ],
      },
      {
        sourceLanguage,
        targetLanguage,
        ability: 'Translation',
        rateDetails: breakdowns.map((breakdown) => {
          const priceKey =
            Object.keys(companiesBreakdownToRateMap).find(key => breakdown.name.includes(key));
          const price = companiesBreakdownToRateMap[priceKey];
          return {
            price,
            translationUnit: _.get(wordsUnit, '_id'),
            currency: _.get(currency, '_id'),
            breakdown: breakdown._id,
          };
        }),
      },
    ];
  }

  _getDeleteCompanyOperation(companyId) {
    return {
      deleteOne: {
        filter: {
          _id: companyId,
        },
      },
    };
  }

  _getDeleteUserIds(request) {
    const testUserFirstName = 'ar-ap-test';
    const userIds = new Set();
    if (request.contact.firstName === testUserFirstName) {
      userIds.add(request.contact._id.toString());
    }
    request.contact.projectManagers.forEach((user) => {
      if (user.firstName === testUserFirstName) {
        userIds.add(user._id.toString());
      }
    });
    request.projectManagers.forEach((user) => {
      if (user.firstName === testUserFirstName) {
        userIds.add(user._id.toString());
      }
    });
    forEachProviderTask(request, ({ providerTask: { provider } }) => {
      const providerId = _.get(provider, '_id');
      if (_.get(provider, 'name', '').includes(testUserFirstName)) {
        userIds.add(providerId.toString());
      }
    });
    return { userIds: Array.from(userIds) };
  }
}

module.exports = ArApTestsApi;
