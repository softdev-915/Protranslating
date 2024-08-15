import _ from 'lodash';
import { mapActions } from 'vuex';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';
import ArInvoiceService from '../../../../services/ar-invoice-service';
import { selectMixin } from '../../../../mixins/select-mixin';
import userRoleCheckMixin from '../../../../mixins/user-role-check';

export default {
  name: 'InvoiceSelect',
  mixins: [selectMixin, userRoleCheckMixin],
  components: {
    SimpleBasicSelect,
  },
  props: {
    fetchOnCreated: {
      type: Boolean,
      default: true,
    },
    companyId: {
      type: String,
      required: true,
    },
    currencyId: {
      type: String,
      required: true,
    },
    value: {
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    formatOption: {
      type: Function,
      default: (invoice) => ({ text: invoice.no, value: invoice }),
    },
  },
  created() {
    this.service = new ArInvoiceService();
    if (!this.fetchOnCreated) {
      this.preFetchOption = this.formatOption({ no: this.value });
    }
  },
  data: () => ({
    isLoading: false,
    invoices: [],
    retrievedCompany: '',
  }),
  computed: {
    dependOnValues() {
      return `${this.companyId}${this.currencyId}`;
    },
    invoiceEntries() {
      return this.invoices.map(({ no, entries }) => ({ no, entries }));
    },
  },
  watch: {
    dependOnValues(value, oldValue) {
      if (value === oldValue) {
        return;
      }
      if (this.fetchOnCreated) {
        this._retrieve();
      } else {
        this.optionsRetrieved = false;
      }
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onSelect(value) {
      const selectedInvoice = this.invoiceEntries.find((ie) => ie.no === value);
      this.$emit('input', value);
      const entries = _.get(selectedInvoice, 'entries', []);
      this.$emit('entries-input', entries.map((e) => ({
        amount: Number(_.get(e.amount, '$numberDecimal', e.amount)),
        memo: _.get(e, 'memo'),
        departmentId: _.get(e, 'internalDepartment.accountingDepartmentId', ''),
        glAccountNo: _.get(e, 'ability.glAccountNo', ''),
      })));
    },
    onDelete() {
      this.$emit('input', '');
      this.$emit('entries-input', []);
    },
    _retrieve() {
      if (_.isEmpty(this.companyId) || _.isEmpty(this.currencyId)) {
        return;
      }
      this.isLoading = true;
      const filter = {
        company: this.companyId,
        currency: this.currencyId,
      };
      this.service.retrieve({ filter })
        .then((res) => {
          this.invoices = _.get(res, 'data.list', []);
        })
        .catch((e) => this.pushNotification({
          title: 'Error',
          message: 'Could not retrieve invoices',
          state: 'danger',
          response: e,
        }))
        .finally(() => (this.isLoading = false));
    },
  },
};
