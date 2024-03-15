/* global window, document */
import _ from 'lodash';
import EditorSegmentMixin from '../../../mixins/editor-segment-mixin';
import TmStoreMixin from '../../../mixins/tm-store-mixin';
import StatusIcon from '../../../components/status-icon/status-icon.vue';

const VALIDATION_RESULTS_NEW_IS_NOT_VALID = 'newIsNotValid';

export default {
  mixins: [EditorSegmentMixin, TmStoreMixin],
  components: {
    StatusIcon,
  },
  data() {
    return {
      areAvailableSourceTagsShown: false,
    };
  },
  created() {
    if (this.isActive) {
      window.addEventListener('keydown', this.onKeydown);
    }
  },
  mounted() {
    this.$refs.source.innerHTML = this.sourceTextDisplayed;
  },
  destroyed() {
    window.removeEventListener('keydown', this.onKeydown);
  },
  watch: {
    segmentId() {
      this.$refs.target.blur();
      this.$refs.source.blur();
    },
    targetTextDisplayed(text) {
      this.$refs.target.innerHTML = text;
      this.setCaret('target');
    },
    sourceTextDisplayed(text) {
      this.$refs.source.innerHTML = text;
      this.setCaret('source');
    },
    isActive(isActive) {
      if (!isActive) {
        this.$refs.target.blur();
        this.$refs.source.blur();
        window.removeEventListener('keydown', this.onKeydown);
      } else {
        window.addEventListener('keydown', this.onKeydown);
      }
    },
    isNewValid: {
      handler(isValid) {
        this.validationResults = {
          ...this.validationResults,
          [VALIDATION_RESULTS_NEW_IS_NOT_VALID]: !isValid ? true : null,
        };
      },
      immediate: true,
    },
    areAvailableSourceTagsShown(isShown) {
      this.adjustAvailableTagsDiv(isShown, 'availableSourceTagsDiv', 'source');
    },
  },
  computed: {
    isValid() {
      return !this.isNew || this.isNewValid;
    },
    isNewValid() {
      const targetText = this.targetText.trim();
      const sourceText = this.sourceText.trim();
      return !_.isEmpty(targetText) && !_.isEmpty(sourceText);
    },
    availableTargetTags() {
      return _.unionBy(this.missingTargetTags, this.additionalTargetTags, 'data');
    },
    availableSourceTags() {
      return this.buildAdditionalTags(this.sourceInlineTags, this.extraTags);
    },
    isSegmentLoading() {
      return this.isSegmentLoadingById(this.segmentId);
    },
    sourceEventListeners() {
      const eventListeners = {
        blur: this.onSourceBlur,
        keydown: this.handleSourceModification,
        keypress: this.handleSourceModification,
        input: this.handleSourceModification,
        mouseup: this.onSourceMouseUp,
      };
      if (!this.allowCopyPaste) {
        Object.assign(
          eventListeners,
          this.restrictedEventListeners,
          {
            copy: (event) => {
              this.preventDefaultEvent(event);
              this.$emit('custom-copy');
            },
          },
        );
      }
      return eventListeners;
    },
    targetEventListeners() {
      const eventListeners = {
        blur: this.onTargetBlur,
        keydown: this.handleTargetKeydown,
        keypress: e => this.onKeypressGeneric(e, 'target'),
        input: () => this.onInputGeneric('target'),
        mouseup: this.onTargetMouseUp,
      };
      if (!this.allowCopyPaste) {
        Object.assign(
          eventListeners,
          this.restrictedEventListeners,
          {
            copy: (event) => {
              this.preventDefaultEvent(event);
              this.$emit('custom-copy');
            },
          },
        );
      }
      return eventListeners;
    },
    restrictedEventListeners() {
      const events = ['copy', 'cut', 'paste', 'dragenter', 'dragleave', 'dragover', 'drop'];
      return events.reduce((accum, event) => {
        accum[event] = this.preventDefaultEvent;
        return accum;
      }, {});
    },
    allowCopyPaste() {
      return _.get(this, 'company.allowCopyPasteInPortalCat', true);
    },
  },
  methods: {
    async performSegmentUpdate(segment) {
      const updatedSegment = await this.updateSegment(segment);
      if (this.isNew) {
        return;
      }
      this.setSegmentIsLoading({ originalId: updatedSegment.originalId, isLoading: true });
      this.$emit('save', updatedSegment.originalId);
    },
    handleSourceModification(event) {
      if (!this.allowCopyPaste && this.isCopyOrPasteEvent(event)) {
        event.preventDefault();
        if (event.keyCode === 67) {
          this.$emit('custom-copy');
        } else if (event.keyCode === 86) {
          this.handlePaste(event, 'source');
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.keyCode === 65) {
        setTimeout(() => {
          this.emitSelection(event.target, 'source');
        }, 100);
      }
      switch (event.type) {
        case 'keydown':
          this.onKeydownGeneric(event, 'source');
          break;
        case 'keypress':
          this.onKeypressGeneric(event, 'source');
          break;
        case 'input':
          this.onInputGeneric('source');
          break;
        default: break;
      }
    },
    isCopyOrPasteEvent(event) {
      const actionKeyCodes = [67, 86, 88];
      return (event.ctrlKey || event.metaKey) && actionKeyCodes.includes(event.keyCode);
    },
    onKeydown() {},
    onTargetBlur(event) {
      setTimeout(() => {
        this.emitSelection(event.target, 'target');
        this.areAvailableTagsShown = false;
      }, 100);
    },
    onSourceBlur(event) {
      setTimeout(() => {
        this.emitSelection(event.target, 'source');
        this.areAvailableSourceTagsShown = false;
      }, 100);
    },
    onAddUserTag() {
      if (this.$refs.target === document.activeElement) {
        this.areAvailableTagsShown = !this.areAvailableTagsShown;
      } else if (this.$refs.source === document.activeElement && this.isNew) {
        this.areAvailableSourceTagsShown = !this.areAvailableSourceTagsShown;
      }
    },
    onTagPicked(tag, inputName) {
      if (inputName === 'source') {
        this.areAvailableSourceTagsShown = false;
      } else {
        this.areAvailableTagsShown = false;
      }
      this.handleTagPicked(tag, inputName);
    },
    preventDefaultEvent(e) {
      e.preventDefault();
    },
    onSourceMouseUp(event) {
      setTimeout(() => {
        this.emitSelection(event.target, 'source');
      });
    },
    onTargetMouseUp(event) {
      setTimeout(() => {
        this.emitSelection(event.target, 'target');
      });
    },
    handleTargetKeydown(event) {
      if (!this.allowCopyPaste && this.isCopyOrPasteEvent(event)) {
        event.preventDefault();
        if (event.keyCode === 67) {
          this.$emit('custom-copy');
        } else if (event.keyCode === 86) {
          this.handlePaste(event, 'target');
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.keyCode === 65) {
        setTimeout(() => {
          this.emitSelection(event.target, 'target');
        }, 100);
      }
      this.onKeydownGeneric(event, 'target');
    },
  },
};
