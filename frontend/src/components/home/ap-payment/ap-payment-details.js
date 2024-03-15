import _ from 'lodash';
import moment from 'moment';
import { mapGetters } from 'vuex';

import SiConnectorDetails from '../connector/si-connector-details.vue';
import PaymentMethodSelector from '../company/billing-information/payment-method-selector.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import VoidModal from '../../void-modal/void-modal.vue';
import AttachmentsModal from '../attachments-modal/attachments-modal.vue';

import localDateTime from '../../../utils/filters/local-date-time';

import { entityEditMixin } from '../../../mixins/entity-edit';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import notificationMixin from '../../../mixins/notification-mixin';

import ApPaymentService from '../../../services/ap-payment-service';
import BankAccountService from '../../../services/bank-account-service';
import ConnectorService from '../../../services/connector-service';

const bankAccountService = new BankAccountService();
const apPaymentService = new ApPaymentService();
const connectorService = new ConnectorService();
const ACCOUNT_PAYABLE_TYPE_NAMES = { billAdjustment: 'Bill Adjustment', bill: 'Bill' };
const COLUMNS = [
  { name: 'Applied to', prop: 'appliedToNo' },
  {
    name: 'Applied to Type',
    val: ({ appliedToType }) => ACCOUNT_PAYABLE_TYPE_NAMES[appliedToType],
  },
  { name: 'Check #', prop: 'checkNo' },
  { name: 'Applied credits', type: 'currency', prop: 'appliedCredits' },
  { name: 'Payment Amount', type: 'currency', prop: 'paymentAmount' },
];

export default {
  mixins: [entityEditMixin, userRoleCheckMixin, notificationMixin],
  components: {
    SiConnectorDetails,
    PaymentMethodSelector,
    SimpleBasicSelect,
    UtcFlatpickr,
    VoidModal,
    AttachmentsModal,
  },
  data: () => ({
    apPayment: {
      _id: '',
      paymentMethod: { name: '' },
      bankAccount: { _id: '', name: '' },
      details: [],
      siConnector: { isSynced: false, error: '' },
      vendor: {
        _id: '',
        firstName: '',
        lastName: '',
        vendorDetails: {
          address: { state: '', country: '' },
          billingInformation: { ptPayOrPayPal: '' },
        },
      },
      voidDetails: { isVoided: false },
      paymentDate: null,
      attachments: [],
    },
    bankAccounts: null,
    selectedPaymentMethod: '',
    mockedPaymentReverseSIPayload: '',
  }),
  computed: {
    ...mapGetters('features', ['mock']),
    entityName() {
      return 'Ap Payment';
    },
    localPaymentDate() {
      const paymentDate = _.get(this, 'apPayment.paymentDate', new Date());
      return localDateTime(paymentDate, 'YYYY-MM-DD HH:mm');
    },
    isValid() {
      if (!this.canCreate) {
        return true;
      }
      return this.isValidBankAccount && this.isValidPaymentDate && this.isValidPaymentMethod;
    },
    isValidPaymentDate() {
      return moment(this.apPayment.paymentDate).isValid();
    },
    isValidPaymentMethod() {
      return !_.isEmpty(this.apPayment.paymentMethod);
    },
    isValidBankAccount() {
      return !_.isEmpty(this.apPayment.bankAccount);
    },
    ptOrPaypal() {
      return _.get(this.apPayment, 'vendor.vendorDetails.billingInformation.ptPayOrPayPal');
    },
    status() {
      if (this.apPayment.voidDetails.isVoided) {
        return 'Voided';
      }
      return _.defaultTo(_.get(apPaymentService.humanReadableStatusList(), this.apPayment.status), '');
    },
    syncedDescription() {
      return this.apPayment.siConnector.isSynced
        ? 'Synced is true when the AP payment has been successfully synchronized with the accounting platform'
        : 'Synced is false when the AP payment has not been synchronized with the accounting platform yet';
    },
    vendorAddress() {
      return _.get(this.apPayment, 'vendor.vendorDetails.address', {});
    },
    vendorState() {
      return _.get(this.vendorAddress, 'state', {});
    },
    vendorCountry() {
      return _.get(this.vendorAddress, 'country', {});
    },
    paymentMethod() {
      return _.get(this.apPayment, 'paymentMethod.name');
    },
    bankAccount() {
      return _.get(this.apPayment, 'bankAccount.name');
    },
    totalPaymentAmount() {
      return _.sumBy(this.apPayment.details, 'paymentAmount');
    },
    totalCreditsApplied() {
      return _.sumBy(this.apPayment.details, 'appliedCredits');
    },
    vendorName() {
      const vendorCompany = _.get(this.apPayment.vendor, 'vendorDetails.vendorCompany');
      if (_.isEmpty(vendorCompany)) {
        return `${this.apPayment.vendor.firstName} ${this.apPayment.vendor.lastName}`;
      }
      return vendorCompany;
    },
    isNotSyncedWithErrors() {
      return !this.apPayment.siConnector.isSynced && !_.isEmpty(this.apPayment.siConnector.error);
    },
    canCreate: function () {
      return this.hasRole('AP-PAYMENT_CREATE_ALL') && this.isNotSyncedWithErrors;
    },
    voidDetails() {
      return {
        Date: this.localPaymentDate,
        Vendor: this.vendorName,
        'Document No': this.apPayment._id,
        Amount: this.totalPaymentAmount,
      };
    },
    canEdit() {
      return this.hasRole('AP-PAYMENT_UPDATE_ALL');
    },
    canUpdateOrDownloadFiles() {
      if (this.canEdit) {
        return true;
      }
      const canUpdateOwn = this.hasRole('AP-PAYMENT-FILES_UPDATE_OWN');
      const vendorId = _.get(this, 'apPayment.vendor._id');
      const isOwner = this.userLogged._id === vendorId;
      return canUpdateOwn && isOwner;
    },
    canVoid() {
      if (this.apPayment.siConnector.isSynced && this.totalPaymentAmount === 0) {
        return false;
      }
      return !this.apPayment.voidDetails.isVoided && this.canEdit;
    },
    canViewMockedSIPayload() {
      return this.mock && this.mockedPaymentReverseSIPayload;
    },
  },
  created() {
    this.datepickerOptions = {
      onValueUpdate: null,
      enableTime: true,
      allowInput: false,
      disableMobile: 'true',
      minDate: null,
    };
    this.tableColumns = COLUMNS;
    this.bankAccounts = bankAccountService.retrieve();
  },
  watch: {
    selectedPaymentMethod(newValue) {
      if (this.canCreate) {
        this.apPayment.paymentMethod = newValue;
      }
    },
    'apPayment.paymentMethod'(newValue) {
      if (this.canCreate) {
        this.selectedPaymentMethod = _.get(newValue, '_id', newValue);
      }
    },
  },
  methods: {
    _service: () => apPaymentService,
    _refreshEntity(freshEntity) {
      this.$set(this, 'apPayment', freshEntity);
    },
    _handleRetrieve({ data = {} }) {
      const { apPayment } = data;
      this.apPayment = { ...this.apPayment, ...apPayment };
      if (_.has(apPayment, 'bankAccount._id') && this.canCreate) {
        this.apPayment.bankAccount = apPayment.bankAccount._id;
      }
    },
    _handleEditResponse({ data = {} }) {
      Object.assign(this.apPayment, data.apPayment);
    },
    colValue({ prop, val }, data) {
      if (!_.isEmpty(prop)) {
        return _.get(data, prop, '');
      }
      if (_.isFunction(val)) {
        return val(data);
      }
      return !_.isEmpty(val) ? val : '';
    },
    onPaymentDateChange(paymentDate) {
      this.$set(this.apPayment, 'paymentDate', moment(paymentDate).utc());
    },
    save() {
      if (this.isValid) {
        const apPayment = _.cloneDeep(this.apPayment);
        this._save(apPayment, { successEditMessage: 'AP Payment successfully updated' });
      }
    },
    async voidApPayment(data) {
      try {
        this.httpRequesting = true;
        const response = await apPaymentService.void(this.apPayment._id, data);
        this._handleEditResponse(response);
        this.pushSuccess('AP payment was voided successfully!');
      } catch (error) {
        this.pushError(error.message, error);
      } finally {
        this.httpRequesting = false;
      }
    },
    async getPaymentReverseSIPayload() {
      if (!this.mock) {
        return;
      }
      try {
        const { data } = await connectorService.getEntityPayload('ApPayment', this.apPayment._id);
        this.mockedPaymentReverseSIPayload = data;
      } catch (err) {
        this.pushNotification({
          title: 'Error',
          message: _.get(err, 'status.message', 'Error getting compiled payload for entity'),
          state: 'danger',
          response: err,
        });
      }
    },
  },
};
