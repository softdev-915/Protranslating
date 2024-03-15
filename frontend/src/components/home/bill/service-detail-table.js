import { mapGetters } from 'vuex';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import InternalDepartmentSelector from '../../internal-department-select/internal-department-selector.vue';
import ExpenseAccountSelector from '../../expense-account-select/expense-account-selector.vue';

const MONEY_VALUE_PRECISION = 2;

export default {
  mixins: [userRoleCheckMixin],
  components: {
    InternalDepartmentSelector,
    ExpenseAccountSelector,
  },
  props: {
    serviceDetails: {
      type: Array,
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      selectedInternalDepartment: {
        text: '',
        value: '',
      },
      selectedExpenseAccount: {
        text: '',
        value: '',
      },
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canReadAll() {
      return this.hasRole('BILL_READ_ALL');
    },
    tableColumns() {
      if (!this.canReadAll) {
        return ['Task Amount', 'Task Description', 'Recipient', 'Reference No'];
      }
      return ['Expense Account No.', 'Task Amount', 'Accounting Department ID', 'Task Description', 'Recipient', 'Reference No'];
    },
  },
  methods: {
    readableAmount(amount = 0) {
      return amount.toFixed(MONEY_VALUE_PRECISION);
    },
    formatInternalDepartmentSelectOption: ({ accountingDepartmentId }) => ({ text: accountingDepartmentId, value: accountingDepartmentId }),
    formatExpenseAccountSelectOption: ({ number }) => ({ text: number, value: number }),
  },
};
