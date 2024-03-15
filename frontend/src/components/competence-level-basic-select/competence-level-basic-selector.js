import _ from 'lodash';
import ServiceRequestLocker from '../../services/service-request-locker';
import CompetenceLevelService from '../../services/competence-level-service';
import { selectMixin } from '../../mixins/select-mixin';
import SimpleBasicSelect from '../form/simple-basic-select.vue';

const CUSTOM_PROPS = ['value', 'options', 'formatOption', 'entityName', 'fetchOnCreated'];
const CUSTOM_LISTENERS = ['input'];
const buildInitialState = () => ({
  options: [],
  selected: null,
});
const service = new CompetenceLevelService();
const serviceRequestLocker = new ServiceRequestLocker(service);

export default {
  mixins: [selectMixin],
  components: { SimpleBasicSelect },
  props: {
    value: {
      type: [Object, String],
      required: true,
    },
    competenceLevelsAvailable: {
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
  computed: {
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
      this.options = _.isEmpty(this.competenceLevelsAvailable)
        ? serviceRequestLocker.retrieve()
        : this.competenceLevelsAvailable;
    },
  },
};
