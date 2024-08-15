import _ from 'lodash';
import { mapActions } from 'vuex';

export default {
  props: {
    value: {
      type: Array,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    service: {
      type: Object,
      required: true,
    },
    canUpdate: {
      type: Boolean,
      default: true,
    },
    canDownload: {
      type: Boolean,
      default: true,
    },
  },
  data: () => ({
    isLoading: false,
    downloadingDocId: null,
  }),
  computed: {
    areAttachmentsEmpty() {
      return _.isEmpty(this.value);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    show() {
      this.$refs.modal.show();
    },
    hide() {
      this.$refs.modal.hide();
    },
    showFilePicker() {
      this.$refs.fileInput.click();
    },
    isDocumentDownloading(id) {
      return this.downloadingDocId === id;
    },
    async attach(event) {
      const file = _.first(_.get(event, 'target.files', []));
      if (_.isNil(file)) {
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      this.$refs.fileInputForm.reset();
      this.isLoading = true;
      this.service.uploadAttachment({ entityId: this.entityId }, formData)
        .then(this._handleSuccess)
        .catch((err) => this._handleError(err, _.get(err, 'status.message', 'Failed to upload attachment')))
        .finally(() => (this.isLoading = false));
    },
    async detach(attachmentId) {
      this.isLoading = true;
      this.service.detach({ entityId: this.entityId, attachmentId })
        .then(() => this._handleDetach(attachmentId))
        .catch((err) => this._handleError(err, 'Failed to remove attachment'))
        .finally(() => (this.isLoading = false));
    },
    async downloadAttachment(attachmentId) {
      const { entityId } = this;
      this.downloadingDocId = attachmentId;
      this.service.downloadAttachment({ entityId, attachmentId })
        .then(({ data, filename }) => {
          const downloadUrl = URL.createObjectURL(data);
          this.$refs.downloadLink.href = downloadUrl;
          this.$refs.downloadLink.download = filename;
          this.$refs.downloadLink.click();
          this.$refs.downloadLink.href = '#';
          URL.revokeObjectURL(downloadUrl);
        })
        .catch((err) => this._handleError(err, 'Failed to download attachment'))
        .finally(() => (this.downloadingDocId = null));
    },
    _handleSuccess(res) {
      const attachments = _.get(res, 'data.attachments');
      this.$emit('input', attachments);
    },
    _handleDetach(_id) {
      this.$emit('input', this.value.filter((a) => a._id !== _id));
    },
    _handleError(err, message = 'Internal server error') {
      this.pushNotification({
        title: 'Error',
        message,
        state: 'danger',
        response: err,
      });
    },
  },
};

