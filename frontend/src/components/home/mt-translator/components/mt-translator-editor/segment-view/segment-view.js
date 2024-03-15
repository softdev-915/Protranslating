import SuggestionDropdown from '../suggestion-dropdown/suggestion-dropdown.vue';
import Segment from '../segment/segment.vue';

export default {
  components: {
    SuggestionDropdown,
    Segment,
  },
  props: {
    settings: {
      type: Object,
    },
    translate: {
      type: Function,
    },
    text: {
      type: String,
    },
    isTranslationCompleted: {
      type: Boolean,
    },
    segmentedText: {
      type: Array,
    },
    activeSegment: {
      type: Number,
    },
    translatedText: {
      type: Array,
    },
    suggestionModels: {
      type: Object,
    },
  },
  methods: {
    selectSegment(index) {
      this.$emit('select-segment', index);
    },
    changeTranslatedSegment(text) {
      this.$emit('translation-input', text);
    },
    changeSourceSegment(text) {
      this.$emit('source-input', text);
    },
    clearSource() {
      this.$emit('input', '');
    },
    setMtNode(mtNode) {
      this.$emit('set-mt-node', mtNode);
    },
  },
};
