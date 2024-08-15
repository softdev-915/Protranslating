import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import DropFilesMixin from '../../../../mixins/drop-files-mixin';
import commonMixin from '../../../search-select/mixins/commonMixin';
import RequestService from '../../../../services/request-service';
import RequestFiles from '../../../request-files/request-files.vue';
import { iframeDownloadError } from '../../../../utils/notifications';
import LanguageSelect from '../../../language-select/language-select.vue';
import IframeDownload from '../../../iframe-download/iframe-download.vue';
import { extractChildArray, joinObjectsByProperty } from '../../../../utils/arrays';
import {
  dragover, dragstart, clear, dragend, dropFile,
} from '../../../../utils/dragndrop';
import { hasRole } from '../../../../utils/user';
import LanguageMultiSelect from '../../../language-multi-select/language-multi-select.vue';
import { isActiveDocument } from '../request-inline-edit-helper';
import { getMatchingLanguageCombinations } from './request-language-combination-helper';
import ConfirmDialog from '../../../form/confirm-dialog.vue';
import CatImportModal from './cat-import-modal/cat-import-modal.vue';

const requestService = new RequestService();
const DEFAULT_SOURCE_LANGUAGE = { name: 'English', isoCode: 'ENG' };
const ZIP_DOWNLOAD_SIZE_LIMIT_GB = 3;
const languageSetter = (val) => {
  if (_.isArray(val)) {
    return val.map((lang) => _.pick(lang, ['name', 'isoCode']));
  }
  return [_.pick(val, ['name', 'isoCode'])];
};

export default {
  name: 'language-combinations',
  props: {
    value: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
    },
    canEditAll: {
      type: Boolean,
      default: false,
    },
    companyId: {
      type: String,
    },
    defaultSourceLanguage: {
      type: Object,
      default: DEFAULT_SOURCE_LANGUAGE,
    },
    sourceDocumentsColumns: {
      type: Array,
    },
    request: {
      type: Object,
    },
    canDownloadFiles: {
      type: Boolean,
      default: false,
    },
    canUploadFiles: {
      type: Boolean,
      default: false,
    },
    isSingleLanguageCombination: {
      type: Boolean,
    },
    languages: {
      type: Array,
      default: () => [],
    },
    isRequestTypeIP: {
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
    canReadAll: {
      type: Boolean,
      default: false,
    },
    isAutoScanWorkflow: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: true,
    },
    isWorkflowInEditMode: {
      type: Boolean,
      default: false,
    },
    isUserIpAllowed: Boolean,
  },
  created() {
    this.requestService = requestService;
    if (_.isEmpty(this.languageCombination.srcLangs)) {
      this.update('srcLangs', [_.clone(this.defaultSourceLanguage)]);
    }
  },
  mixins: [
    DropFilesMixin,
    commonMixin,
  ],
  components: {
    ConfirmDialog,
    RequestFiles,
    LanguageSelect,
    LanguageMultiSelect,
    IframeDownload,
    CatImportModal,
  },
  data() {
    return {
      downloadingFiles: false,
      hasDanger: false,
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    languageCombination() {
      return this.value;
    },
    hasDocuments() {
      return !_.isEmpty(this.sourceDocuments);
    },
    isNew() {
      return _.isEmpty(_.get(this, 'languageCombination._id', ''));
    },
    canEditFiles() {
      if (this.isWorkflowInEditMode) {
        return false;
      } if (this.canAddSourceFiles) {
        return true;
      }
      return this.canEditAll && !this.isNew;
    },
    canDeleteFiles() {
      return this.canEditAll && !this.isNew && !this.isWorkflowInEditMode;
    },
    canAddSourceFiles() {
      return this.canUploadFiles && !this.isNew;
    },
    languageCombinations() {
      return _.get(this, 'request.languageCombinations', []);
    },
    areAllLanguageCombinationsCreated() {
      return this.languageCombinations.every((l) => !_.isNil(l._id));
    },
    canDownloadSourceFiles() {
      return !this.isNew && this.canDownloadFiles;
    },
    canDownloadSourceFilesAsZip() {
      if (!_.isEmpty(this.sourceDocuments)) {
        if (this.sourceDocuments.every((d) => !_.isNil(d.deletedByRetentionPolicyAt))) {
          return false;
        }
        const totalSize = this.sourceDocuments.map((d) => d.size).reduce((total, size) => total + size);
        const totalSizeInGB = totalSize / 1024 / 1024 / 1024;
        if (totalSizeInGB >= ZIP_DOWNLOAD_SIZE_LIMIT_GB) {
          return false;
        }
      }
      return this.canDownloadSourceFiles;
    },
    hasSrcLangs() {
      return !_.isEmpty(this.srcLangs);
    },
    hasTgtLangs() {
      return !_.isEmpty(this.tgtLangs);
    },
    hasMultipleTargetLanguages() {
      return _.get(this, 'languageCombination.tgtLangs.length', 0) > 1;
    },
    hasMultipleSourceLanguages() {
      return _.get(this, 'languageCombination.srcLangs.length', 0) > 1;
    },
    sourceDocuments() {
      return _.defaultTo(this.documents, []);
    },
    excludedTargetLanguages() {
      const excludedLanguages = this.getExcludedLanguages('tgtLangs');
      return excludedLanguages.concat(this.srcLangs);
    },
    excludedSourceLanguages() {
      const excludedLanguages = this.getExcludedLanguages('srcLangs');
      return excludedLanguages.concat(this.tgtLangs);
    },
    documents() {
      return _.get(this, 'languageCombination.documents', []).filter(isActiveDocument);
    },
    documentUrlResolver() {
      return requestService.getDocumentUrl.bind(requestService);
    },
    documentOCRUrlResolver() {
      return requestService.getDocumentOcrUrl.bind(requestService);
    },
    srcLangList() {
      return joinObjectsByProperty(_.defaultTo(this.srcLangs, []), 'name');
    },
    tgtLangList() {
      return joinObjectsByProperty(_.defaultTo(this.tgtLangs, []), 'name', ', ');
    },
    srcLangs: {
      get() {
        if (this.hasMultipleTargetLanguages) {
          return _.get(this, 'languageCombination.srcLangs[0]', {});
        }
        return this.languageCombination.srcLangs;
      },
      set(value) {
        this.update('srcLangs', languageSetter(value));
      },
    },
    tgtLangs: {
      get() {
        if (this.hasMultipleSourceLanguages) {
          return _.get(this, 'languageCombination.tgtLangs[0]', {});
        }
        return this.languageCombination.tgtLangs;
      },
      set(value) {
        this.update('tgtLangs', languageSetter(value));
      },
    },
    canReadLanguageCombinations() {
      if (this.isRequestTypeIP) {
        return this.canReadAll;
      }
      return true;
    },
    relatedWorkflows() {
      if (_.isEmpty(_.get(this, 'request.workflows')) || !_.isArray(this.request.workflows)) {
        return [];
      }

      const srcLangsIso = this.languageCombination.srcLangs.map((sl) => sl.isoCode);
      const tgtLangsIso = this.languageCombination.tgtLangs.map((tl) => tl.isoCode);
      return this.request.workflows
        .map((w) => ({ src: _.get(w, 'srcLang.isoCode', ''), tgt: _.get(w, 'tgtLang.isoCode', '') }))
        .filter((w) => srcLangsIso.includes(w.src) && tgtLangsIso.includes(w.tgt));
    },
    nonRemovableSrcLangs() {
      return new Set(this.relatedWorkflows.map((rw) => rw.src));
    },
    nonRemovableTgtLangs() {
      return new Set(this.relatedWorkflows.map((rw) => rw.tgt));
    },
    isRunCatImportButtonVisible() {
      return this.isPortalCat && hasRole(this.userLogged, 'REQUEST_READ_ALL');
    },
    canRunCatImport() {
      return this.isRunCatImportButtonVisible
              && this.catFilesToImport.length > 0
              && !this.isCatImportRunning
              && hasRole(this.userLogged, 'PIPELINE-RUN_UPDATE_ALL');
    },
    catFilesToImport() {
      const nonImportedCatFiles = [];
      this.documents.forEach((doc) => {
        if (doc.isPortalCat && !this.importedCatFiles.includes(doc._id)) {
          nonImportedCatFiles.push(doc._id);
        }
      });
      return nonImportedCatFiles;
    },
    hasWorkflows() {
      return this.relatedWorkflows.length > 0;
    },
    hasWorkflowsWithSameLanguageCombinations() {
      const languageCombinationsCounts = {};
      this.relatedWorkflows.forEach((wf) => {
        const key = `${wf.src}-${wf.tgt}`;
        if (_.isNil(languageCombinationsCounts[key])) {
          languageCombinationsCounts[key] = 1;
        } else {
          languageCombinationsCounts[key] += 1;
        }
      });
      return Object.values(languageCombinationsCounts).some((lcCount) => lcCount > 1);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    getExcludedLanguages(languageType) {
      let excludedLanguages;
      const query = { srcLangs: this.srcLangs, tgtLangs: this.tgtLangs };
      const matchingLanguageCombinations = getMatchingLanguageCombinations(
        this.languageCombinations,
        query,
        { shouldMatchBoth: false, excludeDifferentLanguagesNumber: true },
      );
      if (!_.isEmpty(matchingLanguageCombinations)) {
        excludedLanguages = extractChildArray(matchingLanguageCombinations, languageType);
      }
      return _.defaultTo(excludedLanguages, []);
    },
    addLanguageCombination() {
      this.$emit('add-language-combination');
    },
    deleteLanguageCombination() {
      if (_.isNil(this.languageCombination._id)) {
        this.$emit('delete-language-combination', this.index);
        return;
      }
      if (!_.isNil(this.$refs.deleteLanguageCombinationConfirmationDialog)) {
        this.$refs.deleteLanguageCombinationConfirmationDialog.show();
      }
    },
    fireUpload(event) {
      event.preventDefault();
      this.$refs.fileUpload.click(event, this.index);
    },
    onFileDropped(file) {
      this.$emit('upload-file', file, this.languageCombination._id);
    },
    uploadFile(file) {
      this.$emit('upload-file', file, this.languageCombination._id);
    },
    resetSrcFileInput() {
      if (this.$refs.fileUpload) {
        this.$refs.fileUpload.value = '';
      }
    },
    downloadSourceFiles(event) {
      event.preventDefault();
      this.downloadingFiles = true;
      const documentsZipUrl = requestService.getLanguageCombinationDocumentZipUri({
        requestId: this.request._id,
        companyId: this.companyId,
        languageCombinationId: this.languageCombination._id,
      });
      this.$refs.iframeLanguageCombination.download(documentsZipUrl);
    },
    onIframeDownloadError(err) {
      const notification = iframeDownloadError(err);
      this.pushNotification(notification);
    },
    markDocument(fieldName, event) {
      const languageCombination = _.clone(this.languageCombination);
      const document = _.get(this, `documents[${event.index}]`);
      const index = languageCombination.documents.findIndex((d) => d._id === document._id);
      if (index >= 0) {
        this.update(`documents[${index}][${fieldName}]`, event[fieldName]);
      }
    },
    onDocumentDelete(document) {
      if (!_.isNil(this.$refs.deleteDocumentConfirmationDialog)) {
        this.$refs.deleteDocumentConfirmationDialog.show(document);
      }
    },
    onDeleteDocumentConfirmation(event) {
      const document = _.get(event, 'data');
      if (_.get(event, 'confirm', false)) {
        this.$emit('delete-document', document, this.languageCombination._id);
      }
    },
    handleDragEvent(e, dragFunction) {
      dragFunction.call(this, e);
    },
    _addDragDropEvents() {
      const dropZone = this.$refs.languageCombinationDropZone;
      const dropZoneTrigger = this.$refs.languageCombinationDropZoneTrigger;
      if (!_.isNil(dropZone)) {
        dropZone.addEventListener('dragover', (e) => this.handleDragEvent(e, dragover), true);
        dropZone.addEventListener('dragstart', (e) => this.handleDragEvent(e, dragstart), true);
        dropZone.addEventListener('dragend', (e) => this.handleDragEvent(e, dragend), true);
        dropZone.addEventListener('dragleave', (e) => this.handleDragEvent(e, clear), true);
        dropZone.addEventListener('drop', (e) => this.handleDragEvent(e, dropFile), true);
      }
      if (!_.isNil(dropZoneTrigger)) {
        dropZoneTrigger.addEventListener('dragover', (e) => this.handleDragEvent(e, dragover), true);
        dropZoneTrigger.addEventListener('dragstart', (e) => this.handleDragEvent(e, dragstart), true);
        dropZoneTrigger.addEventListener('dragend', (e) => this.handleDragEvent(e, dragend), true);
      }
    },
    onDeleteLanguageCombinationConfirmation(event) {
      const isConfirmed = _.get(event, 'confirm', false);

      if (!isConfirmed) {
        return;
      }

      if (this.hasWorkflows) {
        this.setDangerState();
        return this.$emit('restricted-option-removal');
      }

      this.$emit('delete-language-combination', this.index);
    },
    onSelectedPreferredLanguageCombination(e) {
      this.$emit('preferred-language-combination-selected', e.target.checked);
    },
    setDangerState() {
      this.hasDanger = true;
      this.languageCombination.hasDanger = true;
      this.$root.$on('remove-notification', this.clearDangerState);
    },
    clearDangerState() {
      this.hasDanger = false;
      delete this.languageCombination.hasDanger;
      this.$root.$off('remove-notification', this.clearDangerState);
    },
    customFilter(searchText, options) {
      const filteredOptions = options.filter((option) => this.filterByStart(option.text, searchText));
      return _.sortBy(filteredOptions, 'text');
    },
    update(prop, value) {
      const newValue = _.clone(this.languageCombination);
      _.set(newValue, prop, value);
      this.$emit('input', newValue);
    },
    openCatImportModal() {
      if (!_.isNil(this.$refs.catImportModal)) {
        this.$refs.catImportModal.open();
      }
    },
    runCatImport(workflowCreationStrategy) {
      this.$emit('run-cat-import', { workflowCreationStrategy, files: this.catFilesToImport });
    },
  },
};
