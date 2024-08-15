import _ from 'lodash';
import moment from 'moment';
import { mapActions, mapGetters } from 'vuex';
import UserService from '../../../services/user-service';
import { iframeDownloadError } from '../../../utils/notifications';
import IframeDownload from '../../iframe-download/iframe-download.vue';
import FileUpload from './file-upload.vue';
import UserVersionableDocument from '../../../utils/document/user-versionable-document';
import ConfirmDialog from '../../form/confirm-dialog.vue';
// TODO: create a drag and drop mixin
import DropFiles from '../../drop-files/drop-files.vue';
import {
  dragover, dragstart, dragend, clearDragState,
} from '../../../utils/dragndrop';

const userService = new UserService();
const buildInitialState = () => ({
  dragging: false,
  dragOver: false,
  dragStart: false,
  dragEnd: false,
  options: [],
  selected: [],
  loading: false,
  documents: [],
  downloadingAllFiles: false,
  draggedFile: null,
});

export default {
  components: {
    IframeDownload,
    FileUpload,
    ConfirmDialog,
    DropFiles,
  },
  props: {
    value: {
      type: Array,
    },
    userId: {
      type: String,
    },
  },
  data() {
    return buildInitialState();
  },
  created() {
    this._setDocuments(this.value);
  },
  mounted() {
    this._addEvents();
  },
  beforeDestroy() {
    this._removeEvents();
  },
  watch: {
    value(newValue) {
      this._setDocuments(newValue);
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    userDocumentURLs() {
      if (this.documents) {
        return this.documents.map((d) => d.getAllVersions().map((v) => this.getDocumentUrl(v)));
      }
      return [];
    },
    userDocumentsZipURL() {
      return `/api/lsp/${this.userLogged.lsp._id}/user/${this.userId}/documents/zip`;
    },
    isDownloadAllVisible() {
      return this.documents
        .filter((f) => f.getAllVersions().filter((v) => v.isNew !== true).length).length;
    },
    dragndropClasses() {
      const isInactive = !this.dragging && !this.dragOver && !this.dragStart && !this.dragEnd;
      return {
        'dropzone-dragging': this.dragging,
        'dropzone-drag-over': this.dragOver,
        'dropzone-drag-start': this.dragStart,
        'dropzone-drag-end': this.dragEnd,
        'dropzone-drag-inactive': isInactive,
      };
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    drop(e) {
      e.stopPropagation();
      e.preventDefault();
      clearDragState.call(this);
      this.dragging = false;
      const { files } = e.dataTransfer; // Array of all files
      // Only one file should be uploaded at once, take first of array
      if (files.length) {
        // eslint-disable-next-line prefer-destructuring
        this.draggedFile = files[0];
        this.uploadFile();
      }
    },
    clear() {
      clearDragState.call(this, true);
    },
    _addEvents() {
      const dropZone = this.$refs.dropzone;
      const { dropzonetrigger } = this.$refs;
      this.dragoverFn = dragover;
      this.dragstartFn = dragstart;
      this.dragendFn = dragend;
      dropZone.addEventListener('dragover', this.dragoverFn);
      dropZone.addEventListener('dragstart', this.dragstartFn, false);
      dropZone.addEventListener('dragend', this.dragendFn, false);
      dropZone.addEventListener('drop', this.drop);
      dropZone.addEventListener('dragexit', this.clear);
      dropZone.addEventListener('dragleave', this.clear);
      dropzonetrigger.addEventListener('dragover', this.dragoverFn);
      dropzonetrigger.addEventListener('dragstart', this.dragstartFn, false);
      dropzonetrigger.addEventListener('dragend', this.dragendFn, false);
    },
    _removeEvents() {
      const dropZone = this.$refs.dropzone;
      const { dropzonetrigger } = this.$refs;
      dropZone.removeEventListener('dragover', this.dragoverFn);
      dropZone.removeEventListener('dragstart', this.dragstartFn);
      dropZone.removeEventListener('dragend', this.dragendFn);
      dropZone.removeEventListener('drop', this.drop);
      dropZone.removeEventListener('dragexit', this.clear);
      dropZone.removeEventListener('dragleave', this.clear);
      dropzonetrigger.removeEventListener('dragover', this.dragoverFn);
      dropzonetrigger.removeEventListener('dragstart', this.dragstartFn, false);
      dropzonetrigger.removeEventListener('dragend', this.dragendFn, false);
    },
    _setDocuments(value) {
      this.documents = UserVersionableDocument.buildFromArray(value);
    },
    onDocumentUpload() {
      this.$refs.uploadDocument.show();
    },
    uploadFile() {
      this.$refs.documentUpload.show();
    },
    downloadDocument(file, version) {
      let iframeDownload = this.$refs.iframe_doc_download;
      if (Array.isArray(iframeDownload)) {
        // eslint-disable-next-line prefer-destructuring
        iframeDownload = iframeDownload[0];
      }
      iframeDownload.download(this.userDocumentURLs[file][version]);
    },
    selectDocument(index) {
      this.selected.push(index);
    },
    uploadDocument(data) {
      const { file } = data;
      const { formData } = data;
      const docAdded = {
        name: file.name,
        mime: file.type,
        size: file.size,
        fileType: file.fileType,
        createdAt: moment(),
        isNew: true,
        uploading: true,
      };
      this.loading = true;
      userService.upload(this.userId, file.fileType, formData).then((response) => {
        const { document } = response.data;
        if (_.isNil(document)) {
          throw new Error('Error processing document. Please, try again.');
        }
        const docUploaded = Object.assign(docAdded, document);
        const docsQty = this.documents.length;
        const duplicateIndex = this.documents.findIndex((d) => d.name === file.name);
        if (duplicateIndex !== -1) {
          this.documents[duplicateIndex].push(docUploaded);
        } else {
          this.$set(this.documents, docsQty, new UserVersionableDocument([docUploaded]));
        }
        this.$emit('input', this.documents.map((d) => d.getAllVersions()));
      }).catch((err) => {
        const notification = {
          title: 'Error',
          message: 'Document upload failed',
          state: 'danger',
          response: err,
        };
        this.pushNotification(notification);
      }).finally(() => {
        this.loading = false;
      });
    },
    onDeleteDocument(document) {
      this.$refs.confirmDelete.show(document);
    },
    afterConfirmDelete(eventData) {
      const { confirm } = eventData;
      if (confirm) {
        const document = eventData.data;
        const documents = this.documents.map((d) => d.getAllVersions());
        let versionIndex;
        const fileIndex = documents.findIndex((v) => {
          versionIndex = v.findIndex((f) => f._id === document._id);
          return versionIndex !== -1;
        });
        if (documents[fileIndex].length === 1) {
          documents.splice(fileIndex, 1);
        } else {
          documents[fileIndex].splice(versionIndex, 1);
        }
        if (document.isNew) {
          userService.delete(this.userId, document._id).catch((err) => {
            const notification = {
              title: 'Error deleting document',
              message: err.status.message,
              state: 'danger',
            };
            notification.response = err;
            this.pushNotification(notification);
          });
        }
        this.$emit('input', documents);
      }
    },
    getDocumentUrl(document) {
      if (document.url) {
        return document.url;
      }
      const documentId = document._id;
      return userService.getDocumentUrl(this.userId, documentId, document.name);
    },
    onIframeDownloadError(err) {
      const notification = iframeDownloadError(err);
      this.pushNotification(notification);
    },
    downloadAllFiles() {
      this.downloadingAllFiles = true;
      let iframeDownload = this.$refs.iframe_doc_download;
      if (Array.isArray(iframeDownload)) {
        // eslint-disable-next-line prefer-destructuring
        iframeDownload = iframeDownload[0];
      }
      iframeDownload.download(this.userDocumentsZipURL);
    },
    onAllFilesDownloadFinished() {
      this.downloadingAllFiles = false;
    },
  },
};
