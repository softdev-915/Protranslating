import InvoiceService from '../../services/invoice-service';
import AjaxSelectMixin from '../../mixins/ajax-select-mixin';

export default {
  mixins: [AjaxSelectMixin],
  created() {
    this.service = new InvoiceService();
  },
  computed: {
    filterField() {
      return 'no';
    },
  },
};
