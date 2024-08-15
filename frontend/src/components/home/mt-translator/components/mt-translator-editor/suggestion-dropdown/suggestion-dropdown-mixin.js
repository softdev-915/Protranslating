import _ from 'lodash';

export default {
  data() {
    return {
      activeWord: {
        segmentIndex: null,
        wordIndex: null,
      },
    };
  },
  props: {
    suggestionModels: {
      type: Object,
    },
    selectedSegment: {
      type: Number,
    },
    translatedText: {
      type: Array,
    },
  },
  computed: {
    suggestionSource() {
      return _.get(this.translatedText, `[${this.activeWord.segmentIndex}]`, []).join(' ');
    },
    suggestionPrefix() {
      return _.get(this.translatedText, `[${this.activeWord.segmentIndex}][${this.activeWord.wordIndex}]`);
    },
  },
  methods: {
    setActiveWord(segmentIndex, wordIndex) {
      this.activeWord = {
        segmentIndex,
        wordIndex,
      };
    },
    suggestionInput(text) {
      this.$emit('suggestion-input', this.activeWord.wordIndex, text);
      this.activeWord = {
        segmentIndex: null,
        wordIndex: null,
      };
    },
    dropdownClose() {
      this.activeWord = {
        segmentIndex: null,
        wordIndex: null,
      };
    },
  },
};
