import _ from 'lodash';
import AbilityService from '../../services/ability-service';
import ServiceRequestLocker from '../../services/service-request-locker';
import { selectMixin } from '../../mixins/select-mixin';
import SimpleBasicSelect from '../form/simple-basic-select.vue';

const CUSTOM_PROPS = ['value', 'options', 'formatOption', 'entityName'];
const CUSTOM_LISTENERS = ['input'];
const service = new AbilityService();
const serviceRequestLocker = new ServiceRequestLocker(service);

export default {
  mixins: [selectMixin],
  components: { SimpleBasicSelect },
  props: {
    value: {
      type: [Object, String],
      required: true,
    },
    abilitiesAvailable: {
      type: Array,
    },
    formatOption: {
      type: Function,
      default: ({ name = '', _id = '' }) => ({
        text: name,
        value: { name, _id },
      }),
    },
    filter: {
      type: Function,
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },
  data() {
    return ({
      selected: null,
      abilities: [],
    });
  },
  computed: {
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    options() {
      return _.filter(this.abilities, this.filter);
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
    abilitiesAvailable(newValue) {
      if (!_.isEmpty(newValue)) {
        this.abilities = newValue;
      }
    },
  },
  methods: {
    onOptionsLoaded(abilities) {
      this.$emit('abilities-loaded', abilities);
    },
    _retrieve() {
      if (_.isEmpty(this.abilitiesAvailable)) {
        serviceRequestLocker.retrieve().then((response) => {
          this.abilities = _.get(response, 'data.list', []);
        });
      } else {
        this.abilities = this.abilitiesAvailable;
      }
    },
  },
};
