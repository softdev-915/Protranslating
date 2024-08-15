import { mapGetters, mapMutations, mapActions, mapState } from 'vuex';
import * as mutationTypes from '../../../../stores/modules/memory-editor/types';

const MEMORY_EDITOR_STORE_MODULE_NAME = 'memoryEditor';

export default {
  computed: {
    ...mapGetters(MEMORY_EDITOR_STORE_MODULE_NAME, [
      'segmentById',
      'seachedSegmentById',
      'isSegmentLoadingById',
    ]),
    ...mapState(MEMORY_EDITOR_STORE_MODULE_NAME, [
      'isLoading',
      'tmInfo',
      'company',
      'segments',
      'searchedSegments',
      '_activeSegmentsArray',
      'isSegmentCreationInProgress',
      'isSegmentDeletionInProgress',
      'segmentToCreate',
    ]),
  },
  methods: {
    ...mapMutations(MEMORY_EDITOR_STORE_MODULE_NAME, {
      resetState: mutationTypes.MEMORY_EDITOR_RESET,
      setActiveSegmentsArray: mutationTypes.MEMORY_EDITOR_SET_ACTIVE_SEGMENTS_ARRAY,
      setSegmentToCreate: mutationTypes.MEMORY_EDITOR_SET_SEGMENT_TO_CREATE,
      setSearchedSegments: mutationTypes.MEMORY_EDITOR_SET_SEARCHED_SEGMENTS,
      setSegmentIsLoading: mutationTypes.MEMORY_EDITOR_SET_SEGMENT_IS_LOADING,
    }),
    ...mapActions(MEMORY_EDITOR_STORE_MODULE_NAME, [
      'initMemoryEditor',
      'createSegment',
      'addSegment',
      'updateSegment',
      'deleteSegment',
      'saveTmSegment',
      'searchSegments',
      'replaceSegmentsContent',
    ]),
  },
};
