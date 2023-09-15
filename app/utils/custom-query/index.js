const _ = require('lodash');
const moment = require('moment');

const FIELD_FUNCTION_NONE = '';
const FIELD_FUNCTION_AVG = 'avg';
const FIELD_FUNCTION_COUNT = 'count';
const FIELD_FUNCTION_FIRST = 'first';
const FIELD_FUNCTION_LAST = 'last';
const FIELD_FUNCTION_MAX = 'max';
const FIELD_FUNCTION_MIN = 'min';
const FIELD_FUNCTION_SUM = 'sum';
const FIELD_FUNCTION_CONCAT = 'concat';
const FIELD_FUNCTIONS = [
  FIELD_FUNCTION_NONE,
  FIELD_FUNCTION_AVG,
  FIELD_FUNCTION_COUNT,
  FIELD_FUNCTION_FIRST,
  FIELD_FUNCTION_LAST,
  FIELD_FUNCTION_MAX,
  FIELD_FUNCTION_MIN,
  FIELD_FUNCTION_SUM,
  FIELD_FUNCTION_CONCAT,
];
const FIELD_REF_TO_PATH_DELIMITER = ' → ';
const FILTER_TYPE_GROUP = 'group';
const FILTER_TYPE_RULE = 'rule';
const FILTER_GROUP_LOGICAL_OPERATOR_AND = 'and';
const FILTER_GROUP_LOGICAL_OPERATOR_OR = 'or';
const FILTER_GROUP_LOGICAL_OPERATORS = [
  FILTER_GROUP_LOGICAL_OPERATOR_AND,
  FILTER_GROUP_LOGICAL_OPERATOR_OR,
];
const FILTER_RULE_FIELD_TYPE_BOOLEAN = 'Boolean';
const FILTER_RULE_FIELD_TYPE_DATE = 'Date';
const FILTER_RULE_FIELD_TYPE_NUMBER = 'Number';
const FILTER_RULE_FIELD_TYPE_STRING = 'String';
const FILTER_RULE_OPERATOR_EQUALS = 'equals';
const FILTER_RULE_OPERATOR_DOES_NOT_EQUAL = 'does not equal';
const FILTER_RULE_OPERATOR_CONTAINS = 'contains';
const FILTER_RULE_OPERATOR_DOES_NOT_CONTAIN = 'does not contain';
const FILTER_RULE_OPERATOR_BEGINS_WITH = 'begins with';
const FILTER_RULE_OPERATOR_ENDS_WITH = 'ends with';
const FILTER_RULE_OPERATOR_EXISTS = 'exists';
const FILTER_RULE_OPERATOR_DOES_NOT_EXISTS = 'does not exists';
const FILTER_RULE_OPERATOR_LOWER_THAN = 'lower than';
const FILTER_RULE_OPERATOR_LOWER_THAN_OR_EQUAL = 'lower than or equal';
const FILTER_RULE_OPERATOR_GREATER_THAN = 'greater than';
const FILTER_RULE_OPERATOR_GREATER_THAN_OR_EQUAL = 'greater than or equal';
const FILTER_RULE_VALUE_TYPE_VALUE = 'value';
const FILTER_RULE_VALUE_TYPE_FIELD = 'field';
const ORDER_BY_SORT_ASC = 'asc';
const ORDER_BY_SORT_DESC = 'desc';
const ORDER_BY_SORT_OPTIONS = [ORDER_BY_SORT_ASC, ORDER_BY_SORT_DESC];
const SCHEDULER_NAME_LAST_RESULT = 'custom-query-last-result';
const getEntitiesText = entities => entities.map(({ name = '' }) => name).join(', ');
const getFieldPathText = ({ refFrom, path = '' }) => {
  if (!_.isEmpty(refFrom)) {
    return `${refFrom}${FIELD_REF_TO_PATH_DELIMITER}${path}`;
  }
  return path;
};
const getFieldDataText = ({ function: fieldFunction = '', field = {}, alias = '' }, replaceWithAlias = false) => {
  let result = getFieldPathText(field);
  if (!_.isEmpty(fieldFunction)) {
    result = `${fieldFunction}(${result})`;
  }
  if (!_.isEmpty(alias)) {
    if (replaceWithAlias) {
      result = alias;
    } else {
      result += ` as "${alias}"`;
    }
  }
  return result;
};
const getFieldsText = fields => fields.map(getFieldDataText).join(', ');
const filterRuleToText = ({ refFrom, field = '', operator = '', value = {} }) => {
  const refFromText = !_.isEmpty(refFrom) ? `${refFrom}${FIELD_REF_TO_PATH_DELIMITER}` : '';
  let result = `${refFromText}${field} ${operator}`;
  if (!_.isEmpty(value)) {
    let { value: actualValue = '' } = value;
    switch (value.type) {
      case FILTER_RULE_VALUE_TYPE_VALUE:
        if (_.isBoolean(actualValue)) {
          actualValue = actualValue ? 'true' : 'false';
        } else if (_.isDate(actualValue)) {
          actualValue = actualValue.toLocaleString();
        }
        break;
      case FILTER_RULE_VALUE_TYPE_FIELD:
        actualValue = getFieldPathText(actualValue);
        break;
      default:
        throw new Error(`No such filter value type ${value.type}`);
    }
    result += ` ${value.type} "${actualValue}"`;
  }
  return result;
};

const filterGroupToText = ({ logicalOperator = '', children = [] }) => {
  let result = '';
  children.forEach(({ type = '', query = {} }) => {
    if (result !== '') {
      result += ` ${logicalOperator} `;
    }
    switch (type) {
      case FILTER_TYPE_GROUP:
        result += filterGroupToText(query);
        break;
      case FILTER_TYPE_RULE:
        result += filterRuleToText(query);
        break;
      default:
        throw new Error(`No such custom query filter type: ${type}`);
    }
  });
  return !_.isEmpty(result) ? `(${result})` : result;
};
const getFilterText = ({ query = {} }) => filterGroupToText(query);
const getGroupByText = groupBy => groupBy.map(getFieldPathText).join(', ');
const getOrderByText = orderBY => orderBY
  .map(({ fieldData = {}, sort = '' }) => `${getFieldDataText(fieldData)} ${sort}`)
  .join(', ');

const modifyDateFilters = (group) => {
  let value;
  _.get(group, 'query.children', []).forEach((child) => {
    const { type = '' } = child;
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    switch (type) {
      case FILTER_TYPE_GROUP:
        child = modifyDateFilters(child);
        break;
      case FILTER_TYPE_RULE:
        value = _.get(child, 'query.value.value', '');
        if (dateTimeRegex.test(value)) {
          _.set(child, 'query.value.value', new Date(value));
        }
        break;
      default:
        throw new Error(`No such custom query filter type: ${type}`);
    }
  });
  return group;
};
const getResultFilePath = (customQueryName, userId, lastRunAt) => {
  const lastRunAtStr = moment.utc(lastRunAt).format('YYYYMMDDHHmmZZ');
  return `custom-query/reports/${userId}/${customQueryName}-${lastRunAtStr}.csv`;
};

module.exports = {
  FIELD_FUNCTION_NONE,
  FIELD_FUNCTION_AVG,
  FIELD_FUNCTION_COUNT,
  FIELD_FUNCTION_FIRST,
  FIELD_FUNCTION_LAST,
  FIELD_FUNCTION_MAX,
  FIELD_FUNCTION_MIN,
  FIELD_FUNCTION_SUM,
  FIELD_FUNCTION_CONCAT,
  FIELD_FUNCTIONS,
  FILTER_TYPE_GROUP,
  FILTER_TYPE_RULE,
  FILTER_GROUP_LOGICAL_OPERATOR_AND,
  FILTER_GROUP_LOGICAL_OPERATOR_OR,
  FILTER_GROUP_LOGICAL_OPERATORS,
  FILTER_RULE_FIELD_TYPE_BOOLEAN,
  FILTER_RULE_FIELD_TYPE_DATE,
  FILTER_RULE_FIELD_TYPE_NUMBER,
  FILTER_RULE_FIELD_TYPE_STRING,
  FILTER_RULE_VALUE_TYPE_VALUE,
  FILTER_RULE_VALUE_TYPE_FIELD,
  FILTER_RULE_OPERATOR_EQUALS,
  FILTER_RULE_OPERATOR_DOES_NOT_EQUAL,
  FILTER_RULE_OPERATOR_CONTAINS,
  FILTER_RULE_OPERATOR_DOES_NOT_CONTAIN,
  FILTER_RULE_OPERATOR_BEGINS_WITH,
  FILTER_RULE_OPERATOR_ENDS_WITH,
  FILTER_RULE_OPERATOR_EXISTS,
  FILTER_RULE_OPERATOR_DOES_NOT_EXISTS,
  FILTER_RULE_OPERATOR_LOWER_THAN,
  FILTER_RULE_OPERATOR_LOWER_THAN_OR_EQUAL,
  FILTER_RULE_OPERATOR_GREATER_THAN,
  FILTER_RULE_OPERATOR_GREATER_THAN_OR_EQUAL,
  ORDER_BY_SORT_ASC,
  ORDER_BY_SORT_DESC,
  ORDER_BY_SORT_OPTIONS,
  SCHEDULER_NAME_LAST_RESULT,
  getEntitiesText,
  getFieldsText,
  getFieldDataText,
  getFilterText,
  getGroupByText,
  getOrderByText,
  modifyDateFilters,
  getResultFilePath,
  getFieldPathText,
};
