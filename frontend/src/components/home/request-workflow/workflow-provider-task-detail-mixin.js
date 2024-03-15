import _ from 'lodash';
import ProviderTaskProgress from '../../provider-task-progress/provider-task-progress.vue';
import {
  getProgressByTask,
  isPortalCatSupported,
  isPortalCatPreflightTask,
  isProjectManagementTask,
} from '../../../utils/workflow/workflow-helpers';
import { getRequestDocuments } from '../list-request/request-inline-edit-helper';

export default {
  components: {
    ProviderTaskProgress,
  },
  props: {
    isProgressLoading: {
      type: Boolean,
      default: false,
    },
    providerTaskProgress: {
      type: Object,
      default: null,
    },
    isPortalCat: {
      type: Boolean,
    },
    isPreviousProviderTaskFinished: {
      type: Boolean,
      default: false,
    },
    isTaskIncludedInGroup: {
      type: Boolean,
      default: false,
    },
    previousTask: {
      type: Object,
      default: null,
    },
    isUserIpAllowed: {
      type: Boolean,
      default: false,
    },
    pcErrors: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    taskProgress() {
      if (!_.isNil(this.providerTaskProgress)) {
        const ability = _.get(this, 'task.ability');
        const progress = getProgressByTask(ability, this.providerTaskProgress);
        if (_.isNil(progress)) {
          return;
        }
        const numWordsTotal = _.get(this, 'providerTaskProgress.assignedWordsTotal');
        return (progress / numWordsTotal) * 100;
      }
    },
    isPortalCatSupported() {
      const ability = _.get(this, 'task.ability') || '';
      return isPortalCatSupported(ability);
    },
    documents() {
      return getRequestDocuments(this.request.languageCombinations);
    },
    areAllDocumentsDeletedByRetentionPolicy() {
      if (_.isEmpty(this.documents)) {
        return false;
      }
      return this.documents.every(doc => !_.isNil(doc.deletedByRetentionPolicyAt));
    },
    relevantPcErrors() {
      const srcLangIsoCode = _.get(this, 'workflow.srcLang.isoCode');
      const tgtLangIsoCode = _.get(this, 'workflow.tgtLang.isoCode');
      return _.filter(this.pcErrors, error => error.srcLang === srcLangIsoCode
          && error.tgtLang === tgtLangIsoCode);
    },
    shouldDisplayPcErrorByType() {
      const pcErrors = _.defaultTo(this.relevantPcErrors, []);
      const importErrors = pcErrors.find(error => _.get(error, 'type') === 'import');
      const mtErrors = pcErrors.find(error => _.get(error, 'type') === 'mt');
      if (!_.isEmpty(importErrors)) {
        return true;
      } else if (!_.isEmpty(mtErrors)) {
        return _.get(this, 'workflow.useMt', false);
      }
    },
    shouldDisplayPcError() {
      return this.isOwnTask && !_.isEmpty(this.relevantPcErrors) && this.shouldDisplayPcErrorByType;
    },
    canEnterPortalCatOwnTask() {
      if (!this.isOwnTask) {
        return false;
      }
      const ability = _.get(this, 'task.ability', '');
      if (isProjectManagementTask(ability)) {
        return true;
      }
      if (isPortalCatPreflightTask(ability)) {
        return this.hasRole('PIPELINE-RUN_UPDATE_ALL');
      }
      const canEnterDueToPrevTask =
        this.isPreviousProviderTaskFinished || this.isTaskIncludedInGroup;
      return canEnterDueToPrevTask &&
        this.isPortalCatSupported &&
        this.hasRole({ oneOf: ['TASK_READ_OWN', 'TASK_UPDATE_OWN'] });
    },
    canEnterPortalCat() {
      if (_.isNil(this.taskProvider)) {
        return false;
      }
      const canEnterAll = this.hasRole({ oneOf: ['WORKFLOW_READ_ALL', 'WORKFLOW_UPDATE_ALL'] });
      return !this.areAllDocumentsDeletedByRetentionPolicy &&
        this.isUserIpAllowed && (canEnterAll || this.canEnterPortalCatOwnTask);
    },
    hasFiles() {
      return _.get(this, 'providerTask.files.length', 0) > 0;
    },
    hasNotes() {
      return _.get(this, 'providerTask.notes.length', 0) > 0;
    },
  },
  methods: {
    navigateToPortalCat() {
      if (this.canEnterPortalCat) {
        this.$router.push(`portal-cat?workflowId=${this.workflowId}&taskId=${_.get(this, 'task._id')}&ptId=${this.providerTask._id}`);
      }
    },
    isLastBillDetails(index) {
      return index === _.get(this.providerTask, 'billDetails', []).length - 1;
    },
  },
};
