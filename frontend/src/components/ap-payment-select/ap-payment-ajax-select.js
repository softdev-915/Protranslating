import _ from 'lodash';
import ApPaymentService from '../../services/ap-payment-service';
import AjaxSelectMixin from '../../mixins/ajax-select-mixin';

export default {
  mixins: [AjaxSelectMixin],
  created() {
    this.service = new ApPaymentService();
  },
  computed: {
    filterField() {
      return '_id';
    },
  },
  methods: {
    formatOption(option) {
      const { _id } = option;
      option = _.pick(option, [
        '_id', 'appliedToNo',
      ]);
      return { ...option, value: _id, text: _id };
    },
  },
};
