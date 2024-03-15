import _ from 'lodash';
import moment from 'moment';
import { mapActions, mapGetters } from 'vuex';
import sessionObserver from '../../utils/observers/session';
import UserToastService from '../../services/user-toast-service';

const DANGER_NOTIFICATION_TYPE = 'danger';
const userToastService = new UserToastService();
const _toNotification = (userToast) => {
  const notification = {
    _id: userToast._id,
    title: userToast.title,
    message: userToast.message,
    state: userToast.state,
  };
  if (userToast.ttl) {
    notification.ttl = userToast.ttl;
  }
  return notification;
};

export default {
  props: {
    intervalSeconds: {
      type: Number,
      default: 360,
    },
    allowAutoDismiss: {
      type: Boolean,
      default: false,
    },
  },
  created() {
    sessionObserver.addObserver(this);
  },
  data() {
    return {
      oldNotificationLength: 0,
      pollInterval: null,
    };
  },
  watch: {
    notifications(newNotifications) {
      const newNotificationLength = newNotifications.length;
      if (newNotificationLength > this.oldNotificationLength && this.allowAutoDismiss) {
        const startIndex = newNotificationLength - this.oldNotificationLength - 1;
        for (let i = startIndex; i < newNotificationLength; i++) {
          const newNotification = newNotifications[i];
          if (newNotification.ttl) {
            const self = this;
            if (!newNotification.ttlTimeout) {
              newNotification.ttlTimeout = setTimeout(() => {
                self.removeNotification(newNotification, true);
              }, newNotification.ttl * 1000);
            }
          }
        }
      }
      this.oldNotificationLength = newNotifications.length;
    },
    globalEvent({ event }) {
      if (_.isNil(event)) {
        return;
      }
      // create a copy of the array in order to process all items in it
      // otherwise the first call will remove the array's element causing
      // the algorithm to miss elements
      this.notifications.slice(0).filter((n) => Math.abs(moment().diff(n.createdAt, 'seconds')) > 1).forEach((n) => {
        this.removeNotification(n, false);
      });
    },
  },
  computed: {
    ...mapGetters('app', [
      'userLogged',
      'globalEvent',
    ]),
    ...mapGetters('notifications', [
      'notifications',
    ]),
    e2eTypes() {
      return this.notifications.map((n) => {
        const type = n._id ? 'user-toast' : 'action-toast';
        return type;
      });
    },
  },
  methods: {
    ...mapActions('notifications', ['clearNotifications', 'deleteNotification', 'pushNotification']),
    onNotificationHtmlClick(notification) {
      if (_.isFunction(notification.onClick)) {
        notification.onClick();
      }
    },
    onLogin(user) {
      this._startInterval(user);
    },
    onLogout() {
      this._clearInterval();
    },
    getNotificationClass(notification) {
      let baseClasses = 'alert';
      if (notification.ttl) {
        baseClasses += ' alert-dismissible';
      }
      return `${baseClasses} alert-${notification.state}`;
    },
    cancelTimeout(notification) {
      if (notification.ttlTimeout) {
        clearTimeout(notification.ttlTimeout);
        delete notification.ttlTimeout;
      }
    },
    showStack(event, notification) {
      this.cancelTimeout(notification);
      event.srcElement.nextElementSibling.style.display = 'inherit';
      event.srcElement.style.display = 'none';
    },
    getErrorMessage(notification) {
      return _.get(notification, 'response.status.message', '');
    },
    shouldShowStack(notification) {
      if (_.get(notification, 'state') === DANGER_NOTIFICATION_TYPE) {
        const stackErr = this.getStackError(notification);
        return notification.isShowStack || (stackErr !== '' && !_.isNil(stackErr));
      }
      return !_.isNil(notification.details);
    },
    getStackError(notification) {
      let stack = _.get(notification, 'details', '');
      const headers = _.get(notification, 'response.__original__.headers.map');
      const contentType = _.get(headers, '["content-type"][0]');
      const requestId = _.get(headers, '["x-request-id"][0]');
      const statusCode = _.get(notification, 'response.status.code');
      const stackTrace = _.get(notification, 'response.status.stack');
      if (_.get(notification, 'state') === DANGER_NOTIFICATION_TYPE) {
        if (!stackTrace) {
          stack += _.get(notification, 'response.message', '');
        }
        if (!_.isEmpty(requestId)) {
          stack += `Error in request: ${requestId}. `;
        }
        if (!_.isNil(statusCode)) {
          stack += `The server responded with HTTP code ${statusCode} and content type: ${_.defaultTo(contentType, 'Unknown')}`;
        }
      }
      return stack;
    },
    removeNotification(notification, autoDismissed) {
      if (notification._id) {
        this.setToastRead(notification, autoDismissed);
      }
      this.$root.$emit('remove-notification');
      this.cancelTimeout(notification);
      this.deleteNotification(notification);
    },
    retrieveUsersToast() {
      // upon login, the computed property userLogged isn't fully synchronized
      // so we're forced to provide the user id comming from the
      // onLogin hook
      userToastService.retrieve({ userId: this.userLogged._id }).then((response) => {
        const userToasts = response.data.list;
        if (userToasts.length) {
          userToasts.forEach((userToast) => {
            const notification = _toNotification(userToast);
            this.pushNotification(notification);
          });
        }
      }).catch((err) => {
        // log the error, because if we're starting to fail
        // eslint-disable-next-line no-console
        console.log(err);
      });
    },
    setToastRead(notification, autoDismissed = false, backoff = 360) {
      const update = {
        userId: this.userLogged._id,
        toastId: notification._id,
        data: {
          read: true,
          dismissed: !autoDismissed,
        },
      };
      userToastService.edit(update).catch(() => {
        const self = this;
        setTimeout(() => {
          // exponential backoff with 16 seconds max
          const newBackoff = backoff >= 360 ? 360 : backoff ** 2;
          self.setToastRead(notification, autoDismissed, newBackoff);
        }, backoff * 1000);
      });
    },
    _startInterval() {
      if (this.pollInterval) {
        this._clearInterval();
      }
      const self = this;
      // when initializing, make the first request
      // but wait a second to allow the userLogged
      // computed property to sync
      setTimeout(() => {
        self.retrieveUsersToast();
      }, 1000);
      this.pollInterval = setInterval(() => {
        self.retrieveUsersToast();
      }, this.intervalSeconds * 1000);
    },
    _clearInterval() {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      this.clearNotifications();
    },
  },
};
