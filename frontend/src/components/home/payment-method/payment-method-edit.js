import _ from 'lodash';
import { mapGetters } from 'vuex';
import PaymentMethodService from '../../../services/payment-method-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';
import { findPaymentMethodValidationError } from './payment-method-validator';

const paymentMethodService = new PaymentMethodService();
const buildInitialState = () => ({
  paymentMethod: {
    _id: '',
    name: '',
    deleted: false,
    readDate: null,
  },
});

export default {
  mixins: [entityEditMixin],
  data() {
    return buildInitialState();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'paymentMethod';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'PAYMENT-METHOD_CREATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'PAYMENT-METHOD_UPDATE_ALL');
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      if (this.paymentMethod && typeof this.paymentMethod === 'object') {
        return this.paymentMethod._id === '';
      }
    },
    isValid: function () {
      return this.entityValidationErrors.length === 0;
    },
    entityValidationErrors() {
      return findPaymentMethodValidationError(this.paymentMethod);
    },
  },
  methods: {
    _service() {
      return paymentMethodService;
    },
    _handleRetrieve(response) {
      this.paymentMethod = response.data.paymentMethod;
    },
    _handleCreate(response) {
      this.paymentMethod._id = response.data.paymentMethod._id;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.paymentMethod.readDate');
      if (newReadDate) {
        this.paymentMethod.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'paymentMethod', freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.paymentMethod);
      }
    },
    cancel() {
      this.close();
    },
  },
};
