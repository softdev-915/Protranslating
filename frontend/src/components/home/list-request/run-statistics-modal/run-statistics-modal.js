/* global document, Blob */

import { mapActions } from 'vuex';

export default {
  props: {
    value: {
      type: Object,
      required: true,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    open() {
      this.$refs.modal.show();
    },
    close() {
      this.$refs.modal.hide();
    },
    runStatistics() {
      this.$emit('run-statistics');
      this.close();
    },
  },
};
