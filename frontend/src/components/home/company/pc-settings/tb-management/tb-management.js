import _ from 'lodash';
import FileModal from './file-upload-modal.vue';
import ConfirmDialog from '../../../../form/confirm-dialog.vue';
import PcSettingsFilesMixin from '../../../../../mixins/pc-settings-resources-mixin';
import { errorNotification } from '../../../../../utils/notifications';

export default {
  mixins: [PcSettingsFilesMixin],
  components: { FileModal, ConfirmDialog },
  props: {
    companyId: String,
  },
  data() {
    return {
      isLoading: false,
      type: 'tb',
      confirmationMessage: '',
    };
  },
  methods: {
    showFileModal() {
      if (!this.isLoading) {
        this.$refs.fileModal.show();
      }
    },
    async onUpload({ file, srcLang, tgtLang, isReviewed }) {
      const formData = new FormData();
      formData.append('file', file);
      this.isLoading = true;
      try {
        await this._upload({ formData, srcLang, tgtLang, isReviewed });
      } catch (err) {
        const code = _.get(err, 'status.code', '');
        if (code === 409) {
          const resourceId = _.get(err, 'status.data.resourceId', '');
          this.confirmationMessage = 'Only one termbase file is allowed per language combination. Uploading a new one will replace the current one. Are you sure you want to proceed?';
          this.$refs.confirmDialog.show({ resourceId, formData, isReviewed, action: 'upload' });
        }
      }
      this.isLoading = false;
    },
    async onDialogConfirm({
      confirm, data: { resourceId, formData, isReviewed, action } = {},
    }) {
      if (confirm) {
        this.isLoading = true;
        if (action === 'upload') {
          try {
            await this.resourcesService.updatePcSettingsResource({
              type: this.type,
              formData,
              resourceId,
              isReviewed,
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
      this.confirmationMessage = 'You’re about to delete a termbase. Are you sure you want to proceed?';
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
  },
};
