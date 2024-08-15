import _ from 'lodash';
import { mapGetters } from 'vuex';
import ActionPipelinesWidget from '../../../widgets/action-pipelines/action-pipelines.vue';
import FilesWidget from '../../../widgets/files/files.vue';
import EditorWidget from '../../../widgets/editor/editor.vue';
import PreviewWidget from '../../../widgets/preview/preview.vue';
import ResourcesWidget from '../../../widgets/resources/resources.vue';
import ProgressBar from '../../progress-bar/progress-bar.vue';
import Dockbar from '../../dockbar/dockbar.vue';
import MainContent from '../../main-content/main-content.vue';
import PcStoreMixin from '../../../mixins/pc-store-mixin';
import UiSetMixin from '../../../mixins/ui-set-mixin';

const buildInitialData = () => ({
  setName: 'actions',
  defaultConfig: {
    leftWidth: '25%',
    widgets: [
      {
        name: 'resources',
        config: {
          height: '33%',
          minimized: false,
          index: 0,
          position: 'left-side',
        },
      },
      {
        name: 'action-pipelines',
        config: {
          height: '33%',
          minimized: false,
          index: 1,
          position: 'left-side',
        },
      },
      {
        name: 'files',
        config: {
          height: '33%',
          minimized: false,
          index: 2,
          position: 'left-side',
        },
      },
      {
        name: 'editor',
        config: {
          height: '50%',
          minimized: false,
          layout: 'columns',
          index: 0,
          position: 'main',
        },
      },
      {
        name: 'preview',
        config: {
          height: '50%',
          minimized: false,
          index: 1,
          position: 'main',
        },
      },
    ],
  },
  setConfig: {
    leftWidth: 'auto',
    widgets: [
      {
        name: 'resources',
        title: 'Resources',
        component: ResourcesWidget,
        iconClass: 'fas fa-database',
      },
      {
        name: 'action-pipelines',
        title: 'Action Pipelines',
        component: ActionPipelinesWidget,
        iconClass: 'fas fa-cogs',
      },
      {
        name: 'files',
        title: 'Files',
        component: FilesWidget,
        iconClass: 'fas fa-server',
      },
      {
        name: 'editor',
        title: 'Editor',
        component: EditorWidget,
        iconClass: 'fas fa-newspaper-o',
      },
      {
        name: 'preview',
        title: 'Preview',
        component: PreviewWidget,
        iconClass: 'fas fa-eye',
      },
    ],
  },
});

export default {
  mixins: [PcStoreMixin, UiSetMixin],
  components: {
    Dockbar,
    ProgressBar,
    MainContent,
  },
  data() {
    return buildInitialData();
  },
  created() {
    this.saveConfigDebounced = _.debounce(this.saveConfig, 1000);
  },
  watch: {
    taskConfig(taskConfig) {
      const config = this.resolveConfig();
      this.applySetConfig(this.prepareConfig(config));
      if (_.isNil(taskConfig)) {
        this.setTaskConfig(config);
      }
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
  },
  methods: {
    restoreLayout() {
      this.onConfigChange(this.defaultConfig);
    },
    onSwitchLayout() {
      const newConfig = _.clone(this.setConfig);
      const editorWidget = _.get(newConfig, 'widgets', []).find(widget => widget.name === 'editor');
      const currentLayout = _.get(editorWidget, 'config.layout', 'columns');
      if (!_.isNil(editorWidget)) {
        editorWidget.config = { ...editorWidget.config, layout: currentLayout === 'columns' ? 'rows' : 'columns' };
      }
      this.onConfigChange(newConfig);
    },
    onConfigChange(newConfig) {
      this.setTaskConfig(newConfig);
      this.saveConfigDebounced();
    },
    onSaveWorkbench() {
      this.$emit('save-workbench', this.taskConfig);
    },
    saveConfig() {
      this.saveTaskConfig();
    },
    resolveConfig() {
      const userDefaultConfig = _.get(this, 'userLogged.portalCatDefaultConfig');
      return _.defaultTo(this.taskConfig, _.defaultTo(userDefaultConfig, this.defaultConfig));
    },
    prepareConfig(config) {
      const widgetConfigs = _.get(config, 'widgets', []);
      if (widgetConfigs.length !== _.get(this, 'setConfig.widgets.length', 0)) {
        return this.defaultConfig;
      }
      return config;
    },
  },
};
