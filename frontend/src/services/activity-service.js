import Vue from 'vue';
import _ from 'lodash';
import moment from 'moment';
import activityResource from '../resources/activity';
import lspAwareUrl from '../resources/lsp-aware-url';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';

const scheduledAtValFunc = (a) => {
  const scheduledAt = _.get(a, 'emailDetails.scheduledAt');
  if (scheduledAt) {
    return moment(scheduledAt).format('MM-DD-YYYY');
  }
  return '';
};

const COLUMNS = extendColumns([
  { name: 'ID', type: 'string', prop: '_id', visible: true },
  { name: 'Date Sent', type: 'string', prop: 'dateSent', visible: false, val: item => (item.dateSent ? moment(item.dateSent).format('MM-DD-YYYY') : '') },
  { name: 'Type', type: 'string', prop: 'activityType', visible: true },
  { name: 'Users', type: 'array', prop: 'users', visible: true },
  { name: 'Created By', type: 'string', prop: 'activityCreatedBy', visible: true },
  { name: 'Internal Departments', type: 'array', prop: 'internalDepartments', visible: true },
  { name: 'Company', type: 'string', prop: 'company', visible: false },
  { name: 'Company Status', type: 'string', prop: 'companyStatus', visible: false },
  { name: 'Requests', type: 'string', prop: 'requests', visible: true },
  { name: 'Incident Date', type: 'string', prop: 'incidentDate', visible: true, val: item => (_.get(item, 'feedbackDetails.incidentDate') ? moment(item.feedbackDetails.incidentDate).format('MM-DD-YYYY') : '') },
  { name: 'Subject', type: 'string', prop: 'subject', visible: true },
  { name: 'Comments', type: 'string', prop: 'comments', visible: true },
  { name: 'Tags', type: 'array', prop: 'tags', visible: true },
  { name: 'NC/CC Category', type: 'string', prop: 'nonComplianceClientComplaintCategory', visible: true, val: item => (_.get(item, 'feedbackDetails.nonComplianceClientComplaintCategory', '')) },
  { name: 'Status', type: 'string', prop: 'status', visible: true, val: item => (_.get(item, 'feedbackDetails.status', '')) },
  { name: 'CAR #', type: 'string', prop: 'car', visible: true, val: item => (_.get(item, 'feedbackDetails.car', '')) },
  { name: 'Escalated', type: 'boolean', prop: 'escalated', visible: true, val: item => (_.get(item, 'feedbackDetails.escalated', '')) },
  { name: 'From', type: 'string', prop: 'fromText', visible: true },
  { name: 'To', type: 'string', prop: 'toText', visible: false },
  { name: 'Cc', type: 'string', prop: 'ccText', visible: false },
  { name: 'Bcc', type: 'string', prop: 'bccText', visible: false },
  { name: 'Body', type: 'string', prop: 'emailTextBody', visible: false },
  { name: 'Opportunities', type: 'string', prop: 'opportunityNumbersText', visible: false },
  { name: 'Failed emails', type: 'string', prop: 'failedEmailsText', visible: false },
  { name: 'Scheduled At', type: 'string', visible: false, val: scheduledAtValFunc },
  { name: 'Invoice Number', type: 'string', prop: 'invoiceNo', visible: true },
  { name: 'Files', type: 'array', prop: 'files', visible: false, val: item => _.get(item, 'files') || item.attachmentsText || '' },
  { name: 'Inactive', type: 'boolean', prop: 'deleted', visible: false },
  { name: 'Updated at', type: 'string', prop: 'updatedAt', visible: true },
  { name: 'Updated by', type: 'string', prop: 'updatedBy', visible: true },
  { name: 'Created at', type: 'string', prop: 'createdAt', visible: true },
]);

export default class ActivityService {
  constructor(resource = activityResource) {
    this.resource = resource;
    this.endpointBuilder = lspAwareUrl;
  }

  get columns() {
    return COLUMNS;
  }

  get(activityId) {
    return resourceWrapper(this.resource.get({ activityId }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('activity/export');
  }

  create(activity) {
    return resourceWrapper(this.resource.save(activity));
  }

  edit(activity) {
    return resourceWrapper(this.resource.update({ activityId: activity._id }, activity));
  }

  sendQuote(activityId) {
    const url = lspAwareUrl(`activity/${activityId}/sendQuote`);
    return resourceWrapper(Vue.http.put(url));
  }

  approveQuote(activityId) {
    const url = lspAwareUrl(`activity/${activityId}/approveQuote`);
    return resourceWrapper(Vue.http.put(url));
  }

  uploadDocument(activityId, formData) {
    const url = this.endpointBuilder(`activityFeedback/${activityId}/document/`);
    return resourceWrapper(Vue.http.post(url, formData));
  }

  uploadActivityAttachment(formData) {
    const endpointUrl = lspAwareUrl('activityEmail/document');
    return resourceWrapper(Vue.http.post(endpointUrl, formData));
  }

  deleteDocument(activityId, documentId, filename) {
    const url = this.endpointBuilder(`activity/${activityId}/deleteDocument/${documentId}/filename/${filename}`);
    return resourceWrapper(Vue.http.delete(url));
  }

  deleteDocuments(activityId, documentIds) {
    const url = this.endpointBuilder(`activity/${activityId}/document/delete-selected`);
    return resourceWrapper(Vue.http.delete(url, { params: { documentIds } }));
  }

  getDocumentUrl(activityId, documentId, filename) {
    return this.endpointBuilder(`activity/${activityId}/document/${documentId}/filename/${filename}`);
  }

  getEmailActivityDocumentUrl(activityId, _companyId, document) {
    if (_.isEmpty(activityId)) {
      return this.endpointBuilder(`activity/document/${document._id}/filename/${document.name}`);
    }
    return this.endpointBuilder(`emailActivity/${activityId}/document/${document._id}/filename/${document.name}`);
  }
  sendInvoiceEmail(activityId) {
    const url = this.endpointBuilder(`activity/${activityId}/send-invoice-email`);
    return resourceWrapper(Vue.http.put(url, { activityId }));
  }
}
