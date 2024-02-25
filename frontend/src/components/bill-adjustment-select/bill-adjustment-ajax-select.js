import BillAdjustmentService from '../../services/bill-adjustment-service';
import AjaxSelectMixin from '../../mixins/ajax-select-mixin';

export default {
  mixins: [AjaxSelectMixin],
  created() {
    this.service = new BillAdjustmentService();
    this.filterField = 'adjustmentNo';
  },
};
