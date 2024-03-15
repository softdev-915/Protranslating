import _ from 'lodash';
import BankAccountService from '../../services/bank-account-service';
import AjaxSelectMixin from '../../mixins/ajax-select-mixin';

export default {
  mixins: [AjaxSelectMixin],
  props: {
    filter: {
      type: Object,
      default: { deletedText: 'false' },
    },
  },
  created() {
    this.selectedOption = _.cloneDeep(this.value);
    this.service = new BankAccountService();
  },
  computed: {
    filterField() {
      return 'name';
    },
  },
};
