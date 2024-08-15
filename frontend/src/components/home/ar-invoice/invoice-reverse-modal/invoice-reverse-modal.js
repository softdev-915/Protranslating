import _ from 'lodash';
import moment from 'moment';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';
import UtcFlatpickr from '../../../form/utc-flatpickr.vue';
import ConfirmDialog from '../../../form/confirm-dialog.vue';
import NotificationMixin from '../../../../mixins/notification-mixin';
import userRoleCheckMixin from '../../../../mixins/user-role-check';
import InvoiceService from '../../../../services/invoice-service';

const IN_PROGRESS_STATUS = 'In Progress';
const DRAFTED_STATUS = 'Drafted';

export default {
  name: 'ReverseModal',
  mixins: [NotificationMixin, userRoleCheckMixin],
  components: {
    SimpleBasicSelect,
    UtcFlatpickr,
    ConfirmDialog,
  },
  props: {
    invoice: {
      type: Object,
      default: () => ({}),
    },
  },
  created() {
    this.service = new InvoiceService();
    this.datepickerOptions = {
      allowInput: false,
      enableTime: true,
      static: true,
    };
  },
  data() {
    return {
      reverseTransactionDate: null,
      memo: '',
    };
  },
  computed: {
    date() {
      return _.get(this, 'invoice.date', '');
    },
    formattedDate() {
      return moment(this.date).format('YYYY-MM-DD HH:mm');
    },
    invoiceId() {
      return _.get(this, 'invoice._id', '');
    },
    company() {
      return _.get(this, 'invoice.company.name', '');
    },
    amount() {
      return _.get(this, 'invoice.accounting.amount', '');
    },
    canReverse() {
      return this.hasRole('INVOICE_UPDATE_ALL') &&
        [DRAFTED_STATUS, IN_PROGRESS_STATUS].every(status => status !== this.invoice.status) &&
        this.invoice.accounting.paid === 0 && this.invoice.siConnector.isSynced;
    },
    isReverseDateValid() {
      const reverseTime = new Date(this.reverseTransactionDate).setSeconds(0);
      const invoiceTime = new Date(this.date).setSeconds(0);
      return reverseTime >= invoiceTime;
    },
    reverseDateInputHasError() {
      return this.reverseTransactionDate && !this.isReverseDateValid;
    },
    canSubmit() {
      return this.reverseTransactionDate && this.isReverseDateValid;
    },
  },
  methods: {
    show() {
      this.$refs.modal.show();
    },
    hide() {
      this.$refs.modal.hide();
    },
    submit() {
      this.$refs.confirmDialog.show();
    },
    async reverse() {
      try {
        const response = await this.service.reverse(this.invoiceId, {
          reversedOnDate: this.reverseTransactionDate,
          memo: this.memo,
        });
        this.$emit('invoice-refresh', response.data);
        this.pushSuccess('Invoice successfully reversed');
        this.hide();
      } catch (e) {
        this.pushError(`Reversing invoice failed: ${_.get(e, 'status.message', e)}`);
      }
    },
    onDialogConfirmed({ confirm }) {
      if (confirm) {
        this.reverse();
      }
    },
  },
};
