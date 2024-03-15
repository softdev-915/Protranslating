import _ from 'lodash';
import { mapGetters } from 'vuex';
import ConfirmDialog from '../form/confirm-dialog.vue';

export default {
  name: 'progress-upload',
  props: {
    confirmationMessage: String,
  },
  components: {
    ConfirmDialog,
  },
  data() {
    return {
      progress: null,
    };
  },
  watch: {
    globalEvent({ progress }) {
      if (!_.isNil(progress)) this.progress = progress;
    },
  },
  computed: {
    ...mapGetters('app', ['globalEvent']),
    isProgress() {
      return this.progress;
    },
  },
  methods: {
    cancelDialog() {
      if (!_.isNil(this.$refs.cancelUploading)) {
        this.$refs.cancelUploading.show();
      }
    },
    confirm() {
      this.$emit('confirm');
    },
    cancel() {
      this.$emit('cancel');
    },
  },
};
