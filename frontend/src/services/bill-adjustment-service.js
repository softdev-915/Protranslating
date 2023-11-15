import _ from 'lodash';
import Vue from 'vue';
import billResource from '../resources/bill-adjustment';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';
import BaseDebounceService from './base-debounce-service';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Adjustment No', type: 'string', prop: 'adjustmentNo', visible: true,
  },
  {
    name: 'Reference Bill No', type: 'string', prop: 'referenceBillNo', visible: true,
  },
  {
    name: 'Adjustment Date', type: 'string', prop: 'date', visible: true,
  },
  {
    name: 'Type', type: 'string', prop: 'type', visible: true,
  },
  {
    name: 'Status', type: 'string', prop: 'status', visible: true,
  },
  {
    name: 'Synced', type: 'string', prop: 'isSyncedText', visible: true,
  },
  {
    name: 'Last Sync Date',
    type: 'date',
    prop: 'siConnector.connectorEndedAt',
    visible: false,
    val: (item) => _.get(item, 'siConnector.connectorEndedAt', ''),
  },
  {
    name: 'Sync Error', type: 'string', prop: 'siConnector.error', visible: false,
  },
  {
    name: 'Vendor Name', type: 'string', prop: 'vendorName', visible: true,
  },
  {
    name: 'Vendor ID', type: 'string', prop: 'vendorId', visible: false,
  },
  {
    name: 'GL Posting Date', type: 'string', prop: 'glPostingDate', visible: true,
  },
  {
    name: 'Adjustment Balance', type: 'currency', prop: 'adjustmentBalance', visible: true,
  },
  {
    name: 'Amount Paid', type: 'currency', prop: 'amountPaid', visible: true,
  },
  {
    name: 'Adjustment Total', type: 'currency', prop: 'adjustmentTotal', visible: true,
  },
  {
    name: 'Description', type: 'string', prop: 'description', visible: false,
  },
]);

export default class BillAdjustmentService extends BaseDebounceService {
  constructor(resource = billResource) {
    super();
    this.resource = resource;
  }

  get name() {
    return 'bill-adjustment';
  }

  get columns() {
    return COLUMNS;
  }

  get(id) {
    return resourceWrapper(this.resource.query({ id }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveByIds(ids) {
    return resourceWrapper(this.resource.get({ ids }));
  }

  retrieveCsv() {
    return lspAwareUrl('bill-adjustment/export');
  }

  create(newUnit) {
    return resourceWrapper(this.resource.save(newUnit));
  }

  edit(newUnit) {
    return resourceWrapper(this.resource.update({ id: newUnit._id }, newUnit));
  }

  getBillAdjustmentFilesZipUrl(billAdjustmentId) {
    const billAdjustmentDocumentsUrl = lspAwareUrl(
      `bill-adjustment/${billAdjustmentId}/documents/src/zip`,
    );
    return billAdjustmentDocumentsUrl;
  }

  getDocumentDownloadUrl(documentUrl) {
    return resourceWrapper(Vue.http.get(documentUrl));
  }

  getDocumentUrl(billAdjustmentId, documentId) {
    const documentEndpoint = `bill-adjustment/${billAdjustmentId}/document/${documentId}`;
    return lspAwareUrl(documentEndpoint);
  }

  uploadDocument(formData, fileParams) {
    const endpointUrl = lspAwareUrl(`bill-adjustment/${fileParams.billAdjustmentId}/document`, fileParams);
    return resourceWrapper(Vue.http.post(endpointUrl, formData));
  }

  deleteDocument(documentId, billAdjustmentId) {
    const endpointUrl = lspAwareUrl(`bill-adjustment/${billAdjustmentId}/document/${documentId}`);
    return resourceWrapper(Vue.http.delete(endpointUrl));
  }
}
