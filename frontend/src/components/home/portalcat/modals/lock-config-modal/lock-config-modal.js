import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import { hasRole } from '../../../../../utils/user';
import PcStoreMixin from '../../mixins/pc-store-mixin';
import PipelineStatusPollerMixin from '../../mixins/pipeline-status-poller-mixin';
import BreakdownService from '../../../../../services/breakdown-service';
import PortalCatService from '../../../../../services/portalcat-service';
import { errorNotification, warningNotification, successNotification } from '../../../../../utils/notifications';

const PORTALCAT_TYPE_LOCKING = 'locking';
const PL_STATUS_INPROGRESS = 'running';
const PL_LOCKING_ACTION_NAME = 'Locking';
const breakdownService = new BreakdownService();
const portalCatService = new PortalCatService();

export default {
  mixins: [PcStoreMixin, PipelineStatusPollerMixin],
  data() {
    return {
      companyDefault: {},
      lockConfig: {},
      breakdowns: [],
      manualLocking: false,
      appliedScope: 'file',
      isLoadingLocal: false,
    };
  },
  created() {
    this.retrieveBreakdowns();
  },
  watch: {
    'lockConfig.segmentsToLock'(segments) {
      if (segments.length < 1 && !this.manualLocking) {
        this.lockConfig.newConfirmedBy = '';
        this.appliedScope = '';
      }
    },
    'manualLocking'(value) {
      if (value) {
        this.appliedScope = 'file';
      }
    },
    lockingPipelineStatus: {
      handler(newValue, oldValue) {
        const pipelineId = _.get(this, 'lockingPipeline._id');
        this.onStatusChange(oldValue, this.isLockingInProgress, pipelineId);
      },
      immediate: true,
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),

    canUpdateLockConfig() {
      return hasRole(this.userLogged, 'REQUEST-LOCK-CONFIG_UPDATE_ALL');
    },
    canLockManual() {
      if (this.selectedSegments.length < 2) {
        return false;
      }
      return this.canUpdateLockConfig;
    },
    canUpdateStatus() {
      const segmentsToLock = _.get(this.lockConfig, 'segmentsToLock', []);
      if (segmentsToLock.length < 1) {
        return false;
      }
      return this.canUpdateLockConfig;
    },
    canUpdateScope() {
      if (this.manualLocking) {
        return false;
      }
      return this.canUpdateLockConfig;
    },
    canReset() {
      if (!this.hasConfigChanged(this.lockConfig, this.companyDefault)) {
        return false;
      }
      return this.canUpdateLockConfig;
    },
    canApply() {
      if (this.manualLocking) {
        return true;
      }
      if (_.get(this, 'lockConfig.segmentsToLock', []).length < 1) {
        return false;
      }
      return this.canUpdateLockConfig;
    },
    lockedSegmentsSelected() {
      const lockedSegments = _.get(this, 'lockConfig.segmentsToLock', []);
      return lockedSegments
        .map(({ _id, name }) => ({ value: _id, text: name }));
    },
    pipelineObjs() {
      return _.map(this.pipelines, pipelineId => this.pipelineById(pipelineId));
    },
    lockingPipeline() {
      return this.pipelineObjs.find(pipeline => pipeline.type === PORTALCAT_TYPE_LOCKING);
    },
    lockingPipelineStatus() {
      return _.get(this.lockingPipeline, 'status', '');
    },
    isLockingInProgress() {
      return this.lockingPipelineStatus === PL_STATUS_INPROGRESS;
    },
    lockingAction() {
      const actions = _.get(this.lockingPipeline, 'currentActions', []);
      return actions.find(action => action.name === PL_LOCKING_ACTION_NAME);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification', 'deleteNotification']),

    async retrieveBreakdowns() {
      const response = await breakdownService.retrieve();
      const breakdowns = _.get(response, 'data.list', [])
        .map(({ _id, name }) => ({ value: _id, text: name }));
      this.breakdowns = breakdowns;
    },
    onLockedSegmentsSelect(selectedValues) {
      const newValues = selectedValues
        .map(({ value, text }) => ({ _id: value, name: text, id: value }));
      this.lockConfig.segmentsToLock = newValues;
    },
    hasConfigChanged(currentConfig, originConfig) {
      return Object.keys(currentConfig).some((key) => {
        const newValue = _.get(currentConfig, `${key}`);
        const oldValue = _.get(originConfig, `${key}`);
        const newFieldType = typeof newValue;
        if (Array.isArray(newValue)) {
          if (newValue.length !== oldValue.length) {
            return true;
          }
          return _.differenceWith(newValue, oldValue, _.isEqual).length > 0;
        }
        if ((newFieldType === 'string') || (newFieldType === 'undefined')) {
          return newValue !== oldValue;
        }
        return false;
      });
    },
    init() {
      this.lockConfig = { ..._.get(this.request, 'company.pcSettings.lockedSegments', {}) };
      this.companyDefault = { ..._.get(this.request, 'company.pcSettings.lockedSegments', {}) };
      this.manualLocking = false;
      this.appliedScope = 'file';
      this.lockRunningNotification = warningNotification('Applying locking configuration.', null, null, 'Warning');
    },
    hide() {
      this.$refs.bModal.hide();
    },
    show() {
      this.init();
      this.$refs.bModal.show();
    },
    reset() {
      this.lockConfig = {
        ..._.get(this.request, 'company.pcSettings.lockedSegments', {}),
      };
      this.manualLocking = false;
      this.appliedScope = 'file';
    },
    async apply() {
      this.isLoadingLocal = true;
      if (_.isNil(this.lockingAction)) {
        return;
      }
      const requestId = _.get(this, 'request._id', '');
      const actionConfig = _.get(this.lockingAction, 'config', {});
      actionConfig.import = false;
      if (!_.isEmpty(_.get(this.lockConfig, 'segmentsToLock'))) {
        actionConfig.segmentsToLock = _.get(this.lockConfig, 'segmentsToLock').map(segment => segment._id);
      }
      if (_.get(this.lockConfig, 'newConfirmedBy')) {
        actionConfig.newConfirmedBy = _.get(this.lockConfig, 'newConfirmedBy');
      }
      if (this.manualLocking) {
        actionConfig.selectedSegments = this.selectedSegments;
      }

      try {
        this.pushNotification(this.lockRunningNotification);
        await portalCatService.updatePipelineActionConfig({
          requestId,
          pipelineId: this.lockingPipeline._id,
          actionId: this.lockingAction._id,
          config: JSON.stringify(actionConfig),
        });
        await this.runPipelines({
          scope: this.appliedScope,
          requestId,
          pipelineId: this.lockingPipeline._id,
          workflowId: this.$route.query.workflowId,
        });
        this.deleteNotification(this.lockRunningNotification);
        this.pushNotification(successNotification('Locking configuration applied successfully.', 3000));
      } catch (err) {
        this.deleteNotification(this.lockRunningNotification);
        this._handleError('Failed to apply locking configuration.', err);
      } finally {
        this.isLoadingLocal = false;
        this.hide();
      }
    },
    _handleError(message, error = {}) {
      this.pushNotification(errorNotification(message, undefined, error));
    },
  },
};
