import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import UserService from '../../../../services/user-service';
import { getPasswordValidationErrorMessage, shouldShowInvalidPassword, shouldShowEmptyPassword } from '../../../../utils/form';
import { successNotification, errorNotification } from '../../../../utils/notifications';
import ConfirmPassword from '../../../form/confirm-password/confirm-password.vue';

const userService = new UserService();

export default {
  components: {
    ConfirmPassword,
  },
  data() {
    return {
      dirtyForm: false,
      passwords: {
        password: '',
        newPassword: '',
        repeatPassword: '',
        isValidConfirmPassword: false,
        dirtyForm: false,
      },
      loading: false,
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    isValidPassword: function () {
      return this.passwords.password.trim().length > 0;
    },
    showInvalidPassword: function () {
      return shouldShowInvalidPassword(this.passwords.password,
        this.isValidPassword, this.dirtyForm);
    },
    isValid() {
      return this.isValidPassword
        && this.passwords.isValidConfirmPassword
        && this.passwords.newPassword === this.passwords.repeatPassword
        && this.passwords.password !== this.passwords.newPassword;
    },
    showEmptyPassword: function () {
      return shouldShowEmptyPassword(this.passwords.password, this.dirtyForm);
    },
    passwordErrorMessage() {
      return getPasswordValidationErrorMessage(this.passwords.newPassword,
        this.userLogged.securityPolicy);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('app', ['logout']),
    send() {
      if (this.loading || !this.isValid) {
        return;
      }
      this.changePasswordFailed = false;
      this.loading = true;
      const passwordChange = {
        password: this.passwords.password.trim(),
        newPassword: this.passwords.newPassword.trim(),
        repeatPassword: this.passwords.repeatPassword.trim(),
      };
      userService
        .changePassword(passwordChange)
        .then(() => {
          this.pushNotification(successNotification('The password was successfuly changed'));
        }).catch((response) => {
          this.changePasswordFailed = true;
          const errMessage = _.get(response, 'status.message', 'Unknown err');
          if (response.status.code === 401 && errMessage.indexOf('locked') >= 0) {
            this.logout().then(() => {
              this.$router.push({ name: 'login' }).catch((err) => { console.log(err); });
            });
          } else {
            this.pushNotification(errorNotification(errMessage));
          }
        })
        .finally(() => {
          this.loading = false;
          this.dirtyForm = false;
          this.passwords = {
            password: '',
            newPassword: '',
            repeatPassword: '',
            dirtyForm: false,
          };
        });
    },
  },
};
