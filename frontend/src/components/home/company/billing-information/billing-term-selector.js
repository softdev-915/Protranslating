import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import BillingTermService from '../../../../services/billing-term-service';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';

const CUSTOM_PROPS = ['value', 'options', 'formatOption', 'isDisabled', 'entityName'];
const CUSTOM_LISTENERS = ['input'];
const billingTermService = new BillingTermService();
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
    billingTermsAvailable: {
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
    if (this.billingTermsAvailable) {
      this.options = this.billingTermsAvailable;
    } else if (_.get(this, 'canReadBillingInformation', false)) {
      this.options = billingTermService.retrieve();
    }
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canReadBillingInformation() {
      return hasRole(this.userLogged, 'BILLING-TERM_READ_ALL')
        || hasRole(this.userLogged, 'COMPANY-BILLING_READ_OWN')
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
