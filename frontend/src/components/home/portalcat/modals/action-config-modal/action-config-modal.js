import { mapGetters, mapActions } from 'vuex';
import _ from 'lodash';
import PCStoreMixin from '../../mixins/pc-store-mixin';
import RoleCheckMixin from '../../../../../mixins/user-role-check';
import PortalCatService from '../../../../../services/portalcat-service';
import PipelineActionConfigService from '../../../../../services/pipeline-action-config-template-service';
import { errorNotification, successNotification } from '../../../../../utils/notifications';
import ActionConfigTemplateConfirmModal from './action-config-template-confirm-modal.vue';
import BrowserStorage from '../../../../../utils/browser-storage';

const MODAL_ID = 'pc-action-config-modal';
const portalCatService = new PortalCatService();
const pipelineActionConfigService = new PipelineActionConfigService();

export default {
  mixins: [
    PCStoreMixin,
    RoleCheckMixin,
  ],
  components: {
    ActionConfigTemplateConfirmModal,
  },
  data() {
    return {
      action: null,
      pipeline: null,
      modalId: MODAL_ID,
      isLoadingConfig: false,
      isApplyingConfig: false,
      isSavingConfig: false,
      configYaml: null,
      selectedTemplate: { text: '', _id: '' },
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    ...mapGetters('features', ['mock']),
    actionName() {
      return _.get(this, 'action.name', '');
    },
    actionId() {
      return _.get(this, 'action._id', '');
    },
    pipelineId() {
      return _.get(this, 'pipeline._id', '');
    },
    requestId() {
      return _.get(this, 'request._id', '');
    },
    isHideButtonVisible() {
      return !_.isEmpty(_.get(this.selectedTemplate, '_id'));
    },
    canHideTemplate() {
      return this.hasRole('ACTION-CONFIG_UPDATE_ALL') && !this.isLoading;
    },
    isLoading() {
      return this.isLoadingConfig || this.isApplyingConfig || this.isSavingConfig;
    },
    isTestEnvironment() {
      const BE_NODE_ENV = new BrowserStorage('lms-flags-storage').findInCache('BE_NODE_ENV');
      return BE_NODE_ENV !== 'PROD' && this.mock;
    },
    companyId() {
      return _.get(this, 'request.company._id');
    },
    templateConfigYaml() {
      return _.get(this, 'selectedTemplate.configYaml', '');
    },
    hasConfigChanged() {
      return this.configYaml !== this.templateConfigYaml;
    },
    canSave() {
      return this.hasRole('ACTION-CONFIG_CREATE_ALL') && this.hasConfigChanged && !this.isLoading;
    },
    canApply() {
      return this.hasRole('ACTION-CONFIG_UPDATE_ALL') && !this.isLoading;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    resetData() {
      this.action = null;
      this.pipeline = null;
      this.configYaml = null;
      this.selectedTemplate = { text: '', _id: '' };
    },
    closeModal(modalId) {
      if (modalId === MODAL_ID) {
        this.$refs.bModal.hide();
        this.resetData();
      }
    },
    openModal({ action, pipeline }) {
      this.$refs.bModal.show();
      this.action = action;
      this.pipeline = pipeline;
      this.fetchConfig();
    },
    async fetchConfig() {
      this.isLoadingConfig = true;
      try {
        const response = await portalCatService.getPipelineActionConfig({
          requestId: this.requestId,
          pipelineId: this.pipelineId,
          actionId: this.actionId,
        });
        this.configYaml = _.get(response, 'data.actionConfigYaml');
      } catch (err) {
        this._handleError('Error fetching config', err);
      } finally {
        this.isLoadingConfig = false;
      }
    },
    async onApply() {
      this.isApplyingConfig = true;
      try {
        await portalCatService.updatePipelineActionConfig({
          requestId: this.requestId,
          pipelineId: this.pipelineId,
          actionId: this.actionId,
          config: this.configYaml,
        });
        this.pushNotification(successNotification('Config applied successfully'));
      } catch (err) {
        this._handleError('Error applying config', err);
      } finally {
        this.isApplyingConfig = false;
      }
    },
    async retrieveTemplates(term) {
      const response = await pipelineActionConfigService.retrieve({
        companyId: this.companyId,
        term,
        action: this.actionName,
      });
      const templates = _.get(response, 'data.list', []);
      return templates.map(template => ({
        ...template,
        text: template.name,
      }));
    },
    onSaveClick() {
      const template = !_.isEmpty(this.selectedTemplate._id)
        ? {
          ...this.selectedTemplate,
          configYaml: this.configYaml,
        }
        : {
          configYaml: this.configYaml,
          actionName: this.actionName,
        };
      this.$refs.confirmTemplateCreationModal.show(template);
    },
    async onTemplateSaveClick(template) {
      try {
        const { data: existingTemplate } = await pipelineActionConfigService.getTemplateByName({
          companyId: this.companyId,
          name: template.name,
          action: this.actionName,
        });
        this.$refs.confirmTemplateOverwritingModal.show({
          ...template,
          _id: existingTemplate._id,
        });
      } catch (err) {
        const statusCode = _.get(err, 'status.code');
        if (statusCode === 404) {
          return this.onNewTemplateSave(template);
        }
        this._handleError('Error saving template.', err);
      }
    },
    async onTemplateOverwrite(template) {
      this.isSavingConfig = true;
      try {
        const response =
                await pipelineActionConfigService.update(this.companyId, template._id, template);
        const updatedTemplate = _.get(response, 'data');
        if (_.get(this.selectedTemplate, '_id') === _.get(updatedTemplate, '_id')) {
          this.selectedTemplate = {
            ...this.selectedTemplate,
            ...updatedTemplate,
          };
          this.selectedTemplate.text = this.selectedTemplate.name;
        }
        this.pushNotification(successNotification('Template overwritten successfully.'));
      } catch (err) {
        this._handleError('Error saving config template.', err);
      } finally {
        this.isSavingConfig = false;
      }
    },
    async onNewTemplateSave(template) {
      this.isSavingConfig = true;
      try {
        const response =
                await pipelineActionConfigService.create(this.companyId, template);
        this.selectedTemplate = {
          ...this.selectedTemplate,
          ..._.get(response, 'data'),
        };
        this.selectedTemplate.text = this.selectedTemplate.name;
        this.pushNotification(successNotification('Config template was saved successfully'));
      } catch (err) {
        this._handleError('Error saving config template.', err);
      } finally {
        this.isSavingConfig = false;
      }
    },
    onTemplateSelect(template) {
      this.selectedTemplate = template;
      if (_.isEmpty(template)) {
        return this.fetchConfig();
      }
      this.configYaml = template.configYaml;
    },
    onHideClick() {
      this.$refs.confirmTemplateHidingModal.show(this.selectedTemplate);
    },
    async onDeleteClick() {
      this.isSavingConfig = true;
      try {
        await pipelineActionConfigService.deleteAll(this.companyId);
        this.selectedTemplate = { text: '', _id: '' };
        this.$refs.templateSelect.resetData();
        this.pushNotification(successNotification('All templates have been deleted successfully'));
      } catch (err) {
        this._handleError('Error deleting templates', err);
      } finally {
        this.isSavingConfig = false;
      }
    },
    async onTemplateHide() {
      this.isSavingConfig = true;
      try {
        await pipelineActionConfigService.hide(this.companyId, this.selectedTemplate._id);
        this.selectedTemplate = { text: '' };
        this.pushNotification(successNotification('Template hidden successfully'));
      } catch (err) {
        this._handleError('Error hiding template', err);
      } finally {
        this.isSavingConfig = false;
      }
    },
    _handleError(message, error = {}) {
      this.pushNotification(errorNotification(message, undefined, error));
    },
  },
};
