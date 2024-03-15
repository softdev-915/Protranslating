import _ from 'lodash';
import { hasRole } from '../../../../utils/user';

import activityEmailDetailsMixin from '../../../../mixins/activity-email-details-mixin';

const CREATE_ROLES = ['ACTIVITY-EMAIL_CREATE_ALL', 'ACTIVITY-EMAIL_CREATE_OWN'];
const UPDATE_ROLES = ['ACTIVITY-EMAIL_UPDATE_ALL', 'ACTIVITY-EMAIL_UPDATE_OWN'];

export default {
  name: 'activity-email-details',
  mixins: [activityEmailDetailsMixin],
  created() {
    if (_.isEmpty(this.activity._id) && _.get(this.activity, 'emailDetails.embeddedAttachments.length') > 0) {
      const newAttachment = this.activity.emailDetails.embeddedAttachments[0];
      this.activity.emailDetails.embeddedAttachments = [];
      this.uploadAttachment(newAttachment);
    }
  },
  computed: {
    canCreate() {
      return CREATE_ROLES.some((role) => hasRole(this.userLogged, role));
    },
    canEdit() {
      return UPDATE_ROLES.some((role) => hasRole(this.userLogged, role));
    },
  },
};
