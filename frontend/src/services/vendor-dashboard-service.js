import Vue from 'vue';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';

export default class VendorDashboardService {
  constructor() {
    this.endpointBuilder = lspAwareUrl;
  }

  getDashboardData(dateFilterTotalAmountPosted, dateFilterTotalAmountPaid) {
    const query = `?dateFilterTotalAmountPosted=${encodeURIComponent(dateFilterTotalAmountPosted)}&dateFilterTotalAmountPaid=${encodeURIComponent(dateFilterTotalAmountPaid)}`;
    const url = this.endpointBuilder(`user/vendor-dashboard/${query}`);
    return resourceWrapper(Vue.http.get(url));
  }
}
