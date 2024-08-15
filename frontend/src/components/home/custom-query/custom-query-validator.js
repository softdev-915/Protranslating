import _ from 'lodash';

const getNameErrors = (customQuery) => {
  const error = {};
  const name = _.get(customQuery, 'name', '');
  if (_.isEmpty(name.trim())) {
    error.name = 'Name is required';
  }
  return error;
};

const getEntitiesErrors = (customQuery) => {
  const error = {};
  const entities = _.get(customQuery, 'entities', []);
  if (_.isEmpty(entities)) {
    error.entities = 'At least one entity is required';
  }
  return error;
};

const getFieldsErrors = ({ fields = [], groupBy = [] }) => {
  const error = {};
  if (_.isEmpty(_.get(fields, '0.field', {}))) {
    _.set(error, 'fields.common', 'At least one field is required');
  }
  const aliases = [];
  const notAllFieldsAggregated = fields.some(({ function: aggregation, field }) => _.isEmpty(aggregation) && !_.isEmpty(field));
  fields.forEach(({ function: aggregation, field = {}, alias }, i) => {
    if (
      !['', 'count', 'first', 'last', 'concat'].includes(aggregation)
      && !['Number', 'Decimal128'].includes(field.type)
    ) {
      _.set(error, `fields.${i}.function`, 'Aggregated functions applicable only to fields with numeric value');
    }
    if (!_.isEmpty(aggregation) && _.isEmpty(groupBy[0]) && notAllFieldsAggregated) {
      _.set(error, `fields.${i}.function`, 'Aggregation works only when "Group by" section is not empty or all the fields have some aggregation function');
    }
    if (!_.isEmpty(field.path) && !_.isEmpty(groupBy[0])) {
      const isPresentInGroupBy = groupBy.some(groupByField =>
        _.isEqual(_.pick(groupByField, ['refFrom', 'path']), _.pick(field, ['refFrom', 'path']))
      );
      if (!isPresentInGroupBy && _.isEmpty(aggregation)) {
        _.set(error, `fields.${i}.field`, 'Field must have an aggregation function or be present in "Group by" section');
      }
    }
    if (aliases.includes(alias)) {
      _.set(error, `fields.${i}.alias`, 'Same alias for multiple fields');
    }
    if (!_.isEmpty(alias)) {
      if (alias.includes('.')) {
        _.set(error, `fields.${i}.alias`, 'Alias shouldn\'t contain dots.');
      }
      aliases.push(alias);
    }
  });
  return error;
};

const getOrderByErrors = ({ orderBy = [], groupBy = [] }) => {
  const error = {};
  orderBy.forEach(({ fieldData = {}, sort = '' }, i) => {
    if (!_.isEmpty(fieldData) && _.isEmpty(sort)) {
      _.set(error, `orderBy.${i}.sort`, 'Specify sorting option');
    }
    if (
      !_.isEmpty(groupBy[0])
      && _.isEmpty(fieldData.function)
      && !_.isEmpty(fieldData.field)
      && !groupBy.some((groupByField) => _.isEqual(groupByField, fieldData.field))
    ) {
      _.set(error, `orderBy.${i}.fieldData`, 'Field must be present in "Group by" section either should be aggregated');
    }
  });
  return error;
};

const getCustomQueryErrors = (customQuery) => ({

  ...getNameErrors(customQuery),
  ...getEntitiesErrors(customQuery),
  ...getFieldsErrors(customQuery),
  ...getOrderByErrors(customQuery),
});

export { getCustomQueryErrors };
