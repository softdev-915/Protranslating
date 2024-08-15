import _ from 'lodash';
import { mapGetters } from 'vuex';
import ApPaymentService from '../../../services/ap-payment-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import userRoleCheckMixin from '../../../mixins/user-role-check';

const apPaymentService = new ApPaymentService();
const buildInitialState = () => ({
  apPayment: {
    _id: '',
    status: '',
    amountPaid: 0,
    balance: 0,
    vendor: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      vendorDetails: {
        address: {
          line1: '',
          line2: '',
          city: '',
          country: {
            name: '',
            code: '',
          },
          state: {
            name: '',
          },
          zip: '',
        },
        billingInformation: {
          taxId: '',
          paymentMethod: {
            name: '',
          },
          billingTerms: {
            name: '',
          },
          wtFeeWaived: false,
          priorityPayment: false,
          billPaymentNotes: '',
        },
        vendorCompany: '',
      },
    },
    sync: {
      synced: false,
      error: '',
      lastSyncDate: '',
    },
    selectedStatus: '',
    deleted: false,
    readDate: null,
  },
});

export default {
  mixins: [entityEditMixin, userRoleCheckMixin],
  data() {
    return buildInitialState();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'apPayment';
    },
    canCreate: function () {
      return this.hasRole('AP-PAYMENT_CREATE_ALL');
    },
    canEdit: function () {
      return this.hasRole('AP-PAYMENT_UPDATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return _.get(this, 'apPayment._id', '') === '';
    },
    isValid: function () {
      return _.isEmpty(this.errors.items);
    },
  },
  methods: {
    _service() {
      return apPaymentService;
    },
    _handleRetrieve(response) {
      this.apPayment = _.get(response, 'data.apPayment');
    },
    _handleCreate(response) {
      this.apPayment._id = _.get(response, 'data.apPayment._id');
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.apPayment.readDate');
      if (newReadDate) {
        this.apPayment.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'apPayment', freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.apPayment);
      }
    },
    cancel() {
      this.close();
    },
  },
};
