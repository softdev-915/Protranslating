import { mapActions, mapGetters } from 'vuex';
import _ from 'lodash';
import BigDataSetGrid from '../../responsive-grid/big-data-set-grid/big-data-set-grid.vue';
import AccountPayableService from '../../../services/account-payable-service';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import ApPaymentValueEdit from './ap-payment-value-edit.vue';

export default {
  props: {
    query: Object,
    selectedRows: { type: Array, required: true },
    selectedPaymentMethod: String,
  },
  mixins: [userRoleCheckMixin],
  components: {
    BigDataSetGrid,
  },
  computed: { ...mapGetters('app', ['userLogged']) },
  created() {
    this.service = new AccountPayableService();
    this.components = { ApPaymentValueEdit };
  },
  methods: {
    ...mapActions('apPayment', ['setAccountsPayable']),
    onAllRowsSelected(selected) {
      this.$emit('all-rows-selected', selected);
    },
    onRowSelected(_id, selected) {
      this.$emit('row-selected', { _id, selected });
    },
    onGridDataLoaded(data) {
      this.setAccountsPayable(data.list);
    },
    onGridDataImported() {
      this.$emit('grid-data-imported');
    },
    onGridResetQuery(currentQuery) {
      const defaultFilter = { billOnHold: false, hasPositiveBalance: true, isSynced: true };
      if (this.selectedPaymentMethod) {
        defaultFilter.billPaymentMethodId = this.selectedPaymentMethod;
      }
      return Object.assign({ filter: JSON.stringify(defaultFilter) }, _.omit(currentQuery, ['q', 'filter']), { page: 1 });
    },
  },
};
