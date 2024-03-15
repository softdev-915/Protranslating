import _ from 'lodash';
import { mapGetters } from 'vuex';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import ServiceTypeService from '../../../services/service-type-service';
import { hasRole } from '../../../utils/user';

const CUSTOM_PROPS = ['value', 'formatOption', 'preFetchOption', 'entityName', 'options'];
const CUSTOM_LISTENERS = ['input'];
const serviceTypeService = new ServiceTypeService();
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
      if (hasRole(this.userLogged, 'SERVICE-TYPE_READ_ALL')) {
        const options = await serviceTypeService.retrieve();
        this.options = _.get(options, 'data.list', []);
      }
    },
  },
};
