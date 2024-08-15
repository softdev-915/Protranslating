export const SchedulerModalMixin = {
  props: {
    showModal: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      selectedOption: { value: '', text: '' },
    };
  },
  watch: {
    showModal(show) {
      return show ? this.openModal() : this.hideModal();
    },
  },
  methods: {
    openModal() {
      if (this.$refs.modal) {
        this.$emit('on-modal-show');
        this.$refs.modal.show();
      }
    },
    hideModal() {
      if (this.$refs.modal) {
        this.$emit('on-modal-hide');
        this.$refs.modal.hide();
      }
    },
    runNow() {
      this.$emit('on-run-now');
    },
    onOptionSelect(selectedOption) {
      this.selectedOption = selectedOption;
      this.$emit('on-option-select', selectedOption);
    },
  },
};
