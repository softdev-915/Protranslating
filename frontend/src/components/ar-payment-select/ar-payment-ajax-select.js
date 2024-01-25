import ArPaymentService from '../../services/ar-payment-service';
import AjaxSelectMixin from '../../mixins/ajax-select-mixin';

export default {
  mixins: [AjaxSelectMixin],
  created() {
    this.service = new ArPaymentService();
    this.filterField = '_id';
  },
};
