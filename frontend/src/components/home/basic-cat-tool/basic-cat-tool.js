import { mapActions, mapGetters } from 'vuex';
import SectionContainer from '../../section-container/section-container.vue';
import RequestService from '../../../services/request-service';
import MouseDownMoveUpFinish from '../../../utils/mouse-down-move-up-finish';
import BasicCatToolEditor from './basic-cat-tool-editor.vue';
import BasicCatToolFiles from './basic-cat-tool-files.vue';
import BasicCatToolPreview from './basic-cat-tool-preview.vue';
import BasicCatToolComponentSelector from './basic-cat-tool-component-selector.vue';
import BasicCATConfigService from '../../../services/basic-cat-config-service';
import { getRequestDocuments } from '../list-request/request-inline-edit-helper';

const requestService = new RequestService();
const basicCatConfigService = new BasicCATConfigService();
const configSaveFailureFactory = (self) => (err) => {
  const notification = {
    title: 'Error',
    message: 'could not save basic cat tool layout config',
    state: 'warning',
    response: err,
  };
  self.pushNotification(notification);
};

export default {
  components: {
    BasicCatToolComponentSelector,
    BasicCatToolEditor,
    BasicCatToolFiles,
    BasicCatToolPreview,
    SectionContainer,
  },
  props: {
    requestId: {
      type: String,
      required: true,
    },
    language: String,
    fileId: String,
    idleBeforeSave: {
      type: Number,
      default: 5000,
    },
  },
  data() {
    return {
      request: {
        _id: null,
        documents: [],
      },
      document: {
        _id: null,
        name: null,
      },
      wordCount: null,
      canSave: false,
      northResized: null,
      northHeightChanged: false,
      northComponent: 'preview',
      southComponent: 'editor',
      westComponent: 'files',
      northSize: null,
      sorthColumnResizeHandler: null,
      westResized: null,
      westWidthChanged: false,
      westSize: null,
      westColumnResizeHandler: null,
      knownComponents: ['preview', 'editor', 'files'],
    };
  },
  created() {
    this._loadRequest(this.requestId);
    this._loadConfig();
  },
  mounted() {
    const southResizerElement = this.$refs.southColumnResizer;
    this.southColumnResizeHandler = new MouseDownMoveUpFinish(southResizerElement, {
      onStart: this._onSouthResizeStart,
      onResize: this._onSouthResize,
      onFinish: this._onSouthResizeFinish,
      onClick: (event) => {
        event.stopPropagation();
        return false;
      },
    });
    const westResizerElement = this.$refs.westColumnResizer;
    this.westColumnResizeHandler = new MouseDownMoveUpFinish(westResizerElement, {
      onStart: this._onWestResizeStart,
      onResize: this._onWestResize,
      onFinish: this._onWestResizeFinish,
      onClick: (event) => {
        event.stopPropagation();
        return false;
      },
    });
  },
  beforeDestroy: function () {
    this.southColumnResizeHandler.destroy();
    this.westColumnResizeHandler.destroy();
  },
  watch: {
    fileId(newVal) {
      this._selectDocument(newVal);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onWestSelect(selectedComponent) {
      this.swapComponents(this.westComponent, selectedComponent);
      this.westComponent = selectedComponent;
      this.saveComponentSwap();
    },
    onNorthSelect(selectedComponent) {
      this.swapComponents(this.northComponent, selectedComponent);
      this.northComponent = selectedComponent;
    },
    onSouthSelect(selectedComponent) {
      this.swapComponents(this.southComponent, selectedComponent);
      this.southComponent = selectedComponent;
    },
    saveComponentSwap() {
      basicCatConfigService.save(this.userLogged._id, {
        northComponent: this.northComponent,
        southComponent: this.southComponent,
        westComponent: this.westComponent,
      })
        .catch(configSaveFailureFactory(this));
    },
    swapComponents(component, targetComponent) {
      if (this.westComponent === targetComponent) {
        this.westComponent = component;
      }
      if (this.northComponent === targetComponent) {
        this.northComponent = component;
      }
      if (this.southComponent === targetComponent) {
        this.southComponent = component;
      }
    },
    onEditorStatusChange(status) {
      switch (status) {
        case 'saving':
          this.canSave = false;
          break;
        default:
          this.canSave = true;
          break;
      }
    },
    onWordCountChange(wordCount) {
      this.wordCount = wordCount;
    },
    save() {
      if (this.$refs.editor) {
        const { editor } = this.$refs;
        editor.save();
      }
    },
    _loadRequest(requestId) {
      return requestService.get(requestId).then((response) => {
        this.request = response.data.request;
        if (this.fileId) {
          this._selectDocument(this.fileId);
        }
      })
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: `could not retrieve request ${requestId}`,
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        });
    },
    _selectDocument(fileId) {
      const requestDocuments = getRequestDocuments(this.request.languageCombinations);
      if (fileId && Array.isArray(requestDocuments)) {
        const doc = requestDocuments.find((d) => d._id === fileId);
        if (doc) {
          this.document = doc;
        }
      } else {
        this.document = null;
      }
    },
    _onSouthResizeStart() {
      if (!this.northHeightChanged) {
        this.northCurrentHeight = this.northHeight
          ? this.northHeight : this.$refs.north.offsetHeight;
      }
      this.northHeightChanged = true;
    },
    _onSouthResize(coordinates) {
      this.northResized = coordinates.y;
    },
    _onSouthResizeFinish(coordinates) {
      this._onSouthResize(coordinates);
      const newHeight = this.northCurrentHeight + this.northResized;
      this.northCurrentHeight = newHeight;
      this.northResized = 0;
      basicCatConfigService.save(this.userLogged._id, { northSize: newHeight })
        .catch(configSaveFailureFactory(this));
    },
    _onWestResizeStart() {
      if (!this.westWidthChanged) {
        this.westCurrentWidth = this.westWidth ? this.westWidth : this.$refs.west.offsetWidth;
      }
      this.westWidthChanged = true;
    },
    _onWestResize(coordinates) {
      this.westResized = coordinates.x;
    },
    _onWestResizeFinish(coordinates) {
      this._onWestResize(coordinates);
      const newWidth = this.westCurrentWidth + this.westResized;
      this.westCurrentWidth = newWidth;
      this.westResized = 0;
      basicCatConfigService.save(this.userLogged._id, { westSize: newWidth }).catch((err) => {
        const notification = {
          title: 'Error',
          message: 'could not save basic cat tool layout config',
          state: 'warning',
          response: err,
        };
        this.pushNotification(notification);
      });
    },
    _loadConfig() {
      basicCatConfigService.retrieve(this.userLogged._id).then((config) => {
        this.northSize = config.northSize;
        this.westSize = config.westSize;
        this.northComponent = config.northComponent;
        this.southComponent = config.southComponent;
        this.westComponent = config.westComponent;
      })
        .catch((err) => {
          if (err.status.code !== 404) {
            const notification = {
              title: 'Error',
              message: 'could not retrieve basic cat tool layout config',
              state: 'warning',
              response: err,
            };
            this.pushNotification(notification);
          }
        });
    },
  },
  computed: {
    ...mapGetters('app', [
      'userLogged',
    ]),
    isDocumentSelected() {
      return this.request && this.document.name;
    },
    northStyles: function () {
      if (this.northResized) {
        const newHeight = this.northCurrentHeight + this.northResized;
        return { height: `${newHeight}px` };
      }
      if (this.northHeightChanged) {
        return { height: `${this.northCurrentHeight}px` };
      }
      if (this.northSize) {
        return { height: `${this.northSize}px` };
      }
      return {};
    },
    westStyles: function () {
      if (this.westResized) {
        const newWidth = this.westCurrentWidth + this.westResized;
        return { width: `${newWidth}px` };
      }
      if (this.westWidthChanged) {
        return { width: `${this.westCurrentWidth}px` };
      }
      if (this.westSize) {
        return { width: `${this.westSize}px` };
      }
      return {};
    },
  },
};
