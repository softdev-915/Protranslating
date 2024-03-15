import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import PaymentMethodService from '../../../../services/payment-method-service';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';

const CUSTOM_PROPS = ['value', 'options', 'formatOption', 'entityName'];
const CUSTOM_LISTENERS = ['input'];
const paymentMethodService = new PaymentMethodService();
const buildInitialState = () => ({
  options: [],
  selected: null,
});

export default {
  components: { SimpleBasicSelect },
  props: {
    value: {
      type: [Object, String],
    },
    disabled: {
      type: Boolean,
      default: true,
    },
    paymentMethodsAvailable: {
      type: Array,
    },
    formatOption: {
      type: Function,
      default: ({ name = '', _id = '' }) => ({ text: name, value: _id }),
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },
  data() {
    return buildInitialState();
  },
  created() {
    if (this.paymentMethodsAvailable) {
      this.options = this.paymentMethodsAvailable;
    } else if (_.get(this, 'canReadPaymentMethod', false)) {
      this.options = paymentMethodService.retrieve();
    }
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canReadPaymentMethod() {
      return hasRole(this.userLogged, 'PAYMENT-METHOD_READ_ALL')
      || hasRole(this.userLogged, 'COMPANY-BILLING_READ_OWN')
      || hasRole(this.userLogged, 'BILL_READ_OWN')
      || hasRole(this.userLogged, 'COMPANY_UPDATE_ALL');
    },
    wrappedProps() {
      return _.omit(_.get(this, '$props', {}), CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(_.get(this, '$listeners', []), CUSTOM_LISTENERS);
    },
  },
  watch: {
    value: {
      handler(newValue) {
        this.selected = newValue;
      },
      immediate: true,
    },
    selected(newValue) {
      this.$emit('input', newValue);
    },
  },
};
