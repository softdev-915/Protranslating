/* eslint-disable prefer-destructuring */
import _ from 'lodash';
import moment from 'moment';
import { mapActions, mapGetters } from 'vuex';
import ActivityService from '../../../../services/activity-service';
import { iframeDownloadError } from '../../../../utils/notifications';
import IframeDownload from '../../../iframe-download/iframe-download.vue';
import ActivityVersionableDocument from '../../../../utils/document/activity-versionable-document';
import ConfirmDialog from '../../../form/confirm-dialog.vue';

import DropFiles from '../../../drop-files/drop-files.vue';
import {
  dragover, dragstart, dragend, clearDragState,
} from '../../../../utils/dragndrop';

// To make sure event.target.files from a file upload <input> is an array or is
// array-like, check if value isArray or is instanceof FileList
const isArrayOrFileList = (arr) => Array.isArray(arr) || arr instanceof FileList;
const activityService = new ActivityService();
const buildInitialState = () => ({
  dragging: false,
  dragOver: false,
  dragStart: false,
  dragEnd: false,
  options: [],
  selected: [],
  loading: false,
  documents: [],
  downloadingSelectedFiles: false,
  deletingSelectedFiles: false,
  draggedFile: null,
});

export default {
  components: {
    IframeDownload,
    ConfirmDialog,
    DropFiles,
  },
  props: {
    value: {
      type: Array,
    },
    activityId: {
      type: String,
    },
  },
  data() {
    return buildInitialState();
  },
  mounted() {
    this._addEvents();
  },
  beforeDestroy() {
    this._removeEvents();
  },
  watch: {
    value: {
      handler: function (newValue) {
        this._setDocuments(newValue);
      },
      immediate: true,
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    activityDocumentURLs() {
      if (this.documents) {
        return this.documents.map((d) => d.getAllVersions().map((v) => this.getDocumentUrl(v)));
      }
      return [];
    },
    activitySelectedDocumentsZipURL() {
      return `/api/lsp/${this.userLogged.lsp._id}/activity/${this.activityId}/documents/zip`;
    },
    // Note This logic may be required in case of no files selected, or the activity
    // is new (unsaved) the download button does nothing, can become unclickable or not visible
    // isDownloadSelectedVisible() {
    //   return this.documents
    //     .filter(f => f.getAllVersions().filter(v => v.isNew !== true).length).length;
    // },
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
    isNew() {
      return _.isEmpty(_.defaultTo(this.activityId, ''));
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

      if (files.length) {
        for (let i = 0; i < files.length; i++) {
          const f = files.item(i);
          const formData = new FormData();
          formData.append('file', f, f.name);
          this.uploadFile(formData, f);
        }
      }
    },
    clear() {
      clearDragState.call(this, true);
    },
    _addEvents() {
      const dropZone = this.$refs.dropzone;
      const { dropzonetrigger } = this.$refs;
      dropZone.addEventListener('dragover', dragover.bind(this));
      dropZone.addEventListener('dragstart', dragstart.bind(this), false);
      dropZone.addEventListener('dragend', dragend.bind(this), false);
      dropZone.addEventListener('drop', this.drop);
      dropZone.addEventListener('dragexit', this.clear);
      dropZone.addEventListener('dragleave', this.clear);
      dropzonetrigger.addEventListener('dragover', dragover.bind(this));
      dropzonetrigger.addEventListener('dragstart', dragstart.bind(this), false);
      dropzonetrigger.addEventListener('dragend', dragend.bind(this), false);
    },
    _removeEvents() {
      const dropZone = this.$refs.dropzone;
      const { dropzonetrigger } = this.$refs;
      dropZone.removeEventListener('dragover', dragover.bind(this));
      dropZone.removeEventListener('dragstart', dragstart.bind(this));
      dropZone.removeEventListener('dragend', dragend.bind(this));
      dropZone.removeEventListener('drop', this.drop);
      dropZone.removeEventListener('dragexit', this.clear);
      dropZone.removeEventListener('dragleave', this.clear);
      dropzonetrigger.removeEventListener('dragover', dragover.bind(this));
      dropzonetrigger.removeEventListener('dragstart', dragstart.bind(this), false);
      dropzonetrigger.removeEventListener('dragend', dragend.bind(this), false);
    },
    _setDocuments(value) {
      this.documents = ActivityVersionableDocument.activeDocuments(value);
    },
    fireUploadPrompt(event) {
      event.preventDefault();
      this.$refs.fileUploadInput.click(event);
    },
    uploadFile(formData, file) {
      const newDocument = {
        name: file.name,
        mime: file.type,
        size: file.size,
        fileType: file.fileType,
        createdAt: moment(),
        isNew: true,
        uploading: true,
      };
      this.loading = true;
      activityService.uploadDocument(this.activityId, formData).then((response) => {
        const docUploaded = Object.assign(newDocument, response.data.newDocument);
        const docsQty = this.documents.length;
        const duplicateIndex = this.documents.findIndex((d) => d.name === file.name);
        if (duplicateIndex !== -1) {
          this.documents[duplicateIndex].push(docUploaded);
        } else {
          this.$set(this.documents, docsQty, new ActivityVersionableDocument([docUploaded]));
        }
        if (!_.isEmpty(_.defaultTo(this.activityId))) {
          this.$emit('documents-updated');
        }
        this.$emit('input', this.documents.map((d) => d.getAllVersions()));
      }).catch((err) => {
        const notification = {
          title: 'Error',
          message: 'Document upload failed',
          state: 'danger',
        };
        notification.response = err;
        this.pushNotification(notification);
      }).finally(() => {
        this.$refs.fileUploadInput.value = null;
        this.loading = false;
      });
    },
    onFileSelect(event) {
      const files = _.get(event, 'target.files');
      if (!files || !isArrayOrFileList(files) || !files.length) {
        return;
      }
      for (let i = 0; i < files.length; i++) {
        const f = files.item(i);
        const formData = new FormData();
        formData.append(event.target.name, f, f.name);
        this.uploadFile(formData, f);
      }
    },
    downloadDocument(file, version) {
      let iframeDownload = this.$refs.iframe_doc_download;
      if (Array.isArray(iframeDownload)) {
        iframeDownload = iframeDownload[0];
      }
      iframeDownload.download(this.activityDocumentURLs[file][version]);
    },
    onDeleteDocument(document) {
      this.$refs.confirmDelete.show(document);
    },
    afterConfirmDelete(eventData) {
      const { confirm } = eventData;
      if (confirm) {
        const document = eventData.data;
        const documents = this.documents.map((d) => d.getAllVersions());
        activityService.deleteDocument(this.activityId, document._id, document.name)
          .catch((err) => {
            const notification = {
              title: 'Error deleting document',
              message: err.status.message,
              state: 'danger',
            };
            notification.response = err;
            this.pushNotification(notification);
          }).then(() => {
            let versionIndex;
            const fileIndex = documents.findIndex((v) => {
              versionIndex = v.findIndex((f) => f._id === document._id);
              return versionIndex !== -1;
            });
            documents[fileIndex][versionIndex].deleted = true;
            this._setDocuments(documents);
            this.$set(this, 'documents', documents);
            this.$emit('input', documents);
            this.$emit('documents-updated');
          });
      }
    },
    getDocumentUrl(document) {
      if (document.url) {
        return document.url;
      }
      const documentId = document._id;
      return activityService.getDocumentUrl(this.activityId, documentId, document.name);
    },
    onIframeDownloadError(err) {
      this.downloadingSelectedFiles = false;
      const notification = iframeDownloadError(err);
      this.pushNotification(notification);
    },
    markSelected(event, index) {
      if (_.has(this.documents, `[${index}].isSelected`)) {
        this.documents[index].isSelected = event.target.checked;
      }
    },
    onSelectedFilesDownloadFinished() {
      this.downloadingSelectedFiles = false;
    },
    downloadSelectedFiles() {
      if (Array.isArray(this.documents)) {
        const selectedDocumentsLatestVersionIds = this.documents
          .filter((d) => d.isSelected)
          .map((doc) => doc.getLatest())
          .filter((fileVersion) => fileVersion.isNew !== true)
          .map((version) => version._id);
        if (selectedDocumentsLatestVersionIds.length) {
          this.downloadingSelectedFiles = true;
          let iframeDownload = this.$refs.iframe_doc_download;
          if (Array.isArray(iframeDownload)) {
            iframeDownload = iframeDownload[0];
          }
          iframeDownload.download(`${this.activitySelectedDocumentsZipURL}?documentIds[]=${selectedDocumentsLatestVersionIds.join('&documentIds[]=')}`);
        }
      }
    },
    deleteSelectedFiles() {
      let documentIdsToDelete = [];
      if (Array.isArray(this.documents)) {
        const selectedDocumentsVersionIds = this.documents
          .filter((d) => d.isSelected)
          .map((doc) => doc.getAllVersions()
            .map((version) => version._id));
        if (selectedDocumentsVersionIds.length) {
          _.each(selectedDocumentsVersionIds, (versionIds) => {
            if (versionIds.length) {
              documentIdsToDelete = documentIdsToDelete.concat(versionIds);
            }
          });
          if (documentIdsToDelete.length) {
            this.deletingSelectedFiles = true;
            activityService.deleteDocuments(this.activityId, documentIdsToDelete).then((res) => {
              const documentsDeleted = _.get(res, 'data.documents', []);
              const documents = this.documents.map((d) => d.getAllVersions());
              _.forEach(documentsDeleted, (documentDeleted) => {
                let versionIndex;
                const fileIndex = documents.findIndex((v) => {
                  versionIndex = v.findIndex((f) => f._id === documentDeleted._id);
                  return versionIndex !== -1;
                });
                documents[fileIndex][versionIndex].deleted = true;
              });
              this._setDocuments(documents);
              this.$emit('input', documents);
              if (!_.isEmpty(_.defaultTo(this.activityId))) {
                this.$emit('documents-updated');
              }
            }).catch((err) => {
              const notification = {
                title: 'Error deleting documents',
                message: err.status.message,
                state: 'danger',
              };
              notification.response = err;
              this.pushNotification(notification);
            }).finally(() => {
              this.deletingSelectedFiles = false;
            });
          }
        }
      }
    },
  },
};
