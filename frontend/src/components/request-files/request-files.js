import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../utils/user';
import FilesMixin from '../../mixins/files-mixin';
import IframeDownload from '../iframe-download/iframe-download.vue';
import { isDocumentSupported } from '../home/portalcat/helpers';

const isNewAndCantCreate = (d, userLogged) => d.isNew && !hasRole(userLogged, 'INTERNAL-DOCUMENT_CREATE_ALL');
const isNotNewAndCantUpdate = (d, userLogged) => !d.isNew && !hasRole(userLogged, 'INTERNAL-DOCUMENT_UPDATE_ALL');
export default {
  mixins: [FilesMixin],
  components: {
    IframeDownload,
  },
  props: {
    entityId: String,
    companyId: String,
    languageCombinationId: String,
    documents: Array,
    canEdit: Boolean,
    service: {
      type: Object,
    },
    isAutoScanWorkflow: {
      type: Boolean,
      default: false,
    },
    isPortalCat: {
      type: Boolean,
      default: false,
    },
    isCatImportRunning: {
      type: Boolean,
      default: false,
    },
    importedCatFiles: {
      type: Array,
      default: () => [],
    },
    urlResolver: Function,
    ocrUrlResolver: Function,
    visibleColumns: Array,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    shouldShowInternalFiles() {
      return _.map(this.documents, (d) => !d.isInternal || hasRole(this.userLogged, 'INTERNAL-DOCUMENT_READ_ALL'));
    },
    isOCRAvailable() {
      return this.isAutoScanWorkflow && hasRole(this.userLogged, 'OCR-FILES_READ_ALL');
    },
    shouldAllowDeleteInternalFiles() {
      return _.map(this.documents, (d) => !d.isInternal || hasRole(this.userLogged, 'INTERNAL-DOCUMENT_DELETE_ALL'));
    },
    internalCheckboxDisabled() {
      return _.map(this.documents, (d) => isNewAndCantCreate(d, this.userLogged)
        || isNotNewAndCantUpdate(d, this.userLogged));
    },
    hasInternalCheckbox() {
      return this.activeColumns.find((c) => (c.name === 'Internal')) !== undefined;
    },
    hasPortalCatCheckbox() {
      return this.activeColumns.find(c => (c.name === 'Translate in PortalCAT')) !== undefined;
    },
    isInternalDisabled() {
      if (this.hasInternalCheckbox) {
        const col = this.activeColumns.find((c) => (c.name === 'Internal'));
        return _.get(col, 'disabled', false);
      }
      return false;
    },
    isLoading() {
      return this.loading || this.isCatImportRunning;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    deleteDocument(document, index) {
      if (this.shouldShowInternalFiles[index]) {
        this.$emit('document-delete', document);
      }
    },
    getDocumentUrl(document) {
      if (document.url) {
        return document.url;
      }
      return this.urlResolver(this.entityId, this.companyId, document);
    },
    getDocumentOcrUrl(document) {
      return this.ocrUrlResolver(
        this.entityId, this.companyId, this.languageCombinationId, document,
      );
    },
    downloadOCRZip(event, document) {
      event.preventDefault();
      this.documentsBeingDownloaded.push(document);
      const documentsZipUrl = this.getDocumentOcrUrl(document);
      let iframeDownload = this.$refs[`download_ocr_${document._id}`];
      if (Array.isArray(iframeDownload)) {
        iframeDownload = iframeDownload[0];
      }
      iframeDownload.download(documentsZipUrl);
      this.clearDocumentDownloadState(document);
    },
    markInternal(event, index) {
      if (this.canEdit) {
        const isInternal = event.target.checked;
        this.$emit('marked-internal', {
          index,
          isInternal,
        });
        const document = this.documents[index];
        if (document.isPortalCat) {
          this.$emit('marked-as-portal-cat', {
            index,
            isPortalCat: false,
          });
          if (isInternal) {
            this.$emit('marked-as-removed-from-portal-cat', {
              index,
              isRemovedFromPortalCat: true,
            });
          }
        }
      }
    },
    markReference(event, index) {
      if (this.canEdit) {
        const isReference = event.target.checked;
        this.$emit('marked-reference', {
          index,
          isReference,
        });
        const document = this.documents[index];
        if (document.isPortalCat) {
          this.$emit('marked-as-portal-cat', {
            index,
            isPortalCat: false,
          });
          if (isReference) {
            this.$emit('marked-as-removed-from-portal-cat', {
              index,
              isRemovedFromPortalCat: true,
            });
          }
        }
      }
    },
    markDocumentAsPortalCat(event, index) {
      if (this.canEdit) {
        const shouldTranslateInPortalCat = event.target.checked;
        this.$emit('marked-as-portal-cat', {
          index,
          isPortalCat: shouldTranslateInPortalCat,
        });
        if (shouldTranslateInPortalCat) {
          this.$emit('marked-as-removed-from-portal-cat', {
            index,
            isRemovedFromPortalCat: false,
          });
        }
      }
    },
    isPortalCatCheckboxDisabled(file) {
      return file.isReference ||
              file.isInternal ||
              !hasRole(this.userLogged, 'PIPELINE-RUN_UPDATE_ALL') ||
              !isDocumentSupported(file);
    },
    getIsTranslatedIndeterminate(doc) {
      return _.isNil(doc.isTranslated);
    },
    getIsTranslatedValue(doc) {
      return doc.isTranslated;
    },
    getIsOCRReady(doc) {
      return doc.OCRStatus === 'processing_complete' && !_.isNil(doc.OCRCloudKey);
    },
  },
};
