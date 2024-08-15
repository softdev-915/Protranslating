import _ from 'lodash';
import QueryBuilderRule from 'vue-query-builder/dist/rule/QueryBuilderRule.umd.js';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';
import QueryBuilderRuleValueInput from './query-builder-rule-value-input.vue';
import { getRuleErrors } from './query-builder-validator';

export default {
  components: { QueryBuilderRuleValueInput, SimpleBasicSelect },
  extends: QueryBuilderRule,
  computed: {
    error() {
      return getRuleErrors(_.get(this, 'query', {}));
    },
    operatorError() {
      return _.get(this, 'error.operator', '');
    },
    isOperatorsEmpty() {
      const operators = _.get(this, 'rule.operators', []);
      return operators.length === 0;
    },
    isValueNeeded() {
      const { operator = '' } = this.query;
      return !['exists', 'does not exists'].includes(operator);
    },
  },
  watch: {
    rule: {
      handler(newRule) {
        if (_.isNil(newRule)) {
          this.$nextTick(() => this.$emit('child-deletion-requested', this.index));
        }
      },
      immediate: true,
    },
  },
};
