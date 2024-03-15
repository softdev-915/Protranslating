import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import MainContent from '../components/main-content/main-content.vue';
import Dockbar from './components/dockbar/dockbar.vue';
import ContextWidget from './widgets/segment-context/segment-context.vue';
import EditorWidget from './widgets/editor/editor.vue';
import SegmentDetailsWidget from './widgets/segment-details/segment-details.vue';
import SegmentHistoryWidget from './widgets/segment-history/segment-history.vue';
import UiSetMixin from '../mixins/ui-set-mixin';
import ProgressBar from './components/progress-bar/progress-bar.vue';
import TmStoreMixin from '../mixins/tm-store-mixin';
import { errorNotification } from '../../../../utils/notifications';

const buildInitialData = () => ({
  defaultConfig: {
    leftWidth: '25%',
    widgets: [
      {
        name: 'segment-details',
        config: {
          height: '33%',
          minimized: false,
          index: 0,
          position: 'left-side',
        },
      },
      {
        name: 'segment-history',
        config: {
          height: '33%',
          minimized: false,
          index: 1,
          position: 'left-side',
        },
      },
      {
        name: 'context',
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
          height: '100%',
          minimized: false,
          layout: 'columns',
          index: 0,
          position: 'main',
        },
      },
    ],
  },
  setConfig: {
    leftWidth: 'auto',
    widgets: [
      {
        name: 'segment-details',
        title: 'Segment details',
        component: SegmentDetailsWidget,
      },
      {
        name: 'segment-history',
        title: 'Segment history',
        component: SegmentHistoryWidget,
      },
      {
        name: 'context',
        title: 'Context',
        component: ContextWidget,
      },
      {
        name: 'editor',
        component: EditorWidget,
      },
    ],
  },
});

export default {
  mixins: [
    UiSetMixin,
    TmStoreMixin,
  ],
  components: {
    Dockbar,
    MainContent,
    ProgressBar,
  },
  data() {
    return buildInitialData();
  },
  created() {
    this._initialize();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    companyId() {
      const { entityId } = this.$route.params;
      return _.defaultTo(entityId, '');
    },
    srcLang() {
      const { srcLang } = this.$route.query;
      return _.defaultTo(srcLang, '');
    },
    tgtLang() {
      const { tgtLang } = this.$route.query;
      return _.defaultTo(tgtLang, '');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    restoreLayout() {
      this.applySetConfig(this.defaultConfig);
    },
    resolveConfig() {
      return this.defaultConfig;
    },
    prepareConfig(config) {
      return config;
    },
    switchLayout() {
      const newConfig = _.clone(this.setConfig);
      const editorWidget = _.get(newConfig, 'widgets', []).find(widget => widget.name === 'editor');
      const currentLayout = _.get(editorWidget, 'config.layout', 'columns');
      if (!_.isNil(editorWidget)) {
        const newLayout = currentLayout === 'columns' ? 'rows' : 'columns';
        editorWidget.config = Object.assign({}, editorWidget.config, { layout: newLayout });
      }
      this.applySetConfig(newConfig);
    },
    async _initialize() {
      try {
        await this.initMemoryEditor({
          companyId: this.companyId,
          srcLang: this.srcLang,
          tgtLang: this.tgtLang,
        });
      } catch (err) {
        this._handleError(err);
      }
    },
    _handleError(error = {}) {
      const message = _.get(error, 'status.message', _.get(error, 'message', error));
      this.pushNotification(errorNotification(message));
    },
  },
};
