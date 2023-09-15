const mongoose = require('mongoose');
const _ = require('lodash');
const BSON = require('bson');
const { getRoles } = require('../roles');
const { decimal128ToNumber, bigJsToNumber } = require('../bigjs');
const logger = require('../../components/log/logger');

const { Types: { ObjectId }, isValidObjectId } = mongoose;
const extractChildArray = (arr, property) => _.flatten(_.map(arr, (obj) => _.get(obj, property, [])));
const validObjectId = (_id) => {
  if (typeof _id === 'object') {
    return isValidObjectId(_id);
  }
  const isNumber = /^\d+$/.test(_id);
  if (isNumber) {
    return false;
  }
  try {
    const objId = new ObjectId(_id);
    return objId.toString() === _id;
  } catch (err) {
    return false;
  }
};

const checkDocumentExceedsSize = (doc, maxSize = 16) => {
  const docSizeInBytes = BSON.calculateObjectSize(doc);
  const docSizeInMB = docSizeInBytes / (1024 ** 2);
  return docSizeInMB > maxSize;
};

const salesRepPopulate = {
  _id: 1,
  firstName: 1,
  lastName: 1,
  lsp: 1,
  deleted: 1,
  terminated: 1,
  type: 1,
};

const userLspPopulate = (prefix) => {
  const selected = {
    _id: 1,
    firstName: 1,
    middleName: 1,
    lastName: 1,
    email: 1,
    lsp: 1,
    deleted: 1,
    terminated: 1,
    type: 1,
    inactiveNotifications: 1,
  };

  if (prefix) {
    const prefixedSelect = {};

    prefixedSelect[prefix] = 1;
    Object.keys(selected).forEach((k) => {
      prefixedSelect[`${prefix}.${k}`] = selected[k];
    });
    return prefixedSelect;
  }
  return selected;
};
const populateStrToObj = (populate) => populate.split(' ').map((p) => ({ path: p }));
const pushPopulates = (populate, population) => {
  if (typeof populate === 'string') {
    populateStrToObj(populate).forEach((p) => {
      population.push(p);
    });
  } else if (Array.isArray(populate)) {
    population.forEach((p) => {
      // recursive call
      pushPopulates(p, population);
    });
  } else if (typeof populate === 'object') {
    population.push(populate);
  }
};

const contactSelect = (prefix) => {
  const selected = {
    _id: 1,
    firstName: 1,
    middleName: 1,
    lastName: 1,
    email: 1,
    lsp: 1,
    deleted: 1,
    terminated: 1,
    type: 1,
    inactiveNotifications: 1,
  };

  if (prefix) {
    const prefixedSelect = {};

    prefixedSelect[prefix] = 1;
    Object.keys(selected).forEach((k) => {
      prefixedSelect[`${prefix}.${k}`] = selected[k];
    });
    return prefixedSelect;
  }
  return selected;
};
const vendorSelect = (prefix) => {
  const selected = {
    _id: 1,
    firstName: 1,
    middleName: 1,
    lastName: 1,
    email: 1,
    lsp: 1,
    deleted: 1,
    terminated: 1,
    type: 1,
    inactiveNotifications: 1,
    'vendorDetails.rates': 1,
    'vendorDetails.billingInformation.currency': 1,
  };

  if (prefix) {
    const prefixedSelect = {};

    prefixedSelect[prefix] = 1;
    Object.keys(selected).forEach((k) => {
      prefixedSelect[`${prefix}.${k}`] = selected[k];
    });
    return prefixedSelect;
  }
  return selected;
};

const requestContactSelect = (prefix) => {
  const contactSelectProps = contactSelect(prefix);
  let properPrefix = '';

  if (prefix) {
    contactSelectProps[prefix] = 1;
    properPrefix = `${prefix}.`;
  }
  contactSelectProps[`${properPrefix}projectManagers`] = 1;
  contactSelectProps[`${properPrefix}company`] = 1;
  return contactSelectProps;
};

const contactWithProjectManagerSelect = (prefix) => {
  const contactSelectProps = contactSelect(prefix);

  if (prefix) {
    contactSelectProps[prefix] = 1;
    contactSelectProps[`${prefix}.projectManagers`] = 1;
  } else {
    contactSelectProps.projectManagers = 1;
  }
  return contactSelectProps;
};

const providerSelect = (prefix) => {
  const contactSelectProps = contactSelect(prefix);

  if (prefix) {
    contactSelectProps[prefix] = 1;
    contactSelectProps[`${prefix}.abilities`] = 1;
    contactSelectProps[`${prefix}.languageCombinations`] = 1;
    contactSelectProps[`${prefix}.catTools`] = 1;
    contactSelectProps[`${prefix}.vendorDetails.billingInformation.flatRate`] = 1;
    contactSelectProps[`${prefix}.vendorDetails.competenceLevels`] = 1;
  } else {
    contactSelectProps.abilities = 1;
    contactSelectProps.languageCombinations = 1;
    contactSelectProps.catTools = 1;
    contactSelectProps['vendorDetails.billingInformation.flatRate'] = 1;
    contactSelectProps['vendorDetails.competenceLevels'] = 1;
    contactSelectProps['vendorDetails.escalated'] = 1;
  }
  return contactSelectProps;
};

const vendorProviderSelect = (prefix) => {
  const vendorSelectProps = vendorSelect(prefix);

  if (prefix) {
    vendorSelectProps[prefix] = 1;
    vendorSelectProps[`${prefix}.abilities`] = 1;
    vendorSelectProps[`${prefix}.languageCombinations`] = 1;
    vendorSelectProps[`${prefix}.catTools`] = 1;
  } else {
    vendorSelectProps.abilities = 1;
    vendorSelectProps.languageCombinations = 1;
    vendorSelectProps.catTools = 1;
  }
  return vendorSelectProps;
};

const companyDefaultPopulate = {
  _id: 1,
  name: 1,
  parentCompany: 1,
  hierarchy: 1,
  status: 1,
};

const convertToObjectId = (id) => {
  if (id instanceof ObjectId) {
    return id;
  }
  if (_.isString(id)) {
    return new ObjectId(id);
  }
  return '';
};

const areObjectIdsEqual = (id1, id2) => {
  try {
    const objId1 = new ObjectId(_.get(id1, '_id', id1));
    const objId2 = new ObjectId(_.get(id2, '_id', id2));
    return objId1.equals(objId2);
  } catch (err) {
    return false;
  }
};

const hasUserAccessToSchema = (schemaName, user, permissionLevels) => {
  const incompleteRolesSchemas = {
    Country: [],
    Currency: ['CREATE_ALL', 'UPDATE_ALL'],
    Language: ['CREATE_ALL', 'UPDATE_ALL'],
    State: [],
  };
  const roleAliases = {
    ArInvoice: 'Invoice',
    AuditTrails: 'Audit',
    Certification: 'User',
    CompanyDepartmentRelationship: 'CompanyDeptRelationship',
    CompanyMinimumCharge: 'CompanyMinCharge',
    CompanyExternalAccountingCode: 'ExternalAccountingCode',
    Account: 'RevenueAccount',
    CatTool: 'Cat',
    VendorMinimumCharge: 'VendorMinCharge',
    ArAdvance: 'ArPayment',
    SchedulingStatus: 'Request',
    RequestType: 'Request',
    Check: 'ApPayment',
    TaxForm: 'Vendor',
    ProviderInstructions: 'ProviderTaskInstructions',
  };
  schemaName = _.get(roleAliases, schemaName, schemaName);
  if (_.has(incompleteRolesSchemas, schemaName)) {
    permissionLevels = _.intersection(permissionLevels, incompleteRolesSchemas[schemaName]);
  }
  if (_.isEmpty(permissionLevels)) {
    return true;
  }
  schemaName = _.kebabCase(schemaName).toUpperCase();
  const roleRegExp = new RegExp(`^${schemaName}[A-Z-]*_(?:${permissionLevels.join('|')})$`);
  return getRoles(user).some((role) => roleRegExp.test(role));
};

const Decimal128Custom = {
  type: mongoose.Schema.Types.Decimal128,
  get: decimal128ToNumber,
  set: bigJsToNumber,
};

const Decimal128SchemaOptions = {
  id: false,
  toJSON: { getters: true },
  toObject: { getters: true },
};

const currencyCommonFields = {
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Currency',
    required: true,
  },
  isoCode: {
    type: String,
    required: true,
  },
};

const cursorMapAsyncHelper = async (cursor, eachAsyncFn, options = {}, entity) => {
  try {
    const results = [];

    await cursor.eachAsync(async (doc) => {
      const processedRecord = await eachAsyncFn(doc);

      if (_.isNil(processedRecord) || _.isEmpty(processedRecord)) {
        logger.debug(`Failed to process ${entity} entity with id ${doc._id}`);
      } else {
        results.push(processedRecord);
      }
    }, options);
    return results;
  } catch (err) {
    logger.debug(`Error in cusorMapAsyncHelper when processing ${entity} entity`, err);
    throw err;
  }
};

const safeConvertToObjectId = (id, fallback = null) => {
  try {
    const converted = convertToObjectId(id);
    return converted;
  } catch (err) {
    return fallback;
  }
};

const transformDecimal128Fields = (doc, obj) => {
  _.keys(obj).forEach((key) => {
    obj[key] = decimal128ToNumber(obj[key]);
  });
  return obj;
};

module.exports = {
  extractChildArray,
  contactSelect,
  companyDefaultPopulate,
  providerSelect,
  vendorProviderSelect,
  pushPopulates,
  requestContactSelect,
  userLspPopulate,
  salesRepPopulate,
  validObjectId,
  convertToObjectId,
  checkDocumentExceedsSize,
  contactWithProjectManagerSelect,
  areObjectIdsEqual,
  hasUserAccessToSchema,
  Decimal128Custom,
  Decimal128SchemaOptions,
  currencyCommonFields,
  cursorMapAsyncHelper,
  safeConvertToObjectId,
  transformDecimal128Fields,
};
