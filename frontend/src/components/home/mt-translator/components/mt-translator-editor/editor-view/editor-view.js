/* global window document navigator */
import _ from 'lodash';
import { mapActions } from 'vuex';
import EditorField from './editor-field/editor-field.vue';

export default {
  components: {
    EditorField,
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
    isSegmentationLoading: {
      type: Boolean,
    },
    isSegmentationCompleted: {
      type: Boolean,
    },
    isTranslationLoading: {
      type: Boolean,
    },
    isTranslationCompleted: {
      type: Boolean,
    },
    activeSegment: {
      type: Number,
    },
    segmentedText: {
      type: Array,
    },
    translatedText: {
      type: Array,
    },
    isDisabled: {
      type: Boolean,
    },
    suggestionModels: {
      type: Object,
    },
  },
  computed: {
    sourceStringFromSegments() {
      return this.segmentedText.join(' ');
    },
    targetStringFromSegments() {
      return this.translatedText.join(' ');
    },
    canDisplayTextArea() {
      return !this.isSegmentationCompleted && this.segmentedText.length === 0;
    },
  },
  mounted() {
    window.addEventListener('click', this.clickListener);
  },
  beforeDestroy() {
    window.removeEventListener('click', this.clickListener);
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onSourceInput(e) {
      const text = _.get(e, 'target.value');
      this.$emit('input', text);
    },
    selectSegment(index) {
      this.$emit('select-segment', index);
    },
    clickListener(event) {
      const targetField = _.get(this.$refs, 'target');
      const sourceField = _.get(this.$refs, 'source');
      if (
        (
          !_.isNil(targetField) && !targetField.contains(event.target))
              && (
                !_.isNil(sourceField) && !sourceField.contains(event.target))) {
        this.$emit('select-segment', null);
      }
    },
    changeTranslatedSegment(text) {
      this.$emit('translation-input', text);
    },
    changeSourceSegment(text, replaceAll) {
      this.$emit('source-input', text, replaceAll);
    },
    clearSource() {
      this.$emit('input', '');
    },
    onTargetInput(text) {
      this.$emit('translation-input', text);
    },
    setMtNode(mtNode) {
      this.$emit('set-mt-node', mtNode);
    },
    async copyTargetToClipboard() {
      const { state } = await navigator.permissions.query({ name: 'clipboard-write' });
      if (state !== 'granted') {
        this.pushNotification({
          title: 'Error',
          message: `You should allow browser make copies to your clipboard for ${window.location.host}. Current state: ${state}`,
          state: 'danger',
        });
        return;
      }
      await navigator.clipboard.writeText(this.targetStringFromSegments);
    },
  },
};
