import _ from 'lodash';
import { mapGetters } from 'vuex';
import CertificationService from '../../../../services/certification-service';
import { hasRole } from '../../../../utils/user';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';

const service = new CertificationService();
const CUSTOM_PROPS = ['value', 'options', 'formatOption', 'emptyOption', 'entityName'];
const CUSTOM_LISTENERS = ['input'];
const buildInitialState = () => ({
  options: [],
  selected: null,
});

export default {
  components: { SimpleBasicSelect },

  data() {
    return buildInitialState();
  },

  props: {
    certificationsAvailable: Array,
    value: { type: Object, required: true },
    formatOption: {
      type: Function,
      default: ({ name = '', _id = '' }) => ({
        text: name,
        value: { _id, name },
      }),
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },

  watch: {
    certificationsAvailable: {
      handler(newVal) {
        if (Array.isArray(newVal)) {
          this.options = newVal;
        } else if (_.get(this, 'canRetrieve', false)) {
          this.options = service.retrieve();
        }
      },
      immediate: true,
    },
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

    customProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    customListeners() {
      return _.omit(_.get(this, '$listeners', []), CUSTOM_LISTENERS);
    },
    canRetrieve() {
      return hasRole(this.userLogged, 'USER_READ_ALL');
    },
  },
};
