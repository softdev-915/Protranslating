import _ from 'lodash';
import { mapGetters } from 'vuex';
import TranslationUnitService from '../../services/translation-unit-service';
import ServiceRequestLocker from '../../services/service-request-locker';
import { hasRole } from '../../utils/user';
import { selectMixin } from '../../mixins/select-mixin';
import SimpleBasicSelect from '../form/simple-basic-select.vue';

const CUSTOM_PROPS = ['value', 'options', 'formatOption', 'filterOption', 'entityName'];
const CUSTOM_LISTENERS = ['input'];
const buildInitialState = () => ({
  options: [],
  selected: null,
});
const service = new TranslationUnitService();
const serviceRequestLocker = new ServiceRequestLocker(service);

export default {
  mixins: [selectMixin],
  components: { SimpleBasicSelect },
  props: {
    value: {
      type: [Object, String],
    },
    translationUnitsAvailable: {
      type: Array,
    },
    formatOption: {
      type: Function,
      default: ({ name = '', _id = '' }) => ({ text: name, value: _id }),
    },
    filter: {
      type: String,
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },
  data() {
    return buildInitialState();
  },
  created() {
    if (this.translationUnitsAvailable) {
      this.options = this.translationUnitsAvailable;
    }
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRetrieve() {
      return hasRole(this.userLogged, 'TRANSLATION-UNIT_READ_ALL');
    },
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
  },
  watch: {
    filter(newValue) {
      const isPromise = _.get(this.options, 'promise', this.options) instanceof Promise;
      if (!_.isEmpty(newValue) && !_.isEmpty(this.options) && !isPromise) {
        const translationUnit = this.options.find((b) => b.name === newValue);
        this._selectOption(_.get(translationUnit, '_id'));
      }
    },
    value: {
      handler(newValue) {
        this._selectOption(newValue);
      },
      immediate: true,
    },
    selected(newValue) {
      this.$emit('input', newValue);
    },
  },
  methods: {
    _selectOption(newValue) {
      this.selected = newValue;
    },
    filterOption(option) {
      const filter = _.defaultTo(this.filter, '');
      const name = _.get(option, 'name', '');
      return ['', name].includes(filter);
    },
    _retrieve() {
      if (this.canRetrieve && _.isEmpty(this.translationUnitsAvailable)) {
        this.options = serviceRequestLocker.retrieve();
      }
    },
  },
};
