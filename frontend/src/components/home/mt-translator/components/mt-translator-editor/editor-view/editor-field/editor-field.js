/* global window document */
import _ from 'lodash';
import SuggestionDropdownMounter from '../../suggestion-dropdown/suggestion-dropdown-mounter.vue';
import {
  getCaretPosition,
  getPrefixIndex,
  getCaretCoords,
  getSelectionRange,
} from '../../../../../../../utils/portalmt';

export default {
  props: {
    activeSegment: {
      type: Number,
    },
    segments: {
      type: Array,
    },
    showSuggestions: {
      type: Boolean,
    },
    settings: {
      type: Object,
    },
    suggestionModels: {
      type: Object,
    },
    e2eType: {
      type: String,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    sourceSegments: {
      type: Array,
      default: () => [],
    },
  },
  components: {
    SuggestionDropdownMounter,
  },
  computed: {
    isDropdownDisplayed() {
      const models = _.omitBy(this.suggestionModels, _.isNil);
      return (
        !_.isNil(this.activeSegment) &&
              this.showSuggestions &&
              this.isDropdownOpen &&
                !_.isEmpty(models)
      );
    },
    isActive() {
      return this.segments.length > 0;
    },
    prefix() {
      if (!_.isNil(this.prefixIndex)) {
        const string = _.get(this.$refs, `editor-field.childNodes[${this.activeSegment}].innerText`, '').trim();
        return string.slice(0, this.prefixIndex).trim();
      }
      return null;
    },
  },
  data() {
    return {
      caretPos: 0,
      caretSegmentPos: 0,
      prefixIndex: null,
      caretCoords: {
        x: 0,
        y: 0,
      },
      isDropdownOpen: false,
      areAllSegmentsSelected: false,
    };
  },
  created() {
    this.onInput = _.debounce(this._onInput, 200);
  },
  mounted() {
    document.addEventListener('selectionchange', this.selectionChangeListener);
  },
  beforeDestroy() {
    document.removeEventListener('selectionchange', this.selectionChangeListener);
  },
  watch: {
    caretPos() {
      this.updateSegmentCaretPos();
      this.updatePrefixIndex();
    },
    prefix(newPrefix) {
      if (!_.isNil(newPrefix)) {
        this.isDropdownOpen = false;
        setTimeout(() => {
          this.caretCoords = getCaretCoords();
          this.isDropdownOpen = true;
        }, 0);
      } else {
        this.isDropdownOpen = false;
      }
    },
  },
  methods: {
    selectSegment(index) {
      this.$emit('select-segment', index);
    },
    onKeyDown(e) {
      if (_.isNil(this.activeSegment) && !this.areAllSegmentsSelected && e.keyCode !== 13) {
        e.preventDefault();
        return;
      }
      if (e.keyCode === 13) {
        e.preventDefault();
        this.$emit('enter-key');
      } else if (e.keyCode >= 37 && e.keyCode <= 40) {
        this.$nextTick(this.updateCaretPos);
      }
    },
    onSuggestionInput(suggestion) {
      this.isDropdownOpen = false;
      const text = this.segments[this.activeSegment];
      const stringBefore = text.substr(0, this.prefixIndex);
      const newString = `${stringBefore} ${suggestion}`;
      this.$emit('input', newString);
    },
    updateCaretPos() {
      this.caretPos = getCaretPosition(_.get(this.$refs, 'editor-field'));
    },
    updateSegmentCaretPos() {
      const node = _.get(this.$refs, `editor-field.childNodes[${this.activeSegment}]`);
      if (_.isNil(node)) {
        return;
      }
      this.caretSegmentPos = getCaretPosition(node);
    },
    updatePrefixIndex() {
      const string = _.get(this.$refs, `editor-field.childNodes[${this.activeSegment}].innerText`, '').trim();
      this.prefixIndex = getPrefixIndex(string, this.caretSegmentPos);
    },
    _onInput() {
      const allText = _.get(this.$refs, 'editor-field.innerText');
      if (_.isEmpty(allText.trim())) {
        this.$emit('clear');
        return;
      }
      let text;
      let caretPos;
      let replaceAll = false;
      if (this.areAllSegmentsSelected || _.isNil(this.activeSegment)) {
        text = allText;
        caretPos = text.length;
        replaceAll = true;
        this.selectSegment(0);
      } else {
        text = _.get(this.$refs, `editor-field.childNodes[${this.activeSegment}].innerText`, '');
        caretPos = (text.length - this.segments[this.activeSegment].length) + this.caretSegmentPos;
      }
      this.areAllSegmentsSelected = false;
      this.$emit('input', text, replaceAll);
      this.$nextTick(() => {
        this.setCaretPos(caretPos);
      });
    },
    setCaretPos(index) {
      const setpos = document.createRange();
      const set = window.getSelection();
      setpos.setStart(_.get(this.$refs, `editor-field.childNodes[${this.activeSegment}].childNodes[0]`), index);
      setpos.collapse(true);
      set.removeAllRanges();
      set.addRange(setpos);
      this.$nextTick(this.updateCaretPos);
    },
    setMtNode(mtNode) {
      this.$emit('set-mt-node', mtNode);
    },
    onDropdownClose() {
      this.isDropdownOpen = false;
      this.prefixIndex = null;
    },
    selectionChangeListener() {
      const { anchorNode, focusNode } = document.getSelection();
      if (_.isNil(anchorNode)) {
        return;
      }
      const doesSelectionBelongToEditor = Array.from(_.get(this.$refs, 'editor-field.childNodes', [])).includes(anchorNode.parentNode);
      if (doesSelectionBelongToEditor) {
        const editorField = this.$refs['editor-field'];
        const { start, end } = getSelectionRange(editorField);
        const allTextLength = editorField.innerText.length;
        if (start === 0 && end === allTextLength) {
          this.areAllSegmentsSelected = true;
          this.selectSegment(null);
          return;
        }

        const selectedSegmentsRange = [
          _.get(anchorNode, 'parentNode.dataset.index', null),
          _.get(focusNode, 'parentNode.dataset.index', null),
        ]
          .filter(index => !_.isNil(index))
          .map(Number)
          .sort((a, b) => a - b);
        const [firstSelectedSegment, lastSelectedSegment] = selectedSegmentsRange;
        if (firstSelectedSegment === lastSelectedSegment) {
          this.selectSegment(firstSelectedSegment);
          this.areAllSegmentsSelected = false;
          return;
        }
        this.selectSegment(null);
        this.areAllSegmentsSelected = false;
      }
    },
  },
};
