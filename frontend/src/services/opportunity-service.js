import Vue from 'vue';
import OpportunityResource from '../resources/opportunity';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Opportunity No.',
    prop: 'no',
    type: 'string',
    visible: true,
  },
  {
    name: 'Title',
    prop: 'title',
    type: 'string',
    visible: true,
  },
  {
    name: 'Status',
    prop: 'status',
    type: 'string',
    visible: true,
  },
  {
    name: 'Company',
    prop: 'companyText',
    type: 'string',
    visible: true,
  },
  {
    name: 'Contact',
    prop: 'contactText',
    type: 'string',
    visible: true,
  },
  {
    name: 'Source Language',
    type: 'string',
    prop: 'srcLangText',
    visible: true,
  },
  {
    name: 'Target Languages',
    type: 'string',
    prop: 'tgtLangs',
    queryKey: 'tgtLangs.name',
    val: (item) => item.tgtLangs.map((t) => t.name).join(', '),
    visible: true,
  },
  {
    name: 'Expected close date',
    prop: 'expectedCloseDate',
    type: 'string',
    visible: true,
  },
  {
    name: 'Sales Rep',
    prop: 'salesRepText',
    type: 'string',
    visible: true,
  },
  {
    name: 'Won on',
    prop: 'wonOnDate',
    type: 'string',
    visible: false,
  },
  {
    name: 'Documents',
    prop: 'documents',
    queryKey: 'documents.name',
    val: (item) => item.documents.map((d) => d.name).join(', '),
    type: 'string',
    visible: false,
  },
  {
    name: 'Probability',
    prop: 'probability',
    type: 'string',
    visible: false,
  },
  {
    name: 'Secondary contacts',
    prop: 'secondaryContactsText',
    type: 'string',
    visible: false,
  },
]);

export default class OpportunityService {
  constructor(resource = OpportunityResource) {
    this.resource = resource;
    this.endpointBuilder = lspAwareUrl;
  }

  get columns() {
    return COLUMNS;
  }

  get(id) {
    return resourceWrapper(this.resource.query({ id }));
  }

  getDocumentUrl(opportunityId, companyId, { _id, name }) {
    const documentEndpoint = `company/${encodeURIComponent(companyId)}/opportunity/${encodeURIComponent(opportunityId)}`;
    return this.endpointBuilder(`${documentEndpoint}/document/${encodeURIComponent(_id)}/filename/${encodeURIComponent(name)}`);
  }

  getDocumentDownloadUrl(documentUrl) {
    return resourceWrapper(Vue.http.get(documentUrl));
  }

  getZipDocumentUrl(companyId, opportunityId) {
    const documentEndpoint = `company/${encodeURIComponent(companyId)}/opportunity/${encodeURIComponent(opportunityId)}`;
    return this.endpointBuilder(`${documentEndpoint}/documents/src/zip`);
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('opportunity/export');
  }

  create(newOpportunity) {
    return resourceWrapper(this.resource.save(newOpportunity));
  }

  edit(newOpportunity) {
    return resourceWrapper(this.resource.update({ id: newOpportunity._id }, newOpportunity));
  }

  getDocumentRemovePermissions(opportunityId) {
    const url = lspAwareUrl(`opportunity/${opportunityId}/file-removal-permission`);
    return resourceWrapper(Vue.http.get(url));
  }
}
