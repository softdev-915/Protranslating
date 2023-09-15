const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { Types: { ObjectId } } = require('mongoose');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const PROJECTION = ['_id', 'name', 'hierarchy', 'status', 'securityPolicy'];
const ERRORS = [];
let Collection;
const getParent = async (_id, companyId) => {
  const parent = await Collection.findOne({ _id: new ObjectId(_id) });
  if (_.isNil(parent)) {
    throw new Error(`Parent ${_id} for company ${companyId} is not found\n`);
  }
  return _.pick(parent, PROJECTION);
};

const resetHierarchy = async (company) => {
  const { _id } = company;
  const parentCompanyId = _.get(company, 'parentId');
  const subParentCompanyId = _.get(company, 'subParentId');
  const subSubParentCompanyId = _.get(company, 'subSubParentId');
  let hierarchy = company.name;
  if (!_.isEmpty(subSubParentCompanyId)) {
    const { name } = await getParent(subSubParentCompanyId, _id);
    hierarchy = `${name}: ${hierarchy}`;
  }
  if (!_.isEmpty(subParentCompanyId)) {
    const { name } = await getParent(subParentCompanyId, _id);
    hierarchy = `${name}: ${hierarchy}`;
  }
  if (!_.isEmpty(parentCompanyId)) {
    const { name } = await getParent(parentCompanyId, _id);
    hierarchy = `${name}: ${hierarchy}`;
  }
  await Collection.updateOne({ _id }, { $set: { hierarchy } });
};

const assignParent = (parentCompany, parent) => {
  if (_.isEmpty(parentCompany)) {
    parentCompany = parent;
  } else if (_.isEmpty(parentCompany.parentCompany)) {
    parentCompany.parentCompany = parent;
  } else {
    parentCompany.parentCompany.parentCompany = parent;
  }
  return parentCompany;
};

const resetParents = async (company) => {
  const { _id } = company;
  const parentCompanyId = _.get(company, 'parentId');
  const subParentCompanyId = _.get(company, 'subParentId');
  const subSubParentCompanyId = _.get(company, 'subSubParentId');
  let parentCompany = null;
  if (!_.isEmpty(subSubParentCompanyId)) {
    const parent = await getParent(subSubParentCompanyId, _id);
    parentCompany = assignParent(parentCompany, parent);
  }
  if (!_.isEmpty(subParentCompanyId)) {
    const parent = await getParent(subParentCompanyId, _id);
    parentCompany = assignParent(parentCompany, parent);
  }
  if (!_.isEmpty(parentCompanyId)) {
    const parent = await getParent(parentCompanyId, _id);
    parentCompany = assignParent(parentCompany, parent);
  }
  await Collection.updateOne({ _id }, { $set: { parentCompany } });
};

const CompaniesStream = async (handler) => new Promise((resolve, reject) => {
  const stream = Collection.find().stream();
  stream.on('error', (err) => reject(err));
  stream.on('end', resolve);
  stream.on('data', async (company) => {
    stream.pause();
    try {
      await handler(company);
    } catch (e) {
      ERRORS.push(e);
    }
    stream.resume();
  });
});

const migration = () => mongo.connect(configuration)
  .then((connections) => connections.mongoose.connection)
  .then((db) => {
    Collection = db.collection('companies');
    return CompaniesStream(resetHierarchy);
  })
  .then(() => CompaniesStream(resetParents))
  .then(() => {
    if (!_.isEmpty(ERRORS)) {
      fs.writeFileSync(path.resolve(__dirname, 'hierarchy-errors'), ERRORS, null);
    }
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
