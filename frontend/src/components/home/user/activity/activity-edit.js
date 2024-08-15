import _ from 'lodash';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import activityMixin from '../../../../mixins/activity-mixin';
import userRoleCheckMixin from '../../../../mixins/user-role-check';
import ActivityTypeSelector from '../../../activity/activity-type-selector.vue';
import RichTextEditor from '../../../rich-text-editor/rich-text-editor.vue';
import UserAjaxMultiSelect from '../../../form/user-ajax-multi-select.vue';
import ActivityFeedbackDetails from './activity-feedback-details.vue';
import ActivityUserNoteDetails from './activity-user-note-details.vue';
import ActivityEmailDetails from './activity-email-details.vue';

let initialTags = [];
const CREATE_ROLES = [
  'ACTIVITY-NC-CC_CREATE_ALL',
  'ACTIVITY-NC-CC_UPDATE_ALL',
  'ACTIVITY-NC-CC_CREATE_OWN',
  'ACTIVITY-NC-CC_UPDATE_OWN',
  'ACTIVITY-VES1_CREATE_ALL',
  'ACTIVITY-VES1_UPDATE_ALL',
  'ACTIVITY-VES2_CREATE_ALL',
  'ACTIVITY-VES2_UPDATE_ALL',
  'ACTIVITY-VES-T_CREATE_ALL',
  'ACTIVITY-VES-T_UPDATE_ALL',
  'ACTIVITY-VES-B_CREATE_ALL',
  'ACTIVITY-VES-B_UPDATE_ALL',
  'ACTIVITY-CA_CREATE_ALL',
  'ACTIVITY-CA_UPDATE_ALL',
  'ACTIVITY-FR_CREATE_ALL',
  'ACTIVITY-FR_UPDATE_ALL',
  'ACTIVITY-NC-CC_CREATE_DEPARTMENT',
  'ACTIVITY-NC-CC_UPDATE_DEPARTMENT',
  'ACTIVITY-EMAIL_CREATE_ALL',
  'ACTIVITY-EMAIL_CREATE_OWN',
  'ACTIVITY-USER-NOTE_CREATE_ALL',
];
const USER_NOTE_UPDATE_ROLES = ['ACTIVITY-USER-NOTE_CREATE_ALL'];
const EMAIL_UPDATE_ROLES = [
  'USER_UPDATE_ALL',
  'ACTIVITY-EMAIL_UPDATE_ALL',
  'ACTIVITY-EMAIL_UPDATE_OWN',
];
const FEEDBACK_UPDATE_ROLES_TAGS_HEAP = {
  own: {
    'Feedback Received': 'ACTIVITY-FR_UPDATE_OWN',
    'Escalation 1': 'ACTIVITY-VES1_UPDATE_OWN',
    'Escalation 2': 'ACTIVITY-VES2_UPDATE_OWN',
    'Escalation Termination': 'ACTIVITY-VES-T_UPDATE_OWN',
    'Escalation Bypass': 'ACTIVITY-VES-B_UPDATE_OWN',
    'Non-Conformance': 'ACTIVITY-NC-CC_UPDATE_OWN',
    'Client Complaint': 'ACTIVITY-NC-CC_UPDATE_OWN',
    'Competence Audit': 'ACTIVITY-CA_UPDATE_OWN',
  },
  all: {
    'Feedback Received': 'ACTIVITY-FR_UPDATE_ALL',
    'Escalation 1': 'ACTIVITY-VES1_UPDATE_ALL',
    'Escalation 2': 'ACTIVITY-VES2_UPDATE_ALL',
    'Escalation Termination': 'ACTIVITY-VES-T_UPDATE_ALL',
    'Escalation Bypass': 'ACTIVITY-VES-B_UPDATE_ALL',
    'Non-Conformance': 'ACTIVITY-NC-CC_UPDATE_ALL',
    'Client Complaint': 'ACTIVITY-NC-CC_UPDATE_ALL',
    'Competence Audit': 'ACTIVITY-CA_CREATE_ALL',
  },
  department: {
    'Non-Conformance': 'ACTIVITY-NC-CC_UPDATE_DEPARTMENT',
    'Client Complaint': 'ACTIVITY-NC-CC_UPDATE_DEPARTMENT',
  },
};

export default {
  mixins: [entityEditMixin, activityMixin, userRoleCheckMixin],
  components: {
    ActivityTypeSelector,
    RichTextEditor,
    UserAjaxMultiSelect,
    ActivityUserNoteDetails,
    ActivityFeedbackDetails,
    ActivityEmailDetails,
  },
  created() {
    const activityTemplate = _.get(this.$route, 'params.activityTemplate');
    if (_.isObject(activityTemplate)) {
      Object.assign(this.activity, activityTemplate);
    }
    initialTags = this.activity.tags;
  },
  computed: {
    canEditOwn() {
      if (!this.activity.activityType) {
        return false;
      }
      return this.canEditOwnEmail || this.canEditOwnUserNote || this.canEditOwnFeedback;
    },
    canEditOwnEmail() {
      return (this.activity.activityType === 'Email' && EMAIL_UPDATE_ROLES.some((r) => this.hasRole(r)));
    },
    canEditOwnUserNote() {
      return (this.activity.activityType === 'User Note' && USER_NOTE_UPDATE_ROLES.some((r) => this.hasRole(r)));
    },
    canEditOwnFeedback() {
      return _.some(
        _.concat(this.activity.tags, initialTags),
        (t) => this.hasRole(FEEDBACK_UPDATE_ROLES_TAGS_HEAP.own[t]),
      );
    },
    canCreate() {
      return CREATE_ROLES.some((role) => this.hasRole(role));
    },
    canCreateOrEdit() {
      return (!this.isNew && this.canEdit) || (this.isNew && this.canCreate);
    },
    canOnlyEdit() {
      return !this.isNew && this.canEdit;
    },
    canEdit() {
      if (!this.activity.activityType) {
        return false;
      }
      const tags = _.concat(this.activity.tags, initialTags);
      return (
        this.canEditOwnEmail
        || this.canEditOwnUserNote
        || tags.some(
          (t) => this.hasRole(FEEDBACK_UPDATE_ROLES_TAGS_HEAP.all[t])
                || this.hasRole(FEEDBACK_UPDATE_ROLES_TAGS_HEAP.department[t]),
        )
        || (this.isCreator && this.canEditOwn)
      );
    },
  },
  methods: {
    onDocumentsUpdate() {
      this._initialize(this.activity._id);
    },
    close() {
      this.$router.go(-1);
    },
  },
};
