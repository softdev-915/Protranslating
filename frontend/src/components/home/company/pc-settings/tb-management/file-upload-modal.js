import _ from 'lodash';
import LanguageCombinationSelect from '../../../../language-combination-selector/index.vue';

export default {
  components: { LanguageCombinationSelect },
  data() {
    return {
      file: null,
      languageCombinations: [],
      isReviewed: false,
    };
  },
  computed: {
    isValid() {
      return this.isValidLanguageCombination && !_.isNil(this.file);
    },
    isValidLanguageCombination() {
      return !_.isEmpty(this.languageCombinations) &&
        this.firstLanguageCombination.value.length === 2;
    },
    firstLanguageCombination() {
      return _.first(this.languageCombinations);
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
        srcLang: {
          name: this.firstLanguageCombination.value[0].text,
          isoCode: this.firstLanguageCombination.value[0].value,
        },
        tgtLang: {
          name: this.firstLanguageCombination.value[1].text,
          isoCode: this.firstLanguageCombination.value[1].value,
        },
        isReviewed: this.isReviewed,
      };
      this.$emit('file-upload', data);
      this.hide();
      this.resetState();
    },
    resetState() {
      this.file = null;
      this.$refs.fileInputForm.reset();
      this.isReviewed = false;
      this.languageCombinations = [];
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
