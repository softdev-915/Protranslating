/* global FormData */
import _ from 'lodash';
import moment from 'moment';
import { mapActions, mapGetters } from 'vuex';
import ApPaymentService from '../../../services/ap-payment-service';
import BankAccountService from '../../../services/bank-account-service';
import PaymentMethodSelector from '../company/billing-information/payment-method-selector.vue';
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import AccountPayableGrid from './account-payable-grid.vue';
import { entityEditMixin } from '../../../mixins/entity-edit';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import localDateTime from '../../../utils/filters/local-date-time';
import AccountPayableService from '../../../services/account-payable-service';

const apPaymentService = new ApPaymentService();
const accountPayableService = new AccountPayableService();

export default {
  mixins: [entityEditMixin, userRoleCheckMixin],
  data() {
    return {
      isVisibleAccountPayableGrid: false,
      wasCsvImported: false,
      handlingCreate: false,
      apPayment: {
        _id: '',
        bankAccount: '',
        status: '',
        paymentMethod: '',
        budgetAmount: 0,
        paymentDate: '',
        details: [],
      },
      selectedPaymentMethod: '',
      bankAccounts: null,
    };
  },
  components: {
    SimpleBasicSelect,
    UtcFlatpickr,
    AccountPayableGrid,
    PaymentMethodSelector,
  },
  created() {
    this.datepickerOptions = {
      onValueUpdate: null,
      enableTime: true,
      allowInput: false,
      disableMobile: 'true',
      minDate: null,
    };
    this.entityName = 'Ap payment';
    this.bankAccounts = new BankAccountService().retrieve();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    ...mapGetters('apPayment', [
      'remainingBudgetAmount', 'selectedAccountsPayableIdList', 'selectedAccountsPayable',
    ]),
    isPaymentBeingCreated() {
      const statusList = apPaymentService.statusList();
      return [statusList.Drafted, statusList['In Progress']].some((status) => status === this.apPayment.status);
    },
    canReadAll() {
      return this.hasRole('AP-PAYMENT_READ_ALL');
    },
    canReadOwn() {
      return this.hasRole('AP-PAYMENT_READ_OWN');
    },
    canCreate: function () {
      return this.hasRole('AP-PAYMENT_CREATE_ALL');
    },
    showBreadcrumb: function () {
      return this.navigationBreadcrumb.length > 1;
    },
    isValid() {
      return _.isEmpty(_.get(this, 'errors.items', []))
        && this.areMandatoryFieldsFilled
        && _.isEmpty(this.apPayment._id);
    },
    apGridQuery() {
      const filter = { billOnHold: false, hasPositiveBalance: true, isSynced: true };
      if (!_.isEmpty(this.selectedPaymentMethod)) {
        filter.billPaymentMethodId = this.selectedPaymentMethod;
      }
      return { filter: JSON.stringify(filter) };
    },
    subtotalCreditsApplied() {
      return _.sumBy(this.selectedAccountsPayable, 'creditsToApply').toFixed(2);
    },
    localPaymentDate() {
      const paymentDate = _.get(this, 'apPayment.paymentDate', new Date());
      return localDateTime(paymentDate, 'YYYY-MM-DD HH:mm');
    },
    isValidPaymentDate() {
      return moment(this.apPayment.paymentDate).isValid();
    },
    isValidRemainingBudgetAmount() {
      return this.remainingBudgetAmount >= 0;
    },
    isValidPaymentMethod() {
      return this.paymentAmount === 0 || !_.isEmpty(this.apPayment.paymentMethod);
    },
    isValidBankAccount() {
      return this.paymentAmount === 0 || !_.isEmpty(this.apPayment.bankAccount);
    },
    areMandatoryFieldsFilled() {
      if (this.wasCsvImported) {
        return true;
      }
      return this.isValidPaymentDate
        && this.isValidRemainingBudgetAmount
        && this.isValidPaymentMethod
        && this.isValidBankAccount
        && this.isValidSummaryPayment
        && (!_.isEmpty(this.selectedAccountsPayable));
    },
    paymentAmount() {
      return _.sumBy(this.selectedAccountsPayable, 'paymentAmount').toFixed(2);
    },
    isValidSummaryPayment() {
      return this.paymentAmount > 0 || this.subtotalCreditsApplied > 0 || this.wasCsvImported;
    },
  },
  watch: {
    selectedPaymentMethod(newValue) {
      this.clearAccountsPayable();
      this.apPayment.paymentMethod = newValue;
    },
    'apPayment.paymentMethod'(newValue) {
      this.selectedPaymentMethod = newValue;
    },
    'apPayment.budgetAmount': {
      handler(newBudgetAmount) {
        this.apPayment.budgetAmount = _.round(newBudgetAmount, 2);
        this.setBudgetAmount(this.apPayment.budgetAmount);
      },
      immediate: true,
    },
  },
  methods: {
    ...mapActions('apPayment', [
      'setBudgetAmount', 'toggleAllAccountsPayable', 'toggleAccountPayable', 'clearAccountsPayable',
    ]),
    _service() {
      return apPaymentService;
    },
    _handleRetrieve(response) {
      this.apPayment = _.get(response, 'data.apPayment', {});
      this.handlingCreate = false;
    },
    _handleCreate() {
      this.handlingCreate = true;
      this.clearAccountsPayable();
      this.$router.push({
        name: 'list-ap-payment',
        query: {
          filter: JSON.stringify({ createdBy: this.userLogged.email }), sort: '-createdAt',
        },
      }).catch((err) => { console.log(err); });
    },
    onGridDataImported() {
      this.wasCsvImported = true;
    },
    _refreshEntity(freshEntity) {
      this.handlingCreate = false;
      this.$set(this, 'apPayment', freshEntity);
    },
    save() {
      if (this.isValid && !this.handlingCreate) {
        const apPayment = _.cloneDeep(this.apPayment);
        if (!_.isEmpty(this.selectedAccountsPayable)) {
          apPayment.details = this.selectedAccountsPayable.map(
            ({
              _id, creditsToApply, paymentAmount, vendorId,
            }) => ({
              accountPayableId: _id, creditsToApply, paymentAmount, vendorId,
            }),
          );
        }
        this._save(apPayment);
      }
    },
    onPaymentDateChange(paymentDate) {
      this.$set(this.apPayment, 'paymentDate', moment(paymentDate).utc());
    },
    triggerEntriesUpload() {
      this.$refs.csvEntriesImportedFile.click();
    },
    uploadCsvWithEntries(event) {
      const files = _.get(event, 'target.files', []);
      if (_.isEmpty(files)) {
        return;
      }
      const f = files.item(0);
      const formData = new FormData();
      formData.append(event.target.name, f, f.name);
      this.loading = true;
      this.wasCsvImported = false;
      accountPayableService.uploadCsv(formData, 'ap-payment-entries')
        .then((response) => {
          const importedEntriesNumber = _.get(response, 'data.importedEntriesNumber');
          this.wasCsvImported = true;
          const notification = {
            title: 'Success',
            message: `${importedEntriesNumber} entries have been imported`,
            state: 'success',
          };
          this.pushNotification(notification);
        })
        .catch((err) => {
          this.uploading = false;
          const notification = {
            title: 'Error',
            message: _.get(err, 'status.message', 'Failed to upload csv'),
            state: 'danger',
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          this.loading = false;
          this.$refs.importEntriesForm.reset();
        });
    },
    cancel() {
      this.close();
    },
  },
};
