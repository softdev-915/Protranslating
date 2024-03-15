import _ from 'lodash';
import BrowserStorage from '../../utils/browser-storage';

export default {
  data() {
    return {};
  },
  created() {
    const BE_NODE_ENV = new BrowserStorage('lms-flags-storage').findInCache('BE_NODE_ENV');
    if (BE_NODE_ENV === 'PROD') {
      this.$router.push({ name: 'login' });
    }
  },
  computed: {
    lspId() {
      return _.get(this, '$route.params.lspId');
    },
    companyId() {
      return _.get(this, '$route.params.companyId');
    },
    mockSSOEmail() {
      return _.get(this, '$route.query.mockSSOEmail');
    },
    mockSSOSuccess() {
      return _.get(this, '$route.query.mockSSOSuccess');
    },
  },
};
