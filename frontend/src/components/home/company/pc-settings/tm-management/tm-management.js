/* global FormData, window */
import _ from 'lodash';
import FileModal from './file-upload-modal.vue';
import ConfirmDialog from '../../../../form/confirm-dialog.vue';
import PcSettingsFilesMixin from '../../../../../mixins/pc-settings-resources-mixin';
import { errorNotification } from '../../../../../utils/notifications';
import UserRoleCheckMixin from '../../../../../mixins/user-role-check';

export default {
  mixins: [
    PcSettingsFilesMixin,
    UserRoleCheckMixin,
  ],
  components: { FileModal, ConfirmDialog },
  props: {
    companyId: String,
  },
  data() {
    return {
      isLoading: false,
      type: 'tm',
      confirmationMessage: '',
      isEditNameMode: {},
    };
  },
  created() {
    this.onWindowClickBound = this.onWindowClick.bind(this);
    window.addEventListener('click', this.onWindowClickBound);
  },
  destroyed() {
    window.removeEventListener('click', this.onWindowClickBound);
  },
  computed: {
    canEnterMemoryEditor() {
      return this.hasRole({ oneOf: ['CAT-RESOURCES_READ_ALL', 'CAT-RESOURCES_UPDATE_ALL'] });
    },
  },
  methods: {
    showFileModal() {
      if (!this.isLoading) {
        this.$refs.fileModal.show();
      }
    },
    async onUpload({ file, srcLang, tgtLang }) {
      const formData = new FormData();
      formData.append('file', file);
      this.isLoading = true;
      try {
        await this._upload({ formData, srcLang, tgtLang });
      } catch (err) {
        const code = _.get(err, 'status.code', '');
        if (code === 409) {
          const resourceId = _.get(err, 'status.data.resourceId', '');
          this.confirmationMessage = 'Only one translation memory is allowed per language combination. Uploading a new file will replace the current memory. Do you want to proceed?';
          this.$refs.confirmDialog.show({ resourceId, formData, action: 'upload' });
        }
      }
      this.isLoading = false;
    },
    async onDialogConfirm({ confirm, data: { resourceId, formData, action } = {} }) {
      if (confirm) {
        this.isLoading = true;
        if (action === 'upload') {
          try {
            await this.resourcesService.updatePcSettingsResource({
              type: this.type,
              formData,
              resourceId,
              companyId: this.companyId,
            });
          } catch (err) {
            const message = _.get(err, 'status.message', err);
            this.pushNotification(errorNotification(`${this.type.toUpperCase()} uploading failed: ${message}`));
          }
          await this._retrieve();
        } else if (action === 'delete') {
          await this._delete();
        }
        this.isLoading = false;
      }
    },
    async onDelete() {
      const resourceIds = _.keys(_.pickBy(this.checkedResources));
      if (this.isLoading || _.isEmpty(resourceIds)) {
        return;
      }
      this.confirmationMessage = 'You’re about to delete a translation memory. Are you sure you want to proceed? This can’t be undone.';
      this.$refs.confirmDialog.show({ action: 'delete' });
    },
    async onDownload() {
      if (this.isLoading) {
        return;
      }
      this.isLoading = true;
      await this._download();
      this.isLoading = false;
    },
    enterNameEditMode(resourceId) {
      if (!this.isUserIpAllowed) {
        return;
      }
      this.$set(this.isEditNameMode, resourceId, true);
      this.$nextTick(() => {
        const input = this.$refs.editNameInput[0];
        input.focus();
        input.select();
      });
    },
    async saveResourceName(resource) {
      this.isLoading = true;
      await this.resourcesService.updatePcSettingsResourceName({
        type: this.type,
        resourceId: resource._id,
        name: resource.name,
        companyId: this.companyId,
      });
      this.isLoading = false;
    },
    async onResourceNameKeypress(event, resource) {
      if (event.keyCode === 13 && !_.isEmpty(resource.name)) {
        this.isEditNameMode[resource._id] = false;
        this.saveResourceName(resource);
      }
    },
    onWindowClick(event) {
      if (event.target.name !== 'resourceName') {
        let resourceId;
        Object.keys(this.isEditNameMode).forEach((key) => {
          if (this.isEditNameMode[key]) {
            resourceId = key;
          }
          this.isEditNameMode[key] = false;
        });
        if (!_.isNil(resourceId)) {
          const resource = this.resources.find(r => r._id === resourceId);
          if (!_.isEmpty(resource.name)) {
            this.saveResourceName(resource);
          }
        }
      }
    },
    navigateToMemoryEditor(resource) {
      if (!this.isUserIpAllowed) {
        this.pushNotification(errorNotification('The IP address is not authorized to access files for this company.'));
        return;
      }
      const companyId = _.get(resource, 'companyId');
      const srcLang = _.get(resource, 'srcLang.isoCode');
      const tgtLang = _.get(resource, 'tgtLang.isoCode');
      this.$router.push({
        name: 'company-memory-editor',
        params: {
          entityId: companyId,
        },
        query: { srcLang, tgtLang },
      });
    },
    canSelect(resource) {
      return resource.tmInfo.numSegments !== 0 && this.isUserIpAllowed;
    },
  },
};
