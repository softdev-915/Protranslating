/* global window, document */
import _ from 'lodash';
import { AsyncStack } from '../../../../services/async-stack';
import { spaceToNbsp, nbspToSpace } from '../../../../utils/strings';
import { wrapSearchResult } from '../components/editor-segment/editor-segment-helpers';

const ACTIVE_SEGMENT_SHORTCUT_DIRECTION_UP = 'up';

export default {
  data() {
    return {
      segmentsValidation: {},
      showOnlySearchedSegments: false,
      searchParams: null,
      clipboard: null,
      selectedText: '',
      lastClickedInput: null,
    };
  },
  created() {
    this.asyncStacksBySegmentId = {};
    this.queueSaveDebouncedBySegmentId = {};
    this.activeSegments = new Set();
    this.specialChars = [
      { original: '\n', replacement: '↵' },
      { original: '\t', replacement: '→' },
      { test: '\\s', original: ' ', replacement: '·' },
    ];
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
  },
  destroyed() {
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
  },
  computed: {
    filteredSegments() {
      const filters = _.get(this, 'editorParams.filters');
      if (_.isNil(filters)) {
        return this.segments;
      }
      return (this.segments || []).filter((segmentId) => {
        const segment = this.segmentByIdFn(segmentId);
        return this.applySegmentFilter(segment, filters);
      });
    },
    segmentByIdFn() {
      return this.segmentById;
    },
  },
  methods: {
    onSegmentMouseDown(event) {
      if (event.shiftKey) {
        document.getSelection().removeAllRanges();
      }
    },
    onSegmentClicked(event, segmentId, index) {
      this.activateClickedSegment(event, segmentId, index);
      if (_.isFunction(this.handleSegmentClicked)) {
        this.handleSegmentClicked(event, segmentId, index);
      }
    },
    activateClickedSegment(event, segmentId, index) {
      const isSegmentActive = this.activeSegments.has(segmentId);
      if (this.activeSegments.size === 1 && isSegmentActive) {
        return;
      }
      let segmentsToActivate = [segmentId];
      if (this.activeSegments.size > 0) {
        const isShiftPressed = _.get(event, 'shiftKey');
        const isCtrlPressed = _.get(event, 'ctrlKey') || _.get(event, 'metaKey');
        if (isShiftPressed) {
          segmentsToActivate = this.activateSegmentWithShift(index);
        } else if (isCtrlPressed) {
          segmentsToActivate = this.activateSegmentWithCtrl(segmentId, isSegmentActive);
        }
      }
      this.clearActiveSegments();
      segmentsToActivate.forEach(segment => this.activateSegment(segment));
    },
    activateSegmentWithShift(segmentIndex) {
      const firstActiveSegment = _.first(this.activeSegmentsArray);
      const firstActiveSegmentIndex = _.indexOf(this.segmentsToDisplay, firstActiveSegment);
      if (segmentIndex < firstActiveSegmentIndex) {
        return this.segmentsToDisplay.slice(segmentIndex, firstActiveSegmentIndex + 1);
      }
      return this.segmentsToDisplay.slice(firstActiveSegmentIndex, segmentIndex + 1);
    },
    activateSegmentWithCtrl(segmentId, isSegmentActive) {
      let segmentsToActivate = _.clone(this.activeSegmentsArray);
      if (!isSegmentActive) {
        segmentsToActivate.push(segmentId);
      } else {
        segmentsToActivate = segmentsToActivate.filter(id => id !== segmentId);
      }
      return segmentsToActivate;
    },
    deactivateSegment(segmentId) {
      this.activeSegments.delete(segmentId);
      const segmentIndex = _.indexOf(this.activeSegmentsArray, segmentId);
      this.activeSegmentsArray.splice(segmentIndex, 1);
      this.activeSegmentsArray = Array.from(this.activeSegmentsArray);
    },
    activateSegment(segmentId) {
      if (this.activeSegments.has(segmentId)) {
        return;
      }
      this.activeSegments.add(segmentId);
      const indexToInsert = _.sortedLastIndexBy(
        this.activeSegmentsArray, segmentId, sId => this.segmentByIdFn(sId).position,
      );
      this.activeSegmentsArray.splice(indexToInsert, 0, segmentId);
      this.activeSegmentsArray = Array.from(this.activeSegmentsArray);
    },
    isSegmentActive(segmentId) {
      return this.activeSegments.has(segmentId);
    },
    clearActiveSegments() {
      this.activeSegments.clear();
      this.activeSegmentsArray = [];
    },
    highlightSegment(segmentId) {
      const segment = this.segmentByIdFn(segmentId);
      if (!_.isNil(segment)) {
        this.clearActiveSegments();
        this.activateSegment(segmentId);
        setTimeout(() => {
          this.scrollToSegment(segmentId);
        });
      }
    },
    scrollToSegment(segmentId) {
      const dScrollerEl = _.get(this.$refs, 'dScroller.$el');
      if (_.isNil(dScrollerEl)) {
        return;
      }
      const segmentEl = dScrollerEl.querySelector(`[data-segment-id="${segmentId}"]`);
      if (_.isNil(segmentEl)) {
        this.$refs.dScroller.scrollToItem(_.indexOf(this.segmentsToDisplay, segmentId));
        return;
      }
      const dScrollerElRect = dScrollerEl.getBoundingClientRect();
      const segmentElRect = segmentEl.getBoundingClientRect();
      if (segmentElRect.bottom > dScrollerElRect.bottom) {
        dScrollerEl.scrollTop += segmentElRect.height;
      } else if (segmentElRect.top < dScrollerElRect.top) {
        dScrollerEl.scrollTop -= segmentElRect.height;
      }
    },
    handleNextActiveSegmentShortcut(direction = ACTIVE_SEGMENT_SHORTCUT_DIRECTION_UP) {
      let newActiveSegmentId;
      const isDirectionUp = direction === ACTIVE_SEGMENT_SHORTCUT_DIRECTION_UP;
      if (_.isEmpty(this.activeSegmentsArray)) {
        newActiveSegmentId = _.first(this.segmentsToDisplay);
      } else if (this.activeSegmentsArray.length > 1) {
        this.clearActiveSegments();
        newActiveSegmentId =
          isDirectionUp ? _.first(this.activeSegmentsArray) : _.last(this.activeSegmentsArray);
      } else {
        const currentActiveSegmentIndex =
          _.indexOf(this.segmentsToDisplay, _.first(this.activeSegmentsArray));
        const prevSegmentIndex = currentActiveSegmentIndex + (isDirectionUp ? -1 : 1);
        const prevSegmentId = this.segmentsToDisplay[prevSegmentIndex];
        if (!_.isNil(prevSegmentId)) {
          this.clearActiveSegments();
          newActiveSegmentId = prevSegmentId;
        }
      }
      if (!_.isNil(newActiveSegmentId)) {
        this.highlightSegment(newActiveSegmentId);
      }
    },
    onSegmentValidation(data, segmentId) {
      this.segmentsValidation[segmentId] = data;
    },
    queueSaveDebounced(originalId, rule) {
      let debouncedFn = this.queueSaveDebouncedBySegmentId[originalId];
      if (_.isNil(debouncedFn)) {
        debouncedFn =
          this.queueSaveDebouncedBySegmentId[originalId] = _.debounce(this.queueSave, 3000);
      }
      debouncedFn(originalId, rule);
    },
    queueSave(originalId, rule) {
      let asyncStack = this.asyncStacksBySegmentId[originalId];
      if (_.isNil(asyncStack)) {
        asyncStack = this.asyncStacksBySegmentId[originalId] = new AsyncStack();
      }
      asyncStack.add(this.saveSegment.bind(this, originalId, rule));
    },
    flushSave(originalId) {
      const debouncedFn = this.queueSaveDebouncedBySegmentId[originalId];
      if (_.isNil(debouncedFn)) {
        return;
      }
      debouncedFn.flush();
    },
    formatTextBasedOnSearchParams(text, inputName) {
      let formattedText = spaceToNbsp(text);
      if (!_.isNil(this.searchParams)) {
        const sourceText = spaceToNbsp(_.get(this, 'searchParams.sourceText', ''));
        const targetText = spaceToNbsp(_.get(this, 'searchParams.targetText', ''));
        const isCaseSensitive = _.get(this, 'searchParams.isCaseSensitive', '');
        const flags = isCaseSensitive ? 'g' : 'gi';
        if (inputName === 'source' && !_.isEmpty(sourceText)) {
          formattedText = formattedText.replace(new RegExp(sourceText, flags), wrapSearchResult);
        } else if (inputName === 'target' && !_.isEmpty(targetText)) {
          formattedText = formattedText.replace(new RegExp(targetText, flags), wrapSearchResult);
        }
      }
      return formattedText;
    },
    onCustomCopy() {
      this.clipboard = this.selectedText;
    },
    captureSelection() {
      setTimeout(() => {
        const selection = document.getSelection();
        if (selection.rangeCount === 0) {
          this.selectedText = '';
          return;
        }
        this.selectedText = nbspToSpace(selection.toString());
      });
    },
    onMouseDown(event) {
      if (event.target.classList.contains('source')) {
        this.lastClickedInput = 'source';
      } else if (event.target.classList.contains('target')) {
        this.lastClickedInput = 'target';
      } else {
        this.lastClickedInput = null;
      }
    },
    onMouseUp() {
      this.captureSelection();
    },
  },
};
