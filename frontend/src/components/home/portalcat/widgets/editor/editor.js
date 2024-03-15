/* global document, window */
import _ from 'lodash';
import Promise from 'bluebird';
import { mapGetters, mapActions } from 'vuex';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import Widget from '../widget.vue';
import EditorSegment from '../../components/editor-segment/editor-segment.vue';
import EditorMenubar from '../../components/editor-menubar/editor-menubar.vue';
import EditorSearch from '../../components/editor-search/editor-search.vue';
import WidgetMixin from '../widget-mixin';
import PCStoreMixin from '../../mixins/pc-store-mixin';
import EditorMixin from '../../mixins/editor-mixin';
import userRoleCheckMixin from '../../../../../mixins/user-role-check';
import { errorNotification, successNotification } from '../../../../../utils/notifications';
import { getIsSegmentAssigned, getCanUpdateBasedOnStatus, recentActionsTypes } from '../../components/editor-segment/editor-segment-helpers';
import { AsyncStack } from '../../../../../services/async-stack';
import RepetitionsWarningModal from '../../modals/repetitions-warning-modal/repetitions-warning-modal.vue';
import { nbspToSpace, spaceToNbsp } from '../../../../../utils/strings';
import RequestService from '../../../../../services/request-service';

const ACTIVE_SEGMENT_SHORTCUT_DIRECTION_UP = 'up';
const ACTIVE_SEGMENT_SHORTCUT_DIRECTION_DOWN = 'down';
const SEGMENT_VALIDATION_MISSING_TAGS = 'missingTags';
// eslint-disable-next-line no-useless-escape
const HTML_ATTRIBUTES_REGEXP = /(\s+|[^\s]*="[a-zA-Z0-9:;\.\s\(\)\-\,#]*")/gi;
const TASK_ABILITY_TRANSLATION = 'Translation';
const TASK_ABILITY_EDITING = 'Editing';
const TASK_ABILITY_PEMT = 'PEMT';
const TASK_ABILITY_QA = 'QA';
const SEGMENT_STATUS_CONFIRMED_BY_TRANSLATOR = 'CONFIRMED_BY_TRANSLATOR';
const SEGMENT_STATUS_CONFIRMED_BY_EDITOR = 'CONFIRMED_BY_EDITOR';
const SEGMENT_STATUS_CONFIRMED_BY_QA_EDITOR = 'CONFIRMED_BY_QA_EDITOR';
const SEGMENT_STATUS_UNCONFIRMED = 'UNCONFIRMED';

function buildDefaultEditorParams() {
  return {
    filters: {
      type: null,
      status: null,
      locked: null,
      withQaIssues: null,
    },
    displayOptions: {
      tagsExpanded: false,
      areAllTagsAsNumbers: false,
      areNonPrintingCharsShown: false,
    },
  };
}

export default {
  mixins: [
    WidgetMixin,
    PCStoreMixin,
    EditorMixin,
    userRoleCheckMixin,
  ],
  components: {
    Widget,
    EditorSegment,
    EditorMenubar,
    EditorSearch,
    DynamicScroller,
    DynamicScrollerItem,
    RepetitionsWarningModal,
  },
  props: {
    layout: {
      type: String,
      default: 'columns',
    },
  },
  data() {
    return {
      isSearchVisible: false,
      activeSegmentsArray: [],
      editorParamsByDocument: {},
      caretCurrentPosition: 0,
      searchIn: '',
      areTagsExpanded: false,
      searchedSegmentsArray: null,
      commonEditorFilters: {
        repetitions: null,
      },
      recentActions: [],
      isRepetitionsWarningDisabled: false,
      caretParams: null,
      popoverContent: '',
    };
  },
  created() {
    this.requestService = new RequestService();
    this.globalAsyncStack = new AsyncStack();
    this.searchSuggestionsDebounced = _.debounce(this.searchSuggestions, 700);
    this.saveTaskConfigDebounced = _.debounce(this.saveTaskConfig, 1000);
    window.addEventListener('keydown', this.onKeydown);
  },
  destroyed() {
    window.removeEventListener('keydown', this.onKeydown);
  },
  watch: {
    activeSegmentsArray(activeSegments) {
      this.setSelectedSegments(activeSegments);
      this.triggerSearchSuggestions(activeSegments);
      const firstSegmentId = _.first(activeSegments);
      this.saveActiveSegment(firstSegmentId);
      if (!this.isRepetitionsFilterOn && activeSegments.length > 1) {
        return;
      }
      const segment = this.segmentByIdFn(firstSegmentId);
      const fileId = _.get(segment, 'fileId');
      if (fileId !== this.activeDocument) {
        this.setActiveDocument(fileId);
        this.$emit('config-change', { activeDocument: fileId });
      }
    },
    segments() {
      const activeSegment = _.get(this.taskConfig, 'activeSegment');
      this.highlightSegment(activeSegment);
      if (_.isFunction(this.onSegmentsUpdate)) {
        this.onSegmentsUpdate();
      }
    },
    'editorParams.filters'() {
      setTimeout(() => {
        this.scrollToSegment(_.first(this.activeSegmentsArray));
      });
    },
    'editorParams.displayOptions.tagsExpanded'(tagsExpanded) {
      this.areTagsExpanded = tagsExpanded;
    },
    searchedSegments(segmentsByFileId) {
      const searchedSegmentsSet = _.get(segmentsByFileId, this.activeDocument);
      if (_.isNil(searchedSegmentsSet)) {
        this.searchedSegmentsArray = null;
        return;
      }
      const searchedSegmentsArray = Object.keys(segmentsByFileId).sort((a, b) => a.localeCompare(b))
        .reduce((res, key) => [...res, ...segmentsByFileId[key]], []);
      this.searchedSegmentsArray = searchedSegmentsArray;
    },
    documents(documents) {
      documents.forEach((document) => {
        this.editorParamsByDocument[document] = buildDefaultEditorParams();
      });
    },
    isRepetitionsFilterOn(isFilterOn) {
      if (isFilterOn && _.isEmpty(this.repetitions)) {
        const { requestId } = this.$route.params;
        this.fetchRepetitions({ requestId });
      }
    },
    lastClickedInput(inputName) {
      this.searchIn = inputName;
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    isEmpty() {
      return _.isEmpty(this.segments);
    },
    catUiSettings() {
      return _.get(this, 'userLogged.uiSettings.catUiSettings');
    },
    areAllTagsAsNumbers() {
      return _.get(this, 'editorParams.displayOptions.areAllTagsAsNumbers', false);
    },
    areNonPrintingCharsShown() {
      return _.get(this, 'editorParams.displayOptions.areNonPrintingCharsShown', false);
    },
    userId() {
      return _.get(this, 'userLogged._id', '');
    },
    segmentsToDisplay() {
      if (this.isRepetitionsFilterOn) {
        return this.repetitions;
      }
      if (this.showOnlySearchedSegments) {
        const searchedSegmentsSet = this.searchedSegments[this.activeDocument];
        if (!_.isNil(searchedSegmentsSet)) {
          return Array.from(searchedSegmentsSet);
        }
      }
      return this.filteredSegments;
    },
    editorParams: {
      get() {
        return this.editorParamsByDocument[this.activeDocument];
      },
      set(newParams) {
        this.editorParamsByDocument = {
          ...this.editorParamsByDocument,
          [this.activeDocument]: newParams,
        };
      },
    },
    isRepetitionsFilterOn() {
      const repetitionsFilter = _.get(this, 'commonEditorFilters.repetitions', []);
      return _.first(repetitionsFilter);
    },
    segmentByIdFn() {
      if (this.isRepetitionsFilterOn) {
        return this.repetitionById;
      }
      return this.segmentById;
    },
    showPopover() {
      return !!this.popoverContent;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    applySegmentFilter(segment, filters) {
      const segmentType = _.get(segment, 'origin', '').toLowerCase();
      const segmentLocked = _.get(segment, 'locked', false) || !this.canUpdate(segment);
      const segmentStatus = _.get(segment, 'status', '');
      const qaIssues = _.get(segment, 'qaIssues');
      const { type, status, locked, withQaIssues } = filters;
      return (
        (_.isNil(type) || type.includes(segmentType)) &&
        (_.isNil(locked) || locked.includes(segmentLocked)) &&
        (_.isNil(status) || status.includes(segmentStatus)) &&
        (_.isNil(withQaIssues) || !_.isNil(qaIssues))
      );
    },
    toggleSearch() {
      this.isSearchVisible = !this.isSearchVisible || !_.isEmpty(this.selectedText);
    },
    onKeydown(event) {
      if (event.ctrlKey || event.metaKey) {
        if (event.shiftKey) {
          if (event.keyCode === 13) {
            event.preventDefault();
            this.unconfirmSegments(this.activeSegmentsArray);
          } else if (event.keyCode === 76) {
            event.preventDefault();
            this.lockUnlockSegments(this.activeSegmentsArray);
          } else if (event.keyCode === 82) {
            event.preventDefault();
            const segmentId = _.defaultTo(_.first(this.activeSegmentsArray), '');
            this.setSegmentHistoryId(segmentId);
          }
        } else if (event.keyCode === 74) {
          event.preventDefault();
          this.joinSegments();
        } else if (event.keyCode === 75) {
          event.preventDefault();
          if (!_.isEmpty(this.selectedText)) {
            this.setResourcesSearchParams({
              text: this.selectedText,
              searchIn: this.searchIn,
            });
          }
        } else if (event.keyCode === 13) {
          event.preventDefault();
          this.handleConfirmSegments(this.activeSegmentsArray);
        } else if (event.keyCode === 72) {
          event.preventDefault();
          if (!_.isEmpty(this.selectedText)) {
            this.searchParams = {
              [`${this.searchIn}Text`]: this.selectedText,
            };
          }
          this.toggleSearch();
        } else if (event.keyCode === 65) {
          this.captureSelection();
        } else if (event.keyCode === 89) {
          event.preventDefault();
          this.redoUndoneAction();
        } else if (event.keyCode === 90) {
          event.preventDefault();
          this.undoLastAction();
        }
      } else if (event.altKey) {
        if (event.keyCode === 74) {
          event.preventDefault();
          this.splitSegment();
        } else if (event.keyCode === 38) {
          event.preventDefault();
          this.handleNextActiveSegmentShortcut(ACTIVE_SEGMENT_SHORTCUT_DIRECTION_UP);
        } else if (event.keyCode === 40) {
          event.preventDefault();
          this.handleNextActiveSegmentShortcut(ACTIVE_SEGMENT_SHORTCUT_DIRECTION_DOWN);
        }
      }
    },
    onSegmentConfirm(segmentId) {
      const segment = this.segmentByIdFn(segmentId);
      const status = _.get(segment, 'status', '');
      if (status !== SEGMENT_STATUS_UNCONFIRMED) {
        this.unconfirmSegments([segmentId]);
      } else {
        this.handleConfirmSegments([segmentId]);
      }
    },
    handleConfirmSegments(segmentIds) {
      if (_.isEmpty(segmentIds)) {
        return;
      }
      const segmentWithMissingTagsId = segmentIds.find((segmentId) => {
        const validation = this.segmentsValidation[segmentId];
        return !_.isNil(validation[SEGMENT_VALIDATION_MISSING_TAGS]);
      });
      if (!_.isNil(segmentWithMissingTagsId)) {
        const validation =
          this.segmentsValidation[segmentWithMissingTagsId][SEGMENT_VALIDATION_MISSING_TAGS];
        const tags = validation.tags.map(tag => this.formatTag(tag.data)).join(', ');
        const segment = this.segmentByIdFn(segmentWithMissingTagsId);
        this.setConfirmDialogOptions({
          handler: this.confirmationDialogHandler.bind(this),
          message: `Missing tag(s) in the translation of segment #${segment.position}: ${tags}. Do you still want to confirm the segment?`,
          title: 'Warning',
          cancelText: 'No',
          payload: { segmentIds },
        });
      } else {
        this.confirmSegments(segmentIds);
      }
    },
    confirmationDialogHandler({ confirm, data }) {
      if (confirm) {
        this.confirmSegments(data.segmentIds);
      }
    },
    confirmSegments(segmentIds, addRecentAction = true) {
      let shouldHighlightNext = true;
      segmentIds.forEach((segmentId) => {
        const newSegment = _.clone(this.segmentByIdFn(segmentId));
        const segmentStatus = this.getNewConfirmedStatus(_.get(newSegment, 'status'));
        shouldHighlightNext = segmentStatus !== SEGMENT_STATUS_UNCONFIRMED;
        _.set(newSegment, 'status', segmentStatus);
        this.performSegmentUpdate(newSegment, { isImmediate: true });
      });
      if (shouldHighlightNext) {
        const lastActiveSegmentId = _.last(segmentIds);
        const lastActiveSegmentIndex = _.indexOf(this.segmentsToDisplay, lastActiveSegmentId);
        const nextSegmentIndex = lastActiveSegmentIndex + 1;
        const nextSegment = this.segmentByIdFn(this.segmentsToDisplay[nextSegmentIndex]);
        if (!_.isNil(nextSegment)) {
          this.clearActiveSegments();
          this.highlightSegment(nextSegment.originalId);
        }
      }
      if (addRecentAction) {
        this.addRecentAction({ type: recentActionsTypes.CONFIRM_SEGMENTS, segmentIds });
      }
    },
    unconfirmSegments(segmentIds, addRecentAction = true) {
      segmentIds.forEach((segmentId) => {
        const newSegment = _.clone(this.segmentByIdFn(segmentId));
        _.set(newSegment, 'status', SEGMENT_STATUS_UNCONFIRMED);
        this.performSegmentUpdate(newSegment, { isImmediate: true });
      });
      if (addRecentAction) {
        this.addRecentAction({ type: recentActionsTypes.UNCONFIRM_SEGMENTS, segmentIds });
      }
    },
    getNewConfirmedStatus(currentStatus) {
      let newStatus = currentStatus;
      const taskAbility = _.get(this, 'task.ability', '');
      if (
        taskAbility === TASK_ABILITY_TRANSLATION &&
        currentStatus === SEGMENT_STATUS_UNCONFIRMED
      ) {
        newStatus = SEGMENT_STATUS_CONFIRMED_BY_TRANSLATOR;
      } else if (taskAbility === TASK_ABILITY_EDITING || taskAbility === TASK_ABILITY_PEMT) {
        newStatus = SEGMENT_STATUS_CONFIRMED_BY_EDITOR;
      } else if (taskAbility === TASK_ABILITY_QA) {
        newStatus = SEGMENT_STATUS_CONFIRMED_BY_QA_EDITOR;
      }
      return newStatus;
    },
    joinSegments() {
      if (this.activeSegmentsArray.length <= 1) {
        return;
      }
      const onlyOwnSegments = this.activeSegmentsArray
        .every(segmentId => this.isSegmentAssigned(this.segmentByIdFn(segmentId)));
      const canJoin = (this.hasRole('SEGMENT-JOIN_UPDATE_OWN') && onlyOwnSegments) ||
        this.hasRole('SEGMENT-JOIN_UPDATE_ALL');
      if (canJoin) {
        const { requestId } = this.$route.params;
        const { workflowId } = this.$route.query;
        const fileId = this.activeDocument;
        const segments = this.activeSegmentsArray.map(
          activeSegmentId => this.segmentByIdFn(activeSegmentId)
        );
        const segmentsIds = segments.map(
          segment => _.get(segment, 'originalId', '')
        );
        this.joinFileSegments({
          requestId,
          workflowId,
          fileId,
          segmentsIds,
        }).then((newSegment) => {
          if (!_.isNil(newSegment)) {
            this.clearActiveSegments();
            this.highlightSegment(newSegment.originalId);
            this.addRecentAction({
              type: recentActionsTypes.JOIN_SEGMENTS,
              oldValue: segments,
              newValue: newSegment,
            });
          }
        });
      } else {
        this.pushNotification(errorNotification('User unauthorized'));
      }
    },
    splitSegment() {
      if (this.activeSegmentsArray.length !== 1) {
        return;
      }
      const segment = this.segmentByIdFn(_.first(this.activeSegmentsArray));
      const sourceText = _.get(segment, 'source.text', '');
      const canJoin = (this.hasRole('SEGMENT-JOIN_UPDATE_OWN') && this.isSegmentAssigned(segment)) ||
        this.hasRole('SEGMENT-JOIN_UPDATE_ALL');
      if (
        this.caretCurrentPosition <= 0 ||
        this.caretCurrentPosition >= sourceText.length ||
        !canJoin
      ) {
        return;
      }
      const { requestId } = this.$route.params;
      const { workflowId } = this.$route.query;
      const fileId = this.activeDocument;
      this.splitFileSegment({
        requestId,
        workflowId,
        fileId,
        segmentId: segment.originalId,
        position: this.caretCurrentPosition,
      }).then((newSegments) => {
        if (!_.isNil(newSegments)) {
          const firstSegment = _.first(newSegments);
          this.clearActiveSegments();
          this.highlightSegment(firstSegment.originalId);
          this.addRecentAction({
            type: recentActionsTypes.SPLIT_SEGMENT,
            oldValue: segment,
            newValue: newSegments,
          });
        }
      });
    },
    formatTag(tagText) {
      const displayOptions = _.get(this, 'editorParams.displayOptions', {});
      if (displayOptions.tagsExpanded) {
        return tagText;
      }
      return tagText.replace(HTML_ATTRIBUTES_REGEXP, '');
    },
    formatText(text, inputName) {
      let formattedText = text;
      if (this.areNonPrintingCharsShown) {
        this.specialChars.forEach((params) => {
          const test = _.get(params, 'test', params.original);
          formattedText = formattedText.replace(new RegExp(test, 'g'), params.replacement);
        });
      }
      const activeDocumentSearchResults = _.get(this, `searchedSegments[${this.activeDocument}]`, []);
      if (!_.isEmpty(activeDocumentSearchResults)) {
        return this.formatTextBasedOnSearchParams(formattedText, inputName);
      }
      return spaceToNbsp(formattedText);
    },
    onSourceBlur() {
      this.caretCurrentPosition = 0;
    },
    triggerSearchSuggestions(activeSegments) {
      const { requestId } = this.$route.params;
      const { workflowId } = this.$route.query;
      const segmentId = _.first(activeSegments);
      const segment = this.segmentByIdFn(segmentId);
      const fileId = _.get(segment, 'fileId');
      this.searchSuggestionsDebounced({
        activeSegments,
        requestId,
        workflowId,
        fileId,
      });
    },
    isSegmentAssigned(segment) {
      const userId = _.get(this, 'userId', '');
      return getIsSegmentAssigned(userId, segment);
    },
    canUpdate(segment) {
      const segmentInStore = this.segmentByIdFn(segment.originalId);
      return this.canUpdateBasedOnStatus(segmentInStore) && (this.hasRole('SEGMENT_UPDATE_ALL') || (
        this.hasRole('SEGMENT_UPDATE_OWN') &&
        this.isSegmentAssigned(segmentInStore)
      ));
    },
    canUpdateBasedOnStatus(segment) {
      const taskAbility = _.get(this, 'task.ability', '');
      return getCanUpdateBasedOnStatus(taskAbility, segment.status);
    },
    async performSegmentUpdate(segment, { isImmediate = false, rule }) {
      if (!this.canUpdate(segment)) {
        return;
      }
      this.setSegmentIsLoading({ originalId: segment.originalId, isLoading: true });
      const updatedSegment = await this.updateFileSegment(segment);
      this.queueSaveDebounced(updatedSegment.originalId, rule);
      if (isImmediate) {
        this.flushSave(updatedSegment.originalId);
      }
    },
    async saveSegment(originalId, repetitionsStrategy) {
      const { requestId } = this.$route.params;
      const { workflowId } = this.$route.query;
      const segment = this.segmentByIdFn(originalId);
      const fileId = _.get(segment, 'fileId');
      const segmentClone = _.cloneDeep(segment);
      const targetText = _.get(segment, 'target.text', '');
      _.set(segmentClone, 'target.text', nbspToSpace(targetText));
      try {
        await this.saveFileSegment({
          requestId,
          workflowId,
          fileId,
          originalId,
          segment: segmentClone,
          repetitionsStrategy,
        });
      } catch (err) {
        const errorCode = _.get(err, 'status.code');
        if (errorCode === 409) {
          if (this.isRepetitionsWarningDisabled) {
            this.onUpdateRepetitionsWarningConfirm(
              { originalId },
              { confirm: true, isRepetitionsWarningDisabled: true }
            );
          } else {
            this.$refs.repetitionsWarningModal.show({
              handler: this.onUpdateRepetitionsWarningConfirm.bind(this, {
                originalId,
              }),
            });
          }
        }
      }
    },
    onSaveSegment(originalId) {
      this.setSegmentIsLoading({ originalId, isLoading: true });
      this.queueSaveDebounced(originalId);
    },
    onSegmentTagExpanded(isExpanded) {
      const displayOptions = _.get(this, 'editorParams.displayOptions', {});
      if (!isExpanded && displayOptions.tagsExpanded) {
        return;
      }
      this.areTagsExpanded = isExpanded;
    },
    saveActiveSegment(originalId) {
      this.$emit('config-change', { activeSegment: originalId });
    },
    async onReplace({ params, scope }) {
      this.searchParams = params;
      const showOnlyMatching = _.get(params, 'showOnlyMatching', false);
      this.showOnlySearchedSegments = showOnlyMatching;
      params.replaceOriginalIds = this.activeSegmentsArray;
      const { requestId } = this.$route.params;
      const { workflowId } = this.$route.query;
      try {
        const segments = await this.replaceSegmentsContent({
          requestId,
          workflowId,
          params,
          scope,
          fileId: this.activeDocument,
        });
        const replaceSegmentIds = _.get(params, 'replaceOriginalIds', []);
        replaceSegmentIds.forEach(segmentId => this.removeSegmentFromSearchedSegments(segmentId));
        const message = `${segments.length} matches were replaced.`;
        this.pushNotification(successNotification(message));
      } catch (err) {
        const errorCode = _.get(err, 'status.code');
        if (errorCode === 409) {
          if (this.isRepetitionsWarningDisabled) {
            this.onReplaceRepetitionsWarningConfirm(
              { params, scope },
              { confirm: true, isRepetitionsWarningDisabled: true },
            );
          } else {
            this.$refs.repetitionsWarningModal.show({
              handler: this.onReplaceRepetitionsWarningConfirm.bind(this, { params, scope }),
            });
          }
        } else {
          const message = _.get(err, 'status.message', err.message);
          this.pushNotification(errorNotification(message));
        }
      }
    },
    async onUpdateRepetitionsWarningConfirm(
      { originalId },
      { confirm, isRepetitionsWarningDisabled },
    ) {
      this.isRepetitionsWarningDisabled = isRepetitionsWarningDisabled;
      const rule = 'SEGMENT_ONLY';
      if (!confirm) {
        const recentAction = this.recentActions
          .find(({ type, newValue, oldValue }) =>
            type === recentActionsTypes.EDIT_SEGMENT &&
            oldValue.status !== SEGMENT_STATUS_UNCONFIRMED &&
            oldValue.originalId === originalId &&
          !_.isEqual(newValue.target, oldValue.target));
        const updatedSegment = _.cloneDeep(recentAction.oldValue);
        this.setFileSegment(updatedSegment);
        await this.saveSegment(originalId, rule);
      }
    },
    async onReplaceRepetitionsWarningConfirm(
      { params, scope },
      { confirm, isRepetitionsWarningDisabled },
    ) {
      this.isRepetitionsWarningDisabled = isRepetitionsWarningDisabled;
      const rule = 'WHOLE_DOCUMENT';
      if (confirm) {
        params.repetitionsStrategy = rule;
        this.onReplace({ params, scope });
      }
    },
    onSearch(searchParams) {
      this.searchParams = searchParams;
      const showOnlyMatching = _.get(searchParams, 'showOnlyMatching', false);
      this.showOnlySearchedSegments = showOnlyMatching;
      const { requestId } = this.$route.params;
      const { workflowId } = this.$route.query;
      this.searchSegments({
        requestId,
        workflowId,
        params: searchParams,
      });
    },
    onSearchClear() {
      this.searchParams = null;
      this.showOnlySearchedSegments = false;
      this.setSearchedSegments({});
    },
    onSearchCurrentResultChange(index) {
      if (_.isNil(this.searchedSegmentsArray) || _.isNil(index)) {
        return;
      }
      const segmentId = this.searchedSegmentsArray[index];
      let segmentsDocument;
      Object.keys(this.searchedSegments).forEach((fileId) => {
        if (this.searchedSegments[fileId].has(segmentId)) {
          segmentsDocument = fileId;
        }
      });
      if (segmentsDocument === this.activeDocument) {
        this.highlightSegment(segmentId);
      } else {
        this.onSegmentsUpdate = () => {
          if (!_.isEmpty(this.segments)) {
            this.highlightSegment(segmentId);
            this.onSegmentsUpdate = null;
          }
        };
        this.setActiveDocument(segmentsDocument);
        this.$emit('config-change', { activeDocument: segmentsDocument });
      }
    },
    lockUnlockSegments(segments = [], addRecentNotification = true) {
      if (_.isEmpty(segments)) {
        return;
      }
      const { requestId } = this.$route.params;
      const { workflowId } = this.$route.query;
      segments.forEach((segmentId) => {
        const segment = this.segmentByIdFn(segmentId);
        const fileId = _.get(segment, 'fileId');
        const canLock = this.hasRole('SEGMENT-LOCK_UPDATE_ALL') ||
          (this.hasRole('SEGMENT-LOCK_UPDATE_OWN') && this.isSegmentAssigned(segment));
        if (!canLock) {
          return;
        }
        const newLockedStatus = !_.get(segment, 'locked', true);
        this.updateFileSegmentLocked({
          requestId,
          workflowId,
          fileId,
          originalId: segmentId,
          isLocked: newLockedStatus,
        });
      });
      if (addRecentNotification) {
        this.addRecentAction({
          type: recentActionsTypes.LOCK_SEGMENTS,
          segmentIds: segments,
        });
      }
    },
    async onUpdateTte({ tte, numOfWords, editTime }) {
      if (tte < 1 || tte > 10) {
        return;
      }
      const { requestId } = this.$route.params;
      const { workflowId, taskId, ptId } = this.$route.query;
      const data = {
        segmentEditTime: editTime,
        segmentWordsEdited: numOfWords,
        segmentTTE: tte,
      };
      await this.requestService.updateProviderTaskTTE(requestId, workflowId, taskId, ptId, data);
    },
    async undoLastAction() {
      const lastAction = this.recentActions.find(action => action.undone === false);
      if (this.isLoading || _.isNil(lastAction)) {
        return;
      }
      lastAction.undone = true;
      if (lastAction.type === recentActionsTypes.EDIT_SEGMENT) {
        this.performSegmentUpdate(lastAction.oldValue, { isImmediate: true });
        if (!_.isNil(lastAction.oldCaretOffset)) {
          this.caretParams.offset = lastAction.oldCaretOffset;
        }
      } else if (lastAction.type === recentActionsTypes.JOIN_SEGMENTS) {
        this.undoJoiningSegments(lastAction);
      } else if (lastAction.type === recentActionsTypes.SPLIT_SEGMENT) {
        this.undoSplittingSegment(lastAction);
      } else if (lastAction.type === recentActionsTypes.LOCK_SEGMENTS) {
        this.lockUnlockSegments(lastAction.segmentIds, false);
      } else if (lastAction.type === recentActionsTypes.CONFIRM_SEGMENTS) {
        this.unconfirmSegments(lastAction.segmentIds, false);
        await this.highlightSegment(_.first(lastAction.segmentIds));
      } else if (lastAction.type === recentActionsTypes.UNCONFIRM_SEGMENTS) {
        this.confirmSegments(lastAction.segmentIds, false);
      }
    },
    async redoUndoneAction() {
      const lastAction = this.recentActions
        .findLast(action => action.undone === true && action.canRedo === true);
      if (this.isLoading || _.isNil(lastAction)) {
        return;
      }
      lastAction.undone = false;
      if (lastAction.type === recentActionsTypes.EDIT_SEGMENT) {
        this.performSegmentUpdate(lastAction.newValue, { isImmediate: true });
        if (!_.isNil(lastAction.newCaretOffset)) {
          this.caretParams.offset = lastAction.newCaretOffset;
        }
      } else if (lastAction.type === recentActionsTypes.JOIN_SEGMENTS) {
        this.redoJoiningSegments(lastAction);
      } else if (lastAction.type === recentActionsTypes.SPLIT_SEGMENT) {
        this.redoSplittingSegment(lastAction);
      } else if (lastAction.type === recentActionsTypes.LOCK_SEGMENTS) {
        this.lockUnlockSegments(lastAction.segmentIds, false);
      } else if (lastAction.type === recentActionsTypes.CONFIRM_SEGMENTS) {
        this.confirmSegments(lastAction.segmentIds, false);
      } else if (lastAction.type === recentActionsTypes.UNCONFIRM_SEGMENTS) {
        this.unconfirmSegments(lastAction.segmentIds, false);
        await this.highlightSegment(_.first(lastAction.segmentIds));
      }
    },
    addRecentAction(action) {
      this.recentActions.forEach((recentAction) => {
        if (recentAction.undone === true) {
          recentAction.canRedo = false;
        }
      });
      this.recentActions.unshift({ ...action, undone: false, canRedo: true });
      if (this.recentActions.length > 10) {
        this.recentActions.pop();
      }
    },
    async undoJoiningSegments(lastAction) {
      const { requestId } = this.$route.params;
      const { workflowId } = this.$route.query;
      const fileId = this.activeDocument;
      const originalSegmentIndex = this.segments
        .findIndex(s => s === lastAction.newValue.originalId);
      await Promise.mapSeries(lastAction.oldValue, async (segment, index, segmentsCount) => {
        const segmentId = this.segments[originalSegmentIndex + index];
        if (index !== segmentsCount - 1) {
          const breakingPoint = segment.source.text.length;
          const newSegments = await this.splitFileSegment({
            requestId,
            workflowId,
            fileId,
            segmentId,
            position: breakingPoint,
          });
          if (!_.isNil(newSegments)) {
            const firstSegment = _.first(newSegments);
            this.clearActiveSegments();
            this.highlightSegment(firstSegment.originalId);
          }
        }
        lastAction.oldValue[index].originalId = segmentId;
        return this.performSegmentUpdate(
          { ...segment, originalId: segmentId }, { isImmediate: true });
      });
    },
    async undoSplittingSegment(lastAction) {
      const { requestId } = this.$route.params;
      const { workflowId } = this.$route.query;
      const fileId = this.activeDocument;
      const segmentsIds = lastAction.newValue.map(
        segment => _.get(segment, 'originalId', '')
      );
      const newSegment = await this.joinFileSegments({
        requestId,
        workflowId,
        fileId,
        segmentsIds,
      });
      if (!_.isNil(newSegment)) {
        this.clearActiveSegments();
        this.highlightSegment(newSegment.originalId);
        lastAction.oldValue.originalId = newSegment.originalId;
        return this.performSegmentUpdate(lastAction.oldValue, { isImmediate: true });
      }
    },
    async redoJoiningSegments(lastAction) {
      const { requestId } = this.$route.params;
      const { workflowId } = this.$route.query;
      const fileId = this.activeDocument;
      const segmentsIds = lastAction.oldValue.map(
        segment => _.get(segment, 'originalId', '')
      );
      const newSegment = await this.joinFileSegments({
        requestId,
        workflowId,
        fileId,
        segmentsIds,
      });
      if (!_.isNil(newSegment)) {
        this.clearActiveSegments();
        this.highlightSegment(newSegment.originalId);
        return this.performSegmentUpdate(lastAction.newValue, { isImmediate: true });
      }
    },
    async redoSplittingSegment(lastAction) {
      const { requestId } = this.$route.params;
      const { workflowId } = this.$route.query;
      const fileId = this.activeDocument;
      const originalSegmentIndex = this.segments
        .findIndex(s => s === lastAction.oldValue.originalId);
      await Promise.mapSeries(lastAction.newValue, async (segment, index, segmentsCount) => {
        const segmentId = this.segments[originalSegmentIndex + index];
        if (index !== segmentsCount - 1) {
          const breakingPoint = segment.source.text.length;
          const newSegments = await this.splitFileSegment({
            requestId,
            workflowId,
            fileId,
            segmentId,
            position: breakingPoint,
          });
          if (!_.isNil(newSegments)) {
            const firstSegment = _.first(newSegments);
            this.clearActiveSegments();
            this.highlightSegment(firstSegment.originalId);
          }
        }
        segment.originalId = segmentId;
        return this.performSegmentUpdate(segment, { isImmediate: true });
      });
    },
  },
};
