import _ from 'lodash';
import Widget from '../../../widgets/widget.vue';
import WidgetMixin from '../../../widgets/widget-mixin';
import TmStoreMixin from '../../../mixins/tm-store-mixin';
import { CancellablePoller } from '../../../../../../services/cancellable-poller';
import TranslationMemoryService from '../../../../../../services/translation-memory-service';
import { NEW_SEGMENT_ORIGINAL_ID } from '../../../helpers';

const translationMemoryService = new TranslationMemoryService();

export default {
  mixins: [
    WidgetMixin,
    TmStoreMixin,
  ],
  components: {
    Widget,
  },
  data() {
    return {
      areDetailsLoading: false,
      segmentDetails: null,
    };
  },
  watch: {
    activeSegmentId(segmentId) {
      if (segmentId !== NEW_SEGMENT_ORIGINAL_ID) {
        this.fetchDetails();
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
    createdBy() {
      return _.get(this, 'segmentDetails.createdBy', '');
    },
    createdAt() {
      return _.get(this, 'segmentDetails.createdAt', '');
    },
    updatedBy() {
      return _.get(this, 'segmentDetails.updatedBy', '');
    },
    usedBy() {
      return _.get(this, 'segmentDetails.usedBy.fileName', '');
    },
    usedAt() {
      return _.get(this, 'segmentDetails.usedAt', '');
    },
  },
  methods: {
    async fetchDetails() {
      if (_.isNil(this.activeSegment)) {
        return;
      }
      if (!_.isNil(this.historyPoller)) {
        this.historyPoller.cancel();
      }
      this.segmentDetails = [];
      this.historyPoller = new CancellablePoller(
        translationMemoryService.getSegmentDetails.bind(
          translationMemoryService,
          {
            companyId: this.companyId,
            tmId: this.tmId,
            originalId: this.activeSegment.originalId,
          }
        ),
        10000,
      );
      this.areDetailsLoading = true;
      this.historyPoller.start((response, error, poller) => {
        if (!poller.cancelled) {
          poller.cancel();
          this.segmentDetails = _.get(response, 'data.segmentInfo');
          this.areDetailsLoading = false;
        }
      });
    },
  },
};
