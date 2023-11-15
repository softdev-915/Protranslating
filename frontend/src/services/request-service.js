import _ from 'lodash';
import Vue from 'vue';
import moment from 'moment';
import requestResource from '../resources/request';
import requestDocumentResource from '../resources/request-document';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';
import CommonService from './common-service';
import SessionFlags from '../utils/session/session-flags';
import { secondsToTimeLeftLegend, formatDate } from '../utils/date';
import { store } from '../stores/store';
import serviceFactory from '.';

const REQUEST_STATUSES = [
  { text: 'Waiting for Quote', value: 'Waiting for Quote', disabled: false },
  { text: 'Waiting for approval', value: 'Waiting for approval', disabled: false },
  { text: 'To be processed', value: 'To be processed', disabled: false },
  { text: 'In progress', value: 'In progress', disabled: false },
  { text: 'Delivered', value: 'Delivered', disabled: false },
  { text: 'Waiting for Client PO', value: 'Waiting for Client PO', disabled: false },
  { text: 'Completed', value: 'Completed', disabled: false },
  { text: 'Cancelled', value: 'Cancelled', disabled: false },
  { text: 'On Hold', value: 'On Hold', disabled: false },
];

const MAPPED_REQUEST_STATUSES = {
  waitingForQuote: 'Waiting for Quote',
  waitingForApproval: 'Waiting for approval',
  toBeProcessed: 'To be processed',
  inProgress: 'In progress',
  waitingForClientPO: 'Waiting for Client PO',
  completed: 'Completed',
  cancelled: 'Cancelled',
  onHold: 'On Hold',
  delivered: 'Delivered',
};

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Request No.', prop: 'no', type: 'string', visible: true,
  },
  {
    name: 'Opportunity No.', prop: 'opportunityNo', type: 'string', visible: false,
  },
  {
    name: 'Reference number', prop: 'referenceNumber', type: 'string', visible: false,
  },
  {
    name: 'Contact', prop: 'contactName', type: 'string', visible: true,
  },
  {
    name: 'Contact Email', prop: 'contactEmail', type: 'string', visible: false,
  },
  {
    name: 'Instructions and Comments', prop: 'comments', type: 'string', visible: true,
  },
  {
    name: 'Language Combinations', prop: 'languageCombinationsText', type: 'string', visible: true,
  },
  {
    name: 'Source Documents', prop: 'sourceDocumentsList', type: 'string', visible: true,
  },
  {
    name: 'Company', prop: 'companyName', type: 'string', visible: true,
  },
  {
    name: 'Company Hierarchy', prop: 'companyHierarchy', type: 'string', visible: true,
  },
  {
    name: 'Data Classification', prop: 'dataClassification', type: 'string', visible: false,
  },
  {
    name: 'Late', prop: 'lateText', type: 'string', visible: false,
  },
  {
    name: 'Rush', prop: 'rushText', type: 'string', visible: false,
  },
  {
    name: 'Department Notes', prop: 'departmentNotes', type: 'string', visible: false,
  },
  {
    name: 'Assignment Status', prop: 'assignmentStatusName', type: 'string', visible: false,
  },
  {
    name: 'Quote required ?', prop: 'quoteRequiredText', type: 'string', visible: false,
  },
  {
    name: 'Title', prop: 'title', type: 'string', visible: true,
  },
  {
    name: 'Other CC', prop: 'otherCC', type: 'string', visible: true,
  },
  {
    name: 'Project Managers', type: 'string', visible: true, prop: 'pmNames',
  },
  {
    name: 'Scheduling Company', type: 'string', visible: false, prop: 'schedulingCompanyName',
  },
  {
    name: 'Scheduling Contact', type: 'string', visible: false, prop: 'schedulingContactName',
  },
  {
    name: 'Memo', type: 'string', visible: false, prop: 'memo',
  },
  {
    name: 'Actual GP %',
    type: 'string',
    visible: false,
    prop: 'billGp',
    val: (item) => `${_.get(item, 'billGp', 0).toFixed(2)} %`,
  },
  {
    name: 'Actual Billable Cost Total', type: 'currency', visible: false, prop: 'billTotal',
  },
  {
    name: 'Projected Total Cost', type: 'currency', visible: false, prop: 'projectedCostTotal',
  },
  {
    name: 'Projected GP %',
    type: 'string',
    val: (item) => `${_.get(item, 'projectedCostGp', 0).toFixed(2)} %`,
    prop: 'projectedCostGp',
    visible: false,
  },
  {
    name: 'Invoice Total', type: 'currency', visible: false, prop: 'invoiceTotal',
  },
  {
    name: 'LSP Internal Department', type: 'string', visible: false, prop: 'internalDepartmentName',
  },
  {
    name: 'Location of the Request', type: 'string', visible: false, prop: 'locationName',
  },
  {
    name: 'Scheduling Status', type: 'string', visible: false, prop: 'schedulingStatusName',
  },
  {
    name: 'Recipient', type: 'string', visible: false, prop: 'recipient',
  },
  {
    name: 'Request Type',
    type: 'string',
    visible: false,
    prop: 'requestType.name',
    val: (item) => _.get(item, 'requestType.name', ''),
  },
  {
    name: 'Location of the request', type: 'string', visible: false, prop: 'locationName',
  },
  {
    name: 'Partners', type: 'string', visible: false, prop: 'partnerNames',
  },
  {
    name: 'Insurance Company', type: 'string', visible: false, prop: 'insuranceCompanyName',
  },
  {
    name: 'Number of Rooms', type: 'string', visible: false, prop: 'rooms',
  },
  {
    name: 'Number of Attendees', type: 'string', visible: false, prop: 'atendees',
  },
  {
    name: 'Request Expected Start', prop: 'expectedStartDate', type: 'dateRange', visible: false,
  },
  {
    name: 'Request Actual Start', prop: 'actualStartDate', type: 'string', visible: false,
  },
  {
    name: 'Request Actual End', prop: 'actualDeliveryDate', type: 'string', visible: false,
  },
  {
    name: 'Expected Duration',
    type: 'string',
    visible: false,
    prop: 'expectedDurationTime',
    val: (item) => `${_.get(item, 'expectedDurationTime', 0)} hrs`,
  },
  {
    name: 'Reception Date', prop: 'receptionDate', type: 'string', visible: false,
  },
  {
    name: 'PO', prop: 'purchaseOrder', type: 'string', visible: false,
  },
  {
    name: 'PO required', prop: 'poRequiredText', type: 'string', visible: false,
  },
  { name: 'Also Deliver To', prop: 'otherContactName', visible: false },
  {
    name: 'Delivery Date',
    prop: 'deliveryDate',
    type: 'dateRange',
    visible: true,
    val: (item) => formatDate(item.deliveryDate, 'YYYY-MM-DD HH:mm'),
    cssCell: (item) => (moment(item.deliveryDate).isBefore(moment()) ? 'red-text' : ''),
  },
  {
    name: 'Quote Target Date & Time',
    prop: 'quoteDueDate',
    type: 'dateRange',
    visible: false,
    val: (item) => formatDate(item.quoteDueDate, 'YYYY-MM-DD HH:mm'),
  },
  {
    name: 'Quote Expected Close Date',
    prop: 'expectedQuoteCloseDate',
    type: 'dateRange',
    visible: false,
    val: (item) => formatDate(item.expectedQuoteCloseDate, 'YYYY-MM-DD HH:mm'),
  },
  {
    name: 'Turnaround time notes', type: 'string', prop: 'turnaroundTime', visible: false,
  },
  {
    name: 'Request Status', prop: 'status', type: 'string', visible: true,
  },
  {
    name: 'Projected GP %', type: 'string', prop: 'projectedCostGp', visible: false,
  },
  {
    name: 'Final Documents', type: 'string', prop: 'finalDocs', visible: false,
  },
  {
    name: 'Cancelled at',
    type: 'string',
    prop: 'cancelledAt',
    visible: false,
    val: (item) => formatDate(item.cancelledAt, 'YYYY-MM-DD HH:mm'),
  },
  {
    name: 'Completed at',
    type: 'string',
    prop: 'completedAt',
    visible: false,
    val: (item) => formatDate(item.completedAt, 'YYYY-MM-DD HH:mm'),
  },
  {
    name: 'Delivered at',
    type: 'string',
    prop: 'deliveredAt',
    visible: false,
    val: (item) => formatDate(item.deliveredAt, 'YYYY-MM-DD HH:mm'),
  },
  {
    name: 'Invoice to Company', type: 'string', visible: false, prop: 'invoiceCompanyName',
  },
  {
    name: 'Invoice to Contact', type: 'string', visible: false, prop: 'invoiceContactName',
  },
  {
    name: 'Request Invoice Status', type: 'string', visible: false, prop: 'requestInvoiceStatus',
  },
  {
    name: 'Overdue', type: 'string', visible: true, prop: 'timeSinceText',
  },
  {
    name: 'Complaint/Nonconformance', type: 'string', prop: 'complaintText', visible: true,
  },
]);
export default class RequestService extends CommonService {
  constructor(resource = requestResource) {
    super(resource);
    this.documentResource = requestDocumentResource;
    this.endpointBuilder = lspAwareUrl;
    this.gridColumns = COLUMNS;
    this.mockBigFileUploading = _.get(SessionFlags.getCurrentFlags(), 'mockBigFileUploading', false);
    this.currentHttpRequest = null;
    this.uploadCanceled = false;
    this.uploadStartedDate = null;
  }

  static defaultColumnsForReadOwnRole() {
    return [
      { name: 'Request No.', visible: true },
      { name: 'Contact', visible: true },
      { name: 'Contact Email', visible: true },
      { name: 'Company', visible: true },
      { name: 'Company Hierarchy', visible: true },
      { name: 'Title', visible: true },
      { name: 'Language Combinations', visible: true },
      {
        name: 'Delivery Date', prop: 'deliveryDate', type: 'dateRange', visible: true,
      },
      { name: 'Project Managers', visible: true },
      { name: 'Request Status', visible: true },
      {
        name: 'Request Type',
        type: 'string',
        visible: false,
        prop: 'requestType.name',
      },
      { name: 'Overdue', visible: true },
    ];
  }

  static defaultColumnsForReadAllRole() {
    return [
      { name: 'Request No.', visible: true },
      { name: 'Contact', visible: true },
      { name: 'Contact Email', visible: true },
      { name: 'Company', visible: true },
      { name: 'Company Hierarchy', visible: true },
      { name: 'Title', visible: true },
      { name: 'Language Combinations', visible: true },
      {
        name: 'Delivery Date', prop: 'deliveryDate', type: 'dateRange', visible: true,
      },
      { name: 'Project Managers', visible: true },
      { name: 'Request Status', visible: true },
      { name: 'Overdue', visible: true },
      { name: 'Complaint/Nonconformance', visible: true },
      { name: 'Final Documents', visible: true },
    ];
  }

  static defaultFileColumns({
    canEdit,
    isAutoWorkflow = false,
    canReadOCRFiles = false,
    canReadCatFiles = false,
  }) {
    return [
      { name: 'Reference', visible: true },
      { name: 'Internal', visible: true },
      { name: 'Translated', visible: isAutoWorkflow },
      { name: 'Translate in PortalCAT', visible: canReadCatFiles },
      { name: 'Filename', visible: true },
      { name: 'OCR-ed Files', visible: isAutoWorkflow && canReadOCRFiles },
      { name: 'Created At', visible: true },
      { name: 'Deleted At', visible: true },
      { name: 'Deleted By', visible: true },
      { name: 'Retention Time', visible: true },
      { name: 'Size', visible: true },
      { name: 'Download', visible: true },
      { name: 'Remove', visible: canEdit },
    ];
  }

  get columns() {
    return this.gridColumns;
  }

  set columns(newValue) {
    this.gridColumns = newValue;
  }

  static get requestStatuses() {
    return REQUEST_STATUSES;
  }

  static get mappedStatuses() {
    return MAPPED_REQUEST_STATUSES;
  }

  getDocumentUrl(requestId, companyId, document) {
    const documentId = _.get(document, '_id', document);
    const documentEndpoint = `company/${encodeURIComponent(companyId)}/request/${encodeURIComponent(requestId)}`;
    return this.endpointBuilder(`${documentEndpoint}/document/${documentId}`);
  }

  getDocumentOcrUrl(requestId, companyId, languageCombinationId, document) {
    const documentId = _.get(document, '_id', document);
    const documentEndpoint = `company/${encodeURIComponent(companyId)}/request/${encodeURIComponent(requestId)}/languageCombination/${encodeURIComponent(languageCombinationId)}`;
    return this.endpointBuilder(`${documentEndpoint}/document/${documentId}/ocr_result`);
  }

  mockUploadHandler() {
    const progressObj = { loaded: 0, total: 5000 };
    let fileUploadMockInterval;
    this.uploadStartedDate = moment();
    return new Promise((resolve, reject) => {
      fileUploadMockInterval = setInterval(() => {
        if (this.uploadCanceled) reject();
        progressObj.loaded += 100;
        this.updateUploadProgress(progressObj);
        if (progressObj.loaded >= progressObj.total || this.uploadCanceled) {
          clearInterval(fileUploadMockInterval);
          resolve({
            body: {
              data:
              {
                request: { languageCombinations: [] },
              },
            },
          });
        }
      }, 500);
    });
  }

  updateUploadProgress(progressObj) {
    const { total, loaded } = progressObj;
    const progressPercentage = `${Math.round((loaded * 100) / total)} %`;
    const secondsElapsed = moment().diff(this.uploadStartedDate, 'seconds');
    const totalExpectedUploadTime = total / (loaded / secondsElapsed);
    const secondsLeftForUploadFinised = totalExpectedUploadTime - secondsElapsed;
    if (secondsLeftForUploadFinised === 0 && progressPercentage === '100 %') {
      this.setUploadProgress(`${progressPercentage}. Uploading finished, wait please...`);
    } else {
      this.setUploadProgress(`${progressPercentage}. Time left: ${secondsToTimeLeftLegend(secondsLeftForUploadFinised)}`);
    }
  }

  uploadHandler(endpointUrl, formData) {
    if (this.mockBigFileUploading) {
      return this.mockUploadHandler();
    }
    const progressObj = { loaded: 0, total: 0 };
    const self = this;
    return Vue.http.post(endpointUrl, formData, {
      before(request) {
        self.uploadStartedDate = moment();
        self.currentHttpRequest = request;
      },
      progress({ lengthComputable, total, loaded }) {
        if (lengthComputable) {
          Object.assign(progressObj, { loaded, total });
          self.updateUploadProgress(progressObj);
        }
      },
    });
  }

  cancelUpload() {
    this.uploadCanceled = true;
    serviceFactory.logService().info('Cancel upload');
    if (this.mockBigFileUploading) return;
    this.currentHttpRequest.abort();
  }

  setUploadProgress(progress) {
    serviceFactory.logService().info(`Set upload Progress. ${progress}`);
    store.dispatch('app/triggerGlobalEvent', { progress });
  }

  getDocumentDownloadUrl(documentUrl) {
    return resourceWrapper(Vue.http.get(documentUrl));
  }

  get(requestId, { withCATData = false } = {}) {
    return resourceWrapper(
      this.resource.get({ requestId, withCATData }),
    );
  }

  getRequestsWithQuote(params) {
    const paramsClone = { ...params };
    return resourceWrapper(this.resource.get({ params: paramsClone, quoted: 'quoted' }));
  }

  retrieve(params) {
    const paramsClone = { ...params };
    return resourceWrapper(this.resource.get({ params: paramsClone }));
  }

  retrieveCsv() {
    return lspAwareUrl('request/export');
  }

  getDocumentRemovePermissions(requestId) {
    const url = lspAwareUrl(`request/${requestId}/file-removal-permission`);
    return resourceWrapper(Vue.http.get(url));
  }

  edit(request) {
    return resourceWrapper(this.resource.update({ requestId: request._id }, request));
  }

  create(request) {
    return resourceWrapper(this.resource.save(request));
  }

  saveQuoteRequestData(requestId, payload) {
    const url = lspAwareUrl(`request/${requestId}/quote`);
    return resourceWrapper(Vue.http.put(url, payload));
  }

  uploadRequestDocument(formData, fileParams) {
    let endpointUrl = `request/${fileParams.requestId}/document`;
    endpointUrl = this.buildLspAwareDocumentUrl(endpointUrl, fileParams);
    return this._handleFileUpload(formData, endpointUrl);
  }

  _handleFileUpload(formData, endpointUrl) {
    const handler = this.uploadHandler.bind(this);
    return resourceWrapper(handler(endpointUrl, formData)).finally(() => {
      this.setUploadProgress('');
    });
  }

  uploadTaskDocument({
    formData, requestId, workflowId, taskId, providerTaskId, newDocument,
  }) {
    let endpointUrl = `request/${requestId}/workflow/${workflowId}/task/${taskId}/providerTask/${providerTaskId}/document`;
    endpointUrl = this.buildLspAwareDocumentUrl(endpointUrl, { newDocument });
    return this._handleFileUpload(formData, endpointUrl);
  }

  buildLspAwareDocumentUrl(endpointUrl, params) {
    const { languageCombinationId } = params;
    if (!_.isEmpty(languageCombinationId)) {
      endpointUrl += `?languageCombinationId=${languageCombinationId}`;
    }
    return lspAwareUrl(endpointUrl);
  }

  deleteDocument(documentId, requestId) {
    if (!_.isEmpty(documentId) && !_.isEmpty(requestId)) {
      const endpointUrl = lspAwareUrl(`request/${requestId}/document/${documentId}`);
      return resourceWrapper(Vue.http.delete(endpointUrl));
    }
  }

  getLanguageCombinationDocumentZipUri({ companyId, requestId, languageCombinationId }) {
    const downloadUrl = `languageCombination/${languageCombinationId}/documents/src/zip`;
    const endpointUrl = lspAwareUrl(`company/${companyId}/request/${requestId}/${downloadUrl}`);
    return endpointUrl;
  }

  approveQuote(requestId) {
    const url = lspAwareUrl(`request/${requestId}/approve-quote`);
    return resourceWrapper(Vue.http.put(url));
  }

  calculatePatentFee(requestId, patentData, translationOnly = false) {
    const url = lspAwareUrl(`request/${requestId}/calculate-patent-fee?translationOnly=${translationOnly}`);
    return resourceWrapper(Vue.http.put(url, patentData));
  }

  forceUpdatePatentFee(requestId, countries) {
    if (_.isEmpty(countries)) {
      return;
    }
    const url = lspAwareUrl(`request/${requestId}/force-update-patent-fee`);
    return resourceWrapper(Vue.http.put(url, countries));
  }

  getRequestUpdateRequiredFields(request) {
    return _.pick(request, ['_id', 'title', 'requireQuotation', 'deliveryDate', 'languageCombinations', 'comments', 'quoteCurrency']);
  }

  updateProviderTaskTTE(requestId, workflowId, taskId, providerTaskId, data) {
    const url = lspAwareUrl(`request/${requestId}/workflow/${workflowId}/task/${taskId}/providerTask/${providerTaskId}/tte`);
    return resourceWrapper(Vue.http.put(url, data), false);
  }
}
