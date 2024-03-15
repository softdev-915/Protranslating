/* global window, document, Text, HTMLElement */
import _ from 'lodash';
import { mapGetters } from 'vuex';
import PCStoreMixin from '../../mixins/pc-store-mixin';
import {
  isTag,
  findTagByHtmlElement,
  getCaretOffsetAndSelection,
  buildTagPair,
  getCanUpdateBasedOnStatus,
  getIsSegmentAssigned,
  recentActionsTypes,
  isMt,
} from './editor-segment-helpers';
import EditorSegmentMixin from '../../mixins/editor-segment-mixin';
import StatusIcon from '../../components/status-icon/status-icon.vue';
import UserRoleCheckMixin from '../../../../../mixins/user-role-check';
import SuggestionDropdownMounter
  from '../../../mt-translator/components/mt-translator-editor/suggestion-dropdown/suggestion-dropdown-mounter.vue';

const SEGMENT_VALIDATION_MISSING_TAGS = 'missingTags';
const TAG_FUNCTION_CLOSING = 'CLOSING';
const TAG_FUNCTION_OPENING = 'OPENING';
const TAG_FUNCTION_PLACEHOLDER = 'PLACEHOLDER';
const LETTER_CASE_MODE_SENTENCE = 'LETTER_CASE_MODE_SENTENCE';
const LETTER_CASE_MODE_UPPER = 'LETTER_CASE_MODE_UPPER';
const LETTER_CASE_MODE_LOWER = 'LETTER_CASE_MODE_LOWER';

export default {
  mixins: [
    PCStoreMixin,
    EditorSegmentMixin,
    UserRoleCheckMixin,
  ],
  components: {
    StatusIcon,
    SuggestionDropdownMounter,
  },
  props: {
    isRepetitionsFilterOn: Boolean,
  },
  data() {
    return {
      selectedTag: null,
      tagClipboard: null,
      editStartedAt: null,
      isChanged: false,
      letterCase: null,
      popoverContent: '',
      popoverLoading: false,
      showPopover: false,
    };
  },
  created() {
    if (this.isActive) {
      window.addEventListener('keydown', this.onKeydown);
    }
  },
  mounted() {
    this.$refs.source.addEventListener('copy', this.onCopy);
    this.$refs.source.addEventListener('mouseup', this.onSourceMouseUp);

    this.$refs.target.addEventListener('copy', this.onCopy);
    this.$refs.target.addEventListener('paste', this.onTargetPaste);
    this.$refs.target.addEventListener('mouseup', this.onTargetMouseUp);
  },
  destroyed() {
    window.removeEventListener('keydown', this.onKeydown);
  },
  watch: {
    segmentId() {
      this.$refs.target.blur();
      this.$refs.source.blur();
      this.areAvailableTagsShown = false;
    },
    isActive(isActive) {
      if (!isActive) {
        this.$refs.target.blur();
        this.$refs.source.blur();
        window.removeEventListener('keydown', this.onKeydown);
        this.removeTagsHighlighting(this.$refs.source);
        this.removeTagsHighlighting(this.$refs.target);
      } else {
        this.$refs.target.focus();
        window.addEventListener('keydown', this.onKeydown);
      }
    },
    pickedResource(resource) {
      if (this.isActive) {
        this.applyResource(resource);
      }
    },
    missingTargetTags: {
      handler(tags) {
        if (!_.isEmpty(tags)) {
          this.validationResults = {
            ...this.validationResults,
            [SEGMENT_VALIDATION_MISSING_TAGS]: { tags },
          };
        } else {
          this.validationResults = {
            ...this.validationResults,
            [SEGMENT_VALIDATION_MISSING_TAGS]: null,
          };
        }
      },
      immediate: true,
    },
    targetTextDisplayed(targetText) {
      this.$refs.target.innerHTML = targetText;
      this.setCaret('target');
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    userId() {
      return _.get(this, 'userLogged._id', '');
    },
    sourceTextWithTags() {
      return _.get(this.segment, 'source.textWithTags', '');
    },
    segmentNumber() {
      return _.get(this.segment, 'position', '');
    },
    fileName() {
      return _.get(this.segment, 'fileName', '');
    },
    fileId() {
      return _.get(this.segment, 'fileId', '');
    },
    isLocked() {
      return _.get(this.segment, 'locked', false) || this.isDisabled;
    },
    isDisabled() {
      return !this.canUpdate || this.isRequestCompleted || this.isPipelineInProgress;
    },
    isSuggestionsLocked() {
      return this.isLocked || _.isNil(this.suggestionsModel);
    },
    isMatched() {
      return _.get(this.segment, 'matched', false);
    },
    matchScore() {
      return _.get(this.segment, 'tmMatchInfo.score', '');
    },
    availableTargetTags() {
      return _.unionBy(this.missingTargetTags, this.additionalTargetTags, 'data');
    },
    isLoading() {
      const originalId = _.get(this, 'segment.originalId', '');
      return this.isSegmentLoadingById(originalId);
    },
    status() {
      return _.get(this, 'segment.status', '');
    },
    isSegmentAssigned() {
      return getIsSegmentAssigned(this.userId, this.segment);
    },
    canUpdateBasedOnStatus() {
      const taskAbility = _.get(this, 'task.ability', '');
      return getCanUpdateBasedOnStatus(taskAbility, this.status);
    },
    canUpdate() {
      return this.hasRole('SEGMENT_UPDATE_ALL') || (this.canUpdateBasedOnStatus && (
        this.hasRole('SEGMENT_UPDATE_OWN') &&
        this.isSegmentAssigned
      ));
    },
    isRequestCompleted() {
      return _.get(this, 'request.status', '') === 'Completed';
    },
    allowCopyPaste() {
      return _.get(this, 'request.company.allowCopyPasteInPortalCat', true);
    },
    sourceEventListeners() {
      const eventListeners = {
        dragstart: this.allowCopyPaste ? this.onSourceDragStart : this.preventDefaultEvent,
        mousedown: this.isRequestCompleted ? null : this.onSourceMouseDown,
        blur: this.isRequestCompleted ? null : this.onSourceBlur,
        keydown: this.onSourceKeydown,
      };
      return _.pickBy(eventListeners, _.identity);
    },
    targetEventListeners() {
      const eventListeners = {
        drag: this.allowCopyPaste ? null : this.preventDefaultEvent,
        dragenter: this.allowCopyPaste ? this.focus : this.preventDefaultEvent,
        drop: this.allowCopyPaste ? this.onTargetDrop : this.preventDefaultEvent,
        cut: this.allowCopyPaste ? null : this.preventDefaultEvent,
        dragleave: this.allowCopyPaste ? null : this.preventDefaultEvent,
        dragover: this.allowCopyPaste ? null : this.preventDefaultEvent,
        blur: this.isRequestCompleted ? null : this.onTargetBlur,
        keydown: !this.isLocked ? event => this.onKeydownGeneric(event, 'target') : this.preventDefaultEvent,
        keypress: !this.isLocked ? event => this.onKeypressGeneric(event, 'target') : this.preventDefaultEvent,
        input: !this.isLocked ? () => this.onInputGeneric('target') : this.preventDefaultEvent,
        click: !this.isSuggestionsLocked ? this.onTargetClick : this.preventDefaultEvent,
        focus: this.onTargetFocus,
      };
      return _.pickBy(eventListeners, _.identity);
    },
    isRepetitive() {
      const repetitionSegment = this.repetitionById(this.segmentId);
      return !_.isNil(repetitionSegment);
    },
    qaIssues: {
      get() {
        return _.get(this, 'segment.qaIssues');
      },
      set(qaIssues) {
        const segment = _.clone(this.segment);
        segment.qaIssues = qaIssues;
        this.performSegmentUpdate(segment);
      },
    },
    areAllQaIssuesIgnored: {
      get() {
        return _.isNil(this.qaIssues) ||
          this.qaIssues.every(issue => issue.locQualityIssueEnabled === 'no');
      },
      set(value) {
        this.qaIssues = this.qaIssues.map((issue) => {
          const clone = _.clone(issue);
          clone.locQualityIssueEnabled = value ? 'no' : 'yes';
          return clone;
        });
      },
    },
  },
  methods: {
    async handleMove(event) {
      const childElement = this.$refs.source.querySelector('[data-popover-trigger]');
      if (!childElement) {
        return;
      }
      const childRect = childElement.getBoundingClientRect();
      const isWithinChildElement = (
        event.clientX >= childRect.left &&
        event.clientX <= childRect.right &&
        event.clientY >= childRect.top &&
        event.clientY <= childRect.bottom
      );
      if (isWithinChildElement) {
        const htmlString = this.sourceTextDisplayed;
        const tempElement = document.createElement('div');
        tempElement.innerHTML = htmlString;
        let tbNotes = '';
        let translations = '';
        this.showPopover = true;
        this.popoverLoading = true;
        const terminologyInfo = _.get(this.segment, 'terminologyInfo', []);
        terminologyInfo.forEach((terminology) => {
          translations += `<br>${terminology.term.target}`;
          tbNotes += `${_.defaultTo(terminology.term.note, '')}`;
        });
        this.popoverContent = `<b>Translations:</b> ${translations}<br><b>Notes:</b><br>${tbNotes || 'None'}`;
      } else {
        this.showPopover = false;
      }
    },
    handleMouseLeave() {
      this.showPopover = false;
    },
    onSourceDragStart(event) {
      if (!isTag(event.srcElement) || this.isLocked) {
        event.preventDefault();
        return;
      }
      const tag = findTagByHtmlElement(event.srcElement, this.sourceInlineTags);
      const data = { tag, segmentId: this.segmentId };
      event.dataTransfer.setData('application/json', JSON.stringify(data));
    },
    onSourceMouseDown(event) {
      if (isTag(event.target)) {
        this.$refs.source.removeAttribute('contenteditable');
      } else {
        this.$refs.source.setAttribute('contenteditable', true);
      }
    },
    handleSourceMouseUp(event) {
      this.$emit('source-mouseup', event, this.segmentId);
      setTimeout(() => {
        this.emitCaretSet();
        this.highlightTags(event.target, this.$refs.source);
        this.captureSelection(event.target, 'source');
        if (isTag(event.target) && !this.areTagsAsNumbers) {
          this.onTagMouseUp(event.target);
        }
      });
    },
    onTargetDrop(event) {
      const tagJson = event.dataTransfer.getData('application/json');
      try {
        const { tag, segmentId } = JSON.parse(tagJson);
        if (segmentId !== this.segmentId || this.isLocked) {
          event.preventDefault();
          return;
        }
        this.isDropping.target = true;
        setTimeout(() => {
          const isTagInserted =
            this.insertTag(
              this.prepareTagForInsertion(tag, this.targetInlineTags),
              'target',
            );
          if (!isTagInserted) {
            this.$refs.target.innerHTML = this.targetTextDisplayed;
          }
          this.isDropping.target = false;
        });
      } catch (err) {
        this.isDropping.target = false;
        this.$refs.target.innerHTML = this.targetTextDisplayed;
      }
    },
    handleTargetMouseup(event) {
      this.$emit('target-mouseup', event, this.segmentId);
      setTimeout(() => {
        this.emitCaretSet();
        this.highlightTags(event.target, this.$refs.target);
        this.captureSelection(event.target, 'target');
      });
    },
    emitCaretSet() {
      if (!this.getIsSourceFocused()) {
        this.$emit('caret-set', -1);
        return;
      }
      const sourceSelection = getCaretOffsetAndSelection(this.$refs.source, this.sourceText);
      const { withoutTags: { startOffset } } = sourceSelection;
      this.$emit('caret-set', startOffset);
    },
    removeTagsHighlighting(htmlElement, tagId) {
      let query = '.tag';
      if (!_.isNil(tagId)) {
        query += `[data-tag-id="${tagId}"]`;
      }
      const allTags = _.defaultTo(htmlElement.querySelectorAll(query), []);
      allTags.forEach(tag => tag.classList.remove('highlighted'));
    },
    onTagMouseUp(tagHtmlElement) {
      const selection = document.getSelection();
      if (!selection.isCollapsed) {
        return;
      }
      let openTagHtmlElement;
      const parent = tagHtmlElement.parentElement;
      const { tagId, tagFunction } = tagHtmlElement.dataset;
      const tagOnBlur = () => {
        openTagHtmlElement.innerText = this.formatTag(openTagHtmlElement.innerText);
        openTagHtmlElement.classList.remove('expanded');
        tagHtmlElement.removeEventListener('blur', tagOnBlur);
        this.removeTagsHighlighting(parent, tagId);
        this.$emit('tag-expanded', false);
      };
      if (tagFunction === TAG_FUNCTION_CLOSING) {
        openTagHtmlElement = Array.from(parent.querySelectorAll(`[data-tag-id="${tagId}"]`))
          .find(tEl => tEl !== tagHtmlElement);
      } else {
        openTagHtmlElement = tagHtmlElement;
      }
      const tag = this.sourceInlineTags.find(t => t.id === +tagId &&
        (t.function === TAG_FUNCTION_OPENING || t.function === TAG_FUNCTION_PLACEHOLDER));
      if (openTagHtmlElement.classList.contains('expanded')) {
        openTagHtmlElement.innerText = this.formatTag(openTagHtmlElement.innerText);
        openTagHtmlElement.classList.remove('expanded');
        this.$emit('tag-expanded', false);
      } else {
        openTagHtmlElement.innerText = tag.data;
        tagHtmlElement.addEventListener('blur', tagOnBlur);
        openTagHtmlElement.classList.add('expanded');
        this.$emit('tag-expanded', true);
      }
    },
    highlightTags(target, parent) {
      this.removeTagsHighlighting(parent);
      if (!isTag(target)) {
        return;
      }
      const tagId = target.dataset.tagId;
      const tagPair = parent.querySelectorAll(`[data-tag-id="${tagId}"]`);
      tagPair.forEach(tag => tag.classList.add('highlighted'));
    },
    onSourceBlur(event) {
      this.$emit('source-blur', event);
      this.captureSelection(event.target, 'source');
      this.removeTagsHighlighting(this.$refs.source);
    },
    onKeydown(event) {
      if (event.ctrlKey || event.metaKey) {
        const createTags = (tagName) => {
          if (this.getIsTargetFocused()) {
            event.preventDefault();
            const tagPair = buildTagPair(tagName, this.targetInlineTags);
            this.wrapTargetWithTags(tagPair);
          }
        };
        switch (event.keyCode) {
          case 83: {
            if (event.shiftKey) {
              event.preventDefault();
              this.copySourceIntoTarget();
            }
            break;
          }
          case 67: {
            if (_.isNil(this.selectedTag)) {
              this.tagClipboard = null;
            } else {
              event.preventDefault();
              this.tagClipboard = this.selectedTag;
            }
            break;
          }
          case 86: {
            if (this.getIsTargetFocused() && !_.isNil(this.tagClipboard)) {
              event.preventDefault();
              this.insertTag(
                this.prepareTagForInsertion(this.tagClipboard, this.targetInlineTags),
                'target',
              );
            }
            break;
          }
          case 73: { createTags('i'); break; }
          case 66: { createTags('b'); break; }
          case 85: { createTags('u'); break; }
          default: break;
        }
        if (
          !this.areAvailableTagsShown &&
          this.getIsTargetFocused() &&
          [91, 93, 17].includes(event.keyCode) &&
          !this.isLocked
        ) {
          this.areAvailableTagsShown = true;
        } else {
          this.areAvailableTagsShown = false;
        }
      } else if (event.keyCode === 9) {
        event.preventDefault();
        if (this.getIsSourceFocused()) {
          this.$refs.target.focus();
        } else {
          this.$refs.source.focus();
        }
      } else if (event.shiftKey) {
        if (event.keyCode === 114) {
          event.preventDefault();
          this.changeLetterCase();
        }
      }
    },
    onSourceKeydown(event) {
      const actionKeyCodes = [67, 86, 88];
      if (!(event.ctrlKey || event.metaKey) || !actionKeyCodes.includes(event.keyCode)) {
        event.preventDefault();
      }
      if (event.keyCode === 67 && !this.allowCopyPaste) {
        this.handleCopy(event);
      }
      if (event.altKey) {
        if (event.shiftKey) {
          if (event.keyCode === 84) {
            event.preventDefault();
            this.copySelectionToTarget();
          }
        }
      }
    },
    wrapTargetWithTags(tagPair = []) {
      if (tagPair.length !== 2) {
        return;
      }
      const range = document.getSelection().getRangeAt(0);
      this.insertTag(tagPair[0], 'target');
      range.collapse();
      this.insertTag(tagPair[1], 'target');
    },
    onTargetFocus() {
      this.recordEditStart();
    },
    onTargetBlur(event) {
      this.captureSelection(event.target, 'target');
      this.removeTagsHighlighting(this.$refs.target);
      setTimeout(() => {
        this.areAvailableTagsShown = false;
      }, 200);
      this.recordTTE();
    },
    recordEditStart() {
      this.editStartedAt = this.editStartedAt || Date.now();
    },
    recordTTE() {
      if (!this.isMTEnabled || _.isNil(this.editStartedAt) || !this.isChanged) {
        return;
      }
      const numOfWords = this.targetText.split(/\s/).length;
      const editTime = Date.now() - this.editStartedAt;
      const tte = editTime / 1000 / numOfWords;
      this.$emit('update-tte', { tte, numOfWords, editTime });
    },
    copySourceIntoTarget() {
      if (this.isLocked) {
        return;
      }
      const range = document.getSelection().getRangeAt(0);
      const rangeStartContainer = range.startContainer;
      if (this.$refs.target !== document.activeElement) return;
      const isCaretAtNodeStart = range.startOffset === 0;
      if (isTag(rangeStartContainer) || isTag(rangeStartContainer.parentElement)) {
        const isCaretAtNodeEnd = rangeStartContainer.textContent.length === range.startOffset;
        if (!isCaretAtNodeStart && !isCaretAtNodeEnd) return;
      }
      const inputElement = this.$refs.target;
      const childNodes = Array.from(inputElement.childNodes);
      let nodeUnderCaretIndex;
      if (range.startContainer === this.$refs.target) {
        nodeUnderCaretIndex = range.startOffset;
      } else {
        nodeUnderCaretIndex = _.findIndex(childNodes, (node) => {
          if (isTag(rangeStartContainer.parentElement)) {
            return node === rangeStartContainer.parentElement;
          }
          return node === rangeStartContainer;
        });
      }
      const nodeUnderCaretIndexAdjuster = (nodeUnderCaretIndex === 0 && isCaretAtNodeStart) ||
        range.startContainer === this.$refs.target ? 0 : 1;
      const targetSelection = getCaretOffsetAndSelection(this.$refs.target, this.targetText);
      const segmentSource = _.get(this, 'segment.source');
      const oldSegment = _.cloneDeep(this.segment);
      const newSegment = this.pasteInto(segmentSource, targetSelection, 'target');
      this.performSegmentUpdate(newSegment);
      const oldCaretOffset = targetSelection.withoutTags.startOffset;
      const newCaretOffset = oldCaretOffset + segmentSource.text.length;
      this.$emit('add-recent-action', {
        type: recentActionsTypes.EDIT_SEGMENT,
        oldValue: oldSegment,
        newValue: newSegment,
        newCaretOffset,
        oldCaretOffset,
      });
      setTimeout(() => {
        const newRange = document.createRange();
        const newOffset = this.$refs.source.childNodes.length +
          (nodeUnderCaretIndex === -1 ? 0 : nodeUnderCaretIndex + nodeUnderCaretIndexAdjuster);
        newRange.setStart(inputElement, newOffset);
        newRange.collapse(true);
        const selection = document.getSelection();
        selection.removeAllRanges();
        selection.addRange(newRange);
      }, 0);
    },
    applyResource(resource) {
      if (_.isNil(resource) || this.$refs.target !== document.activeElement) {
        return;
      }
      const targetSelection = getCaretOffsetAndSelection(this.$refs.target, this.targetText);
      const resourceTargetText = _.get(resource, 'target.text', resource.target);
      const oldSegment = _.cloneDeep(this.segment);
      const newSegment = this.pasteInto(resourceTargetText, targetSelection, 'target');
      this.performSegmentUpdate(newSegment, { immediate: true });
      const oldCaretOffset = targetSelection.withoutTags.startOffset;
      const newCaretOffset = oldCaretOffset + resourceTargetText.length;
      this.$emit('set-caret-params', { inputName: 'target', nodeIndex: 0, offset: newCaretOffset });
      this.$emit('add-recent-action', { type: recentActionsTypes.EDIT_SEGMENT, oldValue: oldSegment, newValue: newSegment, oldCaretOffset, newCaretOffset });
      _.set(newSegment, 'isAutoSuggestion', isMt(resource));
      this.performSegmentUpdate(newSegment);
    },
    async performSegmentUpdate(segment) {
      this.isChanged = true;
      const updatedSegment = await this.updateFileSegment(segment);
      this.setSegmentIsLoading({ originalId: updatedSegment.originalId, isLoading: true });
      this.$emit('save', updatedSegment.originalId);
    },
    onConfirmClick() {
      this.$emit('confirm', this.segmentId);
    },
    preventDefaultEvent(e) {
      e.preventDefault();
    },
    onQaIssueIgnoreChange(event, index) {
      const qaIssues = this.qaIssues.map((issue, i) => {
        if (index === i) {
          const clone = _.clone(issue);
          const isIgnored = _.get(event, 'target.checked');
          clone.locQualityIssueEnabled = isIgnored ? 'no' : 'yes';
          return clone;
        }
        return issue;
      });
      this.patchFileSegment({
        originalId: this.segmentId,
        data: { qaIssues },
      });
      const { requestId } = this.$route.params;
      const { workflowId, taskId } = this.$route.query;
      const { fileId } = this;
      this.updateFileSegmentQaIssues({
        requestId,
        workflowId,
        taskId,
        fileId,
        originalId: this.segmentId,
        qaIssues,
      });
    },
    getIsSourceFocused() {
      return this.$refs.source === document.activeElement;
    },
    getIsTargetFocused() {
      return this.$refs.target === document.activeElement;
    },
    onCopy(event) {
      if (!this.allowCopyPaste) {
        this.handleCopy(event);
      }
    },
    onTargetPaste(event) {
      if (!this.allowCopyPaste) {
        this.handlePaste(event, 'target');
      }
    },
    onSourceMouseUp(event) {
      if (!this.isRequestCompleted) {
        this.handleSourceMouseUp(event);
      }
    },
    onTargetMouseUp(event) {
      if (!this.isRequestCompleted) {
        this.handleTargetMouseup(event);
      }
    },
    copySelectionToTarget() {
      const range = document.getSelection().getRangeAt(0);
      const rangeStartContainer = range.startContainer;
      if (this.$refs.source === rangeStartContainer.parentElement) {
        const textToAppend = rangeStartContainer
          .textContent.slice(range.startOffset, range.endOffset);
        const newSegment = _.cloneDeep(this.segment);
        const oldSegment = _.cloneDeep(this.segment);
        newSegment.target.text += textToAppend;
        newSegment.target.textWithTags += textToAppend;
        newSegment.target.inlineTags = [];
        this.performSegmentUpdate(newSegment);
        this.$emit('add-recent-action', {
          type: recentActionsTypes.EDIT_SEGMENT,
          oldValue: oldSegment,
          newValue: newSegment,
          oldCaretOffset: oldSegment.target.text.length,
          newCaretOffset: newSegment.target.text.length,
        });
      }
    },
    capitalizeSegment(newSegment, rangeStartOffset, rangeEndOffset) {
      let capitalizedSegmentText = newSegment.target.text
        .slice(rangeStartOffset, rangeEndOffset);
      let capitalizedSegmentTextWithTags = newSegment.target.textWithTags
        .slice(rangeStartOffset, rangeEndOffset);
      if (this.letterCase === LETTER_CASE_MODE_LOWER || _.isNil(this.letterCase)) {
        this.letterCase = LETTER_CASE_MODE_SENTENCE;
        capitalizedSegmentText = this.capitalizeWords(capitalizedSegmentText);
        capitalizedSegmentTextWithTags = this.capitalizeWords(capitalizedSegmentTextWithTags);
      } else if (this.letterCase === LETTER_CASE_MODE_SENTENCE) {
        this.letterCase = LETTER_CASE_MODE_UPPER;
        capitalizedSegmentText = capitalizedSegmentText.toUpperCase();
        capitalizedSegmentTextWithTags = capitalizedSegmentTextWithTags.toUpperCase();
      } else if (this.letterCase === LETTER_CASE_MODE_UPPER) {
        this.letterCase = LETTER_CASE_MODE_LOWER;
        capitalizedSegmentText = capitalizedSegmentText.toLowerCase();
        capitalizedSegmentTextWithTags = capitalizedSegmentTextWithTags.toLowerCase();
      }
      return { capitalizedSegmentText, capitalizedSegmentTextWithTags };
    },
    async changeLetterCase() {
      const oldSegment = _.cloneDeep(this.segment);
      const newSegment = _.cloneDeep(this.segment);
      const selection = document.getSelection();
      let range = selection.getRangeAt(0);
      const rangeStartContainer = range.startContainer;
      const rangeStartOffset = range.startOffset;
      const rangeEndOffset = range.endOffset;
      if (this.$refs.target === rangeStartContainer.parentElement) {
        const { capitalizedSegmentText, capitalizedSegmentTextWithTags } =
          this.capitalizeSegment(newSegment, rangeStartOffset, rangeEndOffset);
        newSegment.target.text =
          newSegment.target.text.substring(0, rangeStartOffset) +
          capitalizedSegmentText +
          newSegment.target.text.substring(rangeEndOffset);
        newSegment.target.textWithTags =
          newSegment.target.textWithTags.substring(0, rangeStartOffset) +
          capitalizedSegmentTextWithTags +
          newSegment.target.textWithTags.substring(rangeEndOffset);
        this.performSegmentUpdate(newSegment);
        this.$emit('add-recent-action', { type: recentActionsTypes.EDIT_SEGMENT, oldValue: oldSegment, newValue: newSegment });
        await this.$nextTick();
        range = document.createRange();
        range.setStart(selection.anchorNode, rangeStartOffset);
        range.setEnd(selection.anchorNode, rangeEndOffset);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    },
    capitalizeWords(str) {
      const words = str.toLowerCase().split(' ');
      return words.map(word => _.capitalize(word)).join(' ');
    },
  },
};
