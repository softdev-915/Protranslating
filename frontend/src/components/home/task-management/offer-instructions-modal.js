import _ from 'lodash';

const NO_INSTRUCTIONS = 'No Instructions';

export default {
  props: {
    value: {
      type: String,
    },
    providerTaskInstructions: {
      type: String,
    },
    offerId: {
      type: String,
    },
  },
  computed: {
    showModal() {
      return this.value === this.offerId;
    },
    instructions() {
      if (_.isEmpty(this.providerTaskInstructions)) {
        return NO_INSTRUCTIONS;
      }
      return this.providerTaskInstructions;
    },
    shouldShowIcon() {
      return !_.isEmpty(this.providerTaskInstructions);
    },
  },
  methods: {
    closeModal() {
      this.$emit('input', null);
    },
    openModal() {
      this.$emit('input', this.offerId);
    },
  },
};
