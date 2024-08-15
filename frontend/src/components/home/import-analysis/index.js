import FileUpload from '../../file-upload/file-upload.vue';

export default {
  components: {
    FileUpload,
  },
  props: {
    canUploadAnalysis: {
      type: Boolean,
      default: false,
    },
    tooltip: {
      type: String,
      required: true,
    },
    customClass: {
      type: String,
      default: '',
    },
    parseFunc: {
      type: Function,
      required: true,
    },
  },
  methods: {
    show() {
      this.$emit('show-analysis-modal', this.parseFunc);
    },
  },
};
