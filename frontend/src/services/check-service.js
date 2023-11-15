import _ from 'lodash';
import Vue from 'vue';
import checkResource from '../resources/check';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = [
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'AP Payment ID', type: 'string', prop: 'apPaymentId', visible: false,
  },
  {
    name: 'Status', type: 'string', prop: 'status', visible: true,
  },
  {
    name: 'Vendor ID', type: 'string', prop: 'vendor._id', val: (item) => _.get(item, 'vendor._id', ''), visible: true,
  },
  {
    name: 'Vendor Name', type: 'string', prop: 'vendor.fullName', val: (item) => _.get(item, 'vendor.fullName', ''), visible: true,
  },
  {
    name: 'Bank Account', type: 'string', prop: 'bankAccountName', visible: true,
  },
  {
    name: 'Amount Selected', type: 'currency', prop: 'amount', visible: true,
  },
  {
    name: 'Check #',
    type: 'string',
    prop: 'checkNo',
    val: (item) => (_.isEmpty(_.trim(item.checkNo)) ? '---' : item.checkNo),
    visible: true,
  },
  {
    name: 'Payment Date', type: 'dateRange', prop: 'paymentDate', visible: true,
  },
  {
    name: 'Check Memo',
    type: 'component',
    prop: 'memo',
    val: () => '',
    componentName: 'CheckMemoEdit',
    visible: true,
    sortable: false,
  },
];

export default class CheckService {
  constructor(resource = checkResource) {
    this.resource = resource;
    this.endpointBuilder = lspAwareUrl;
  }

  get name() {
    return 'apChecks';
  }

  get columns() {
    return COLUMNS;
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  updateMemo(id, memo) {
    const url = this.endpointBuilder(`check/${id}/memo`);
    return resourceWrapper(Vue.http.put(url, { memo }));
  }

  async printChecks(body) {
    const url = this.endpointBuilder('check');
    const response = await Vue.http.post(url, body, { responseType: 'blob' });
    const type = response.headers.get('content-type');
    const disposition = response.headers.get('content-disposition');
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    const filename = matches[1].replace(/['"]/g, '');
    return { type, data: response.data, filename };
  }
}
