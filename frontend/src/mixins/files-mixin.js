import _ from 'lodash';
import moment from 'moment';
import { mapActions } from 'vuex';
import { iframeDownloadError } from '../utils/notifications';
import IframeDownload from '../components/iframe-download/iframe-download.vue';

export default {
  props: {
    useIframeDownload: {
      type: Boolean,
      default: true,
    },
    visibleColumns: {
      type: Array,
      default: () => [],
    },
    canEdit: {
      type: Boolean,
    },
    canDelete: {
      type: Boolean,
    },
  },
  components: {
    IframeDownload,
  },
  data() {
    return {
      documentsBeingDownloaded: [],
      loading: false,
    };
  },
  computed: {
    activeColumns() {
      if (this.visibleColumns) {
        return this.visibleColumns.map((val) => ({ name: val, visible: true }));
      }
      return this.service.defaultFileColumns.filter((c) => c.visible);
    },
    referenceVisible() {
      return this.activeColumns.find((c) => (c.name === 'Reference')) !== undefined;
    },
    filenameVisible() {
      return this.activeColumns.find((c) => (c.name === 'Filename')) !== undefined;
    },
    createdAtVisible() {
      return this.activeColumns.find((c) => (c.name === 'Created At')) !== undefined;
    },
    createdByVisible() {
      return this.activeColumns.find((c) => (c.name === 'Created By')) !== undefined;
    },
    uploadedByVisible() {
      return this.activeColumns.find((c) => (c.name === 'Uploaded By')) !== undefined;
    },
    deletedAtVisible() {
      return this.activeColumns.find((c) => (c.name === 'Deleted At')) !== undefined;
    },
    deletedByVisible() {
      return this.activeColumns.find((c) => (c.name === 'Deleted By')) !== undefined;
    },
    retentionTimeVisible() {
      return this.activeColumns.find((c) => (c.name === 'Retention Time')) !== undefined;
    },
    sizeVisible() {
      return this.activeColumns.find((c) => (c.name === 'Size')) !== undefined;
    },
    downloadVisible() {
      return this.activeColumns.find((c) => (c.name === 'Download')) !== undefined;
    },
    removeVisible() {
      if (_.isBoolean(this.canDelete) && !this.canDelete) {
        return false;
      }
      return this.canEdit && !_.isNil(this.activeColumns.find((c) => c.name === 'Remove'));
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    retentionTotalTime(doc) {
      if (!doc.deletedByRetentionPolicyAt) {
        return '';
      }

      if (!doc.createdAt) {
        // NOTE: should you return the retention time default
        return '';
      }
      const created = moment(doc.createdAt);
      const removed = moment(doc.deletedByRetentionPolicyAt);
      // duration
      const dur = moment.duration(removed.diff(created));
      let min = dur.minutes();

      if (dur.seconds() > 0) {
        min += 1;
      }
      return `${dur.days()} Days, ${dur.hours()} Hours, ${min} Minutes`;
    },
    deleteDocument(document) {
      if (!_.isEmpty(this.entityId)) {
        this.$emit('document-delete', document);
      }
    },
    onIframeDownloadError(err) {
      const notification = iframeDownloadError(err);
      this.pushNotification(notification);
    },
    getDocumentUrl(document) {
      if (document.url) {
        return document.url;
      }
      return this.urlResolver(this.entityId, document._id, document.name);
    },
    markReference(event, index) {
      if (this.canEdit) {
        const isReference = event.target.checked;
        this.$emit('marked-reference', {
          index,
          isReference,
        });
      }
    },
    onDownloadStarted() {
      this.loading = true;
    },
    clearDocumentDownloadState(document) {
      setTimeout(() => {
        const documentsClone = this.documentsBeingDownloaded.splice(0);
        _.remove(documentsClone, (d) => d._id === document._id);
        this.documentsBeingDownloaded = documentsClone;
      }, 3000);
    },
    onDownloadFinished(document) {
      this.loading = false;
      this.clearDocumentDownloadState(document);
    },
    downloadDocumentViaIframe(document) {
      let iframeDownload = this.$refs[`iframe_doc_${document._id}`];
      if (Array.isArray(iframeDownload)) {
        // eslint-disable-next-line prefer-destructuring
        iframeDownload = iframeDownload[0];
      }
      iframeDownload.download(this.getDocumentUrl(document));
    },
    downloadDocument(event, document, useIframeDownload = true) {
      event.preventDefault();
      this.documentsBeingDownloaded.push(document);
      if (this.useIframeDownload && useIframeDownload) {
        return this.downloadDocumentViaIframe(document);
      }
      const documentEndpoint = this.getDocumentUrl(document);
      return this.service.getDocumentDownloadUrl(documentEndpoint)
        .then((response) => {
          const downloadLink = this.$refs[`download_link_${document._id}`];
          const originalLink = downloadLink[0].href;
          downloadLink[0].href = response.data;
          downloadLink[0].click();
          downloadLink[0].href = originalLink;
        })
        .catch((err) => {
          let message = _.get(err, 'message', _.get(err.status, 'message', 'An unknown error ocurred'));
          if (!_.isNil(err.status) && !_.isNil(err.status.message.match('We have detected an integrity issue with the file'))) {
            message = 'File not downloaded: Potential Security Risk \nThe file may be corrupted or tampered with during the downloading process. Try again later or delete the file';
          }
          const notification = {
            title: 'Error',
            message,
            state: 'danger',
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          this.clearDocumentDownloadState(document);
        });
    },
    isDownloadingDocument(document) {
      const foundDocument = this.documentsBeingDownloaded.find((d) => d._id === document._id);
      return !_.isNil(foundDocument);
    },
  },
};
