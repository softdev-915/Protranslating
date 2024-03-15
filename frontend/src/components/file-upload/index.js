import _ from 'lodash';

export default {
  props: {
    label: {
      type: String,
      required: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    accept: {
      type: String,
      default: '',
    },
  },
  computed: {
    hasFileUploadButtonSlot() {
      return !!this.$slots['file-upload-button'];
    },
  },
  methods: {
    onFileUpload() {
      if (!_.isNil(this.$refs.fileInput)) {
        this.$refs.fileInput.click();
      }
    },
    onFileInputChanged(event) {
      const file = _.get(event, 'target.files[0]', null);
      if (!_.isNil(file)) {
        this.$emit('on-file-selected', file);
        this.$refs.fileInput.value = '';
      }
    },
  },
};
