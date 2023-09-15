const mongoose = require('mongoose');
const _ = require('lodash');
const { hasUserAccessToSchema } = require('.');
const { getConditionStatementToReadActivities } = require('../../endpoints/lsp/activity/activity-api-helper');
const { getSchema } = require('../../components/database/mongo');

const getPipelineToFilterRestrictedRecords = async (schemaName, user, entityPrefix = '') => {
  const pipeline = [];

  if (!_.isEmpty(entityPrefix)) {
    entityPrefix += '.';
  }
  const lspId = _.get(user, 'lsp._id');
  const commonSchemas = ['Country', 'State', 'Language'];
  const schemaModel = await getSchema(schemaName);
  if (!commonSchemas.includes(schemaName)) {
    const lspRef = schemaName !== 'Lsp'
      ? ['lsp', 'lspId'].find((field) => _.has(schemaModel.schema.paths, field))
      : '_id';
    if (_.isNil(lspRef)) {
      throw new Error(`Schema ${schemaName} does not have lsp reference field`);
    }
    pipeline.push({
      $match: { [`${entityPrefix}${lspRef}`]: new mongoose.Types.ObjectId(lspId) },
    });
  }
  if (schemaName !== 'Lsp' && !hasUserAccessToSchema(schemaName, user, ['READ_ALL'])) {
    const userRef = ['user', 'userId'].find((field) => _.has(schemaModel.schema.paths, field));
    if (_.isNil(userRef)) {
      throw new Error(`Schema ${schemaName} does not have user reference field`);
    }
    pipeline.push({
      $match: { [`${entityPrefix}${userRef}`]: new mongoose.Types.ObjectId(user._id) },
    });
  }
  if (schemaName === 'Activity') {
    const activityMatchPipeline = getConditionStatementToReadActivities(user)
      .map((statement) => _.mapKeys(statement, (value, key) => `${entityPrefix}${key}`));

    if (!_.isEmpty(activityMatchPipeline)) {
      pipeline.push({
        $match: { $or: activityMatchPipeline },
      });
    }
  }
  return pipeline;
};

module.exports = { getPipelineToFilterRestrictedRecords };
