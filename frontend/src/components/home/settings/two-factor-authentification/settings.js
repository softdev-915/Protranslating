import _ from 'lodash';
import { mapGetters, mapActions, mapMutations } from 'vuex';
import UserService from '../../../../services/user-service';
import { successNotification, errorNotification } from '../../../../utils/notifications';

const userService = new UserService();

export default {
  name: 'TwoFactorAuthSettings',
  data: () => ({
    isExpanded: false,
    hotpDataURL: null,
    hotp: '',
  }),
  created() {
    this.state = _.get(this.userLogged, 'useTwoFactorAuthentification', false);
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    stateLabel() {
      return this.isExpanded ? 'Uncheck if you want to disable' : 'Check if you want to enable';
    },
    state: {
      get() {
        return this.isExpanded;
      },
      set(value) {
        if (value === this.state) {
          return;
        }
        if (value) {
          userService.retrieveDataURL()
            .then((res) => {
              this.hotpDataURL = res.data.dataURL;
              this.isExpanded = true;
            })
            .catch(() => this.pushNotification(errorNotification('Two-Factor authentication is not available for this user')));
        } else {
          let notification;
          userService.toggle2FAState({ email: this.userLogged.email }, 'disable')
            .then(() => {
              this.isExpanded = false;
              this.toggle2FAState(false);
              notification = successNotification('Two-Factor Authentication successfully disabled');
            })
            .catch((e) => {
              notification = errorNotification(e.status.message);
            })
            .finally(() => {
              this.pushNotification(notification);
            });
        }
      },
    },
    toggleStateTitle() {
      return this.isExpanded ? 'Disable' : 'Enable';
    },
    dataURLRetieved() {
      return !_.isNil(this.hotpDataURL);
    },
    isSSOEnabled() {
      return _.get(this, 'userLogged.company.ssoSettings.isSSOEnabled', false);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapMutations('app', ['toggle2FAState']),
    verifyHOTP() {
      let notification;
      userService.toggle2FAState({ email: this.userLogged.email, hotp: this.hotp }, 'enable')
        .then(() => {
          this.toggle2FAState(true);
          notification = successNotification('You entered a valid code. Two-Factor Authentication enabled');
        })
        .catch((e) => {
          notification = errorNotification(e.status.message);
        })
        .finally(() => {
          this.pushNotification(notification);
        });
    },
  },
};
