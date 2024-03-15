import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import CatUiSettings from './cat-ui-settings.vue';
import UserService from '../../../../services/user-service';
import { hasRole } from '../../../../utils/user';
import { successNotification } from '../../../../utils/notifications';

const DEFAULT_QA_WARNING_MESSAGES_COLOR = '#F6B26B';
const DEFAULT_QA_ERROR_MESSAGES_COLOR = '#FF0000';
const DEFAULT_INLINE_USER_TAGS_COLOR = '#c2561a';
const DEFAULT_INLINE_SYSTEM_TAGS_COLOR = '#0000FF';
const userService = new UserService();

export default {
  components: {
    CatUiSettings,
  },
  data() {
    return {
      saving: false,
      uiSettings: {
        catUiSettings: {
          inlineUserTags: {
            color: DEFAULT_INLINE_USER_TAGS_COLOR,
          },
          inlineSystemTags: {
            color: DEFAULT_INLINE_SYSTEM_TAGS_COLOR,
          },
          qaErrorMessages: {
            color: DEFAULT_QA_ERROR_MESSAGES_COLOR,
          },
          qaWarningMessages: {
            color: DEFAULT_QA_WARNING_MESSAGES_COLOR,
          },
        },
      },
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canEdit() {
      return ['STAFF_UPDATE_ALL', 'USER_UPDATE_ALL', 'CONTACT_UPDATE_ALL'].some((role) => hasRole(this.userLogged, role));
    },
  },
  created() {
    const userLoggedUiSettings = _.get(this, 'userLogged.uiSettings', null);
    if (!_.isEmpty(userLoggedUiSettings)) {
      this.uiSettings = _.clone(userLoggedUiSettings);
    }
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('app', ['setUser']),
    save() {
      this.saving = true;
      return userService.updateUISettings(this.uiSettings)
        .then((response) => {
          this.pushNotification(successNotification('UI settings were updated successfully'));
          const userClone = _.clone(this.userLogged);
          userClone.uiSettings = _.get(response, 'data.uiSettings');
          this.setUser(userClone);
        })
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: `An error ocurred upon updating UI settings ${err}`,
            state: 'warning',
            ttl: 5,
            response: err,
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          this.saving = false;
        });
    },
  },
};
