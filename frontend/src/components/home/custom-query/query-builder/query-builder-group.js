import _ from 'lodash';
import QueryBuilderGroup from 'vue-query-builder/dist/group/QueryBuilderGroup.umd.js';
import QueryBuilderRule from './query-builder-rule.vue';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';
import { getGroupErrors } from './query-builder-validator';

export default {
  name: 'QueryBuilderGroup',
  components: { SimpleBasicSelect, QueryBuilderRule },
  extends: QueryBuilderGroup,
  computed: {
    error() {
      return getGroupErrors(_.get(this, 'query', {}), { groupDepth: _.get(this, 'depth', 0) }, false);
    },
    commonError() {
      return _.get(this, 'error.common', '');
    },
  },
  created() {
    this.logicalOperators = { all: 'and', any: 'or' };
  },
  methods: {
    formatRuleSelectOption: (option) => {
      const label = _.get(option, 'label', '');
      return { text: label, value: option };
    },
  },
};
