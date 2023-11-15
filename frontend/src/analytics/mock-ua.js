const install = function (Vue) {
  const mockAnalytics = {
    trackView() {},
    // eslint-disable-next-line no-console
    trackEvent(...args) { console.log(['trackEventMessage', ...args].join(', ')); },
    trackException() {},
    trackTiming() {},
    injectGlobalDimension() {},
    injectGlobalMetric() {},
    changeSessionLanguage() {},
  };
  Vue.prototype.$analytics = Vue.prototype.$ua = Vue.analytics = mockAnalytics;
};

// Export module
export default { install };
