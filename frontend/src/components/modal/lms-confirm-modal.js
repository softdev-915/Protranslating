import _ from 'lodash';
import LmsModal from './lms-modal.vue';

export default {
  name: 'LmsConfirmModal',
  components: {
    LmsModal,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
  },
  computed: {
    isVisible: {
      get() {
        return !_.isEmpty(this.value);
      },
      set(value) {
        if (!value) {
          this.$emit('input', {});
        }
      },
    },
    title() {
      return _.get(this.value, 'title', '');
    },
    message() {
      return _.get(this.value, 'message', '');
    },
    confirmText() {
      return _.get(this.value, 'confirmText', 'Yes');
    },
    cancelText() {
      return _.get(this.value, 'cancelText', 'No');
    },
    onSubmit() {
      return _.get(this.value, 'onSubmit');
    },
    onCancel() {
      return _.get(this.value, 'onCancel');
    },
    modalDataE2e() {
      return _.get(this.value, 'modalDataE2e', 'lms-modal');
    },
  },
  methods: {
    cancel() {
      this.isVisible = null;
      if (_.isFunction(this.onCancel)) {
        this.onCancel();
      }
    },
    submit() {
      this.isVisible = null;
      if (_.isFunction(this.onSubmit)) {
        this.onSubmit();
      }
    },
  },
};
