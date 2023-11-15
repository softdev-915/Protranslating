/* eslint-disable prefer-arrow-callback */
import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import SessionExpiry from './utils/session/session-expiry';
import HomeFooter from './components/home/home-footer/home-footer.vue';
import NotificationManager from './components/notification-manager/notification-manager.vue';
import ViewSearch from './components/view-search/view-search.vue';
import AppHelp from './components/app-help/app-help.vue';
import VersionUpdate from './components/version-update/version-update.vue';
import getResponsiveBreakpoint from './utils/viewport';
import AuthService from './services/auth-service';

const authService = new AuthService();
const COLLAPSED_SIDE_BAR_CLASS = 'col-12';
const NON_COLLAPSED_SIDE_BAR_CLASS = 'col-5 col-md-8 col-lg-10 bordered-left';
const isFocusableElement = function () {
  return document.activeElement.tagName.toLowerCase() === 'input';
};

const reactUponResize = function (appComponent) {
  const vp = getResponsiveBreakpoint();
  if (vp === 'xs' || vp === 'sm') {
    // if mobile collapse the navBar
    appComponent.setCollapsed(true);

    // If mobile, scroll to active element after users taps on it
    if (isFocusableElement()) {
      window.setTimeout(() => {
        document.activeElement.scrollIntoViewIfNeeded();
      }, 0);
    }
  }
  appComponent.setViewport(vp);
};

export default {
  name: 'app',
  $_veeValidate: {
    validator: 'new',
  },
  components: {
    AppHelp,
    HomeFooter,
    NotificationManager,
    ViewSearch,
    VersionUpdate,
  },
  data() {
    return {
      showLoadingSplash: true,
      showBlurLoading: false,
    };
  },
  created: function () {
    const self = this;
    reactUponResize(this);
    window.onresize = function () {
      reactUponResize(self);
    };

    this.sessionExpiry = new SessionExpiry(this.onSessionExpiry, () => authService.sendHeartbeat());
    this.sessionExpiry.app = this;
  },
  updated: _.debounce(function () {
    this.showLoadingSplash = false;
  }, 300),
  watch: {
    globalEvent: function (event) {
      if (_.has(event, 'loading')) {
        this.showLoadingSplash = event.loading;
      }
      if (_.has(event, 'blurLoading')) {
        this.showBlurLoading = event.blurLoading;
      }
      this.$emit('resetTimerInactivity');
      if (typeof event === 'string' && event.match('RefreshSessionPoll')) {
        this.sessionExpiry[event]();
      }
    },
  },
  computed: {
    ...mapGetters('sideBar', [
      'isCollapsed',
    ]),
    ...mapGetters('app', [
      'userRequested',
      'userLogged',
      'globalEvent',
      'lsp',
    ]),
    colClasses() {
      return this.isCollapsed ? COLLAPSED_SIDE_BAR_CLASS : NON_COLLAPSED_SIDE_BAR_CLASS;
    },
    browserClass() {
      if (this.showBlurLoading) return 'blur-loading-row';
      // Add other browsers here as needed
      const isSafari = window.navigator.vendor && window.navigator.vendor.indexOf('Apple') > -1
        && window.navigator.userAgent && !window.navigator.userAgent.match('CriOS');
      return isSafari ? 'safari' : 'other';
    },
    isStandaloneRoute() {
      return this.$route.meta.standaloneRoute;
    },
  },
  methods: {
    ...mapActions('app', ['setViewport', 'logout', 'triggerGlobalEvent']),
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('sideBar', ['setCollapsed', 'setCollapsedAfterAnimation']),
    onGlobalEvent(event, where) {
      this.triggerGlobalEvent({ event, where });
    },
    onAfterSidebarEnter() {
      this.setCollapsedAfterAnimation(false);
    },
    onAfterSidebarLeave() {
      this.setCollapsedAfterAnimation(true);
    },
    onSessionExpiry(timeout) {
      this.logout().finally(() => {
        this.$router.push({ name: 'login' });
        setTimeout(() => {
          const notification = {
            title: 'Session timeout',
            message: `Your session has expired because you have been inactive for over ${timeout}`,
            state: 'warning',
          };
          this.pushNotification(notification);
        }, 500);
      });
    },
  },
};
