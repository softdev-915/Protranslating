
import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../../../utils/user';
import PcStoreMixin from '../../mixins/pc-store-mixin';
import MenubarMixin from '../../mixins/editor-menubar-mixin';
import PipelineStatusPollerMixin from '../../mixins/pipeline-status-poller-mixin';
import BrowserStorage from '../../../../../utils/browser-storage';
import PortalCatService from '../../../../../services/portalcat-service';

const BE_NODE_ENV = new BrowserStorage('lms-flags-storage').findInCache('BE_NODE_ENV');
const PORTALCAT_TYPE_QA = 'qa';
const PORTALCAT_RUN_PIPELINE_SCOPE_FILE = 'file';
const PL_STATUS_INPROGRESS = 'running';
const portalCatService = new PortalCatService();

export default {
  mixins: [PcStoreMixin, MenubarMixin, PipelineStatusPollerMixin],
  data() {
    return {
      isConfirmAllDropdownVisible: false,
      isLoadingLocal: false,
    };
  },
  props: {
    additionalFilters: {
      type: Object,
      default: () => ({}),
    },
  },
  watch: {
    qaPipelineStatus: {
      handler(newValue, oldValue) {
        const pipelineId = _.get(this, 'qaPipeline._id');
        this.onStatusChange(oldValue, this.isQaInProgress, pipelineId);
      },
      immediate: true,
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),

    hasQaIssues() {
      return this.segmentsWithQaIssues.size > 0;
    },
    pipelineObjs() {
      return _.map(this.pipelines, pipelineId => this.pipelineById(pipelineId));
    },
    qaPipeline() {
      return this.pipelineObjs.find(pipeline => pipeline.type === PORTALCAT_TYPE_QA);
    },
    qaPipelineStatus() {
      return _.get(this.qaPipeline, 'status', '');
    },
    isQaInProgress() {
      return this.qaPipelineStatus === PL_STATUS_INPROGRESS;
    },
    isProdEnv() {
      return BE_NODE_ENV === 'PROD';
    },
    canReadLockConfig() {
      return ['REQUEST-LOCK-CONFIG_READ_ALL', 'REQUEST-LOCK-CONFIG_UPDATE_ALL']
        .some(role => hasRole(this.userLogged, role));
    },
    canUpdateLockConfig() {
      return hasRole(this.userLogged, 'REQUEST-LOCK-CONFIG_UPDATE_ALL');
    },
  },
  methods: {
    isCommonFilterOn(name, values) {
      return this.isFilterOn(name, values, this.additionalFilters);
    },
    toggleCommonFilter(name, values) {
      return this.toggleFilter(name, values, this.additionalFilters, this.emitAdditionalFilters);
    },
    emitAdditionalFilters({ filters } = {}) {
      this.$emit('additional-filters-change', filters);
    },
    runQa() {
      if (_.isNil(this.qaPipeline)) {
        return;
      }
      this.runPipelines({
        scope: PORTALCAT_RUN_PIPELINE_SCOPE_FILE,
        requestId: _.get(this.request, '_id', ''),
        pipelineId: this.qaPipeline._id,
        workflowId: this.$route.query.workflowId,
      });
    },
    toggleConfirmAllDropdown() {
      this.isConfirmAllDropdownVisible = !this.isConfirmAllDropdownVisible;
    },
    async confirmSegments(status) {
      this.isConfirmAllDropdownVisible = false;
      this.isLoadingLocal = true;
      const { requestId } = this.$route.params;
      const { workflowId } = this.$route.query;
      const fileId = this.activeDocument;
      await portalCatService.confirmAllSegments(requestId, { workflowId, fileId, status });
      await this.fetchFileSegments({ requestId, workflowId, fileId });
      this.isLoadingLocal = false;
    },
    async ignoreAllIssues() {
      this.isLoadingLocal = true;
      const { requestId } = this.$route.params;
      const { workflowId } = this.$route.query;
      const fileId = this.activeDocument;
      await portalCatService.ignoreAllIssues(requestId, { workflowId, fileId });
      await this.fetchFileSegments({ requestId, workflowId, fileId });
      this.isLoadingLocal = false;
    },
  },
};
