import _ from 'lodash';
import WorkflowsTemplateSelect from './workflow-templates-select.vue';
import userRoleCheckMixin from '../../../../mixins/user-role-check';
import WorkflowTemplateService from '../../../../services/workflow-template-service';
import LmsConfirmModal from '../../../modal/lms-confirm-modal.vue';
import LmsModal from '../../../modal/lms-modal.vue';
import notificationMixin from '../../../../mixins/notification-mixin';

const EMPTY_LANGUAGE_COMBINATION = 'None-None';
const ensureNotEmpty = language => (_.isEmpty(language) ? 'None' : language);
const reduceWorkflowsLanguages = (combinations, workflow) => {
  const srcLangName = _.get(workflow, 'srcLang.name');
  const tgtLangName = _.get(workflow, 'tgtLang.name');

  combinations.add(`${ensureNotEmpty(srcLangName)}-${ensureNotEmpty(tgtLangName)}`);
  return combinations;
};
const reduceRequestLanguages = (uniqueCombinations, combo) => {
  combo.srcLangs.forEach((srcLang) => {
    combo.tgtLangs.forEach((tgtLang) => {
      const srcLangProp = _.get(srcLang, 'name', '').trim();
      const tgtLangProp = _.get(tgtLang, 'name', '').trim();
      uniqueCombinations.add(`${srcLangProp}-${tgtLangProp}`);
    });
  });
  return uniqueCombinations;
};
const isNameConflict = err => _.get(err, 'status.code') === 409;
const NOT_STARTED_STATUS = 'notStarted';
const WARNING_TITLE = 'Warning!';
const REQUEST_CHANGED_WARNING = 'You have made changes on the request level. Do you want to save them before you continue?';
const confirmOverwriteMessage = templateName => `This action will overwrite existing template ${templateName}! Are you sure you want to overwrite it?`;
const confirmMissingLangsMessage = templateName => `The selected workflow template ${templateName} does not contain all language combinations found in the current request, some workflows will not be created. Do you want to continue?`;
const applyMessage = templateName => `You are about to load the following template ${templateName}. Are you sure you want to use this template?`;

export default {
  name: 'WorkflowsTemplateSection',
  mixins: [userRoleCheckMixin, notificationMixin],
  components: {
    WorkflowsTemplateSelect,
    LmsConfirmModal,
    LmsModal,
  },
  props: {
    request: {
      type: Object,
      required: true,
    },
    selectedWorkflows: {
      type: Array,
      required: true,
    },
    isWorkflowInEditMode: {
      type: Boolean,
      required: true,
    },
    onRequestUpdate: {
      type: Function,
      required: true,
    },
    hasRequestChanged: {
      type: Boolean,
      required: true,
    },
  },
  data: () => ({
    isSelectVisible: false,
    isSaveModalShown: false,
    templateWorkflows: [],
    modal: {},
    templateName: '',
    languageCombinations: '',
  }),
  created() {
    this.service = new WorkflowTemplateService();
  },
  watch: {
    templateName: {
      handler(value) {
        if (!value.startsWith(this.templateNamePreffix)) {
          this.templateName = this.templateNamePreffix;
        }
      },
      immediate: true,
    },
  },
  computed: {
    canReadTemplates() {
      return this.hasRole('WORKFLOW-TEMPLATE_READ_ALL');
    },
    canCreateTemplates() {
      return this.hasRole('WORKFLOW-TEMPLATE_CREATE_ALL');
    },
    canUpdateTemplates() {
      return this.hasRole('WORKFLOW-TEMPLATE_UPDATE_ALL');
    },
    canToggleTemplatesSelector() {
      return this.request.workflows.length === 0;
    },
    templateButtonText() {
      return this.request.workflowTemplate || 'Select Workflow Template';
    },
    isCreateButtonDisabled() {
      return !this.canCreateTemplates
        || this.isWorkflowInEditMode
        || _.isEmpty(this.selectedWorkflows);
    },
    templateNamePreffix() {
      return `${this.request.company.name}_`;
    },
    doesNamesExceedsMaxLength() {
      return this.templateName.length > 128;
    },
    isTemplateNameValid() {
      return this.templateName.length > this.templateNamePreffix.length
        && !this.doesNamesExceedsMaxLength;
    },
    requestLanguageCombinations() {
      return [...this.request.languageCombinations.reduce(reduceRequestLanguages, new Set())];
    },
    doesTemplateApplied() {
      return !_.isEmpty(this.request.workflowTemplate);
    },
  },
  methods: {
    toggleTemplateSelector() {
      this.isSelectVisible = !this.isSelectVisible;
    },
    openSaveModal() {
      this.templateName = '';
      this.isSaveModalShown = true;
    },
    closeSaveModal() {
      this.isSaveModalShown = false;
    },
    saveTemplate(overwrite = false) {
      const templateData = {
        requestId: this.request._id,
        name: this.templateName,
        workflows: this.templateWorkflows,
      };

      this.service.create(templateData, overwrite)
        .then((res) => {
          this.pushSuccess(`Workflow template ${res.data.workflowTemplate} was successfully created`);
          this.onRequestUpdate(res);
        })
        .catch((err) => {
          if (isNameConflict(err)) {
            this.modal = {
              title: WARNING_TITLE,
              message: confirmOverwriteMessage(this.templateName),
              onSubmit: this.saveTemplate.bind(this, true),
              modalDataE2e: 'template-overwrite-modal',
            };
            return;
          }
          const errMessage = _.get(err, 'status.message', '');
          this.pushError(`Failed to create template: ${errMessage}`);
        })
        .finally(() => this.closeSaveModal());
    },
    applyTemplate(value) {
      this.ensureRequestNotChangedAndRun(() => {
        this.modal = {
          message: applyMessage(value.name),
          onSubmit: this._applyTemplate.bind(this, value),
          cancelText: 'Cancel',
          modalDataE2e: 'template-apply-confirmation-modal',
        };
      });
    },
    prepareTemplate() {
      this.ensureRequestNotChangedAndRun(this._prepareTemplate);
    },
    validateWorkflows(workflows) {
      workflows.forEach((workflow) => {
        workflow.tasks.forEach((task) => {
          task.providerTasks.forEach((providerTask) => {
            if (providerTask.status !== NOT_STARTED_STATUS) {
              throw new Error('Workflows can NOT be saved as a template if any task status is other than "Not Started"');
            }
          });
        });
      });
    },
    _prepareTemplate() {
      const workflowsToInclude = this.request.workflows
        .filter((wf, index) => this.selectedWorkflows.includes(index));
      try {
        this.validateWorkflows(workflowsToInclude);
        const languageCombinations = workflowsToInclude.reduce(reduceWorkflowsLanguages, new Set());
        this.templateWorkflows = workflowsToInclude.map(wf => wf._id);
        this.languageCombinations = Array.from(languageCombinations).join(', ');
        this.openSaveModal();
      } catch (err) {
        this.pushError(err.message || 'Failed to prepare template');
      }
    },
    _applyTemplate(value) {
      const hasAllCombinations = _.isEqual(
        this.requestLanguageCombinations.sort(),
        value.languageCombinations.filter(combo => combo !== EMPTY_LANGUAGE_COMBINATION).sort()
      );

      if (hasAllCombinations) {
        return this.confirmTemplateApply(value._id, { requestId: this.request._id });
      }

      this.modal = {
        title: WARNING_TITLE,
        message: confirmMissingLangsMessage(value.name),
        onSubmit: this.confirmTemplateApply.bind(this, value._id, { requestId: this.request._id }),
        modalDataE2e: 'template-combinations-warning-modal',
      };
    },
    confirmTemplateApply(templateId, data) {
      this.service.apply(templateId, data)
        .then(res => this.onRequestUpdate(res))
        .then(() => this.$emit('expand-workflows'))
        .catch(err => this.pushError(err.message || 'Failed to apply template'));
    },
    ensureRequestNotChangedAndRun(callback) {
      if (!this.hasRequestChanged) {
        return callback();
      }
      this.modal = {
        title: WARNING_TITLE,
        message: REQUEST_CHANGED_WARNING,
        onSubmit: () => {
          this.$emit('save-request');
          this.$parent.$once('request-saved', callback);
        },
        onCancel: () => {
          this.$emit('reset-request');
          callback();
        },
        modalDataE2e: 'request-changes-modal',
      };
    },
  },
};
