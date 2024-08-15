import _ from 'lodash';
import Widget from '../../../widgets/widget.vue';
import WidgetMixin from '../../../widgets/widget-mixin';
import SegmentHistoryItem from './segment-history-item.vue';
import TmStoreMixin from '../../../mixins/tm-store-mixin';
import TranslationMemoryService from '../../../../../../services/translation-memory-service';
import { CancellablePoller } from '../../../../../../services/cancellable-poller';
import { NEW_SEGMENT_ORIGINAL_ID } from '../../../helpers';

const translationMemoryService = new TranslationMemoryService();

export default {
  mixins: [
    WidgetMixin,
    TmStoreMixin,
  ],
  components: {
    Widget,
    SegmentHistoryItem,
  },
  data() {
    return {
      isHistoryLoading: false,
      historySegments: [],
    };
  },
  watch: {
    activeSegmentId(segmentId) {
      if (segmentId !== NEW_SEGMENT_ORIGINAL_ID) {
        this.fetchHistory();
      }
    },
  },
  computed: {
    companyId() {
      return _.get(this, 'company._id', '');
    },
    tmId() {
      return _.get(this, 'tmInfo._id', '');
    },
    activeSegmentId() {
      if (this._activeSegmentsArray.length === 1) {
        return _.first(this._activeSegmentsArray);
      }
      return null;
    },
    activeSegment() {
      if (!_.isNil(this.activeSegmentId)) {
        return this.segmentById(this.activeSegmentId);
      }
      return null;
    },
  },
  methods: {
    async fetchHistory() {
      if (_.isNil(this.activeSegment)) {
        return;
      }
      if (!_.isNil(this.historyPoller)) {
        this.historyPoller.cancel();
      }
      this.historySegments = [];
      this.historyPoller = new CancellablePoller(
        translationMemoryService.getSegmentHistory.bind(
          translationMemoryService,
          {
            companyId: this.companyId,
            tmId: this.tmId,
            originalId: this.activeSegment.originalId,
          }
        ),
        10000,
      );
      this.isHistoryLoading = true;
      this.historyPoller.start((response, error, poller) => {
        if (!poller.cancelled) {
          poller.cancel();
          this.historySegments = _.get(response, 'data.segments', []);
          this.isHistoryLoading = false;
        }
      });
    },
  },
};
