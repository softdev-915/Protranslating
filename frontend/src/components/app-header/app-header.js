import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import EmlFileUpload from '../home/user/activity/eml-file-upload.vue';
import { hasRole } from '../../utils/user';
import LogService from '../../services/log-service';

const logService = new LogService();
const CONTACT_TYPE = 'Contact';

export default {
  computed: {
    ...mapGetters('app', [
      'lsp',
      'userLogged',
    ]),
    lspLogo() {
      return _.get(this, 'lsp.logoImage.base64Image');
    },
    lspName() {
      return _.get(this, 'lsp.name');
    },
    lspOfficialName() {
      return _.get(this, 'lsp.officialName');
    },
    hasLogo() {
      return !_.isEmpty(this.lspLogo);
    },
    canCreateActivityEmail() {
      return ['USER_CREATE_ALL', 'ACTIVITY-EMAIL_CREATE_ALL', 'ACTIVITY-EMAIL_CREATE_OWN']
        .some((role) => hasRole(this.userLogged, role));
    },
    isSitemapVisible() {
      return this.userLogged.type !== CONTACT_TYPE;
    },
  },
  components: {
    EmlFileUpload,
  },
  methods: {
    ...mapActions('app', ['logout', 'setHelp', 'setSitemap']),
    ...mapActions('sideBar', ['toggleCollapse']),
    refresh() {
      window.location.reload();
    },
    performLogout() {
      try {
        this.logout().finally(() => {
          this.$router.push({ name: 'login' }).catch((err) => { console.log(err); });
        });
      } catch (error) {
        logService.registerException(error, 'Logout Error');
        throw error;
      }
    },
  },
};
