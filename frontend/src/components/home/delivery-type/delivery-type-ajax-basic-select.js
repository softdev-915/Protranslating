import _ from 'lodash';
import { mapGetters } from 'vuex';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import DeliveryTypeService from '../../../services/delivery-type-service';
import { hasRole } from '../../../utils/user';

const CUSTOM_PROPS = ['value', 'formatOption', 'preFetchOption', 'entityName', 'options'];
const CUSTOM_LISTENERS = ['input'];
const deliveryTypeService = new DeliveryTypeService();
const buildInitialState = () => ({ selected: null, options: [] });

export default {
  components: { SimpleBasicSelect },
  props: {
    value: {
      type: [Object, String],
    },
    formatOption: {
      type: Function,
      default: ({ name = '', _id = null }) => ({
        text: name,
        value: _id,
      }),
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    selectedServiceType: {
      type: String,
      default: null,
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },
  data() {
    return buildInitialState();
  },
  created() {
    this.retrieveOptions();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    filteredOptions() {
      return _.isNil(this.selectedServiceType) ? this.options : this.options
        .filter(option => option.serviceTypeId === this.selectedServiceType);
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
  methods: {
    async retrieveOptions() {
      if (hasRole(this.userLogged, 'DELIVERY-TYPE_READ_ALL')) {
        const options = await deliveryTypeService.retrieve();
        this.options = _.get(options, 'data.list', []);
      }
    },
  },
};
