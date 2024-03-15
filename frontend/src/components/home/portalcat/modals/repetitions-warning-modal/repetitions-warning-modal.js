import _ from 'lodash';

export default {
  data() {
    return {
      payload: null,
      isRepetitionsWarningDisabled: false,
    };
  },
  methods: {
    hide() {
      this.$refs.bModal.hide();
    },
    show(payload) {
      this.payload = payload;
      this.$refs.bModal.show();
      this.$refs.segmentOnlyBtn.focus();
    },
    cancel() {
      this.hide();
      const handler = _.get(this, 'payload.handler');
      if (_.isFunction(handler)) {
        handler({
          confirm: false,
          isRepetitionsWarningDisabled: this.isRepetitionsWarningDisabled,
        });
      }
    },
    confirm() {
      this.hide();
      const handler = _.get(this, 'payload.handler');
      if (_.isFunction(handler)) {
        handler({ confirm: true, isRepetitionsWarningDisabled: this.isRepetitionsWarningDisabled });
      }
    },
  },
};
