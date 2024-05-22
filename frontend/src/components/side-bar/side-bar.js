/* global navigator,location */
import moment from 'moment-timezone';
import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../utils/user';
import SideBarChip from './side-bar-chip.vue';
import userRoleCheckMixin from '../../mixins/user-role-check';
import UserService from '../../services/user-service';
import UtcFlatpickr from '../form/utc-flatpickr';
import SimpleBasicSelect from '../form/simple-basic-select.vue';

const PENDING_TASKS_CHECK_INTERVAL = 40 * 1000 * 5;
const VALID_REQUEST_READ_ROLES = [
  'REQUEST_READ_OWN',
  'REQUEST_READ_ALL',
  'REQUEST_READ_COMPANY',
];
const REQUEST_CREATE_ROLES = ['REQUEST_CREATE_OWN', 'REQUEST_CREATE_COMPANY'];
const REQUEST_CREATE_ALL_ROLES = ['REQUEST_CREATE_ALL', 'INTERNAL-DEPARTMENT_READ_ALL'];
const VALID_QUOTE_READ_ROLES = ['QUOTE_READ_OWN', 'QUOTE_READ_ALL', 'QUOTE_READ_COMPANY'];
const VALID_BILL_READ_ROLES = ['BILL_READ_OWN', 'BILL_READ_ALL'];
const VALID_TASK_READ_ROLES = ['TASK_READ_ALL', 'TASK_READ_OWN', 'REQUEST_READ_ASSIGNED-TASK'];
const VALID_PROVIDER_POOL_USER_TYPES = ['Staff', 'Vendor'];
const INVALID_INVOICES_USER_TYPES = ['Staff', 'Vendor'];
const INVALID_QUOTES_VIEW_USERS = ['Staff', 'Vendor'];
const AR_ADJUSTMENT_READ_ROLES = ['AR-ADJUSTMENT_READ_ALL', 'AR-ADJUSTMENT_READ_OWN', 'AR-ADJUSTMENT_READ_COMPANY'];
const AR_PAYMENT_READ_ROLES = ['AR-PAYMENT_READ_ALL', 'AR-PAYMENT_READ_OWN', 'AR-PAYMENT_READ_COMPANY'];
const INVOICE_READ_ROLES = ['INVOICE_READ_OWN', 'INVOICE_READ_ALL', 'INVOICE_READ_COMPANY'];
const CC_PAYMENT_READ_ROLES = ['CC-PAYMENT_READ_ALL'];
const VALID_IP_USER_TYPES = ['Contact'];

export default {
  mixins: [userRoleCheckMixin],
  components: {
    SimpleBasicSelect,
    UtcFlatpickr,
    SideBarChip,
  },
  data() {
    return { isTimezoneDropdownActive: false };
  },
  created() {
    if (this.canReadTasks) {
      this.retrieveTasks();
      this.startTaskPolling(PENDING_TASKS_CHECK_INTERVAL);
    }
    this.applyMockTimezone();
    this.timezones = moment.tz.names();
    this.userService = new UserService();
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp']),
    ...mapGetters('tasks', ['loadingTasks', 'pendingTasks']),
    ...mapGetters('features', ['mock', 'mockTimezone']),
    lastLoginAtDate() {
      return moment(this.userLogged.lastLoginAt).format('MM-DD-YYYY HH:mm');
    },
    locationString() {
      return !_.isEmpty(this.userLogged.location)
        ? `${this.userLogged.location.city}, ${this.userLogged.location.country}`
        : 'Unknown';
    },
    currentRouteMatchCreate() {
      return !!this.$route.path.match(/create/);
    },
    canReadTasks() {
      return VALID_TASK_READ_ROLES.some((r) => this.hasRole(r));
    },
    canReadProviderPool() {
      return VALID_PROVIDER_POOL_USER_TYPES.indexOf(this.userLogged.type) !== -1;
    },
    canReadRequests() {
      return VALID_REQUEST_READ_ROLES.some((role) => this.hasRole(role));
    },
    canCreateRequests() {
      return REQUEST_CREATE_ROLES.some((r) => this.hasRole(r))
        || REQUEST_CREATE_ALL_ROLES.every((r) => this.hasRole(r));
    },
    canCreateIPQuotes() {
      return this.supportsIpQuoting && this.hasRole('IP-QUOTE_CREATE_OWN')
        && VALID_IP_USER_TYPES.includes(_.get(this, 'userLogged.type'));
    },
    canCreateIPOrders() {
      return this.supportsIpQuoting && this.hasRole('IP-ORDER_CREATE_OWN')
        && VALID_IP_USER_TYPES.includes(_.get(this, 'userLogged.type'));
    },
    canReadQuotes() {
      return VALID_QUOTE_READ_ROLES.some((role) => this.hasRole(role))
        && INVALID_QUOTES_VIEW_USERS.indexOf(this.userLogged.type) === -1;
    },
    canReadInvoices() {
      return INVOICE_READ_ROLES.some((role) => this.hasRole(role))
        && INVALID_INVOICES_USER_TYPES.every((userType) => userType !== this.userLogged.type);
    },
    canReadArAdjustments() {
      return AR_ADJUSTMENT_READ_ROLES.some((role) => hasRole(this.userLogged, role))
        && INVALID_INVOICES_USER_TYPES.every((userType) => userType !== this.userLogged.type);
    },
    canReadArPayments() {
      return AR_PAYMENT_READ_ROLES.some((role) => hasRole(this.userLogged, role))
        && INVALID_INVOICES_USER_TYPES.every((userType) => userType !== this.userLogged.type);
    },
    canReadBills() {
      return VALID_BILL_READ_ROLES.some((role) => this.hasRole(role));
    },
    canReadCcPayments() {
      return CC_PAYMENT_READ_ROLES.some((role) => this.hasRole(role));
    },
    canUseVendorDashboard() {
      return this.hasRole({ oneOf: ['VENDOR-DASHBOARD_READ_OWN', 'VENDOR-DASHBOARD-FILTER_READ_OWN'] });
    },
    canUseContactDashboard() {
      return this.hasRole({ oneOf: ['CONTACT-DASHBOARD_READ_OWN', 'CONTACT-DASHBOARD-FILTER_READ_OWN'] });
    },
    canUseDashboard() {
      return this.canUseVendorDashboard || this.canUseContactDashboard;
    },
    canReadPortalTranslator() {
      return this.hasRole({ oneOf: ['MT-TRANSLATOR_READ_COMPANY', 'MT-TRANSLATOR_READ_ALL'] });
    },
    dashboardLinkId() {
      if (this.canUseVendorDashboard) {
        return 'vendorDashboard';
      } if (this.canUseContactDashboard) {
        return 'contactDashboard';
      }
      return '';
    },
    dashboardRoute() {
      if (this.canUseVendorDashboard) {
        return { name: 'vendor-dashboard' };
      } if (this.canUseContactDashboard) {
        return { name: 'contact-dashboard' };
      }
      return '';
    },
    userProfileImage() {
      return _.get(this, 'userLogged.profileImage.file', null);
    },
    pendingTaskCount() {
      const pendingTasks = _.get(this, 'pendingTasks', []);
      return pendingTasks.length;
    },
    requestLinkLabel() {
      if (this.supportsIpQuoting) {
        if (['REQUEST_READ_ALL', 'QUOTE_READ_ALL'].some((r) => this.hasRole(r))) {
          return 'Quotes & Orders';
        }
        return 'Orders';
      }
      return 'Requests';
    },
    isSSOEnabled() {
      return _.get(this, 'userLogged.company.ssoSettings.isSSOEnabled', false);
    },
    supportsIpQuoting() {
      return _.get(this, 'lsp.supportsIpQuoting');
    },
  },
  methods: {
    ...mapActions('app', ['logout', 'setUser']),
    ...mapActions('tasks', ['retrieveTasks', 'startTaskPolling']),
    performLogout() {
      this.logout().finally(() => {
        this.$router.push({ name: 'login' }).catch((err) => { console.log(err); });
      });
    },
    onTaskEvent(taskEvent) {
      this.userTasks = this.userTasks.filter((t) => t._id !== taskEvent._id);
    },
    navigateToChangePassword() {
      this.$router.push({ name: 'change-password' }).catch((err) => { console.log(err); });
    },
    applyMockTimezone() {
      if (!this.mock || _.isEmpty(this.mockTimezone)) {
        return;
      }
      this.setTimezone({ value: this.mockTimezone, isAutoDetected: true });
    },
    setTimezone(timeZone) {
      this.setUser({ ...this.userLogged, ...{ timeZone } });
    },
    toggleTimezoneDropdown() {
      this.isTimezoneDropdownActive = !this.isTimezoneDropdownActive;
    },
    saveTimezone(timezone) {
      this.userService.updateTimezone(timezone).then(() => {
        const query = _.cloneDeep(this.$route.query);
        try {
          const filter = JSON.parse(this.$route.query.filter);
          filter.__tz = timezone;
          query.filter = JSON.stringify(filter);
          this.$router.replace({ query });
        } catch (e) {
          // Nothing to do here. If there were no filter in query we just need to reload
        } finally {
          location.reload();
        }
      });
    },
  },
};
