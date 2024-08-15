/* global document window */
import _ from 'lodash';
import { mapState } from 'vuex';
import {
  wrapTagsAndFormatText,
  isTag,
  getCaretOffsetAndSelection,
  findTagByHtmlElement,
  buildTag,
  buildOppositeTag,
  getNextTagId,
  areSameTags,
  calculateIndexToInsertTag,
  recentActionsTypes,
  HTML_START_END_TAGS_AND_ATTRIBUTES_REGEXP,
  HTML_ATTRIBUTES_REGEXP,
  HTML_PLACEHOLDER_TAG_REGEXP,
} from '../components/editor-segment/editor-segment-helpers';
import TagsList from '../components/tags-list/tags-list.vue';
import { getPrefixIndex, getCaretPosition } from '../../../../utils/portalmt';

const SEGMENT_STATUS_UNCONFIRMED = 'UNCONFIRMED';
const TAG_FUNCTION_CLOSING = 'CLOSING';

export default {
  components: {
    TagsList,
  },
  props: {
    layout: {
      type: String,
      required: true,
    },
    segmentId: {
      type: String,
      required: true,
    },
    formatTagFn: {
      type: Function,
      required: true,
    },
    formatTextFn: {
      type: Function,
      required: true,
    },
    areAllTagsAsNumbers: {
      type: Boolean,
      default: false,
    },
    canEdit: {
      type: Boolean,
      default: true,
    },
    specialChars: {
      type: Array,
      default: () => ([]),
    },
    segmentByIdFn: Function,
    isActive: Boolean,
    catUiSettings: Object,
    index: Number,
    clipboard: String,
    caretParams: Object,
  },
  data() {
    return {
      areAvailableTagsShown: false,
      areTagsAsNumbers: false,
      isDropping: {
        target: false,
        source: false,
      },
      caretPos: 0,
      caretCoords: {
        x: 0,
        y: 0,
      },
      prefixIndex: null,
      isSuggestionsDropdownOpen: false,
      validationResults: {},
      segmentEditionData: {
        timeout: null,
        oldSegment: null,
      },
    };
  },
  created() {
    this.extraTags = [buildTag('<i>'), buildTag('<b>'), buildTag('<u>')];
  },
  mounted() {
    this.$refs.target.innerHTML = this.targetTextDisplayed;
  },
  watch: {
    suggestionsPrefix(newPrefix) {
      if (!_.isEmpty(newPrefix)) {
        this.isSuggestionsDropdownOpen = false;
        setTimeout(() => {
          this._updateDropdownCoords();
          this.isSuggestionsDropdownOpen = true;
        }, 0);
      } else {
        this.isSuggestionsDropdownOpen = false;
      }
    },
    areAllTagsAsNumbers: {
      handler(newValue) {
        this.areTagsAsNumbers = newValue;
      },
      immediate: true,
    },
    validationResults: {
      handler(results) {
        const isValid = Object.keys(results).every(key => _.isNil(results[key]));
        this.$emit('validation', { ...results, isValid });
      },
      immediate: true,
    },
    areAvailableTagsShown(isShown) {
      this.adjustAvailableTagsDiv(isShown, 'availableTagsDiv', 'target');
    },
  },
  computed: {
    ...mapState('portalCat', ['suggestionsModel']),
    isNew() {
      const segmentId = _.get(this, 'segment._id', '');
      return _.isEmpty(segmentId);
    },
    segment() {
      return this.invokeSegmentByIdFn(this.segmentId);
    },
    status() {
      return _.get(this.segment, 'status', '');
    },
    isConfirmed() {
      return !_.isEmpty(this.status) && this.status !== SEGMENT_STATUS_UNCONFIRMED;
    },
    sourceTextDisplayed() {
      return wrapTagsAndFormatText(
        this.sourceText,
        this.sourceInlineTags,
        this.inlineUserTagColor,
        this.formatTag,
        this.formatTextFn,
        'source',
        this.terminologyInfo,
      );
    },
    terminologyInfo() {
      return _.defaultTo(_.get(this.segment, 'terminologyInfo'), []);
    },
    sourceText() {
      return _.get(this.segment, 'source.text', '');
    },
    sourceInlineTags() {
      return _.get(this.segment, 'source.inlineTags', []);
    },
    inlineUserTagColor() {
      return _.get(this, 'catUiSettings.inlineUserTags.color', 'red');
    },
    qaWarningMessageColor() {
      return _.get(this, 'catUiSettings.qaWarningMessages.color', 'orange');
    },
    qaErrorMessageColor() {
      return _.get(this, 'catUiSettings.qaErrorMessages.color', 'red');
    },
    type() {
      return _.get(this.segment, 'origin', '');
    },
    isMT() {
      return !_.isEmpty(this.type) && this.type.toLowerCase() === 'mt';
    },
    isHT() {
      return !_.isEmpty(this.type) && this.type.toLowerCase() === 'ht';
    },
    targetTextDisplayed() {
      return wrapTagsAndFormatText(
        this.targetText,
        this.targetInlineTags,
        this.inlineUserTagColor,
        this.formatTag,
        this.formatTextFn,
        'target',
      );
    },
    targetText() {
      return _.get(this.segment, 'target.text', '');
    },
    targetInlineTags() {
      return _.get(this.segment, 'target.inlineTags', []);
    },
    missingTargetTags() {
      const missingTags =
        _.differenceBy(this.sourceInlineTags, this.targetInlineTags, 'data');
      return _.defaultTo(missingTags, []);
    },
    additionalTargetTags() {
      return this.buildAdditionalTags(this.targetInlineTags, this.extraTags);
    },
    suggestionsPrefix() {
      if (!_.isNil(this.prefixIndex)) {
        const string = _.get(this.$refs, 'target.innerText');
        return string.slice(0, this.prefixIndex).trim();
      }
      return null;
    },
    suggestionModels() {
      return { general: _.get(this.suggestionsModel, 'code', null) };
    },
    suggestionsSourceLanguage() {
      return _.get(this.suggestionsModel, 'sourceLanguage.isoCode', null);
    },
    suggestionsTargetLanguage() {
      return _.get(this.suggestionsModel, 'targetLanguage.isoCode', null);
    },
    sourceMaxTagId() {
      const tag = _.maxBy(this.sourceInlineTags, t => t.id);
      return _.get(tag, 'id', 0);
    },
    isMTEnabled() {
      return _.get(this, 'workflow.useMt');
    },
  },
  methods: {
    invokeSegmentByIdFn(segmentId) {
      if (!_.isNil(this.segmentByIdFn)) {
        return this.segmentByIdFn(segmentId);
      }
      return this.segmentById(segmentId);
    },
    formatTag(tag) {
      if (typeof tag === 'object' && !_.isNil(tag.id) && this.areTagsAsNumbers) {
        const slashStr = tag.function === TAG_FUNCTION_CLOSING ? '/' : '';
        return `<${slashStr}${tag.id}>`;
      }
      const tagText = _.get(tag, 'data', tag);
      return this.formatTagFn(tagText);
    },
    toggleTagsAsNumbers() {
      this.areTagsAsNumbers = !this.areTagsAsNumbers;
    },
    removeSelectedTextAndTags(inputObj, selection) {
      if (_.isNil(selection)) {
        return;
      }
      const {
        withoutTags: { startOffset, endOffset },
        isStartTagIncluded,
        isEndTagIncluded,
        isPlaceholderTagIncluded,
      } = selection;
      const inlineTags = _.get(inputObj, 'inlineTags', []);
      const text = _.get(inputObj, 'text', '');
      const textUpToCaret = text.substring(0, startOffset);
      const selectedText = text.substring(startOffset, endOffset);
      const newInlineTags = inlineTags.filter((tag) => {
        if (isPlaceholderTagIncluded) {
          return false;
        }
        if (
          (isStartTagIncluded && tag.position < startOffset) ||
          (!isStartTagIncluded && tag.position <= startOffset)
        ) {
          return true;
        } else if (
          (isEndTagIncluded && tag.position > endOffset) ||
          (!isEndTagIncluded && tag.position >= endOffset)
        ) {
          return true;
        }
        return false;
      });
      const tagsAfterSelection =
        newInlineTags.filter(tag => tag.position >= endOffset);
      tagsAfterSelection.forEach((tag) => {
        tag.position -= selectedText.length;
      });
      _.set(inputObj, 'inlineTags', newInlineTags);
      const textWithoutSelection = `${textUpToCaret}${text.substring(endOffset)}`;
      _.set(inputObj, 'text', textWithoutSelection);
    },
    removeTag(tag, inputName) {
      const newSegment = _.cloneDeep(this.segment);
      const inlineTags = _.get(newSegment, `${inputName}.inlineTags`, []);
      const newInlineTags = inlineTags.filter(t => t.id !== tag.id || t.function !== tag.function);
      _.set(newSegment, `${inputName}.inlineTags`, newInlineTags);
      this.performSegmentUpdate(newSegment);
    },
    removeTagByHtmlElement(htmlElement, inputName) {
      if (!isTag(htmlElement)) {
        return;
      }
      const childNodes = Array.from(this.$refs[inputName].childNodes);
      const nodeIndex = childNodes.indexOf(htmlElement);
      const prevNode = childNodes[nodeIndex - 1];
      if (!_.isNil(prevNode)) {
        this.$emit('set-caret-params', {
          inputName,
          nodeIndex: nodeIndex - 1,
          offset: prevNode.textContent.length,
        });
      }
      const inlineTags = _.get(this, `${inputName}InlineTags`, []);
      const tag = findTagByHtmlElement(htmlElement, inlineTags);
      this.removeTag(tag, inputName);
    },
    onKeydownGeneric(event, inputName) {
      const selection = document.getSelection();
      const range = selection.getRangeAt(0);
      const inputElement = this.$refs[inputName];
      const updateCaretParams = () => {
        const childNodes = [...inputElement.childNodes];
        const rangeStartContainer = range.startContainer;
        const rangeStartParent = rangeStartContainer.parentElement;
        const inputDirectChild =
          rangeStartParent === inputElement ? rangeStartContainer : rangeStartParent;
        const nodeIndex = childNodes.indexOf(inputDirectChild);
        this.$emit('set-caret-params', {
          inputName,
          nodeIndex,
          offset: range.startOffset,
        });
      };

      if (event.keyCode === 8) {
        if (selection.isCollapsed) {
          const elementUnderCaret = range.startContainer === inputElement ?
            inputElement.childNodes[range.startOffset - 1] :
            range.startContainer.parentElement;
          const isTagUnderCaret = isTag(elementUnderCaret);
          const isAtTagStart = range.startOffset === 0;
          if (isTagUnderCaret && !isAtTagStart) {
            event.preventDefault();
            this.removeTagByHtmlElement(elementUnderCaret, inputName);
          }
        } else {
          event.preventDefault();
          const newSegment = _.clone(this.segment);
          newSegment[inputName] = _.cloneDeep(newSegment[inputName]);
          const clearText = _.get(this, `${inputName}Text`,);
          const inputSelection = getCaretOffsetAndSelection(inputElement, clearText);
          updateCaretParams();
          this.removeSelectedTextAndTags(newSegment[inputName], inputSelection);
          this.performSegmentUpdate(newSegment);
        }
      // disable Delete key
      } else if (event.keyCode === 46) {
        event.preventDefault();
      } else if (event.keyCode === 13) {
        event.preventDefault();
        if (!this.areAvailableTagsShown && !event.ctrlKey && !event.metaKey) {
          document.execCommand('insertHTML', false, '<br>');
        }
      } else if (event.keyCode >= 37 && event.keyCode <= 40) {
        this.$nextTick(() => {
          const isHorizontalMove = [37, 39].includes(event.keyCode);
          const targetText = _.get(this.$refs, 'target.innerText');
          const segmentText = getPrefixIndex(targetText, this.caretPos);
          this.updateCaretPos();
          if (this.isSuggestionsDropdownOpen && !isHorizontalMove) return;
          const prefixIndex = getPrefixIndex(targetText, this.caretPos);
          if (isHorizontalMove && segmentText !== prefixIndex) {
            this.isSuggestionsDropdownOpen = false;
          }
        });
      } else {
        updateCaretParams();
      }
    },
    onKeypressGeneric(event, inputName) {
      const selection = document.getSelection();
      const range = selection.getRangeAt(0);
      const rangeStartParent = range.startContainer.parentElement;
      const rangeEndParent = range.endContainer.parentElement;
      if (isTag(rangeStartParent) || isTag(rangeEndParent)) {
        if (selection.isCollapsed) {
          const rangeTextContent = range.startContainer.textContent;
          const isAtTagEdge = range.startOffset === 0 ||
            range.startOffset === rangeTextContent.length;
          if (!isAtTagEdge) {
            event.preventDefault();
          }
        } else {
          event.preventDefault();
        }
      } else if (!selection.isCollapsed) {
        const clearText = _.get(this, `${inputName}Text`);
        const inputSelection = getCaretOffsetAndSelection(this.$refs[inputName], clearText);
        const inputObj = _.get(this, `segment.${inputName}`);
        this.removeSelectedTextAndTags(inputObj, inputSelection);
      }
    },
    onInputGeneric(inputName) {
      const isDropping = _.get(this, `isDropping.${inputName}`);
      if (isDropping) {
        return;
      }
      const range = document.getSelection().getRangeAt(0);
      if (!_.isNil(this.segmentEditionData.timeout)) {
        clearTimeout(this.segmentEditionData.timeout);
      }
      if (_.isNil(this.segmentEditionData.oldSegment)) {
        this.segmentEditionData.oldSegment = _.cloneDeep(this.segment);
      }
      if (_.isNil(this.segmentEditionData.initialCaretPosition)) {
        this.segmentEditionData.initialCaretPosition = range.startOffset - 1;
      }
      const inputElement = this.$refs[inputName];
      const newSegment = _.clone(this.segment);
      newSegment[inputName] = _.cloneDeep(newSegment[inputName]);
      const childNodes = Array.from(inputElement.childNodes);
      const oldText = _.get(this, `${inputName}Text`, '');
      let newText = inputElement.innerText
        .replace(HTML_START_END_TAGS_AND_ATTRIBUTES_REGEXP, '')
        .replace(HTML_PLACEHOLDER_TAG_REGEXP, '');
      this.specialChars.forEach((params) => {
        const { replacement, original } = params;
        newText = newText.replace(new RegExp(replacement, 'g'), original);
      });
      const charCountDiff = newText.length - oldText.length;
      const rangeStartContainer = range.startContainer;
      const rangeStartParent = rangeStartContainer.parentElement;
      const inputDirectChild =
        rangeStartParent === inputElement ? rangeStartContainer : rangeStartParent;
      const nodeIndex = childNodes.indexOf(inputDirectChild);
      this.adjustOldTags(inputName, newSegment, charCountDiff);
      _.set(newSegment, `${inputName}.text`, newText);
      this.performSegmentUpdate(newSegment, { immediate: true });
      const newTargetOffset = range.startOffset;
      this.$emit('set-caret-params', {
        inputName,
        nodeIndex,
        offset: newTargetOffset,
      });
      this.segmentEditionData.timeout = setTimeout(() => {
        if (charCountDiff > 1) {
          this.segmentEditionData.initialCaretPosition -= charCountDiff - 1;
        }
        this.$emit('add-recent-action', {
          type: recentActionsTypes.EDIT_SEGMENT,
          oldValue: this.segmentEditionData.oldSegment,
          newValue: newSegment,
          oldCaretOffset: this.segmentEditionData.initialCaretPosition,
          newCaretOffset: newTargetOffset,
        });
        this.segmentEditionData.oldSegment = null;
        this.segmentEditionData.timeout = null;
        this.segmentEditionData.initialCaretPosition = null;
      }, 1000);
    },
    adjustOldTags(inputName, segment, offset) {
      const range = document.getSelection().getRangeAt(0);
      const rangeStartContainer = range.startContainer;
      const rangeStartParent = rangeStartContainer.parentElement;
      const inputElement = this.$refs[inputName];
      const childNodes = Array.from(inputElement.childNodes);
      const inputDirectChild =
        rangeStartParent === inputElement ? rangeStartContainer : rangeStartParent;
      const isCaretAtNodeEnd = inputDirectChild.textContent.length === range.startOffset;
      const nodeIndex = childNodes.indexOf(inputDirectChild);
      const lastTagElementIndexBeforeCaret =
      _.findLastIndex(childNodes, node => isTag(node), nodeIndex);
      const lastTagElementBeforeCaret = childNodes[lastTagElementIndexBeforeCaret];
      const inlineTags = _.get(segment, `${inputName}.inlineTags`, []);
      let lastTagIndexBeforeCaret = -1;
      if (!_.isNil(lastTagElementBeforeCaret) &&
        (lastTagElementBeforeCaret !== inputDirectChild || isCaretAtNodeEnd)) {
        lastTagIndexBeforeCaret =
          findTagByHtmlElement(lastTagElementBeforeCaret, inlineTags, _.findIndex);
      }
      inlineTags.forEach((tag, index) => {
        const shouldMoveTag = index > lastTagIndexBeforeCaret;
        if (shouldMoveTag) {
          tag.position += offset;
        }
      });
    },
    setCaret(inputName) {
      const inputElement = this.$refs[inputName];
      const canSet = !_.isNil(this.caretParams) &&
        this.caretParams.inputName === inputName &&
        document.activeElement === inputElement;
      if (canSet) {
        if (!_.isNil(this.caretParams.tag)) {
          this.setCaretAfterTag(inputName, this.caretParams.tag);
        } else {
          const { nodeIndex, offset } = this.caretParams;
          const newRange = document.createRange();
          newRange.selectNodeContents(inputElement);
          const childNodes = Array.from(inputElement.childNodes);
          const startNode = childNodes[nodeIndex];
          const startOffset = offset;
          if (!_.isNil(startNode)) {
            newRange.setStart(
              _.isNil(startNode.firstChild) ? startNode : startNode.firstChild,
              startOffset,
            );
            newRange.collapse(true);
            const selection = document.getSelection();
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
        this.$emit('set-caret-params', null);
      }
    },
    setCaretAfterTag(inputName, tag) {
      const childNodes = this.$refs[inputName].childNodes;
      const inlineTags = _.get(this, `${inputName}InlineTags`, []);
      let tagNode;
      childNodes.forEach((node) => {
        if (!isTag(node)) {
          return;
        }
        const existingTag = findTagByHtmlElement(node, inlineTags);
        if (areSameTags(existingTag, tag)) {
          tagNode = node;
        }
      });
      if (!_.isNil(tagNode)) {
        const newRange = document.createRange();
        newRange.setStart(
          tagNode.firstChild,
          tagNode.textContent.length,
        );
        newRange.collapse(true);
        const selection = document.getSelection();
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    },
    prepareTagForInsertion(tag, inlineTags = [], newIdStartsFrom = 1) {
      const tagClone = _.clone(tag);
      if (_.isNil(tagClone.id)) {
        tagClone.id = getNextTagId(inlineTags, newIdStartsFrom);
      }
      return tagClone;
    },
    handleTagPicked(tag, inputName) {
      if (this.isLocked) {
        return;
      }
      const inlineTags = _.get(this, `${inputName}InlineTags`, []);
      const newTag = this.prepareTagForInsertion(tag, inlineTags, this.sourceMaxTagId + 1);
      const isTagInserted = this.insertTag(newTag, inputName);
      if (isTagInserted) {
        this.areAvailableTagsShown = false;
      }
    },
    insertTag(tag, inputName) {
      const inputElement = this.$refs[inputName];
      inputElement.focus();
      const { withoutTags: { startOffset } } =
        getCaretOffsetAndSelection(this.$refs[inputName], this[`${inputName}Text`]);
      if (startOffset === -1) {
        return false;
      }
      const range = document.getSelection().getRangeAt(0);
      const rangeParent = range.startContainer.parentElement;
      const prevSibling = isTag(rangeParent) ?
        rangeParent.previousSibling :
        range.startContainer.previousSibling;
      const newSegment = _.cloneDeep(this.segment);
      const oldSegment = _.cloneDeep(this.segment);
      const inlineTags = _.get(newSegment, `${inputName}.inlineTags`, []);
      if (this.isDropping[inputName]) {
        rangeParent.dataset.tagId = null;
      }
      tag.position = startOffset;
      const isCaretAtNodeStart = range.startOffset === 0;
      let indexToInsert;
      if (isTag(rangeParent)) {
        const rangeTagIndex = findTagByHtmlElement(rangeParent, inlineTags, _.findIndex);
        if (rangeTagIndex !== -1) {
          indexToInsert = isCaretAtNodeStart ? rangeTagIndex : rangeTagIndex + 1;
        } else if (isTag(prevSibling)) {
          const prevTagIndex = findTagByHtmlElement(prevSibling, inlineTags, _.findIndex);
          indexToInsert = prevTagIndex + 1;
        }
      } else if (isCaretAtNodeStart && isTag(prevSibling)) {
        const prevTagIndex = findTagByHtmlElement(prevSibling, inlineTags, _.findIndex);
        indexToInsert = prevTagIndex + 1;
      }
      if (_.isNil(indexToInsert)) {
        indexToInsert = calculateIndexToInsertTag(inputElement, tag, inlineTags);
      }
      inlineTags.splice(indexToInsert, 0, tag);
      this.$emit('set-caret-params', {
        inputName,
        tag,
      });
      _.set(newSegment, `${inputName}.inlineTags`, inlineTags);
      this.performSegmentUpdate(newSegment);
      this.$emit('add-recent-action', { type: recentActionsTypes.EDIT_SEGMENT, oldValue: oldSegment, newValue: newSegment });
      return true;
    },
    onAddUserTag() {
      if (!this.areAvailableTagsShown && this.$refs.target === document.activeElement) {
        this.areAvailableTagsShown = true;
      } else {
        this.areAvailableTagsShown = false;
      }
    },
    buildAdditionalTags(inlineTags = [], extraTags) {
      const additionalTags = _.cloneDeep(extraTags).map((tag) => {
        let additionalTag = tag;
        inlineTags.forEach((t) => {
          const dataWithoutAttrs = t.data.replace(HTML_ATTRIBUTES_REGEXP, '');
          if (dataWithoutAttrs === tag.data) {
            const pair =
              inlineTags.find(tt => tt.id === t.id && tt.function !== t.function);
            if (!pair) {
              additionalTag = buildOppositeTag(tag);
            }
          }
        });
        return additionalTag;
      });
      return additionalTags;
    },
    adjustAvailableTagsDiv(isShown, refName, inputName) {
      const parentScrollItem = this.$refs[inputName].closest('.vue-recycle-scroller__item-view');
      if (_.isNil(parentScrollItem)) {
        return;
      }
      if (isShown) {
        parentScrollItem.style.zIndex = 1;
        this.$nextTick(() => {
          const parent = parentScrollItem.closest('.vue-recycle-scroller');
          const { bottom: parentBottom } = parent.getBoundingClientRect();
          const { bottom: availableTagsDivBottom } =
            this.$refs[refName].getBoundingClientRect();
          if (availableTagsDivBottom > parentBottom) {
            this.$refs[refName].style.bottom = '100%';
          }
        });
      } else {
        parentScrollItem.style.zIndex = 0;
      }
    },
    onTargetClick() {
      this.updateCaretPos();
      this.updatePrefixIndex();
      if (this.isSuggestionsDropdownOpen) return;
      this.$nextTick(() => {
        setTimeout(() => {
          this._updateDropdownCoords();
          this.isSuggestionsDropdownOpen = true;
        }, 0);
      });
    },
    updateCaretPos() {
      const node = _.get(this.$refs, 'target');
      this.caretPos = getCaretPosition(node);
    },
    updatePrefixIndex() {
      const string = _.get(this.$refs, 'target.innerText');
      this.prefixIndex = getPrefixIndex(string, this.caretPos);
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
    suggestionInput(suggestion) {
      this.isSuggestionsDropdownOpen = false;
      const stringBefore = this.targetText.substring(0, this.prefixIndex);
      const newString = `${stringBefore}${suggestion}`;
      const newSegment = _.clone(this.segment);
      newSegment.target = _.cloneDeep(newSegment.target);
      _.set(newSegment, 'target.text', newString);
      _.set(newSegment, 'isAutoSuggestion', true);
      this.performSegmentUpdate(newSegment);
    },
    onSuggestionDropdownClose() {
      this.isSuggestionsDropdownOpen = false;
    },
    pasteInto(pasteSource, selection, inputName) {
      const newSegment = _.cloneDeep(this.segment);
      const { withoutTags: { startOffset, endOffset }, isCollapsed } = selection;
      if (startOffset === -1 || endOffset === -1) {
        return;
      }
      if (!isCollapsed) {
        this.removeSelectedTextAndTags(newSegment[inputName], selection);
      }
      const textUpToCaret = this[`${inputName}Text`].substring(0, startOffset);
      const text = _.get(newSegment, `${inputName}.text`, '');
      const inlineTags = _.get(newSegment, `${inputName}.inlineTags`, []);
      const sourceText = _.get(pasteSource, 'text', pasteSource);
      const newText = `${textUpToCaret}${sourceText}${text.substring(startOffset)}`;
      _.set(newSegment, `${inputName}.text`, newText);
      this.adjustOldTags(inputName, newSegment, sourceText.length);
      if (typeof pasteSource === 'object') {
        const sourceInlineTags = _.get(pasteSource, 'inlineTags', []);
        sourceInlineTags.forEach((tag) => {
          const tagClone = _.clone(tag);
          tagClone.position = textUpToCaret.length + tag.position;
          const preparedTag = this.prepareTagForInsertion(tagClone, inlineTags);
          const indexToInsert =
            calculateIndexToInsertTag(this.$refs[inputName], preparedTag, inlineTags);
          inlineTags.splice(indexToInsert, 0, preparedTag);
        });
        _.set(newSegment, `${inputName}.inlineTags`, inlineTags);
      }
      return newSegment;
    },
    handleCopy(event) {
      this.preventDefaultEvent(event);
      this.$emit('custom-copy');
    },
    handlePaste(event, inputName) {
      this.preventDefaultEvent(event);
      if (_.isNil(this.clipboard)) {
        return;
      }
      const selection = getCaretOffsetAndSelection(this.$refs[inputName], this[`${inputName}Text`]);
      const oldSegment = _.clone(this.segment);
      const newSegment = this.pasteInto(this.clipboard, selection, inputName);
      this.performSegmentUpdate(newSegment, { immediate: true });
      this.$emit('set-caret-params', { inputName: 'target', nodeIndex: 0, offset: selection.withTags.startOffset + this.clipboard.length });
      this.$emit('add-recent-action', {
        type: recentActionsTypes.EDIT_SEGMENT,
        oldValue: oldSegment,
        newValue: newSegment,
        oldCaretOffset: selection.withTags.startOffset,
        newCaretOffset: selection.withTags.startOffset + this.clipboard.length,
      });
    },
    captureSelection(target, inputName) {
      const selection = document.getSelection();
      if (selection.rangeCount === 0) {
        return;
      }
      const range = selection.getRangeAt(0);
      if (isTag(target) && range.startContainer === range.endContainer) {
        const tag = findTagByHtmlElement(target, this[`${inputName}InlineTags`]);
        this.selectedTag = _.clone(tag);
      } else {
        this.selectedTag = null;
      }
    },
    getQaIssueColor(qaIssue = {}) {
      return qaIssue.locQualityIssueEnabled === 'yes' ? this.qaWarningMessageColor : '';
    },
  },
};
