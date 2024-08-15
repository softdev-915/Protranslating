import _ from 'lodash';
import { mapActions } from 'vuex';
import PortalCatService from '../../../../services/portalcat-service';
import { errorNotification } from '../../../../utils/notifications';

const pcService = new PortalCatService();

export default {
  data() {
    return {
      isDownloading: false,
    };
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    getActionFileUrl(file) {
      const { pipelineId } = this;
      const { actionId } = this;
      const fileId = _.get(file, 'fileId', '');
      return pcService.getActionFileUrl({ pipelineId, actionId, fileId });
    },
    downloadFile(fileId) {
      let iframe = this.$refs[`fileIframe-${fileId}`];

      if (Array.isArray(iframe)) {
        // eslint-disable-next-line prefer-destructuring
        iframe = iframe[0];
      }
      iframe.download();
    },
    async downloadAllFiles() {
      this.isDownloading = true;
      try {
        const { data, filename } = await pcService.getActionsFilesZip(this.pipelineId);
        const downloadUrl = URL.createObjectURL(data);
        this.$refs.downloadLink.href = downloadUrl;
        this.$refs.downloadLink.download = filename;
        this.$refs.downloadLink.click();
        this.$refs.downloadLink.href = '#';
        URL.revokeObjectURL(downloadUrl);
      } catch (err) {
        this.pushNotification(errorNotification(err.message));
      }
      this.isDownloading = false;
    },
  },
};
