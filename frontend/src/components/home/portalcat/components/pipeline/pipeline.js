import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import Action from '../action/action.vue';
import PortalCatStoreMixin from '../../mixins/pc-store-mixin';
import RoleCheckMixin from '../../../../../mixins/user-role-check';
import ActionFilesMixin from '../../mixins/action-files-mixin';
import PipelineStatusPollerMixin from '../../mixins/pipeline-status-poller-mixin';

const PL_STATUS_INPROGRESS = 'running';
const PL_STATUS_STOPPED = 'stopped';
const PL_STATUS_ERROR = 'failed';
const PL_STATUS_SUCCESS = 'succeeded';
const PL_TYPE_IMPORT = 'import';
const NO_ENGINE = 'No engine';

export default {
  mixins: [
    PortalCatStoreMixin,
    RoleCheckMixin,
    ActionFilesMixin,
    PipelineStatusPollerMixin,
  ],
  props: {
    pipeline: {
      type: Object,
      required: true,
    },
    isDisabled: Boolean,
    title: String,
    isExpanded: Boolean,
  },
  components: {
    Action,
  },
  data() {
    return {
      runScope: 'file',
    };
  },
  watch: {
    pipelineStatus: {
      handler(value, prevValue) {
        this.onStatusChange(prevValue, this.isInProgress, this.pipelineId);
      },
      immediate: true,
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    pipelineId() {
      return this.pipeline._id;
    },
    pipelineType() {
      return _.get(this.pipeline, 'type', '');
    },
    isMT() {
      return _.get(this.pipeline, 'type') === 'mt';
    },
    pipelineMessage() {
      return _.get(this.pipeline, 'message', '');
    },
    currentActions() {
      return _.get(this.pipeline, 'currentActions', []);
    },
    activeDocumentName() {
      return _.get(this.documentById(this.activeDocument), 'name', '');
    },
    canRun() {
      return this.hasRole('PIPELINE-RUN_UPDATE_ALL');
    },
    pipelineStatus() {
      return _.get(this.pipeline, 'status', '');
    },
    isInProgress() {
      return this.pipelineStatus === PL_STATUS_INPROGRESS;
    },
    isStopped() {
      return this.pipelineStatus === PL_STATUS_STOPPED;
    },
    isError() {
      return this.pipelineStatus === PL_STATUS_ERROR;
    },
    isSucceeded() {
      return this.pipelineStatus === PL_STATUS_SUCCESS;
    },
    isLoading() {
      return this.isPipelinesLoading;
    },
    titleToDisplay() {
      return _.get(this, 'title', this.pipelineType);
    },
    isDownloadsAvailable() {
      return this.currentActions.some(action => !_.isEmpty(action.downloads));
    },
    modelName() {
      return _.get(this.suggestionsModel, 'code', 'N/A');
    },
    engineName() {
      return _.get(this.mtEngine, 'mtProvider', NO_ENGINE);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onExpandCollapseClicked() {
      if (!this.isDisabled) {
        this.$emit('expand-collapse', this.pipeline);
      }
    },
    async onRunPipelines() {
      const requestId = _.get(this.request, '_id', '');
      const { workflowId } = this.$route.query;
      await this.runPipelines({
        scope: this.runScope,
        requestId,
        pipelineId: this.pipelineId,
        workflowId,
      });
      if (this.pipelineType === PL_TYPE_IMPORT) {
        this.setRepetitions([]);
      }
    },
    onStopPipeline() {
      const requestId = _.get(this.request, '_id', '');
      const { workflowId } = this.$route.query;
      this.stopPipelines({
        scope: this.runScope,
        requestId,
        pipelineId: this.pipelineId,
        workflowId,
      });
    },
  },
};
