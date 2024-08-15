import _ from 'lodash';
import UserService from '../../../services/user-service';
import RequestFiles from '../../request-files/request-files.vue';
import localDateTime from '../../../utils/filters/local-date-time';

const userService = new UserService();

export default {
  components: {
    RequestFiles,
  },

  props: {
    user: { type: Object, require: true },
  },

  computed: {
    requestFilesVisibleColumns() {
      return ['Filename', 'Size', 'Download'];
    },

    registeredOn() {
      const date = _.get(this, 'user.registeredOn');
      return localDateTime(date, 'MM-DD-YYYY HH:mm');
    },

    lastContactUsOn() {
      const date = _.get(this, 'user.lastContactUsOn');
      return localDateTime(date, 'MM-DD-YYYY HH:mm');
    },

    documentUrlResolver() {
      return userService.getUserRegistrationDocument.bind(userService);
    },
  },
};
