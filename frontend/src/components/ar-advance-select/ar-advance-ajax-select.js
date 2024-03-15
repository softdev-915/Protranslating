import ArAdvanceService from '../../services/ar-advance-service';
import AjaxSelectMixin from '../../mixins/ajax-select-mixin';

export default {
  mixins: [AjaxSelectMixin],
  created() {
    this.service = new ArAdvanceService();
    this.filterField = 'no';
  },
};
