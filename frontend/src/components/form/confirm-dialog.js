export default {
  name: 'confirm-dialog',
  props: {
    confirmationMessage: String,
    confirmationTitle: String,
    containerClass: {
      type: String,
      default: 'center',
    },
    showRememberOption: Boolean,
    cancelText: {
      type: String,
      default: 'No',
    },
    confirmText: {
      type: String,
      default: 'Yes',
    },
    cancelBtnClass: {
      type: String,
      default: 'btn-danger',
    },
    confirmBtnClass: {
      type: String,
      default: 'btn-primary',
    },
    dataE2eType: {
      type: String,
      default: 'confirm-dialog',
    },
  },
  data() {
    return {
      payload: null,
      storedResponse: false,
    };
  },
  methods: {
    show(data) {
      this.payload = data;
      if (!this.storedResponse) {
        this.$refs.confirm.show();
      } else {
        this.confirm();
      }
    },
    hide() {
      this.$refs.confirm.hide();
    },
    confirm() {
      this.$emit('confirm', { confirm: true, data: this.payload });
      this.hide();
    },
    cancel() {
      this.$emit('cancel', { confirm: false });
      this.hide();
    },
  },
};
