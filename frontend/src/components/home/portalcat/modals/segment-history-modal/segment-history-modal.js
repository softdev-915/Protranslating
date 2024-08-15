import _ from 'lodash';
import PcStoreMixin from '../../mixins/pc-store-mixin';
import PortalCatService from '../../../../../services/portalcat-service';
import StatusIcon from '../../components/status-icon/status-icon.vue';

const MODAL_ID = 'segment-history-modal';
const SEGMENT_STATUS_UNCONFIRMED = 'UNCONFIRMED';
const portalCatService = new PortalCatService();

export default {
  mixins: [PcStoreMixin],
  components: {
    StatusIcon,
  },
  data() {
    return {
      modalId: MODAL_ID,
      isHistoryLoading: false,
      segmentHistoryItems: [],
    };
  },
  watch: {
    segmentHistoryId(segmentId) {
      if (!_.isEmpty(segmentId)) {
        this.fetchSegmentHistory(segmentId);
        this.show();
      } else {
        this.hide();
      }
    },
  },
  methods: {
    show() {
      this.$refs.modal.show();
    },
    hide() {
      this.$refs.modal.hide();
    },
    closeModal(modalId) {
      if (modalId === MODAL_ID) {
        this.setSegmentHistoryId('');
      }
    },
    async fetchSegmentHistory(segmentId) {
      this.isHistoryLoading = true;
      const { requestId } = this.$route.params;
      const { workflowId } = this.$route.query;
      const response = await portalCatService.getFileSegmentHistory(
        requestId,
        { workflowId, fileId: this.activeDocument, originalId: segmentId },
      );
      this.segmentHistoryItems = _.get(response, 'data.fileSegments', []);
      this.isHistoryLoading = false;
    },
    getHistoryActions(segment, index) {
      const actions = [];
      const nextSegment = this.segmentHistoryItems[index + 1];
      if (_.isNil(nextSegment)) {
        actions.push('created');
        if (segment.isAutoSuggestion) {
          actions.push('target changed with autosuggestions');
        }
      } else {
        if (segment.locked !== nextSegment.locked) {
          if (segment.locked) {
            actions.push('locked');
          } else {
            actions.push('unlocked');
          }
        }
        if (segment.target.textWithTags !== nextSegment.target.textWithTags) {
          actions.push('target changed');
        }
        if (segment.status !== nextSegment.status) {
          if (segment.status === SEGMENT_STATUS_UNCONFIRMED) {
            actions.push('unconfirmed');
          } else {
            actions.push('confirmed');
          }
        }
        if (segment.isAutoSuggestion && !nextSegment.isAutoSuggestion) {
          actions.push('target changed with autosuggestions');
        }
      }
      return _.capitalize(actions.join(', '));
    },
  },
};
