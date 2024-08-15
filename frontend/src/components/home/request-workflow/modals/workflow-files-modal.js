import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import { emptyWorkflowFiles } from '../../../../utils/workflow/workflow-helpers';
import WorkflowTaskFiles from './workflow-task-files.vue';
import RequestService from '../../../../services/request-service';
import TaskService from '../../../../services/task-service';
import { getId } from '../../../../utils/request-entity';
import { getFileWithExtension } from '../../../../utils/files/index';
import CompanyService from '../../../../services/company-service';
import filesMixin from '../../../../mixins/files-mixin';
import { iframeDownloadError } from '../../../../utils/notifications';
import { isFileAlreadyAddedToRequest } from '../../list-request/request-inline-edit-helper';

const taskService = new TaskService();
const requestService = new RequestService();
const companyService = new CompanyService();
const VALIDATION_DELIVERY = 'Validation and Delivery';
const TASK_FINAL_FILE_UPDATE_OWN = 'TASK-FINAL-FILE_UPDATE_OWN';
const TASK_FILES_READ_WORKFLOW = 'TASK-FILES_READ_WORKFLOW';
const TASK_READ_ALL = 'TASK_READ_ALL';
const NOT_ALLOWED_TO_ADD_TASK_FILES_ROLES = ['Completed', 'Cancelled'];
const FILE_MODAL_ID = 'workflowFileModal';
const TASK_REGULATORY_FIELDS_READ_WORKFLOW = 'TASK-REGULATORY-FIELDS_READ_WORKFLOW';
export default {
  components: {
    WorkflowTaskFiles,
  },
  mixins: [filesMixin],
  props: {
    request: {
      type: Object,
    },
    downloadingDocs: {
      type: Array,
      default: () => [],
    },
    value: {
      type: Object,
      default: () => emptyWorkflowFiles(),
    },
    isValidRequest: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      uploadedDocuments: [],
      documentsToUpload: [],
      failedFiles: [],
      workflowFiles: emptyWorkflowFiles(),
      loading: false,
      taskFilesModalOpened: false,
    };
  },
  watch: {
    'request.workflows': function () {
      if (this.taskFilesModalOpened) {
        this.refreshModal(this.request);
      }
    },
    value(newValue) {
      this.workflowFiles = newValue;
      this.openFileModal();
      if (this.documentsToUpload.length === 0) {
        this.loading = false;
      }
    },
    loading(loading) {
      this.$emit('document-upload', loading);
    },
    taskFilesModalOpened(state) {
      this.$emit('workflow-task-files-modal-state', state);
    },
  },
  created() {
    this.service = taskService;
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canAddTaskFiles() {
      if (!this.isValidRequest) {
        return false;
      }
      return ((this.canEditTask && this.canEditNow) || this.canEditAll)
      && NOT_ALLOWED_TO_ADD_TASK_FILES_ROLES.every((status) => this.requestStatus !== status);
    },
    canEditTask() {
      if (this.workflowFiles) {
        return this.workflowFiles.canEditTask;
      }
      return false;
    },
    canEditAll() {
      if (this.workflowFiles) {
        return this.workflowFiles.canEditAll;
      }
      return false;
    },
    canEditNow() {
      return _.get(this, 'workflowFiles.canEditNow', false);
    },
    canReadAllTasks() {
      return hasRole(this.userLogged, TASK_READ_ALL);
    },
    canUpload() {
      return this.canAddTaskFiles
      && !this.lockPreviouslyCompleted
      && !this.isApprovedOrCancelled
      && !this.isOwnTaskCompleted;
    },
    canDownloadFiles() {
      if (this.workflowFiles) {
        return this.workflowFiles.canEditAll || this.workflowFiles.canEditTask
          || this.canProviderReadFiles || hasRole(this.userLogged, TASK_FINAL_FILE_UPDATE_OWN);
      }
      return false;
    },
    companyId() {
      return getId(_.get(this.request, 'company'));
    },
    documentNames() {
      return this.files.map((f) => f.name);
    },
    downloadAllURL() {
      return `/api/lsp/${this.userLogged.lsp._id}/request/${this.request._id}/task/${this.taskId}/providerTask/${this.providerTaskId}/documents/zip`;
    },
    downloadingDocsMap() {
      if (this.downloadingDocs) {
        // converts an array of this [{ _id: 1 }, { _id: 2 } ...]
        // into this { 1: true, 2: true, ... };
        return _.reduce(this.downloadingDocs, (acc, doc) => {
          const fileObj = {};
          fileObj[doc._id] = true;
          return Object.assign(acc, fileObj);
        }, {});
      }
      return {};
    },
    files() {
      return _.get(this.workflowFiles, 'files', []);
    },
    hasDownloadableDocuments() {
      return this.files.filter((f) => !f.deleted && !f.removed
        && !f.isNew && !f.deletedByRetentionPolicyAt).length > 0;
    },
    isDownloadingAllFiles() {
      return this.downloadingDocsMap.all || false;
    },
    isValidationAndDelivery() {
      const workflows = _.get(this, 'request.workflows', []);
      if (!_.isEmpty(workflows) && this.workflowIndex !== -1 && this.taskIndex !== -1) {
        const wi = this.workflowIndex;
        const ti = this.taskIndex;
        const task = this.request.workflows[wi].tasks[ti];
        return task.ability === VALIDATION_DELIVERY;
      }
      return false;
    },
    language() {
      const hasWorkflows = this.request && this.request.workflows;
      if (hasWorkflows && this.workflowIndex !== -1) {
        return this.request.workflows[this.workflowIndex].language;
      }
      return null;
    },
    lockPreviouslyCompleted() {
      if (this.workflowFiles) {
        return this.workflowFiles.lockPreviouslyCompleted;
      }
      return false;
    },
    isOwnTaskCompleted() {
      return _.get(this, 'workflowFiles.isOwnTaskCompleted', false);
    },
    workflowId() {
      return _.get(this.workflowFiles, 'workflowId');
    },
    taskId() {
      return _.get(this.workflowFiles, 'taskId');
    },
    taskIndex() {
      return _.get(this.workflowFiles, 'taskIndex', -1);
    },
    providerTaskIndex() {
      return _.get(this.workflowFiles, 'providerTaskIndex', -1);
    },
    providerTaskId() {
      return _.get(this.workflowFiles, 'providerTaskId');
    },
    requestStatus() {
      return _.get(this.request, 'status');
    },
    workflowFileModalId() {
      return FILE_MODAL_ID;
    },
    workflowIndex() {
      return _.get(this.workflowFiles, 'workflowIndex', -1);
    },
    zipName() {
      return `${this.workflowIndex}_${this.taskIndex}_${this.providerTaskIndex}_all.zip`;
    },
    isApprovedOrCancelled() {
      return _.get(this, 'workflowFiles.isApprovedOrCancelled', false);
    },
    canProviderReadFiles() {
      return this.value.isReadOnlyProvider
        && hasRole(this.userLogged, TASK_FILES_READ_WORKFLOW);
    },
    canReadRegulatoryFields() {
      return hasRole(this.userLogged, TASK_REGULATORY_FIELDS_READ_WORKFLOW);
    },
    canRemoveFiles() {
      return ((this.canEditTask && this.canEditNow) || this.canEditAll)
        && !this.isApprovedOrCancelled
        && !this.isOwnTaskCompleted;
    },
    isFutureTask() {
      return _.get(this, 'workflowFiles.isFutureTask', false);
    },
    canReadTaskWorkflow() {
      return hasRole(this.userLogged, 'TASK_READ_WORKFLOW');
    },
    canDownload() {
      return this.canEditTask
        || this.canEditAll
        || this.canReadAllTasks
        || this.canProviderReadFiles
        || (this.canReadTaskWorkflow && this.isFutureTask)
        || (this.canReadRegulatoryFields && !this.canEditTask && this.isFutureTask);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    handleFiles(event, files) {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        const f = event ? files.item(i) : files[i];
        formData.append(`files_${i}`, f, f.name);
      }
      this.documentsToUpload.push(...Array.from(files));
      return this.uploadFiles(formData, files);
    },
    refreshModal(response) {
      const request = _.get(response, 'data.request', response);
      if (_.get(request, 'workflows')) {
        let foundTask;
        let foundProviderTask;
        const foundWorkflow = request.workflows.find((workflow) => workflow._id === this.workflowId);
        if (!_.isEmpty(foundWorkflow) && !_.isEmpty(foundWorkflow.tasks)) {
          foundTask = foundWorkflow.tasks.find((task) => task._id === this.taskId);
        }
        if (!_.isEmpty(foundTask)) {
          foundProviderTask = foundTask.providerTasks.find((providerTask) => providerTask._id === this.providerTaskId);
        }
        if (!_.isEmpty(foundProviderTask)) {
          this.workflowFiles.files = foundProviderTask.files;
        }
      }
    },
    closeFileModal() {
      if (this.$refs.taskFilesModal) {
        this.$refs.taskFilesModal.hide();
        this.taskFilesModalOpened = false;
      }
    },
    onModalHidden(modalId) {
      if (modalId === FILE_MODAL_ID) {
        this.workflowFiles = emptyWorkflowFiles();
      }
    },
    downloadAllFilesZip() {
      this.$refs.workflowFilesModalIframeDownload.download();
    },
    onAllFilesDownloadError(err) {
      const notification = iframeDownloadError(err);
      this.pushNotification(notification);
    },
    fireUpload(event) {
      this.$refs.fileUpload.value = '';
      event.preventDefault();
      this.$refs.fileUpload.click(event);
    },
    onDocumentDownload(document) {
      this.$emit('document-download', document);
    },
    onDocumentDelete(document) {
      if (this.canEditAll || this.canEditTask) {
        const fileIndex = _.findIndex(this.files, (f) => f._id === document._id);
        if (fileIndex >= 0) {
          this.loading = true;
          taskService.deleteDocument(document._id, this.request._id, this.taskId,
            this.providerTaskId)
            .catch((err) => {
              const notification = {
                title: 'Error',
                message: 'Document deletion failed',
                state: 'danger',
                response: err,
              };
              this.pushNotification(notification);
            })
            .then((response) => {
              this.$emit('request-refresh', response);
              this.refreshModal(response);
              this.loading = false;
            });
        }
      }
    },
    resetSrcFileInput() {
      if (this.$refs.fileUpload) {
        this.$refs.fileUpload.value = '';
      }
    },
    onFileUpload(event) {
      const { files } = event.target;
      if (_.isEmpty(files)) {
        return;
      }
      if (_.isEmpty(getFileWithExtension(files[0].name))) {
        const notification = {
          title: `Can not upload the file ${files[0].name}`,
          message: 'Files must have an extension',
          state: 'warning',
          ttl: 3,
        };
        this.pushNotification(notification);
        this.resetSrcFileInput();
        return false;
      }
      const duplicatedFiles = this.getDuplicatedFilenames(files);
      if (duplicatedFiles.length) {
        this.pushNotification({
          title: 'Error',
          message: 'File name is identical with another file name in the request. Uploading is not allowed.',
          state: 'danger',
        });
        this.pushNotification({
          title: 'Some of the submitted files failed to upload.',
          message: `Please upload the following files again:
              ${duplicatedFiles.join(',')}
              `,
          state: 'danger',
        });
        this.resetSrcFileInput();
        return false;
      }
      this.loading = true;
      // Check if the ip is allowed to upload files for this company
      return companyService.isUploadingAllowedForIp(this.companyId)
        .then(() => this.handleFiles(event, files))
        .catch((err) => {
          let errMessage;
          if (err.status.code === 403) {
            errMessage = 'Your IP is not allowed to upload files for this company';
          } else {
            errMessage = _.get(err, 'status.message', err);
          }
          this.loading = false;
          const notification = {
            title: 'Error',
            message: errMessage,
            state: 'danger',
          };
          this.pushNotification(notification);
        });
    },
    openFileModal() {
      if (this.$refs.taskFilesModal) {
        this.$refs.taskFilesModal.show();
        this.taskFilesModalOpened = true;
      }
    },
    _handleFinalFileUploading() {
      if (this.uploadedDocuments.length !== this.documentsToUpload.length) {
        return;
      }
      if (!_.isEmpty(this.failedFiles)) {
        const errNotification = {
          title: 'Some of the submitted files failed to upload.',
          message: `Please upload the following files again:
              ${this.failedFiles.join(',')}
              `,
          state: 'danger',
        };
        this.pushNotification(errNotification);
      }
      this.loading = false;
      this.failedFiles = [];
      this.documentsToUpload = [];
      this.uploadedDocuments = [];
    },
    getDuplicatedFilenames(uploadedFiles) {
      return Array.from(uploadedFiles)
        .filter(uploadedFile => isFileAlreadyAddedToRequest(this.request, uploadedFile.name))
        .map(uploadedFile => uploadedFile.name);
    },
    uploadFiles(formData, files) {
      const newDocuments = Array.from(files).map(file => ({
        isReference: false,
        isConfidential: false,
        name: file.name,
        mime: file.type,
        size: file.size,
        final: this.isValidationAndDelivery,
        uploading: true,
        md5Hash: 'pending',
      }));
      const metadata = [];
      const workflows = _.get(this.request, 'workflows', []);
      const workflow = workflows.find(w => w._id === this.workflowId);
      const workflowReadDate = _.get(workflow, 'updatedAt');
      newDocuments.forEach((newDocument) => {
        metadata.push({
          final: _.get(newDocument, 'final', false),
          workflowReadDate,
        });
      });
      formData.append('metadata', JSON.stringify(metadata));
      this.loading = true;
      const uploadParams = {
        formData,
        requestId: this.request._id,
        workflowId: this.workflowId,
        taskId: this.taskId,
        providerTaskId: this.providerTaskId,
      };
      requestService.uploadTaskDocument(uploadParams)
        .then((response) => {
          this.uploadedDocuments.push(...newDocuments);
          this.$emit('request-refresh', response);
          this.refreshModal(response);
        }).catch((err) => {
          const errorNotification = {
            title: 'Error',
            message: _.get(err, 'status.message', 'Unknown error'),
            state: 'danger',
          };
          this.pushNotification(errorNotification);
          this.failedFiles = _.get(err, 'data.failedUploads', []);
        })
        .finally(() => {
          newDocuments.forEach((newDocument) => {
            if (_.isNil(this.uploadedDocuments.find(d => d.name === newDocument.name))) {
              this.uploadedDocuments.push(newDocuments);
            }
          });
          this._handleFinalFileUploading();
        });
    },
  },
};
