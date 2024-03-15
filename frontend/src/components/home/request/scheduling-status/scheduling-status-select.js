import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { selectMixin } from '../../../../mixins/select-mixin';
import { hasRole } from '../../../../utils/user';
import SchedulingStatusService from '../../../../services/scheduling-status-service';
import ServiceRequestLocker from '../../../../services/service-request-locker';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';

const CUSTOM_PROPS = [
  'value', 'options', 'formatOption', 'emptyOption', 'preFetchOption', 'entityName', 'fetchOnCreated',
];
const CUSTOM_LISTENERS = ['input'];
const buildInitialState = () => ({ options: [], selected: null });
const service = new SchedulingStatusService();
const serviceRequestLocker = new ServiceRequestLocker(service);

export default {
  components: { SimpleBasicSelect },
  mixins: [selectMixin],
  props: {
    value: {
      type: [Object, String],
    },
    formatOption: {
      type: Function,
      default: ({ name = '', _id = '' }) => ({
        text: name,
        value: { _id, name },
      }),
    },
    emptyOption: {
      type: Object,
      default: () => ({ text: '', value: {} }),
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },
  data() {
    return buildInitialState();
  },
  created() {
    const fetchOnCreated = _.get(this, 'fetchOnCreated', true);
    if (!fetchOnCreated) {
      const value = _.get(this, 'value', {});
      this.preFetchOption = this.formatOption(value);
    } else {
      this.preFetchOption = {};
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
    canRetrieve() {
      return hasRole(this.userLogged, 'REQUEST_CREATE_ALL');
    },
    customProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    customListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    _retrieve() {
      if (this.canRetrieve) {
        this.options = serviceRequestLocker.retrieve();
      }
    },
  },
};
