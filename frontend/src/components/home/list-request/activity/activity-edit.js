import moment from 'moment';
import _ from 'lodash';
import { mapGetters } from 'vuex';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import { hasRole } from '../../../../utils/user';
import activityMixin from '../../../../mixins/activity-mixin';
import RichTextEditor from '../../../rich-text-editor/rich-text-editor.vue';
import UserAjaxMultiSelect from '../../../form/user-ajax-multi-select.vue';
import ActivityTypeSelector from '../../../activity/activity-type-selector.vue';
import ActivityEmailDetails from './activity-email-details.vue';
import ActivityService from '../../../../services/activity-service';
import SchedulerService from '../../../../services/scheduler-service';
import { successNotification, errorNotification } from '../../../../utils/notifications';

const activityService = new ActivityService();
const schedulerService = new SchedulerService();

export default {
  mixins: [entityEditMixin, activityMixin],
  components: {
    ActivityTypeSelector,
    RichTextEditor,
    UserAjaxMultiSelect,
    ActivityEmailDetails,
  },
  data() {
    return {
      sendingQuote: false,
    };
  },
  created() {
    const activityTemplate = _.get(this.$route, 'params.activityTemplate');
    if (!_.isNil(activityTemplate) && this.isNew) {
      Object.assign(this.activity, activityTemplate);
    }
    if (this.isNew) {
      const query = {
        filter: JSON.stringify({
          __tz: moment().utcOffset(),
          name: 'quote-pending-approval-contact',
        }),
      };
      if (_.isEmpty(_.get(this, 'activity.emailDetails.from', ''))) {
        this.httpRequesting = true;
        schedulerService.retrieve(query).then((response) => {
          const scheduler = _.get(response, 'data.list[0]');
          this.activity.emailDetails.from = _.get(scheduler, 'email.from', '');
        }).finally(() => {
          this.httpRequesting = false;
        });
      }
    }
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate() {
      return hasRole(this.userLogged, 'ACTIVITY-EMAIL_CREATE_ALL');
    },
    canEdit() {
      return hasRole(this.userLogged, 'ACTIVITY-EMAIL_UPDATE_ALL');
    },
    sendButtonText() {
      return this.activity.emailDetails.isQuoteSent ? 'Resend Quote' : 'Send Quote';
    },
    dateSent() {
      if (_.get(this, 'activity.emailDetails.isQuoteSent', false)) {
        return _.get(this, 'activity.dateSent', new Date());
      }
      return null;
    },
  },
  methods: {
    _handleCreate(response) {
      this.$set(this.activity, '_id', response.data.activity._id);
      this._handleRetrieve(response);
    },
    close() {
      this.$router.push({
        name: 'request-edition',
        params: {
          entityId: _.get(this, '$route.params.requestId'),
        },
      }).catch((err) => { console.log(err); });
    },
    saveActivity() {
      return new Promise((resolve) => {
        if (_.isEmpty(this.activity._id)) {
          this.save().then(() => {
            const waitSuccessfulSave = setInterval(() => {
              if (!_.isEmpty(this.activity._id)) {
                clearInterval(waitSuccessfulSave);
                resolve();
              }
            }, 500);
          });
        } else {
          resolve();
        }
      });
    },
    sendQuote() {
      this.sendingQuote = true;
      this.activity.emailDetails.requests = [this.$route.params.requestId];
      this.saveActivity()
        .then(() =>
          activityService
            .sendQuote(this.activity._id)
            .then((response) => {
              this.activity.readDate = _.get(response, 'data.activity.readDate', new Date());
              this.pushNotification(successNotification('Quote was sent successfully'));
              this.activity.dateSent = _.get(response, 'data.activity.dateSent', new Date());
              this.activity.emailDetails.scheduledAt = _.get(response, 'data.activity.emailDetails.scheduledAt', new Date());
              this.activity.emailDetails.isQuoteSent = true;
            })
            .catch((err) => {
              const message = _.get(err, 'status.message');
              this.pushNotification(errorNotification(`Failed to send quote. ${message}`, 3, err));
            })
            .finally(() => {
              this.sendingQuote = false;
              this.httpRequesting = false;
            }),
        );
    },
    save() {
      if (this.isValid) {
        const activity = this._prepareActivity();
        activity.emailDetails.requests = [this.$route.params.requestId];
        this._save(activity);
      }
      return Promise.resolve();
    },
  },
};
