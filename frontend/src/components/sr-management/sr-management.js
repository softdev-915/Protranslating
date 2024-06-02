/* global FormData */
import _ from 'lodash';
import SrxFileModal from './srx-file-upload-modal.vue';
import ConfirmDialog from '../form/confirm-dialog.vue';
import PcSettingsFilesMixin from '../../mixins/pc-settings-resources-mixin';
import { errorNotification } from '../../utils/notifications';

export default {
  mixins: [PcSettingsFilesMixin],
  components: { SrxFileModal, ConfirmDialog },
  props: {
    companyId: String,
  },
  data() {
    return {
      isLoading: false,
      type: 'sr',
    };
  },
  methods: {
    showSrxFileModal() {
      if (!this.isLoading) {
        this.$refs.srxFileModal.show();
      }
    },
    async onUpload({ file, language }) {
      const formData = new FormData();
      formData.append('file', file);
      this.isLoading = true;
      try {
        await this._upload({ formData, language });
      } catch (err) {
        const code = _.get(err, 'status.code');
        if (code === 409) {
          const resourceId = _.get(err, 'status.data.resourceId', '');
          this.$refs.confirmDialog.show({ resourceId, formData });
        }
      }
      this.isLoading = false;
    },
    async onDialogConfirm({ confirm, data: { resourceId, formData } = {} }) {
      if (confirm) {
        this.isLoading = true;
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
        this.isLoading = false;
      }
    },
    async onDelete() {
      if (this.isLoading) {
        return;
      }
      this.isLoading = true;
      await this._delete();
      this.isLoading = false;
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
