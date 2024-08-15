import _ from 'lodash';

const QUERY_BUILDER_ELEMENT_TYPE_GROUP = 'query-builder-group';
const QUERY_BUILDER_ELEMENT_TYPE_RULE = 'query-builder-rule';
const CUSTOM_QUERY_FILTER_TYPE_GROUP = 'group';
const CUSTOM_QUERY_FILTER_TYPE_RULE = 'rule';
const FIELD_REF_TO_PATH_DELIMITER = ' → ';
const parseRule = ({ value = {}, operand = '', operator = '' }) => {
  const fieldParts = operand.split(FIELD_REF_TO_PATH_DELIMITER);
  const query = {
    refFrom: fieldParts.length === 2 ? fieldParts[0] : '',
    field: fieldParts.length === 2 ? fieldParts[1] : fieldParts[0],
    operator,
  };
  if (!_.isEmpty(value)) {
    query.value = value;
  } else if (!['exists', 'does not exists'].includes(operator)) {
    return {};
  }
  return { type: CUSTOM_QUERY_FILTER_TYPE_RULE, query };
};

const parseGroup = (group) => {
  const logicalOperators = { all: 'and', any: 'or' };
  const children = _.get(group, 'children', [])
    .map((element) => {
      let parsedResult;
      const query = _.get(element, 'query', {});
      const type = _.get(element, 'type', '');
      switch (type) {
        case QUERY_BUILDER_ELEMENT_TYPE_GROUP:
          parsedResult = parseGroup(query);
          break;
        case QUERY_BUILDER_ELEMENT_TYPE_RULE:
          parsedResult = parseRule(query);
          break;
        default:
          throw new Error(`No element type ${type} found in the Query Builder`);
      }
      return parsedResult;
    })
    .filter((element) => !_.isEmpty(element));
  if (_.isEmpty(children)) {
    return {};
  }
  const nativeBuilderLogicalOperator = _.get(group, 'logicalOperator', '');
  const logicalOperator = _.get(logicalOperators, nativeBuilderLogicalOperator, '');
  return {
    type: CUSTOM_QUERY_FILTER_TYPE_GROUP,
    query: { logicalOperator, children },
  };
};

const parseCustomQueryFilterRule = ({ field = '', operator = '', value = {} }) => {
  const ruleName = field;
  const query = { rule: ruleName, operator, operand: ruleName };
  if (!_.isEmpty(value)) {
    query.value = value;
  } else if (!['exists', 'does not exists'].includes(operator)) {
    return {};
  }
  return { type: QUERY_BUILDER_ELEMENT_TYPE_RULE, query };
};

const parseCustomQueryFilterGroup = (group, isTopGroup) => {
  if (!_.isBoolean(isTopGroup)) {
    isTopGroup = false;
  }
  const children = _.get(group, 'children', [])
    .map((element) => {
      let parsedResult;
      const query = _.get(element, 'query', {});
      const type = _.get(element, 'type', '');
      switch (type) {
        case CUSTOM_QUERY_FILTER_TYPE_GROUP:
          parsedResult = parseCustomQueryFilterGroup(query);
          break;
        case CUSTOM_QUERY_FILTER_TYPE_RULE:
          parsedResult = parseCustomQueryFilterRule(query);
          break;
        default:
          throw new Error(`No element type ${type} found in the custom query filter`);
      }
      return parsedResult;
    })
    .filter((element) => !_.isEmpty(element));
  if (_.isEmpty(children)) {
    return {};
  }
  const customQueryFilterLogicalOperator = _.get(group, 'logicalOperator', '');
  const logicalOperators = { and: 'all', or: 'any' };
  const logicalOperator = _.get(logicalOperators, customQueryFilterLogicalOperator, '');
  const query = { logicalOperator, children };
  return isTopGroup ? query : { type: QUERY_BUILDER_ELEMENT_TYPE_GROUP, query };
};
const parseCustomQueryFilter = ({ query = {} }) => parseCustomQueryFilterGroup(query, true);

export default { parse: parseGroup, parseCustomQueryFilter };
