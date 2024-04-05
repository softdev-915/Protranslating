import _ from 'lodash';
import { mapGetters } from 'vuex';
import BreakdownService from '../../services/breakdown-service';
import ServiceRequestLocker from '../../services/service-request-locker';
import { hasRole } from '../../utils/user';
import { selectMixin } from '../../mixins/select-mixin';
import SimpleBasicSelect from '../form/simple-basic-select.vue';

const CUSTOM_PROPS = ['value', 'options', 'formatOption', 'entityName'];
const CUSTOM_LISTENERS = ['input'];
const service = new BreakdownService();
const serviceRequestLocker = new ServiceRequestLocker(service);
const buildInitialState = () => ({
  options: [],
  loading: false,
  selected: null,
});

export default {
  mixins: [selectMixin],
  components: { SimpleBasicSelect },
  props: {
    value: {
      type: [Object, String],
      required: true,
    },
    breakdownsAvailable: {
      type: Array,
    },
    formatOption: {
      type: Function,
      default: ({ name = '', _id = '' }) => ({
        text: name,
        value: { text: name, value: _id },
      }),
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },
  data() {
    return buildInitialState();
  },
  created() {
    if (this.breakdownsAvailable) {
      this.options = this.breakdownsAvailable;
    }
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRetrieve() {
      return hasRole(this.userLogged, 'BREAKDOWN_READ_ALL');
    },
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
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
    _retrieve() {
      if (this.canRetrieve && _.isEmpty(this.breakdownsAvailable)) {
        this.options = serviceRequestLocker.retrieve();
      }
    },
  },
};
