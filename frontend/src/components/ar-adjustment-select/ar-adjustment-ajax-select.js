import ArAdjustmentService from '../../services/ar-adjustment-service';
import AjaxSelectMixin from '../../mixins/ajax-select-mixin';

export default {
  mixins: [AjaxSelectMixin],
  created() {
    this.service = new ArAdjustmentService();
    this.filterField = 'no';
  },
};
