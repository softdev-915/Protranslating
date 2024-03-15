import _ from 'lodash';
import { defaultActivity } from '../../../activity/activity-helpers';
import activityEmailDetailsMixin from '../../../../mixins/activity-email-details-mixin';

const NA = 'NA';

export default {
  name: 'activity-email-details',
  mixins: [activityEmailDetailsMixin],
  created() {
    this.$emit('validate-activity-email', this.isValid);
    if (_.get(this.activity, 'emailDetails.company')
      && _.get(this.activity, 'emailDetails.opportunities.length') === 0) {
      this.activity.emailDetails.opportunities.push({
        _id: NA,
        no: NA,
      });
    }
    if (_.isEmpty(this.activity._id) && _.get(this.activity, 'emailDetails.embeddedAttachments.length') > 0) {
      const newAttachment = this.activity.emailDetails.embeddedAttachments[0];
      this.activity.emailDetails.embeddedAttachments = [];
      if (_.get(newAttachment, 'value')) {
        this.uploadAttachment(newAttachment);
      }
    }
    this.activity.emailDetails.isQuote = true;
  },
  data() {
    return {
      activity: defaultActivity(),
      requestFilesConfig: {
        visibleColumns: ['Filename', 'Size', 'Download'],
      },
      attachmentsLoading: false,
    };
  },
  watch: {
    'activity.tags'(newVal) {
      if (!newVal.includes('Quote')) {
        newVal.push('Quote');
      }
    },
    isRequestSelectDisabled(newVal) {
      if (newVal && this.isNew) {
        this.activity.emailDetails.requests = [];
      }
    },
  },
};
