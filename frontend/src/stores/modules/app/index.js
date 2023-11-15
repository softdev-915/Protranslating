import Vue from 'vue';
import VueResource from 'vue-resource';
import _ from 'lodash';
import AuthService from '../../../services/auth-service';
import sessionObserver from '../../../utils/observers/session';
import LocalStorageApp from './localStorageApp';
import BrowserStorage from '../../../utils/browser-storage';
import PortalCatService from '../../../services/portalcat-service';

Vue.use(VueResource);

const authService = new AuthService();
const localStorageApp = new LocalStorageApp();
const deleteCookie = (name) => {
  document.cookie = `${name} =; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
};
const DEFAULT_APP_TITLE = 'BIG';
const portalCatService = new PortalCatService();
const _state = {
  lsp: null,
  lspAddressFooter: '',
  userLogged: null,
  versionChanged: false,
  version: localStorageApp.getVersion(),
  userRequested: false,
  viewport: null,
  firstRoute: null,
  sitemap: false,
  help: false,
  globalEvent: null,
  appTitle: '',
  currencyList: [],
};

const getters = {
  userLogged: (storeState) => storeState.userLogged,
  lsp: (storeState) => storeState.lsp,
  lspAddressFooter: (storeState) => {
    const address = _.get(storeState, 'lsp.addressInformation');
    const {
      line1, city, state, zip,
    } = address;
    const lspAddress = `${line1} ${city} ${state?.code} ${zip}`;
    return `${_.get(storeState, 'lsp.description')} ${lspAddress}`;
  },
  lspExchangeDetails: (storeState) => {
    const lspCurrencyExchangeDetails = _.get(storeState, 'lsp.currencyExchangeDetails', []);
    if (_.isArray(lspCurrencyExchangeDetails) && !_.isEmpty(lspCurrencyExchangeDetails)) {
      return lspCurrencyExchangeDetails.map((detail) => detail.quote);
    }
    return [];
  },
  getExchangeRate: storeState => (foreignCurrency) => {
    const currencyExchangeDetails = storeState.lsp.currencyExchangeDetails;
    if (_.isEmpty(currencyExchangeDetails)) {
      return 1;
    }
    const usdRate = currencyExchangeDetails.find(e =>
      e.base === e.quote && _.toNumber(e.quotation) === 1,
    );
    if (_.isNil(usdRate)) {
      return null;
    }
    const foreignRate = currencyExchangeDetails.find(e =>
      e.base === usdRate.base && e.quote === foreignCurrency,
    );
    if (_.isNil(foreignRate)) {
      return 1;
    }
    return foreignRate.quotation;
  },
  localCurrency: (storeState) => {
    const lspCurrencyExchangeDetails = _.get(storeState, 'lsp.currencyExchangeDetails', []);
    const foundCurrency = lspCurrencyExchangeDetails.find((c) => c.base === c.quote);
    const localCurrency = _.get(storeState, 'lsp.currencies', []).find((c) => c._id === _.get(foundCurrency, 'base'));
    return _.defaultTo(localCurrency, {});
  },
  currencies: (storeState) => _.get(storeState, 'lsp.currencies', []),
  currencyList: (storeState) => _.get(storeState, 'currencyList', []),
  versionChanged: (storeState) => storeState.versionChanged,
  version: (storeState) => storeState.version,
  viewport: (storeState) => storeState.viewport,
  userRequested: (storeState) => storeState.userRequested,
  firstRoute: (storeState) => storeState.firstRoute,
  sitemap: (storeState) => storeState.sitemap,
  help: (storeState) => storeState.help,
  globalEvent: (storeState) => storeState.globalEvent,
  appTitle: (storeState) => {
    const lspName = _.get(storeState, 'lsp.officialName') || _.get(storeState, 'lsp.name');
    return _.get(storeState, 'appTitle', lspName);
  },
};

const mutations = {
  setUser: (storeState, payload) => {
    storeState.userLogged = payload;
  },
  setLsp: (storeState, payload) => {
    if (_.isNil(payload)) {
      Vue.set(storeState, 'lsp', null);
      return;
    }
    if (!_.isNil(payload)) {
      const currencies = _.get(payload, 'currencyExchangeDetails', []);
      payload.currencyExchangeDetails = currencies.map((c) => ({
        base: _.get(c, 'base._id', c.base),
        quotation: c.quotation,
        quote: _.get(c, 'quote._id', c.quote),
      }));
      payload.currencies = currencies.map((c) => ({
        _id: _.get(c, 'quote._id'),
        isoCode: _.get(c, 'quote.isoCode'),
        exchangeRate: c.quotation,
      }));
    }

    const currentLogo = _.get(storeState, 'lsp.logoImage');
    if (!_.isEmpty(currentLogo)) {
      const newLogoMD5 = _.get(payload, 'logoImage.md5', '');
      const currentLogoMD5 = _.get(currentLogo, 'md5');
      const logoChanged = _.has(payload, 'logoImage') && newLogoMD5 !== currentLogoMD5;
      // If logo hasn't changed, dont change state as the backend
      // doesn't return the base64Image field
      if (!logoChanged) {
        payload.logoImage = currentLogo;
      }
    }
    Vue.set(storeState, 'lsp', payload);
  },
  setVersion: (storeState, payload) => {
    // only update the version once
    if (!storeState.version) {
      storeState.version = payload;
    }
  },
  setVersionChanged: (storeState) => {
    // only update the version once
    storeState.versionChanged = true;
  },
  setViewport: (storeState, payload) => {
    storeState.viewport = payload;
  },
  setUserRequested: (storeState, payload) => {
    storeState.userRequested = payload;
  },
  setFirstRoute: (storeState, payload) => {
    storeState.firstRoute = payload;
  },
  setHelp: (storeState, payload) => {
    storeState.help = payload;
  },
  setSitemap: (storeState, payload) => {
    storeState.sitemap = payload;
  },
  setProfilePicture: (storeState, payload) => {
    storeState.userLogged = {
      ...storeState.userLogged,
      profileImage: {
        file: payload.file,
      },
    };
  },
  setGlobalEvent: (storeState, payload) => {
    storeState.globalEvent = payload;
  },
  toggle2FAState: (storeState, state) => {
    _.set(storeState, 'userLogged.useTwoFactorAuthentification', state);
  },
  setAppTitle: (storeState, payload) => {
    if (_.isEmpty(payload)) {
      const lspName = _.get(storeState, 'lsp.officialName') || _.get(storeState, 'lsp.name');
      if (_.isEmpty(lspName)) {
        storeState.appTitle = DEFAULT_APP_TITLE;
      } else {
        storeState.appTitle = lspName;
      }
    } else {
      storeState.appTitle = payload;
    }
    document.title = storeState.appTitle;
  },
  setCurrencyList: (storeState, payload) => {
    storeState.currencyList = payload;
  },
  setPortalCatDefaultConfig: (storeState, config) => {
    Vue.set(storeState.userLogged, 'portalCatDefaultConfig', config);
  },
};

const actions = {
  requestUserLogged: ({ commit }) => (
    authService.getCurrentUser().then((response) => {
      const { user, csrfToken } = response.data;
      sessionObserver.onLogin(user);
      commit('setUser', user);
      commit('setLsp', user.lsp);
      commit('setAppTitle', '');
      commit('authorization/setCsrfToken', csrfToken, { root: true });
    })
      .catch(() => {
        commit('setUserRequested', false);
      })
      .finally(() => commit('setUserRequested', true))
  ),
  setUser: ({ commit }, payload) => {
    sessionObserver.onLogin(payload);
    commit('setUser', payload);
  },
  setLsp: ({ commit }, payload) => {
    commit('setLsp', payload);
    commit('setAppTitle', '');
  },
  setVersion: ({ commit, state }, payload) => {
    if (!state.version || state.version === payload) {
      commit('setVersion', payload);
    } else {
      commit('setVersionChanged');
    }
    localStorageApp.save(payload);
  },
  logout: ({ commit, dispatch }) => {
    deleteCookie('lms-session');
    sessionObserver.onLogout();
    commit('authorization/removeCsrfToken', null, { root: true });
    commit('portalCat/reset', null, { root: true });
    commit('memoryEditor/reset', null, { root: true });
    dispatch('tasks/clearTaskPolling', null, { root: true });
    commit('setUser', null);
    commit('setLsp', null);
    commit('setUserRequested', false);
    commit('setAppTitle', DEFAULT_APP_TITLE);
    dispatch('resetRequestInterpretingSpecificSection');
    return authService.logout();
  },
  setViewport: ({ commit }, payload) => {
    commit('setViewport', payload);
  },
  setFirstRoute: ({ commit }, payload) => {
    commit('setFirstRoute', payload);
  },
  setHelp: ({ commit }, payload) => {
    commit('setHelp', payload);
  },
  setSitemap: ({ commit }, payload) => {
    commit('setSitemap', payload);
  },
  setProfilePicture: ({ commit }, payload) => {
    commit('setProfilePicture', payload);
  },
  triggerGlobalEvent: ({ commit }, payload) => {
    commit('setGlobalEvent', payload);
  },
  setAppTitle: ({ commit }, payload) => {
    commit('setAppTitle', payload);
  },
  setCurrencyList: ({ commit }, payload) => {
    commit('setCurrencyList', payload);
  },
  resetRequestInterpretingSpecificSection: () => {
    const localStore = new BrowserStorage('InterpretingSpecificSection');
    localStore.removeFromCache('collapsed');
  },
  savePortalCatDefaultConfig: async ({ commit }, config) => {
    const response = await portalCatService.saveDefaultConfig({ config });
    commit('setPortalCatDefaultConfig', _.get(response, 'data.config'));
  },
};

export default {
  state: _state,
  getters,
  mutations,
  actions,
  namespaced: true,
};
