import _ from 'lodash';
import moment from 'moment';
import { mapGetters, mapActions } from 'vuex';
import { toUserName } from '../utils/user';
import { entityEditMixin } from './entity-edit';
import ActivityService from '../services/activity-service';
import { defaultFeedbackDetails, defaultUserNoteDetails, defaultEmailDetails } from '../components/activity/activity-helpers';

const activityService = new ActivityService();
const activityTypeHeap = {
  Feedback: 'feedbackDetails',
  'User Note': 'userNoteDetails',
  Email: 'emailDetails',
};
const activityDefaultDetailsHeap = {
  Feedback: defaultFeedbackDetails,
  'User Note': defaultUserNoteDetails,
  Email: defaultEmailDetails,
};
const ACTIVITY_TYPE_EMAIL = 'Email';
const OPPORTUNITY_NA = 'NA';
const buildInitialState = () => ({
  activity: {
    activityType: '',
    activityCreatedBy: '',
    dateSent: moment(),
    users: [],
    subject: '',
    body: '',
    comments: '',
    tags: [],
    feedbackDetails: defaultFeedbackDetails(),
    userNoteDetails: defaultUserNoteDetails(),
    emailDetails: defaultEmailDetails(),
    deleted: false,
    readDate: null,
    isImported: false,
  },
  showFileUpload: false,
  parsedEml: null,
  isFeedbackDetailsValid: false,
  isUserNoteDetailsValid: false,
  isEmailDetailsValid: false,
});

export default {
  inject: ['$validator'],
  mixins: [entityEditMixin],
  data() {
    return buildInitialState();
  },
  watch: {
    emlUpload: {
      handler: function (newVal) {
        if (!_.isNil(newVal)) {
          this.activity.isImported = true;
          this.activity.activityType = 'Email';
          this.activity.dateSent = moment(newVal.date);
          this.parsedEml = newVal;
          this.setEmlUpload(null);
        }
      },
      immediate: true,
    },
  },
  created() {
    if (_.isEmpty(this.activity._id)) {
      this.activity.activityCreatedBy = this.userLoggedFullName;
    }
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    ...mapGetters('eml', ['emlUpload']),
    usersNames() {
      if (Array.isArray(this.activity.users)) {
        return this.activity.users.map((u) => u.name);
      }
      return [];
    },
    entityName() {
      return 'activity';
    },
    isCreator() {
      return !this.isNew && this.activity.createdBy === this.userLogged.email;
    },
    usersMustBeShown: function () {
      return this.activity.activityType === 'User Note' || this.activity.activityType === 'Feedback';
    },
    cancelText: function () {
      return this.canEdit ? 'Close' : 'Exit';
    },
    isNew: function () {
      return !this.activity._id;
    },
    isValidActivityType: function () {
      return !!_.get(this, 'activity.activityType.length', 0);
    },
    isValidUsers: function () {
      return !!_.get(this, 'activity.users.length', 0);
    },
    isValid: function () {
      return this.isValidActivityType
        && ((this.activity.activityType === 'Email' && this.isActivityEmailValid)
          || (this.isValidUsers
            && ((this.activity.activityType === 'User Note' && this.isUserNoteDetailsValid)
              || (this.activity.activityType === 'Feedback' && this.isFeedbackDetailsValid))));
    },
    isActivityEmailValid: function () {
      return this.activity.dateSent && this.isEmailDetailsValid;
    },
    isTypeSelectDisabled: function () {
      return !this.isNew || this.activity.emailDetails.isInvoice;
    },
    userLoggedFullName: function () {
      return `${this.userLogged.firstName} ${this.userLogged.lastName}`;
    },
    localDateSent: function () {
      return moment(this.activity.dateSent).format('MM-DD-YYYY HH:MM');
    },
    selectedUsers: function () {
      return this.activity.users.map((o) => ({
        value: o._id,
        text: (typeof o.name === 'undefined') ? toUserName(o) : o.name,
      }));
    },
    getActivityType: function () {
      return _.get(this, 'activity.activityType');
    },
    isInvoiceActivity() {
      return _.get(this.activity, 'emailDetails.isInvoice', false);
    },
    isImportedActivity() {
      return _.get(this.activity, 'isImported', false);
    },
    canSendEmail() {
      return !this.isNew && this.isInvoiceActivity && !this.isImportedActivity;
    },
    sendEmailBtnText() {
      return _.isEmpty(_.get(this.activity, 'emailDetails.scheduledAt')) ? 'Send' : 'Resend';
    },
  },
  methods: {
    ...mapActions('eml', ['setEmlUpload']),
    ...mapActions('notifications', ['pushNotification']),
    _service() {
      return activityService;
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.activity.readDate');
      const retrivedActivity = response.data.activity;
      this._afterEntityRetrieve(retrivedActivity);
      if (newReadDate) {
        this.activity.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this._afterEntityRetrieve(freshEntity);
    },
    _handleRetrieve(response) {
      const retrievedActivity = response.data.activity;
      if (retrievedActivity) {
        this._afterEntityRetrieve(retrievedActivity);
      }
    },
    _afterEntityRetrieve(activity) {
      const activeTypeDetails = _.get(activityTypeHeap, activity.activityType, '');
      // If activityType is defined return it, if not, returns a function
      // that returns an empty object
      const defaultActiveTypeDetails = _.get(
        activityDefaultDetailsHeap, activity.activityType, () => { },
      );

      if (activeTypeDetails) {
        activity[activeTypeDetails] = activity[activeTypeDetails]
          ? _.merge({}, defaultActiveTypeDetails(), activity[activeTypeDetails])
          : defaultActiveTypeDetails();
      }
      if (
        activity.activityType === ACTIVITY_TYPE_EMAIL
        && _.isEmpty(activity.emailDetails.opportunities)
      ) {
        activity.emailDetails.opportunities = [{ _id: OPPORTUNITY_NA, no: OPPORTUNITY_NA }];
      }
      this.activity = { ...activity };
    },
    _handleCreate(response) {
      this.$set(this.activity, '_id', response.data.activity._id);
      this._handleRetrieve(response);
      if (this.activity.activityType === 'Feedback') {
        _.forEach(this.activity.feedbackDetails.documents, (d) => {
          _.forEach(d, (v) => {
            v.isNew = false;
          });
        });
      }
    },
    emailActivityUrlResolver() {
      return activityService.getEmailActivityDocumentUrl.bind(activityService);
    },
    onEmailDetailsValidate(value) {
      this.isEmailDetailsValid = value;
    },
    onFeedbackDetailsValidate(value) {
      this.isFeedbackDetailsValid = value;
    },
    onUserNoteDetailsValidate(value) {
      this.isUserNoteDetailsValid = value;
    },
    manageTags() {
      this.$emit('activity-tag-manage');
    },
    validateBeforeSubmit() {
      this.$validator.validateAll().then(() => {
        this.save();
      });
    },
    onUserSelected(users) {
      this.activity.users = this.activity.users || [];
      this.activity.users = users.map((u) => ({
        _id: u.value,
        name: u.text,
      }));
    },
    navigateUserGrid(userOption) {
      const selectedUser = _.get(this.activity, 'users', [])
        .find((u) => u._id === userOption.value);
      if (_.has(selectedUser, 'email')) {
        const { email } = selectedUser;
        this.onUserManage({ filter: JSON.stringify({ email }) });
      }
    },
    onUserManage(query) {
      this.$emit('user-manage', query);
    },
    uploadFile() {
      this.showFileUpload = true;
    },
    sendInvoiceEmail() {
      activityService.sendInvoiceEmail(this.activity._id)
        .then((response) => {
          const activity = _.get(response, 'data.activity');
          Object.assign(this.activity.emailDetails, activity.emailDetails);
          const notification = {
            title: 'Success',
            message: 'Notification was sent',
            state: 'success',
          };
          this.pushNotification(notification);
        })
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: 'Failed to send notification',
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        });
    },
    _prepareActivity() {
      const activity = _.cloneDeep(this.activity);
      const activeTypeDetails = activityTypeHeap[_.get(activity, 'activityType', '')];

      if (typeof activeTypeDetails !== 'undefined') {
        if (activeTypeDetails === 'feedbackDetails' && activity[activeTypeDetails]) {
          _.forEach(['nonComplianceClientComplaintCategory'], (pr) => (!_.get(activity, `feedbackDetails.${pr}.length`, 0)
          && delete activity[activeTypeDetails][pr]));
          if (!_.get(activity, 'feedbackDetails.company._id', false)) {
            delete activity.feedbackDetails.company;
          } else {
            activity.feedbackDetails.company = activity.feedbackDetails.company._id;
          }
          if (!Array.isArray(_.get(activity, 'feedbackDetails.requests'))) {
            delete activity.feedbackDetails.company;
          } else {
            activity.feedbackDetails.requests = activity.feedbackDetails.requests.map((r) => r._id);
          }
          activity.users = activity.users.map((u) => {
            u.name = (typeof u.name === 'undefined') ? toUserName(u) : u.name;
            return u;
          });
        } else if (activeTypeDetails === activityTypeHeap.Email && activity[activeTypeDetails]) {
          const companyId = _.get(activity, 'emailDetails.company', null);
          activity.emailDetails.company = companyId;

          if (activity.emailDetails.opportunities) {
            const { opportunities } = activity.emailDetails;
            activity.emailDetails.opportunities = opportunities
              .filter((o) => o._id !== 'NA')
              .map((o) => o._id);
          }

          const requests = _.get(activity, 'emailDetails.requests', []);
          activity.emailDetails.requests = requests.map((o) => o._id);
        }

        _.forEach(_.values(activityTypeHeap), (type) => {
          if (type !== activeTypeDetails) {
            delete activity[type];
          }
        });

        const internalDepartments = _.get(activity, `${activeTypeDetails}.internalDepartments`, []);
        activity[activeTypeDetails].internalDepartments = internalDepartments
          .map((it) => it._id || it);
      }
      return activity;
    },
    save() {
      if (this.isValid) {
        const activity = this._prepareActivity();
        this._save(activity);
      }
    },
  },
};
