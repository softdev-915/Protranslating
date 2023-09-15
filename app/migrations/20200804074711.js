const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { validObjectId } = require('../utils/schema');

const envConfig = configuration.environment;
const buildUpdateSetBody = (entity, fields) => {
  const updateSetBody = {};
  fields.forEach((field) => {
    const fieldValue = _.get(entity, field);
    if (!_.isNil(fieldValue) && !validObjectId(fieldValue)) {
      updateSetBody[field] = _.get(fieldValue, '_id');
    }
  });
  return updateSetBody;
};
const objectsToIds = (objects) => {
  const ids = [];
  objects.forEach((object) => {
    if (!validObjectId(object)) {
      ids.push(object._id);
    } else {
      ids.push(object);
    }
  });
  return ids;
};
const revertCompaniesEmbedding = companiesCollection => new Promise(async (resolve, reject) => {
  const currentIndexes = await companiesCollection.getIndexes();
  const indexesToDrop = _.intersection(Object.keys(currentIndexes), [
    'parentObj._id_1', 'subParentObj._id_1', 'subSubParentObj._id_1',
  ]);
  await Promise.mapSeries(indexesToDrop, indexToDrop =>
    companiesCollection.dropIndex(indexToDrop));
  const companyEmbedFields = ['parentObj', 'subParentObj', 'subSubParentObj', 'salesRep'];
  const companiesCursor = companiesCollection.find();
  const companiesCount = await companiesCursor.count();
  if (companiesCount === 0) {
    return resolve();
  }
  let companiesUpdated = 0;
  companiesCursor.on('error', reject);
  companiesCursor.on('data', async (company) => {
    companiesCursor.pause();
    const updateSetBody = buildUpdateSetBody(company, companyEmbedFields);
    if (!_.isEmpty(updateSetBody)) {
      await companiesCollection.updateOne(
        { _id: company._id, lspId: company.lspId },
        { $set: updateSetBody },
      );
    }
    companiesUpdated++;
    if (companiesUpdated === companiesCount) {
      resolve();
    }
    companiesCursor.resume();
  });
});
const revertUsersEmbedding = usersCollection => new Promise(async (resolve, reject) => {
  const userEmbedFields = ['company'];
  const usersCursor = usersCollection.find();
  const usersCount = await usersCursor.count();
  if (usersCount === 0) {
    return resolve();
  }
  let usersUpdated = 0;
  usersCursor.on('error', reject);
  usersCursor.on('data', async (user) => {
    usersCursor.pause();
    const updateSetBody = buildUpdateSetBody(user, userEmbedFields);
    if (!_.isNil(user.projectManagers) && !_.isEmpty(user.projectManagers)) {
      const managersIds = objectsToIds(user.projectManagers);
      if (!_.isEmpty(managersIds)) {
        _.set(updateSetBody, 'projectManagers', managersIds);
      }
    }
    if (!_.isEmpty(updateSetBody)) {
      await usersCollection.updateOne(
        { _id: user._id, lspId: user.lspId },
        { $set: updateSetBody },
      );
    }
    usersUpdated++;
    if (usersUpdated === usersCount) {
      resolve();
    }
    usersCursor.resume();
  });
});
const revertTransactionsEmbedding = transactionsCollection =>
  new Promise(async (resolve, reject) => {
    const transactionEmbedFields = ['provider'];
    const transactionsCursor = transactionsCollection.find();
    const transactionsCount = await transactionsCursor.count();
    if (transactionsCount === 0) {
      return resolve();
    }
    let transactionsUpdated = 0;
    transactionsCursor.on('error', reject);
    transactionsCursor.on('data', async (transaction) => {
      transactionsCursor.pause();
      const updateSetBody = buildUpdateSetBody(transaction, transactionEmbedFields);
      let updateUnsetBody = {};
      const updateBody = {};
      if (!_.isNil(transaction.request)) {
        updateSetBody.requestNo = transaction.request.no;
        updateUnsetBody = { request: '' };
      }
      if (!_.isEmpty(updateSetBody)) {
        updateBody.$set = updateSetBody;
      }
      if (!_.isEmpty(updateUnsetBody)) {
        updateBody.$unset = updateUnsetBody;
      }
      if (!_.isEmpty(updateBody)) {
        await transactionsCollection.updateOne(
          { _id: transaction._id, lspId: transaction.lspId },
          updateBody,
        );
      }
      transactionsUpdated++;
      if (transactionsUpdated === transactionsCount) {
        resolve();
      }
      transactionsCursor.resume();
    });
  });
const revertOpportunitiesEmbedding = opportunitiesCollection =>
  new Promise(async (resolve, reject) => {
    const opportunityEmbedFields = ['contact', 'company', 'salesRep'];
    const opportunitiesCursor = opportunitiesCollection.find();
    const opportunitiesCount = await opportunitiesCursor.count();
    if (opportunitiesCount === 0) {
      return resolve();
    }
    let opportunitiesUpdated = 0;
    opportunitiesCursor.on('error', reject);
    opportunitiesCursor.on('data', async (opportunity) => {
      opportunitiesCursor.pause();
      const updateSetBody = buildUpdateSetBody(opportunity, opportunityEmbedFields);
      if (!_.isNil(opportunity.secondaryContacts) && !_.isEmpty(opportunity.secondaryContacts)) {
        const contactsIds = objectsToIds(opportunity.secondaryContacts);
        if (!_.isEmpty(contactsIds)) {
          _.set(updateSetBody, 'secondaryContacts', contactsIds);
        }
      }
      if (!_.isEmpty(updateSetBody)) {
        await opportunitiesCollection.updateOne(
          { _id: opportunity._id, lspId: opportunity.lspId },
          { $set: updateSetBody },
        );
      }
      opportunitiesUpdated++;
      if (opportunitiesUpdated === opportunitiesCount) {
        resolve();
      }
      opportunitiesCursor.resume();
    });
  });
const revertActivitiesEmbedding = activitiesCollection =>
  new Promise(async (resolve, reject) => {
    const activityEmbedFields = ['emailDetails.company', 'feedbackDetails.company'];
    const activitiesCursor = activitiesCollection.find();
    const activitiesCount = await activitiesCursor.count();
    if (activitiesCount === 0) {
      return resolve();
    }
    let activitiesUpdated = 0;
    activitiesCursor.on('error', reject);
    activitiesCursor.on('data', async (activity) => {
      activitiesCursor.pause();
      const updateSetBody = buildUpdateSetBody(activity, activityEmbedFields);
      if (!_.isNil(activity.users) && !_.isEmpty(activity.users)) {
        const usersIds = objectsToIds(activity.users);
        if (!_.isEmpty(usersIds)) {
          _.set(updateSetBody, 'users', usersIds);
        }
      }
      const emailDetailsOpportunities = _.get(activity, 'emailDetails.opportunities');
      if (!_.isNil(emailDetailsOpportunities) && !_.isEmpty(emailDetailsOpportunities)) {
        const opportunitiesIds = objectsToIds(emailDetailsOpportunities);
        if (!_.isEmpty(opportunitiesIds)) {
          updateSetBody['emailDetails.opportunities'] = opportunitiesIds;
        }
      }
      const emailDetailsRequests = _.get(activity, 'emailDetails.requests');
      if (!_.isNil(emailDetailsRequests) && !_.isEmpty(emailDetailsRequests)) {
        const requestsIds = objectsToIds(emailDetailsRequests);
        if (!_.isEmpty(requestsIds)) {
          updateSetBody['emailDetails.requests'] = requestsIds;
        }
      }
      const feedbackDetailsRequests = _.get(activity, 'feedbackDetails.requests', []);
      if (!_.isNil(feedbackDetailsRequests) && !_.isEmpty(feedbackDetailsRequests)) {
        const requestsIds = objectsToIds(feedbackDetailsRequests);
        if (!_.isEmpty(requestsIds)) {
          updateSetBody['feedbackDetails.requests'] = requestsIds;
        }
      }
      if (!_.isEmpty(updateSetBody)) {
        await activitiesCollection.updateOne(
          { _id: activity._id, lspId: activity.lspId },
          { $set: updateSetBody },
        );
      }
      activitiesUpdated++;
      if (activitiesUpdated === activitiesCount) {
        resolve();
      }
      activitiesCursor.resume();
    });
  });

const migration = () => {
  if (envConfig.NODE_ENV === 'TEST' || envConfig.NODE_ENV === 'DEV') {
    return mongo.connect(configuration)
      .then(connections => connections.mongoose.connection)
      .then((db) => {
        const collections = {
          companies: db.collection('companies'),
          users: db.collection('users'),
          transactions: db.collection('transactions'),
          opportunities: db.collection('opportunities'),
          activities: db.collection('activities'),
        };
        return revertCompaniesEmbedding(collections.companies)
          .then(() => revertUsersEmbedding(collections.users))
          .then(() => revertTransactionsEmbedding(collections.transactions))
          .then(() => revertOpportunitiesEmbedding(collections.opportunities))
          .then(() => revertActivitiesEmbedding(collections.activities));
      });
  }
  return Promise.resolve();
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
