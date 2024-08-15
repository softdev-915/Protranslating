import { mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';

const QUOTE_EDIT_ROLES = ['QUOTE_UPDATE_ALL', 'QUOTE_UPDATE_OWN'];
const QUOTE_READ_ROLES = ['QUOTE_READ_OWN', 'QUOTE_READ_ALL'];
const TASK_READ_ROLES = ['TASK_READ_OWN', 'TASK_READ_ALL'];

export default {
  props: {
    value: {
      type: Boolean,
      default: true,
    },
    readOnlyWorkflow: {
      type: Boolean,
    },
    showCollapseIcon: {
      type: Boolean,
      default: true,
    },
    toggledSections: {
      type: Object,
    },
    foreignCurrency: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      collapsed: true,
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.collapsed = newValue;
      },
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'localCurrency']),
    taskToggleIconClass() {
      return this.value ? 'fa-thin fa-up-right-and-down-left-from-center' : 'fa-thin fa-down-left-and-up-right-to-center';
    },
    isForeignCurrencyRequest() {
      return this.foreignCurrency !== this.localCurrency.isoCode;
    },
    canReadProjectedCost() {
      return hasRole(this.userLogged, 'TASK-FINANCIAL_READ_ALL');
    },
    canReadAllQuote() {
      return QUOTE_READ_ROLES.some((r) => hasRole(this.userLogged, r));
    },
    canReadTask() {
      return TASK_READ_ROLES.some((r) => hasRole(this.userLogged, r));
    },
    canReadInvoiceSection() {
      return hasRole(this.userLogged, 'TASK-FINANCIAL_READ_ALL');
    },
    canReadBillSection() {
      return ['TASK-FINANCIAL_READ_ALL', 'TASK-FINANCIAL_READ_OWN'].some((r) => hasRole(this.userLogged, r));
    },
    canEdit() {
      return QUOTE_EDIT_ROLES.some((r) => hasRole(this.userLogged, r));
    },
  },
  methods: {
    toggleCollapse() {
      this.collapsed = !this.collapsed;
      this.$emit('input', this.collapsed);
    },
  },
};
