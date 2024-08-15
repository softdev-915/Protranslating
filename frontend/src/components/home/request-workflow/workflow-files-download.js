import _ from 'lodash';
import { mapActions } from 'vuex';
import IframeDownload from '../../iframe-download/iframe-download.vue';
import { iframeDownloadError } from '../../../utils/notifications';

export default {
  components: {
    IframeDownload,
  },
  props: {
    value: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      documents: [],
      downloadingIds: [],
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.documents = newValue;
      },
    },
    documents(newDocuments) {
      this.$emit('input', newDocuments);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    downloadDocument(document) {
      this.documents.push(document);
    },
    onDownloadFinished(document) {
      const docIndex = _.findIndex(this.documents, (d) => d._id === document._id);
      if (docIndex !== -1) {
        const documentCloneArray = this.documents.slice(0);
        documentCloneArray.splice(docIndex, 1);
        this.documents = documentCloneArray;
        this.$emit('download-finished', document);
      }
    },
    onDownloadError(err, document) {
      const docIndex = _.findIndex(this.documents, (d) => d._id === document._id);
      if (docIndex !== -1) {
        const documentCloneArray = this.documents.slice(0);
        documentCloneArray.splice(docIndex, 1);
        this.documents = documentCloneArray;
        this.$emit('download-finished', document);
        this.$emit('download-error', {
          error: err,
          document: document,
        });
        const notification = iframeDownloadError(err);
        this.pushNotification(notification);
      }
    },
  },
};
