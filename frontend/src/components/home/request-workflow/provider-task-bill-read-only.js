import _ from 'lodash';

export default {
  props: {
    bill: {
      type: Object,
      required: true,
    },
  },
  created() {
    this.translationUnitName = _.get(this.bill, 'translationUnit.name', '');
    this.breakdownName = _.get(this.bill, 'breakdown.name', '');
  },
};

