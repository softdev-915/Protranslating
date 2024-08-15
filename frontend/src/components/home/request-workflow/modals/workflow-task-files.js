import _ from 'lodash';
import moment from 'moment';
import { mapActions } from 'vuex';
import TaskService from '../../../../services/task-service';
import RequestService from '../../../../services/request-service';
import { emptyWorkflowFiles } from '../../../../utils/workflow/workflow-helpers';
import { getId } from '../../../../utils/request-entity';
import { isActiveDocument } from '../../list-request/request-inline-edit-helper';
import filesMixin from '../../../../mixins/files-mixin';

const taskService = new TaskService();
const requestService = new RequestService();
const TASK_FILES_COLUMNS = [
  'Filename',
  'Uploader',
  'Created At',
  'Deleted At',
  'Deleted By',
  'Retention Time',
  'Download',
];
const TASK_FILES_COLUMNS_WITHOUT_REGULATORY_FIELDS = [
  'Filename',
  'Created At',
  'Download',
];
export default {
  mixins: [filesMixin],
  props: {
    workflowFiles: {
      type: Object,
      default: () => emptyWorkflowFiles(),
    },
    downloadingDocsMap: {
      type: Object,
      default: () => {},
    },
    canDelete: {
      type: Boolean,
      default: false,
    },
    canDownload: {
      type: Boolean,
      default: false,
    },
    lockPreviouslyCompleted: {
      type: Boolean,
      default: false,
    },
    request: Object,
  },
  computed: {
    canReadRegulatoryFields() {
      return this.workflowFiles.canReadRegulatoryFields;
    },
    activeColumns() {
      if (!this.canReadRegulatoryFields) {
        return this.extendColumns(TASK_FILES_COLUMNS_WITHOUT_REGULATORY_FIELDS);
      }
      return this.extendColumns(TASK_FILES_COLUMNS);
    },
    companyId() {
      const company = _.get(this.request, 'company');
      return getId(company);
    },
    documents() {
      return _.get(this.workflowFiles, 'files', []);
    },
    requestId() {
      return _.get(this.request, '_id');
    },
    activeDocuments() {
      return this.documents.filter(isActiveDocument);
    },
    documentsURLs() {
      if (this.activeDocuments) {
        return this.activeDocuments.map((d) => this.getDocumentUrl(d));
      }
      return [];
    },
  },
  created() {
    this.service = taskService;
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
      if (this.canDelete) {
        this.$emit('document-delete', document);
      }
    },
    getDocumentUrl(document) {
      if (document.final && document.completed) {
        return this.getFinalFileURL(document);
      }
      return this.getTaskDocumentUrl(document);
    },
    getTaskDocumentUrl(document) {
      const url = taskService.getDocumentUrl(
        this.requestId,
        this.companyId,
        this.workflowFiles.taskId,
        document._id,
      );
      return url;
    },
    getFinalFileURL(document) {
      if (document.url) {
        return document.url;
      }
      return requestService.getDocumentUrl(this.requestId, this.companyId, document._id);
    },
    extendColumns(columns) {
      return this.canDelete ? columns.concat('Remove') : columns;
    },
  },
};
