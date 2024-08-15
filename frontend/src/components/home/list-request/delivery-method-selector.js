import _ from 'lodash';
import { mapGetters } from 'vuex';
import { selectMixin } from '../../../mixins/select-mixin';
import { hasRole } from '../../../utils/user';
import DeliveryMethodService from '../../../services/delivery-method-service';
import ServiceRequestLocker from '../../../services/service-request-locker';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';

const CUSTOM_PROPS = ['value', 'options', 'formatOption', 'entityName', 'fetchOnCreated'];
const CUSTOM_LISTENERS = ['input'];
const buildInitialState = () => ({
  options: [],
  selected: null,
});
const service = new DeliveryMethodService();
const serviceRequestLocker = new ServiceRequestLocker(service);

export default {
  components: { SimpleBasicSelect },
  mixins: [selectMixin],
  props: {
    value: {
      type: [Object, String],
    },
    deliveryMethodsAvailable: {
      type: Array,
    },
    formatOption: {
      type: Function,
      default: ({ name = '', _id = '' }) => ({
        text: name,
        value: { _id, name },
      }),
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },
  data() {
    return buildInitialState();
  },
  created() {
    if (this.deliveryMethodsAvailable) {
      this.options = this.deliveryMethodsAvailable;
    }
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
  computed: {
    ...mapGetters('app', ['userLogged']),
    canReadDeliveryMethods() {
      return hasRole(this.userLogged, 'DELIVERY-METHOD_READ_ALL');
    },
    customProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    customListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
  },
  methods: {
    _retrieve() {
      if (this.canReadDeliveryMethods) {
        this.options = serviceRequestLocker.retrieve();
      }
    },
  },
};
