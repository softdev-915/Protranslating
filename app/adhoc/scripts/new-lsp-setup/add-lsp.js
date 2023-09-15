
const _ = require('lodash');
const bcrypt = require('bcrypt');
const prompt = require('prompt-sync')();
const Promise = require('bluebird');
const { Types: { ObjectId } } = require('mongoose');
const csv = require('csvtojson');
const mongo = require('../../../components/database/mongo');
const configuration = require('../../../components/configuration');
const { countries } = require('./countries.json');
const { states } = require('./states.json');
const { roles } = require('./roles.json');
const { groups } = require('./groups.json');
const { schedulers } = require('./schedulers.json');

const env = configuration.environment;
const lspName = prompt('> Enter the new lsp name: ');
const lspCurrency = prompt('> Enter the currency: (Iso code, ex: USD): ');
const adminEmail = prompt('> Enter the email of the admin: ');
const adminFirstName = prompt('> Enter the first name: ');
const adminLastName = prompt('> Enter the last name: ');
const ADMIN_PASSWORD = prompt('> Enter the password: ');
const HASHED_PASSWORD = bcrypt.hashSync(ADMIN_PASSWORD, env.PWD_SALT_ROUND);
// eslint-disable-next-line max-len
const mandatoryValues = [lspName, lspCurrency, adminEmail, adminFirstName, adminLastName, HASHED_PASSWORD];

if (mandatoryValues.some(v => _.isEmpty(v))) {
  process.exit();
}
const addCountry = async (db, { name, code }) => {
  const countryCollection = db.collection('countries');
  const hasCountries = await countryCollection.find({}).count() >= 1;
  if (hasCountries) return Promise.resolve();
  const newCountry = await countryCollection.findOneAndUpdate({ code },
    {
      $set: {
        name,
        code,
      },
    },
    { new: true, upsert: true });
  const upsertedCountryId = _.get(newCountry, 'lastErrorObject.upserted');
  const countryId = _.get(newCountry, 'value._id', upsertedCountryId);
  return countryId;
};

const updateState = async (db, state, country) => {
  const stateCollection = db.collection('states');
  const { name, code } = state;
  return stateCollection.updateMany(
    {
      $or: [
        { name },
        { code },
      ],
    },
    {
      $set: {
        name,
        code,
        country: country._id,
      },
    },
    {
      upsert: true,
    });
};

const addCountriesAndStates = async (db) => {
  const countryCollection = db.collection('countries');
  const hasCountries = await countryCollection.find({}).count() >= 1;
  if (hasCountries) return Promise.resolve();
  console.log('Adding countries and states...');
  return Promise.map(countries, country => addCountry(db, country)
    .then(updatedCountryId =>
      Promise.map(states.filter(s =>
        s.country === country.code), state => updateState(db, state, updatedCountryId)),
    ));
};

const addCurrencies = async (db, lspId) => {
  console.log('Adding currencies...');
  const currenciesCol = db.collection('currencies');
  const currencies = await csv().fromFile('./currencies.csv');
  await Promise.mapSeries(currencies, ({ ISOCODE, NAME }) =>
    currenciesCol.findOneAndUpdate({
      isoCode: ISOCODE,
      lspId,
    }, {
      $set: {
        isoCode: ISOCODE,
        name: NAME,
        lspId,
      },
    }, { upsert: true }),
  );
};

const addSchedulers = async (db, lspId) => {
  console.log('Adding schedulers...');
  const schedulersCol = db.collection('schedulers');
  await Promise.map(schedulers, (scheduler) => {
    delete scheduler._id;
    Object.assign(scheduler, {
      lspId: lspId,
      createdAt: new Date(),
      updatedAt: new Date(),
      restoredAt: null,
      deletedAt: null,
      schedule: null,
    });
    return schedulersCol.findOneAndUpdate({
      name: scheduler.name,
      lspId,
    }, {
      $set: scheduler,
    }, { upsert: true });
  });
};

const addLanguages = async (db) => {
  console.log('Adding languages...');
  const languagesCol = db.collection('languages');
  const languages = await csv().fromFile('./languages.csv');
  await Promise.mapSeries(languages, ({ ISOCODE, NAME }) =>
    languagesCol.findOneAndUpdate({
      isoCode: ISOCODE,
    }, {
      $set: {
        isoCode: ISOCODE,
        name: NAME,
      },
    }, { upsert: true }),
  );
};

const addRoles = async (db) => {
  console.log('Adding roles...');
  const rolesCol = db.collection('roles');
  await Promise.map(roles, async (role) => {
    const roleInDb = await rolesCol.findOne({
      name: role.name,
    });
    if (_.isNil(roleInDb)) {
      await rolesCol.insertOne(role);
    }
  });
};

const addGroups = async (db, lspId) => {
  console.log('Adding groups...');
  const addedGroups = [];
  const groupsCol = db.collection('groups');
  await Promise.map(groups, async (group) => {
    group.lspId = lspId;
    const newGroup = await groupsCol.findOneAndUpdate(
      { name: group.name, lspId },
      { $set: group },
      {
        new: true,
        upsert: true,
      });
    const upsertedGroupId = _.get(newGroup, 'lastErrorObject.upserted');
    const newGroupId = _.get(newGroup, 'value._id', upsertedGroupId);
    Object.assign(group, {
      lspId,
      _id: newGroupId,
    });
    addedGroups.push(group);
  });
  return addedGroups;
};

const addUsers = async (db, lmsAuthCol, user) => {
  console.log('Adding users...');
  const usersCol = db.collection('users');
  const userAuth = {
    email: user.email,
    userId: new ObjectId(),
    lspId: user.lsp,
    password: HASHED_PASSWORD,
  };
  const newUser = {
    lsp: user.lsp,
    roles: [],
    forcePasswordChange: false,
    type: 'Staff',
    useTwoFactorAuthentication: false,
    staffDetails: {
      hireDate: new Date(),
      hiringDocuments: [],
    },
  };
  Object.assign(newUser, user);
  await usersCol.findOneAndUpdate({
    email: user.email,
    lsp: userAuth.lspId,
  }, { $set: newUser }, { upsert: true });
  await lmsAuthCol.updateOne(
    { email: user.email, lspId: userAuth.lspId },
    { $set: userAuth },
    { upsert: true });
};

const updateLsp = async (db, lspId, currency) => {
  console.log('Updating lsp currency');
  const lspCol = db.collection('lsp');
  const currenciesCol = db.collection('currencies');
  const localCurrency = await currenciesCol.findOne({ isoCode: currency, lspId }, { _id: 1 });
  const update = {
    currencyExchangeDetails: [{
      base: localCurrency._id,
      quote: localCurrency._id,
      quotation: 1,
    }],
  };
  return lspCol.findOneAndUpdate({ _id: lspId }, { $set: update });
};

const addLsp = async (db, name) => {
  console.log('Adding lsp...');
  const lspCol = db.collection('lsp');
  const lsp = {
    name,
    emailConnectionString: 'SqmaBkbdvE0f6YkCy9XW+0b4P9hpQHGwKQUCebQmzuCptMKN8F9iJeSRRVX8Oz0=',
    securityPolicy: {
      passwordComplexity: {
        lowerCaseLetters: true,
        upperCaseLetters: true,
        specialCharacters: true,
        hasDigitsIncluded: true,
      },
      passwordExpirationDays: 60,
      numberOfPasswordsToKeep: 2,
      minPasswordLength: 10,
      maxInvalidLoginAttempts: 6,
      lockEffectivePeriod: 15,
      timeoutInactivity: 30,
    },
  };
  const newLsp = await lspCol.findOneAndUpdate(
    { name },
    { $set: lsp },
    {
      new: true,
      upsert: true,
    });
  const upsertedLspId = _.get(newLsp, 'lastErrorObject.upserted');
  const lspId = _.get(newLsp, 'value._id', upsertedLspId);
  return lspId;
};

mongo.connect(configuration)
  .then(async (connections) => {
    const { mongoose, mongooseAuth } = connections;
    const db = mongoose.connection;
    const lmsAuth = mongooseAuth.collection('lmsAuth');
    console.log('Started process');
    try {
      const lsp = await addLsp(db, lspName);
      console.log('Done...');
      const lspId = new ObjectId(lsp);
      await addCurrencies(db, lspId);
      console.log('Done...');
      await updateLsp(db, lspId, lspCurrency);
      console.log('Done...');
      await addCountriesAndStates(db);
      console.log('Done...');
      await addRoles(db);
      console.log('Done...');
      const newGroups = await addGroups(db, lspId);
      console.log('Done...');
      await addLanguages(db);
      console.log('Done...');
      await addSchedulers(db, lspId);
      console.log('Done...');
      const ADMIN = {
        email: adminEmail,
        firstName: adminFirstName,
        lastName: adminLastName,
        groups: newGroups,
        lsp: lspId,
      };
      await addUsers(db, lmsAuth, ADMIN);
      console.log('Finished');
    } catch (error) {
      console.log(`Failed importing. Err: ${error}`);
    }
    process.exit();
  });
