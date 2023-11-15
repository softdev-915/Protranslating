
import VueAnalytics from 'vue-ua';
import mockUa from './mock-ua';

const HOST_NAMES = [
  'portal.protranslating.com',
  'portal.big-ip.com',
  'languagevault.com',
  'languagevault.uk',
];
const useAnalytics = (Vue, router) => {
  if (HOST_NAMES.includes(window.location.hostname)) {
    Vue.use(VueAnalytics, {
      appName: 'LMS', // Mandatory
      appVersion: '1', // Mandatory
      trackingId: 'UA-92302731-1', // Mandatory
      debug: false, // Whether or not display console logs debugs (optional)
      vueRouter: router, // Pass the router instance to automatically sync with router (optional)
      // globalDimensions: [ // Optional
      //   { dimension: 1, value: 'MyDimensionValue' },
      //   { dimension: 2, value: 'AnotherDimensionValue' },
      // ],
      // globalMetrics: [ // Optional
      //     { metric: 1, value: 'MyMetricValue' },
      //     { metric: 2, value: 'AnotherMetricValue' },
      // ],
    });
  } else {
    Vue.use(mockUa);
  }
};

export default useAnalytics;
