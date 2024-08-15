import _ from 'lodash';
import { mapActions } from 'vuex';
import PortalCatStoreMixin from './mixins/pc-store-mixin';
import ActionsUiSet from './components/ui-sets/actions-set/actions-set.vue';
import ActionFilesModal from './modals/action-files-modal/action-files-modal.vue';
import ActionConfigModal from './modals/action-config-modal/action-config-modal.vue';
import { errorNotification, successNotification } from '../../../utils/notifications';
import ConfirmDialog from '../../form/confirm-dialog.vue';
import SegmentHistoryModal from './modals/segment-history-modal/segment-history-modal.vue';
import KeyboardShortcutsModal from './modals/keyboard-shortcuts-modal/keyboard-shortcuts-modal.vue';
import LockConfigModal from './modals/lock-config-modal/lock-config-modal.vue';

const PIPELINE_TYPE_MT = 'mt';

export default {
  mixins: [
    PortalCatStoreMixin,
  ],
  components: {
    ActionsUiSet,
    ActionFilesModal,
    ActionConfigModal,
    ConfirmDialog,
    SegmentHistoryModal,
    KeyboardShortcutsModal,
    LockConfigModal,
  },
  created() {
    this._initialize();
  },
  watch: {
    activeDocument(newActiveDocument) {
      if (!_.isNil(newActiveDocument)) {
        const { requestId } = this.$route.params;
        const { workflowId } = this.$route.query;
        this._initializePipelines();
        this.fetchRequestProgress(requestId);
        this.fetchSegmentsWithQaIssues({
          requestId,
          workflowId,
          fileId: newActiveDocument,
        });
      }
    },
    pipelinesErrors: {
      handler(errorsByType = {}) {
        Object.keys(errorsByType).forEach((type) => {
          if (!_.isNil(errorsByType[type]) && this.shouldDisplayPipelineError(type)) {
            this.pushNotification({
              title: `Error in ${type} pipeline`,
              details: errorsByType[type].message,
              state: 'danger',
            });
          }
        });
      },
      immediate: true,
    },
    confirmDialogOptions(options) {
      const payload = _.get(options, 'payload', {});
      const message = _.get(options, 'message', '');
      const title = _.get(options, 'title', '');
      if (
        !_.isNil(this.$refs.confirmDialog) &&
        (!_.isEmpty(message) || !_.isEmpty(title))
      ) {
        this.$refs.confirmDialog.show(payload);
      }
    },
  },
  computed: {
    confirmDialogHandler() {
      return _.get(this, 'confirmDialogOptions.handler', null);
    },
    confirmDialogMessage() {
      return _.get(this, 'confirmDialogOptions.message', '');
    },
    confirmDialogTitle() {
      return _.get(this, 'confirmDialogOptions.title', '');
    },
    confirmDialogCancelText() {
      return _.get(this, 'confirmDialogOptions.cancelText', '');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('app', ['savePortalCatDefaultConfig']),
    onRestoreLayout() {
      if (!_.isNil(this.$refs.mainContent)) {
        this.$refs.mainContent.restoreLayout();
      }
    },
    onSwitchLayout() {
      if (!_.isNil(this.$refs.mainContent)) {
        this.$refs.mainContent.switchLayout();
      }
    },
    async onSaveWorkbench(config) {
      try {
        await this.savePortalCatDefaultConfig({
          ...config,
          widgets: config.widgets.map(widget => _.omit(widget, ['component'])),
        },);
        this.pushNotification(successNotification('Workbench saved successfuly'));
      } catch (e) {
        this._handleError(e);
      }
    },
    async _initialize() {
      const { requestId } = this.$route.params;
      const { taskId, workflowId, ptId } = this.$route.query;
      try {
        if (_.isNil(taskId) || _.isNil(workflowId) || _.isNil(ptId)) {
          throw new Error('You must use PortalCAT only from a Portal task');
        }
        const params = { requestId, taskId, workflowId };
        await this.initPortalCat(params);
      } catch (e) {
        this._handleError(e);
      }
    },
    async _initializePipelines() {
      try {
        const { requestId } = this.$route.params;
        const { workflowId } = this.$route.query;
        const fileId = this.activeDocument;
        await this.fetchPipelines({ requestId, workflowId, fileId });
        await this._initializeSegments();
      } catch (e) {
        this._handleError(e);
      }
    },
    async _initializeSegments() {
      try {
        const { requestId } = this.$route.params;
        const { workflowId } = this.$route.query;
        const fileId = this.activeDocument;
        await this.fetchFileSegments({ requestId, workflowId, fileId });
      } catch (e) {
        this._handleError(e);
      }
    },
    _handleError(error = {}) {
      const message = _.get(error, 'status.message', _.get(error, 'message', error));
      this.pushNotification(errorNotification(message));
    },
    shouldDisplayPipelineError(type) {
      if (type === PIPELINE_TYPE_MT && !_.get(this, 'workflow.useMt')) {
        return false;
      }
      return true;
    },
    onDialogConfirm(event) {
      if (!_.isNil(this.confirmDialogHandler)) {
        this.confirmDialogHandler(event);
      }
    },
    onShortcutsClicked() {
      this.$refs.shortcutsModal.show();
    },
    onActionConfig(data) {
      this.$refs.actionConfigModal.openModal(data);
    },
    onLockSegments() {
      this.$refs.lockConfigModal.show();
    },
  },
};
