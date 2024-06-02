import _ from 'lodash';
import LanguageSelect from '../language-select/language-select.vue';

export default {
  components: {
    LanguageSelect,
  },
  data() {
    return {
      file: null,
      language: {},
    };
  },
  computed: {
    isValid() {
      return !_.isEmpty(this.language) && !_.isNil(this.file);
    },
  },
  methods: {
    show() {
      this.$refs.modal.show();
    },
    hide() {
      this.$refs.modal.hide();
    },
    save() {
      const data = {
        file: this.file,
        language: this.language,
      };
      this.$emit('file-upload', data);
      this.hide();
      this.resetState();
    },
    resetState() {
      this.file = null;
      this.$refs.fileInputForm.reset();
      this.language = {};
    },
    onLanguageSelect(language) {
      this.language = language;
    },
    fireUploadPrompt() {
      this.$refs.fileUploadInput.click();
    },
    onFileSelect(event) {
      const file = _.first(_.get(event, 'target.files', []));
      this.file = file;
    },
  },
};
