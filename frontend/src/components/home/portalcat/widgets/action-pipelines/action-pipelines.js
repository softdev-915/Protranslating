import _ from 'lodash';
import Widget from '../widget.vue';
import Pipeline from '../../components/pipeline/pipeline.vue';
import PortalCatStoreMixin from '../../mixins/pc-store-mixin';
import WidgetMixin from '../widget-mixin';
import UserRoleCheckMixin from '../../../../../mixins/user-role-check';

const PORTALCAT_TYPE_IMPORT = 'import';
const PORTALCAT_TYPE_MT = 'mt';
const PORTALCAT_TYPE_EXPORT = 'export';
const PIPELINE_STATUS_SUCCESS = 'succeeded';

export default {
  mixins: [
    PortalCatStoreMixin,
    WidgetMixin,
    UserRoleCheckMixin,
  ],
  components: {
    Widget,
    Pipeline,
  },
  data() {
    return {
      expandedPipeline: '',
    };
  },
  watch: {
    pipelines() {
      if (_.isEmpty(this.expandedPipeline)) {
        this.expandedPipeline = _.get(this, 'importPipeline._id', '');
      }
    },
    activeDocument() {
      this.expandedPipeline = '';
    },
  },
  computed: {
    pipelineObjs() {
      return _.map(this.pipelines, pipelineId => this.pipelineById(pipelineId));
    },
    importPipeline() {
      return this.pipelineObjs.find(pipeline => pipeline.type === PORTALCAT_TYPE_IMPORT);
    },
    mtPipeline() {
      return this.pipelineObjs.find(pipeline => pipeline.type === PORTALCAT_TYPE_MT);
    },
    exportPipeline() {
      return this.pipelineObjs.find(pipeline => pipeline.type === PORTALCAT_TYPE_EXPORT);
    },
    canRunMtPipeline() {
      const importPipelineStatus = _.get(this, 'importPipeline.status', '');
      return importPipelineStatus === PIPELINE_STATUS_SUCCESS;
    },
    canReadPipelines() {
      return this.hasRole('PIPELINE_READ_ALL');
    },
    isReflowTask() {
      return _.get(this, 'task.ability') === 'Reflow';
    },
  },
  methods: {
    onPipelineExpandCollapse(pipeline = {}) {
      if (this.expandedPipeline === pipeline._id) {
        this.expandedPipeline = '';
      } else {
        this.expandedPipeline = pipeline._id;
      }
    },
  },
};
