import _ from 'lodash';
import SuggestionDropdown from '../suggestion-dropdown/suggestion-dropdown.vue';
import { getPrefixIndex } from '../../../../../../utils/portalmt';

export default {
  props: {
    text: {
      type: String,
    },
    isActive: {
      type: Boolean,
    },
    settings: {
      type: Object,
    },
    suggestionModels: {
      type: Object,
      default: () => [],
    },
    generateSuggestions: {
      type: Boolean,
      default: false,
    },
    fullSelectId: {
      type: String,
    },
    getTranslation: {
      type: Function,
      default: () => {},
    },
    dataE2eType: {
      type: String,
    },
    sourceSegment: {
      type: String,
    },
  },
  components: {
    SuggestionDropdown,
  },
  mounted() {
    window.addEventListener('click', this.clickListener);
  },
  beforeDestroy() {
    window.removeEventListener('click', this.clickListener);
  },
  data() {
    return {
      prefixIndex: null,
      caretPos: 0,
      caretCoords: {
        x: 0,
        y: 0,
      },
      isDropdownOpen: false,
      allSelected: false,
    };
  },
  computed: {
    prefix() {
      if (!_.isNil(this.prefixIndex)) {
        const string = _.get(this.$refs, 'segment.innerText');
        return string.slice(0, this.prefixIndex).trim();
      }
      return null;
    },
    canShowSuggestions() {
      const models = _.omitBy(this.suggestionModels, _.isNil);
      return (
        this.generateSuggestions &&
              this.isDropdownOpen &&
              !_.isEmpty(models)
      );
    },
  },
  watch: {
    prefix(newPrefix) {
      if (!_.isNull(newPrefix)) {
        this.isDropdownOpen = false;
        this.$nextTick(() => {
          this._updateDropdownCoords();
          this.isDropdownOpen = true;
        });
      } else {
        this.isDropdownOpen = false;
      }
    },
  },
  created() {
    this.onInput = _.debounce(this._onInput, 200);
  },
  methods: {
    onFocus() {
      this.$emit('focus');
    },
    onClick() {
      this.updateCaretPos();
      setTimeout(this.updatePrefixIndex, 0);
    },
    _onInput(event) {
      const text = _.get(event, 'target.innerText', '').trim();
      const caretIncrease = text.length - this.text.length;
      this.$emit('input', text);
      setTimeout(() => {
        this._setCaretPos(this.caretPos + caretIncrease);
        this.updatePrefixIndex();
      }, 0);
    },
    reset() {
      this.isDropdownOpen = false;
      this.prefixIndex = null;
    },
    onKeyDown(e) {
      let newAllSelected = false;
      const keyCodes = [65, 67, 91, 17];
      if ((e.ctrlKey || e.metaKey) && keyCodes.includes(e.keyCode)) {
        newAllSelected = true;
        if (e.keyCode === 65) {
          e.preventDefault();
          this._selectAllText();
        }
      } else if (e.keyCode >= 37 && e.keyCode <= 40) {
        setTimeout(() => {
          this.updateCaretPos();
          const haveSwitched = this._checkSegmentBoundaries(e);
          if (!haveSwitched) {
            this.updatePrefixIndex();
          }
        }, 0);
      } else if (e.keyCode === 8) {
        this.$emit('delete-all');
      } else if (e.keyCode === 13) {
        e.preventDefault();
        this.$emit('get-translation');
      }
      this.allSelected = newAllSelected;
    },
    onSuggestionInput(suggestion) {
      this.isDropdownOpen = false;
      const stringBefore = this.text.substr(0, this.prefixIndex);
      const newString = `${stringBefore} ${suggestion}`;
      this.$emit('input', newString);
      setTimeout(() => this._setCaretPos(newString.length), 0);
    },
    clickListener(event) {
      const segmentContainer = _.get(this.$refs, 'segmentContainer');
      if (!_.isNil(segmentContainer)
        && !segmentContainer.contains(event.target)
        && segmentContainer.parentNode !== event.target) {
        this.isDropdownOpen = false;
        this.prefixIndex = null;
      }
    },
    setMtNode(mtNode) {
      this.$emit('set-mt-node', mtNode);
    },
    updatePrefixIndex() {
      const string = _.get(this.$refs, 'segment.innerText');
      this.prefixIndex = getPrefixIndex(string, this.caretPos);
    },
    _setCaretPos(index) {
      this.caretPos = index;
      const setpos = document.createRange();
      const set = window.getSelection();
      setpos.setStart(_.get(this.$refs, 'segment.childNodes[0]'), index);
      setpos.collapse(true);
      set.removeAllRanges();
      set.addRange(setpos);
    },
    updateCaretPos() {
      const range = window.getSelection().getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(_.get(this.$refs, 'segment'));
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      this.caretPos = preCaretRange.toString().length;
    },
    _updateDropdownCoords() {
      const range = window.getSelection().getRangeAt(0);
      const rect = range.getClientRects()[0];
      if (rect) {
        this.caretCoords = {
          x: rect.left,
          y: rect.top + 14,
        };
      }
    },
    _checkSegmentBoundaries(e) {
      switch (e.keyCode) {
        case 37: {
          const prevSibling = _.get(this.$refs, 'segment.parentNode.previousSibling');
          if (this.caretPos === 0 && !_.isNil(prevSibling)) {
            this.reset();
            this._focusPrevSegment(prevSibling.childNodes[0]);
            return true;
          }
          return false;
        }
        case 39: {
          const innerTextLength = _.get(this.$refs, 'segment.innerText.length');
          const nextSibling = _.get(this.$refs, 'segment.parentNode.nextSibling');
          if (this.caretPos === innerTextLength && !_.isNil(nextSibling)) {
            this.reset();
            nextSibling.childNodes[0].focus();
            return true;
          }
          return false;
        }
        default:
          return false;
      }
    },
    _focusPrevSegment(element) {
      element.focus();
      const setpos = document.createRange();
      const set = window.getSelection();
      setpos.setStart(_.get(element, 'childNodes[0]'), _.get(element, 'innerText.length'));
      setpos.collapse(true);
      set.removeAllRanges();
      set.addRange(setpos);
    },
    _selectAllText() {
      if (_.isNil(this.fullSelectId)) {
        return;
      }
      this.reset();
      const selection = window.getSelection();
      selection.removeAllRanges();
      const range = document.createRange();
      const parent = document.querySelector(`#${this.fullSelectId}`);
      range.selectNodeContents(parent);
      selection.addRange(range);
      this.allSelected = true;
    },
  },
};
