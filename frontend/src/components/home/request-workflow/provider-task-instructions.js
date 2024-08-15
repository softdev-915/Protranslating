import _ from 'lodash';
import userRoleCheck from '../../../mixins/user-role-check';
import ProviderInstructionsAjaxBasicSelect from '../../provider-instructions-ajax-basic-select/provider-instructions-ajax-basic-select.vue';

export default {
  mixins: [userRoleCheck],
  props: {
    value: {
      type: String,
      default: '',
    },
    canEditTask: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      providerInstructions: '',
      selectedProviderInstructions: {
        text: '',
        value: '',
        body: '',
      },
    };
  },
  components: {
    ProviderInstructionsAjaxBasicSelect,
  },
  computed: {
    canReadOwn() {
      return !this.hasRole('PROVIDER-TASK-INSTRUCTIONS_READ_ALL') && this.hasRole('PROVIDER-TASK-INSTRUCTIONS_READ_OWN');
    },

  },
  watch: {
    providerInstructions(newValue) {
      this.$emit('input', newValue);
    },
    selectedProviderInstructions(newValue) {
      const providerInstructionBody = _.get(newValue, 'body', '');
      if (providerInstructionBody) {
        this.providerInstructions = providerInstructionBody;
      }
    },
  },
  created() {
    this.providerInstructions = this.value;
  },
  methods: {
    hideModal() {
      if (this.$refs.instructionsModal) {
        this.$refs.instructionsModal.hide();
      }
    },
    showModal() {
      if (this.$refs.instructionsModal) {
        this.$refs.instructionsModal.show();
      }
    },
    onProviderInstructionSelected(newVale) {
      this.selectedProviderInstructions = newVale;
    },
  },
};
