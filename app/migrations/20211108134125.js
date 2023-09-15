/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const OLD_TO_NEW_REFERENCES = {
  'BillAdjustment.vendor._id': 'BillAdjustment.vendor', 'Bill.vendor.vendorId': 'Bill.vendor',
};
const REFERENCES_TO_SCHEMAS = { 'BillAdjustment.vendor': 'User', 'Bill.vendor': 'User' };
const replaceRefFrom = (obj, path) => {
  const refFrom = _.get(obj, path);
  const oldRef = Object.keys(OLD_TO_NEW_REFERENCES).find(ref => refFrom === ref);
  if (_.isString(oldRef)) {
    _.set(obj, path, refFrom.replace(oldRef, OLD_TO_NEW_REFERENCES[oldRef]));
  }
};
const replaceField = (obj, fieldPath, refPath, entities) => {
  const field = _.get(obj, fieldPath);
  const reference = Object.keys(REFERENCES_TO_SCHEMAS).find(ref => field.startsWith(`${ref}.`));
  if (_.isNil(reference)) {
    return false;
  }
  const schema = REFERENCES_TO_SCHEMAS[reference];
  _.set(obj, refPath, reference);
  _.set(obj, fieldPath, field.replace(reference, schema));
  const newEntity = { refFrom: reference, name: schema };
  if (_.isEmpty(_.find(entities, newEntity))) {
    entities.push(newEntity);
  }
  return true;
};
const replaceCustomQueryData = (customQuery, section, refFromPath, fieldPath) => {
  customQuery[section].forEach((obj) => {
    if (!replaceField(obj, fieldPath, refFromPath, customQuery.entities)) {
      replaceRefFrom(obj, refFromPath);
    }
  });
};

const updateFilterGroup = (customQuery, group) => {
  group.children.forEach((child) => {
    switch (child.type) {
      case 'group':
        updateFilterGroup(customQuery, child.query);
        break;
      case 'rule':
        if (!replaceField(child.query, 'field', 'refFrom', customQuery.entities)) {
          replaceRefFrom(child.query, 'refFrom');
        }
        break;
      default:
        throw new Error(`No such type ${child.type} could be inside the Custom Queries filter`);
    }
  });
};

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const connection = await connections.mongoose.connection;
  const customQueries = connection.collection('customQueries');
  const schemas = _.uniq(Object.keys(OLD_TO_NEW_REFERENCES).map(ref => ref.split('.')[0]));
  const cursor = await customQueries.find({
    'entities.name': { $in: schemas },
  });
  while (await cursor.hasNext()) {
    const customQuery = await cursor.next();
    replaceCustomQueryData(customQuery, 'entities', 'refFrom', 'name');
    replaceCustomQueryData(customQuery, 'fields', 'field.refFrom', 'field.path');
    if (!_.isEmpty(customQuery.filter)) {
      updateFilterGroup(customQuery, customQuery.filter.query);
    }
    replaceCustomQueryData(customQuery, 'groupBy', 'refFrom', 'path');
    replaceCustomQueryData(customQuery, 'orderBy', 'fieldData.field.refFrom', 'fieldData.field.path');
    await customQueries.updateOne({ _id: customQuery._id }, {
      $set: _.pick(customQuery, ['entities', 'fields', 'filter', 'groupBy', 'orderBy']),
    });
  }
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch(console.log);
} else {
  module.exports = migration;
}
