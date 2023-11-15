import _ from 'lodash';
import { mapActions } from 'vuex';
import { updateFailedNotification } from '../utils/notifications';

const REQUEST_UPDATE_FAILED_MESSAGE = 'This request was changed from a different browser window or tab. To see the new content, open this page in a new tab or refresh this page.';
export const requestErrorMixin = {
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    _onUpdateError(httpResponse) {
      const notification = this.getNotificationErrorData(httpResponse);
      notification.response = httpResponse;
      return this.pushNotification(notification);
    },
    getNotificationErrorData(httpResponse) {
      let message = _.get(httpResponse, 'status.message');
      const requestUpdateFailedRegExp = new RegExp(REQUEST_UPDATE_FAILED_MESSAGE, 'g');
      switch (_.get(httpResponse, 'status.code')) {
        case 409:
          if (requestUpdateFailedRegExp.test(message)) {
            message = REQUEST_UPDATE_FAILED_MESSAGE;
          }
          return {
            title: 'Request update failed',
            message,
            state: 'warning',
          };
        default:
          return updateFailedNotification('request');
      }
    },
  },
};
