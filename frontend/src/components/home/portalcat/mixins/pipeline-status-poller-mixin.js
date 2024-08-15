import _ from 'lodash';
import { mapGetters } from 'vuex';

const PL_STATUS_INPROGRESS = 'running';
const PL_FETCH_STATUS_INTERVAL = 2000;

export default {
  data() {
    return {
      fetchStatusIntervalId: null,
    };
  },
  destroyed() {
    this.stopFetchStatusInterval();
  },
  computed: {
    ...mapGetters('features', ['mock']),
    requestId() {
      return _.get(this, '$route.params.requestId');
    },
    workflowId() {
      return _.get(this, '$route.query.workflowId');
    },
  },
  methods: {
    stopFetchStatusInterval() {
      if (!_.isNil(this.fetchStatusIntervalId)) {
        clearInterval(this.fetchStatusIntervalId);
      }
    },
    onStatusChange(prevStatus, isInProgress, pipelineId) {
      if (isInProgress) {
        const requestId = _.get(this.request, '_id', '');
        const multiplier = this.mock ? 10 : 1;
        this.fetchStatusIntervalId = setInterval(() => this.fetchPipelineStatus({
          requestId,
          pipelineId: pipelineId,
        }), PL_FETCH_STATUS_INTERVAL * multiplier);
      } else if (prevStatus === PL_STATUS_INPROGRESS) {
        this.stopFetchStatusInterval();
        this.refreshPipelines();
        this.refreshSegments();
      }
    },
    refreshPipelines() {
      this.fetchPipelines({
        requestId: this.requestId,
        workflowId: this.workflowId,
        fileId: this.activeDocument,
      });
    },
    refreshSegments() {
      this.fetchFileSegments({
        requestId: this.requestId,
        workflowId: this.workflowId,
        fileId: this.activeDocument,
      });
      this.fetchSegmentsWithQaIssues({
        requestId: this.requestId,
        workflowId: this.workflowId,
        fileId: this.activeDocument,
      });
    },
  },
};
