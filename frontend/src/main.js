import Vue from 'vue';
import Vue2Filters from 'vue2-filters';
import VueRouter from 'vue-router';
import VueResource from 'vue-resource';
import BootstrapVue from 'bootstrap-vue';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import VueFlatpickr from 'vue-flatpickr-component';
import VueCurrencyInput from 'vue-currency-input';
import * as VeeValidate from 'vee-validate';
import VueMask from 'v-mask';
import _ from 'lodash';
import moment from 'moment';
import {
  AjaxBasicSelect, AjaxMultiSelect, BasicSelect, MultiSelect,
} from './components/search-select';
import versionObserver from './utils/observers/version';
import { store } from './stores/store';
import { routes } from './routes';
import useAnalytics from './analytics';
import App from './app.vue';
import localDateTime from './utils/filters/local-date-time';
import virtualSize from './utils/filters/virtual-size';
import { hasRole } from './utils/user';
import SessionFlags from './utils/session/session-flags';
import loadCustomVeeValidators from './validators';
import pcMockFlags from './utils/portalcat/mock-flags';
import LogService from './services/log-service';
import Popover from './components/popover/popover.vue';

const logService = new LogService();
// const VeeValidateConfig = {
//   inject: true,
// };
// Used by vue-search-select
Vue.config.keyCodes = {
  anyKeyCode: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64,
    65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77,
    78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90],
};
Vue.config.warnHandler = function (msg, vm, trace) {
  // Catch the error thrown because of a bug in VueJS described here - https://github.com/vuejs/vue/issues/6574
  if (_.get(vm, '$options.name', '') === 'DynamicScrollerItem') {
    return;
  }
  console.error(msg, trace);
};
Vue.use(VueCurrencyInput, {
  globalOptions: {
    precision: 4,
    currency: 'USD',
    locale: 'en-US',
  },
});
Vue.use(Vue2Filters);
Vue.filter('localDateTime', localDateTime);
Vue.filter('toCurrency', (value) => {
  if (typeof value !== 'number') {
    return value;
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  return formatter.format(value).replace('$', '');
});
Vue.filter('to2DigitsMin', (value) => {
  if (typeof value !== 'number') {
    return value;
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 10,
    minimumFractionDigits: 2,
  });
  return formatter.format(value).replace('$', '');
});
Vue.filter('virtualSize', virtualSize);
Vue.use(VueRouter);
Vue.use(VueResource);
Vue.use(BootstrapVue);
Vue.use(VueFlatpickr);
Vue.use(VeeValidate, { inject: false });
Vue.use(VueMask);
Vue.component('ajax-basic-select', AjaxBasicSelect);
Vue.component('ajax-multi-select', AjaxMultiSelect);
Vue.component('basic-select', BasicSelect);
Vue.component('multi-select', MultiSelect);
Vue.component('popover', Popover);
loadCustomVeeValidators();

const sessionFlagsParser = new SessionFlags();
versionObserver.store = store;

Vue.config.devtools = true;
const isValidRequestForCsrf = (request) => {
  const excludedUrlPatterns = [
    '^/api/auth$',
    '^/api/auth/forgot-password(/.*)?$',
    '^/api/lsp/selector$',
    '^/api/upload-test-speed$',
    '^/api/log/create$',
  ];
  const requestUrl = request.getUrl();
  const isMatchExcludedUrl = excludedUrlPatterns
    .some((excludedUrlPattern) => requestUrl.match(excludedUrlPattern));
  return !request.method.match(/GET|HEAD|OPTIONS/) && !isMatchExcludedUrl;
};

Vue.http.interceptors.push((request, next) => {
  // modify headers
  request = sessionFlagsParser.interceptor(request);
  request = pcMockFlags.interceptor(request);
  const mock = _.get(request, 'headers.map.lms-mock.0') === 'true';
  const mockTimezone = _.get(request, 'headers.map.lms-mockTimezone.0');
  const timezone = mock && !_.isEmpty(mockTimezone) ? mockTimezone : Intl.DateTimeFormat().resolvedOptions().timeZone;
  request.headers.set('lms-timezone', timezone);
  request.headers.set('lms-tz', moment().utcOffset().toString());
  // csrf
  if (isValidRequestForCsrf(request)) {
    const csrfToken = store.getters['authorization/csrfToken'];
    if (!_.isEmpty(csrfToken)) {
      request.headers.set('csrf-token', csrfToken);
    } else {
      logService.error('CSRF Error. Got empty token from storage');
    }
  }
  // continue to next interceptor
  next((response) => {
    const BE_NODE_ENV = response.headers.get('env');
    sessionFlagsParser.browserStorage.saveInCache('BE_NODE_ENV', BE_NODE_ENV);
    let version = _.get(response, 'body.status.version');
    const mock = store.getters['features/mock'];
    const appVersion = store.getters['app/version'];
    const mockVersion = store.getters['features/mockVersion'];
    if (mock && !_.isNil(mockVersion)) {
      version = mockVersion;
    }
    if (appVersion !== version) {
      versionObserver.onVersionChange(version);
    }

    // Migration runner check
    const unavailable = _.get(response, 'body.status.code') === 503;
    const areMigrationsRunning = response.headers.get('migrations-running') === 'true' || false;
    if (unavailable && areMigrationsRunning) {
      const notification = {
        title: 'Error',
        message: _.get(response, 'body.status.message'),
        state: 'danger',
      };
      store.dispatch('notifications/pushNotification', notification);
    }
  });
});

const router = new VueRouter({
  routes,
  mode: 'history',
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { selector: to.hash };
    }
    return { x: 0, y: 0 };
  },
});

// append google analytics
useAnalytics(Vue, router);

const routerSecurityCheck = (user, to, from, next, isFirstTime) => {
  let nextResolve;
  if (!_.isNil(user) && to.name === 'login') {
    return next({ name: 'home' });
  }
  if (!user) {
    if (!to.meta.public) {
      if (isFirstTime) {
        store.dispatch('app/setFirstRoute', to);
      }
      nextResolve = { name: 'login' };
    } else if (to.meta.role) {
      let isAuthorized = false;
      const oneOf = _.get('to.meta.role.oneOf');
      if (oneOf && Array.isArray(oneOf)) {
        isAuthorized = _.some(oneOf, (r) => hasRole(user, r));
      } else {
        isAuthorized = hasRole(user, to.meta.role);
      }
      if (!isAuthorized) {
      // user has not enough privileged to see the view
      // TODO define what to do here
        nextResolve = { name: 'list-request' };
      }
    }
  }
  next(nextResolve);
};
const _push = router.push;
// THIS IS A HACK TO AVOID BUGS EXISTING IN VUE-ROUTER < 4,
// WHICH APPEARS ON REDIRECTING WITH BEFORE HOOK
router.push = (to, onComplete, onAbort) => {
  const existingQuery = _.cloneDeep(to.query);
  const userLogged = store.getters['app/userLogged'];
  const fullQuery = {
    ...existingQuery,
    lspId: _.get(userLogged, 'lsp._id'),
    userEmail: _.get(userLogged, 'email'),
    userType: _.get(userLogged, 'type'),
  };
  to.query = fullQuery;
  return _push.call(router, to, onComplete, onAbort);
};

router.beforeEach((to, from, next) => {
  // detect query param special flags
  sessionFlagsParser.detectFlags();
  let userLogged = store.getters['app/userLogged'];
  const lsp = store.getters['app/lsp'];
  store.dispatch('notifications/clearScopedNotifications').then(() => { });
  if (_.isNil(userLogged) || _.isNil(lsp)) {
    store.dispatch('app/requestUserLogged').then(() => {
      // the first route will be setted here
      userLogged = store.getters['app/userLogged'];
      routerSecurityCheck(userLogged, to, from, next, true);
    });
    return;
  }
  userLogged = store.getters['app/userLogged'];
  store.dispatch('app/triggerGlobalEvent', { loading: true });
  routerSecurityCheck(userLogged, to, from, next, false);
});

router.afterEach(() => store.dispatch('app/triggerGlobalEvent', { loading: false }));

const registerErrors = () => {
  const prevGlobalErrorFunc = window.onerror;
  window.onerror = (message, source, lineNumber, columnNumber, error) => {
    let result = false;
    if (prevGlobalErrorFunc) {
      result = prevGlobalErrorFunc(message, source, lineNumber, columnNumber, error);
    }
    if (error) {
      logService.registerException(error);
    } else {
      logService.error(message);
    }
    return result;
  };

  const prevVueErrorFunc = Vue.config.errorHandler;
  Vue.config.errorHandler = (error, vm, info) => {
    if (prevVueErrorFunc) {
      prevVueErrorFunc(error, vm, info);
    }
    logService.registerException(error);
  };
};

registerErrors();

new Vue({
  el: '#app',
  store,
  router,
  render: (h) => h(App),
});
