/* global window */
import _ from 'lodash';
import { mapGetters } from 'vuex';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import Widget from '../../../widgets/widget.vue';
import WidgetMixin from '../../../widgets/widget-mixin';
import EditorSearch from '../../../components/editor-search/editor-search.vue';
import EditorMenubar from '../../components/editor-menubar/editor-menubar.vue';
import EditorSegmentActions from '../../components/editor-segment-actions/editor-segment-actions.vue';
import EditorSegment from '../../components/editor-segment/editor-segment.vue';
import TmStoreMixin from '../../../mixins/tm-store-mixin';
import EditorMixin from '../../../mixins/editor-mixin';
import UserRoleCheckMixin from '../../../../../../mixins/user-role-check';
import { emptySegment } from '../../../helpers';
import { nbspToSpace, spaceToNbsp } from '../../../../../../utils/strings';

// eslint-disable-next-line no-useless-escape
const HTML_ATTRIBUTES_REGEXP = /(\s+|[^\s]*="[a-zA-Z0-9:;\.\s\(\)\-\,#]*")/gi;
const ACTIVE_SEGMENT_SHORTCUT_DIRECTION_UP = 'up';
const ACTIVE_SEGMENT_SHORTCUT_DIRECTION_DOWN = 'down';
const SEGMENT_VALIDATION_NEW_IS_NOT_VALID = 'newIsNotValid';

export default {
  mixins: [
    WidgetMixin,
    TmStoreMixin,
    EditorMixin,
    UserRoleCheckMixin,
  ],
  components: {
    Widget,
    EditorSearch,
    EditorMenubar,
    EditorSegmentActions,
    DynamicScroller,
    DynamicScrollerItem,
    EditorSegment,
  },
  props: {
    layout: {
      type: String,
      default: 'columns',
    },
  },
  created() {
    window.addEventListener('keydown', this.onKeydown);
  },
  destroyed() {
    window.removeEventListener('keydown', this.onKeydown);
  },
  data() {
    return {
      editorParams: {
        filters: {
          type: null,
          status: null,
          locked: null,
        },
        displayOptions: {
          areAllTagsAsNumbers: false,
          areNonPrintingCharsShown: false,
        },
      },
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    catUiSettings() {
      return _.get(this, 'userLogged.uiSettings.catUiSettings');
    },
    activeSegmentsArray: {
      get() {
        return this._activeSegmentsArray;
      },
      set(activeSegmentsArray) {
        this.setActiveSegmentsArray(activeSegmentsArray);
      },
    },
    areAllTagsAsNumbers() {
      return _.get(this, 'editorParams.displayOptions.areAllTagsAsNumbers', false);
    },
    areNonPrintingCharsShown() {
      return _.get(this, 'editorParams.displayOptions.areNonPrintingCharsShown', false);
    },
    canEdit() {
      return this.hasRole('CAT-RESOURCES_UPDATE_ALL');
    },
    canCreate() {
      return this.hasRole('CAT-RESOURCES_CREATE_ALL');
    },
    canDelete() {
      return this.hasRole('CAT-RESOURCES_DELETE_ALL');
    },
    companyId() {
      return _.get(this, 'company._id', '');
    },
    tmId() {
      return _.get(this, 'tmInfo._id', '');
    },
    srcLang() {
      return _.get(this, 'tmInfo.srcLang.isoCode', '');
    },
    tgtLang() {
      return _.get(this, 'tmInfo.tgtLang.isoCode', '');
    },
    segmentsToDisplay() {
      if (this.showOnlySearchedSegments) {
        return this.searchedSegments;
      }
      if (_.isNil(this.segmentToCreate)) {
        return this.filteredSegments;
      }
      return this.filteredSegments.concat(this.segmentToCreate);
    },
    scrollerKey() {
      const segmentsKey = _.get(this, 'segmentsToDisplay.length', 0);
      return `${this.layout}_${segmentsKey}`;
    },
    tmUsers() {
      return _.get(this, 'tmInfo.tmInfo.users', []);
    },
  },
  methods: {
    formatTag(tagText) {
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
      if (!_.isEmpty(this.searchedSegments)) {
        return this.formatTextBasedOnSearchParams(formattedText, inputName);
      }
      return spaceToNbsp(formattedText);
    },
    applySegmentFilter(segment, filters) {
      const segmentType = _.get(segment, 'origin', '').toLowerCase();
      const segmentLocked = _.get(segment, 'locked', false);
      const segmentStatus = _.get(segment, 'status', false);
      const { type, status, locked } = filters;
      return (
        (_.isNil(type) || type.includes(segmentType)) &&
        (_.isNil(locked) || locked.includes(segmentLocked)) &&
        (_.isNil(status) || status.includes(segmentStatus))
      );
    },
    onAddSegment() {
      if (!this.canCreate) {
        return;
      }
      const newSegment = emptySegment(this.srcLang, this.tgtLang);
      this.addSegment(newSegment);
      this.highlightSegment(newSegment.originalId);
    },
    async onCreateSegment(segment) {
      if (!this.canCreate) {
        return;
      }
      const newSegment = await this.createSegment({
        companyId: this.companyId,
        tmId: this.tmId,
        body: _.omit(segment, 'originalId'),
      });
      this.setSegmentToCreate(null);
      this.highlightSegment(newSegment.originalId);
    },
    onKeydown(event) {
      if (event.ctrlKey || event.metaKey) {
        if (event.keyCode === 13) {
          event.preventDefault();
          this.handleConfirmSegments(this.activeSegmentsArray);
        }
      } else if (event.altKey) {
        if (event.keyCode === 38) {
          event.preventDefault();
          this.handleNextActiveSegmentShortcut(ACTIVE_SEGMENT_SHORTCUT_DIRECTION_UP);
        } else if (event.keyCode === 40) {
          event.preventDefault();
          this.handleNextActiveSegmentShortcut(ACTIVE_SEGMENT_SHORTCUT_DIRECTION_DOWN);
        }
      }
    },
    handleConfirmSegments(activeSegments = []) {
      for (let i = 0; i < activeSegments.length; i++) {
        const segmentId = activeSegments[i];
        const segment = this.segmentById(segmentId);
        const isNew = _.isNil(segment._id);
        if (isNew) {
          const segmentValidation = _.get(this, `segmentsValidation[${segment.originalId}]`, {});
          const isValid = _.isNil(segmentValidation[SEGMENT_VALIDATION_NEW_IS_NOT_VALID]);
          if (isValid) {
            this.onCreateSegment(segment);
            return;
          }
        }
      }
    },
    onDeleteSegment() {
      if (this.activeSegmentsArray.length !== 1) {
        return;
      }
      const segmentId = _.first(this.activeSegmentsArray);
      if (segmentId === this.segmentToCreate) {
        this.setSegmentToCreate(null);
      } else {
        this.deleteSegment({
          companyId: this.companyId,
          tmId: this.tmId,
          originalId: segmentId,
        });
      }
    },
    onReplace({ params, scope }) {
      this.searchParams = params;
      const showOnlyMatching = _.get(params, 'showOnlyMatching', false);
      this.showOnlySearchedSegments = showOnlyMatching;
      params.replaceOriginalIds = this.activeSegmentsArray;
      this.replaceSegmentsContent({
        companyId: this.companyId,
        tmId: this.tmId,
        params,
        scope,
      });
    },
    onSearch(searchParams) {
      this.searchParams = searchParams;
      const showOnlyMatching = _.get(searchParams, 'showOnlyMatching', false);
      this.showOnlySearchedSegments = showOnlyMatching;
      this.searchSegments({
        companyId: this.companyId,
        tmId: this.tmId,
        params: searchParams,
      });
    },
    onSearchClear() {
      this.searchParams = null;
      this.showOnlySearchedSegments = false;
      this.setSearchedSegments(null);
    },
    onSearchCurrentResultChange(index) {
      if (_.isNil(index)) {
        return;
      }
      const segmentId = this.searchedSegments[index];
      this.highlightSegment(segmentId);
    },
    saveSegment(originalId) {
      this.setSegmentIsLoading({ originalId, isLoading: true });
      const segment = this.segmentById(originalId);
      const segmentClone = _.cloneDeep(segment);
      const targetText = _.get(segment, 'target.text', '');
      _.set(segmentClone, 'target.text', nbspToSpace(targetText));
      return this.saveTmSegment({
        companyId: this.companyId,
        tmId: this.tmId,
        originalId,
        segment: segmentClone,
      });
    },
    onSaveSegment(originalId) {
      this.setSegmentIsLoading({ originalId, isLoading: true });
      this.queueSaveDebounced(originalId);
    },
  },
};
