import _ from 'lodash';

const getRuleErrors = ({ operator = '', value = {} }, path = null) => {
  const error = {};
  const groupDepth = _.get(path, 'groupDepth', 0);
  const groupIndex = _.get(path, 'groupIndex', 0);
  const ruleIndex = _.get(path, 'ruleIndex', 0);
  const prefix = !_.isNil(path) ? `filter.group.${groupDepth}.${groupIndex}.rule.${ruleIndex}.` : '';
  if (_.isEmpty(operator)) {
    error[`${prefix}operator`] = 'Select operator';
  }
  const valueType = _.get(value, 'type', '');
  if (!['exists', 'does not exists'].includes(operator) && _.isEmpty(valueType)) {
    error[`${prefix}value.type`] = 'Select type of value';
  }
  return error;
};

const getGroupErrors = (
  { children = [] },
  { groupDepth = 0, groupIndex = 0 },
  recursive = true,
) => {
  const error = {};
  const prefix = recursive ? `filter.group.${groupDepth}.${groupIndex}.` : '';
  if (_.isEmpty(children) && groupDepth !== 1) {
    error[`${prefix}common`] = 'At least one filter rule is required';
  }
  if (!recursive) {
    return error;
  }
  let nextGroupIndex = -1;
  let nextRuleIndex = -1;
  children.forEach(({ query = {}, type = '' }) => {
    if (type === 'query-builder-group') {
      Object.assign(error, getGroupErrors(query, {
        groupDepth: groupDepth + 1,
        groupIndex: ++nextGroupIndex,
      }));
    } else {
      Object.assign(error, getRuleErrors(query, {
        groupDepth: groupDepth,
        groupIndex: groupIndex,
        ruleIndex: ++nextRuleIndex,
      }));
    }
  });
  return error;
};
const getQueryBuilderErrors = (query) => getGroupErrors(query, { groupDepth: 1, groupIndex: 0 });

export { getQueryBuilderErrors, getGroupErrors, getRuleErrors };
