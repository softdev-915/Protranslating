import _ from 'lodash';

export default {
  props: {
    invoice: {
      type: Object,
      required: true,
    },
    isForeignCurrencyRequest: {
      type: Boolean,
      required: true,
    },
  },
  created() {
    this.get = _.get;
  },
};
