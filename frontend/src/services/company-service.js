import _ from 'lodash';
import Vue from 'vue';
import companyResource from '../resources/company';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import extendColumns from '../utils/shared-columns';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Name', type: 'string', prop: 'name', visible: true,
  },
  {
    name: 'Hierarchy',
    type: 'html',
    prop: 'hierarchy',
    visible: true,
    val: (item) => `<i>${item.hierarchy}</i>`,
  },
  {
    name: 'Using Default Policies', type: 'string', prop: 'isOverwrittenText', visible: true,
  },
  {
    name: 'Company status', type: 'string', prop: 'status', visible: true,
  },
  {
    name: 'Industry', type: 'string', prop: 'industry', visible: true,
  },
  {
    name: 'Pursuit active', type: 'string', prop: 'pursuitActive', visible: true,
  },
  {
    name: 'Customer tier level', type: 'string', prop: 'customerTierLevel', visible: true,
  },
  {
    name: 'Primary phone number', type: 'string', prop: 'primaryPhoneNumber', visible: true,
  },
  {
    name: 'Sales rep', prop: 'salesRepName', type: 'string', visible: true,
  },
  {
    name: 'City', prop: 'cityName', type: 'string', visible: true,
  },
  {
    name: 'State', prop: 'stateName', type: 'string', visible: true,
  },
  {
    name: 'Country', prop: 'countryName', type: 'string', visible: true,
  },
  {
    name: 'Billing email', type: 'string', prop: 'billingEmail', visible: true,
  },
  {
    name: 'Created By', type: 'string', prop: 'createdBy', visible: true,
  },
  {
    name: 'Updated At', type: 'string', prop: 'updatedAt', visible: true,
  },
  {
    name: 'Inactive', type: 'string', prop: 'inactiveText', visible: true,
  },
  {
    name: 'Service Agreement', type: 'string', prop: 'serviceAgreementText', visible: false,
  },
  {
    name: 'Locations', type: 'string', prop: 'locationsText', visible: false,
  },
  {
    name: 'Company Notes', type: 'longtext', prop: 'notes', visible: false,
  },
  {
    name: 'Purchase Order Required', type: 'string', prop: 'purchaseOrderRequiredText', visible: false,
  },
  {
    name: 'Billing Term', type: 'string', prop: 'billingTermName', visible: false,
  },
  {
    name: 'Form Of Payment', type: 'string', prop: 'paymentMethodName', visible: false,
  },
  {
    name: 'Account On Hold', type: 'string', prop: 'onHoldText', visible: false,
  },
  {
    name: 'Gross Profit %', type: 'string', prop: 'grossProfitText', visible: false,
  },
  {
    name: 'LSP Internal Departments', type: 'string', prop: 'internalDepartmentNames', visible: true,
  },
  {
    name: 'Billing Notes',
    type: 'longtext',
    prop: 'billingInformation.notes',
    val: (item) => _.get(item, 'billingInformation.notes'),
    visible: false,
  },
  {
    name: 'Mandatory Request Contact', type: 'string', prop: 'mandatoryRequestContactText', visible: false,
  },
  {
    name: 'Synced',
    type: 'boolean',
    prop: 'siConnector.isSynced',
    visible: false,
    val: (item) => (_.get(item, 'siConnector.isSynced', '')),
  },
  {
    name: 'Last Sync Date',
    type: 'date',
    prop: 'siConnector.connectorEndedAt',
    visible: false,
    val: (item) => (_.get(item, 'siConnector.connectorEndedAt', '')),
  },
  {
    name: 'Sync Error',
    type: 'string',
    prop: 'siConnector.error',
    visible: false,
    val: (item) => (_.get(item, 'siConnector.error', '')),
  },
]);

export default class CompanyService {
  constructor(resource = companyResource) {
    if (typeof resource === 'function') {
      this.resource = resource();
    } else {
      this.resource = resource;
    }
    this.gridColumns = COLUMNS;
  }

  get columns() {
    return this.gridColumns;
  }

  set columns(newValue) {
    this.gridColumns = newValue;
  }

  get(companyId) {
    return this.retrieveById(companyId);
  }

  retrieve(params, columns) {
    this.params = { ...this.params, ...params };
    if (params && typeof params === 'string') {
      const companyIds = [];
      companyIds.push({ ids: params });
      return resourceWrapper(this.resource.query(...companyIds));
    }
    return resourceWrapper(this.resource.get({ params: this.params, columns }));
  }

  getPaginated(params) {
    let paramsClone;
    if (params) {
      paramsClone = { ...params };
      Object.keys(paramsClone).forEach((key) => {
        if (paramsClone[key] === null || paramsClone[key] === undefined) {
          delete paramsClone[key];
        }
      });
    }
    return resourceWrapper(this.resource.get({ params: paramsClone }));
  }

  nameList(params) {
    let paramsClone;
    if (params) {
      paramsClone = { ...params };
      Object.keys(paramsClone).forEach((key) => {
        if (paramsClone[key] === null || paramsClone[key] === undefined) {
          delete paramsClone[key];
        }
      });
    }
    return resourceWrapper(this.resource.get({ nameList: 'nameList', params: paramsClone }));
  }

  search(searchParams) {
    return resourceWrapper(this.resource.get(searchParams));
  }

  retrieveCompanySalesRep(id) {
    return resourceWrapper(this.resource.query({ id, salesRep: 'salesRep' }));
  }

  retrieveCompanyRates(id) {
    if (typeof id === 'string') {
      return resourceWrapper(this.resource.query({ id, rates: 'rates' }));
    }
    return null;
  }

  retrieveById(id, select) {
    return resourceWrapper(this.resource.query({ id, select }));
  }

  retrievePublicInfo(id) {
    const url = lspAwareUrl('company/{id}/publicInfo');
    return resourceWrapper(Vue.resource(url).get({ id }));
  }

  retrieveCsv() {
    return lspAwareUrl('company/export');
  }

  create(newCompany) {
    return resourceWrapper(this.resource.save(newCompany));
  }

  edit(newCompany) {
    return resourceWrapper(this.resource.update({ id: newCompany._id }, newCompany));
  }

  isUploadingAllowedForIp(companyId) {
    return resourceWrapper(this.resource.get({ id: companyId, allowedUploadingForIp: 'allowedUploadingForIp' }));
  }

  retrievePcSettingsResources(companyId, params) {
    const url = lspAwareUrl('company/{companyId}/pc-settings/resources');
    return resourceWrapper(Vue.resource(url, params).get({ companyId }));
  }

  uploadPcSettingsResource({
    formData, language, srcLang, tgtLang, isReviewed, type, companyId,
  }) {
    const url = lspAwareUrl('company/{companyId}/pc-settings/resources');
    const params = {
      language, srcLang, tgtLang, type, isReviewed,
    };
    return resourceWrapper(Vue.resource(url, params).save({ companyId }, formData));
  }

  updatePcSettingsResource({
    type, formData, resourceId, companyId, isReviewed,
  }) {
    const url = lspAwareUrl('company/{companyId}/pc-settings/resources/{resourceId}');
    return resourceWrapper(
      Vue.resource(url, { isReviewed, type }).update({ companyId, resourceId }, formData),
    );
  }

  updatePcSettingsResourceName({
    type, resourceId, companyId, name,
  }) {
    const url = lspAwareUrl(`company/${companyId}/pc-settings/resources/${resourceId}/name`);
    return resourceWrapper(
      Vue.http.patch(url, { name }, { params: { type } }),
    );
  }

  deletePcSettingsResources({ type, resourceIds, companyId }) {
    const url = lspAwareUrl('company/{companyId}/pc-settings/resources');
    return resourceWrapper(Vue.resource(url).delete({ companyId }, { type, resourceIds }));
  }

  async getPcSettingsResource({ type, resourceId, companyId }) {
    const url = lspAwareUrl('company/{companyId}/pc-settings/resources/{resourceId}/download');
    const response = await Vue.resource(url, { type }, null, { responseType: 'blob' }).get({ companyId, resourceId });
    const contentType = response.headers.get('content-type');
    const disposition = response.headers.get('content-disposition');
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    const filename = matches[1].replace(/['"]/g, '');
    return { type: contentType, data: response.data, filename };
  }

  async getPcSettingsResourcesZip({ resourceIds, companyId, type }) {
    const url = lspAwareUrl('company/{companyId}/pc-settings/resources/zip');
    const response = await Vue.resource(url, null, null, { responseType: 'blob' }).save({ companyId }, { resourceIds, type });
    const contentType = response.headers.get('content-type');
    const disposition = response.headers.get('content-disposition');
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    const filename = matches[1].replace(/['"]/g, '');
    return { type: contentType, data: response.data, filename };
  }

  getSsoSettings(id) {
    const url = lspAwareUrl('company/{id}/sso-settings');
    return resourceWrapper(Vue.resource(url).get({ id }));
  }

  getBalance(id) {
    const url = lspAwareUrl('company/{id}/balance');
    return resourceWrapper(Vue.resource(url).get({ id }));
  }

  getAvailableTimeToDeliver(id) {
    const url = lspAwareUrl('company/{id}/availableTimeToDeliver');
    return resourceWrapper(Vue.resource(url).get({ id }));
  }

  getPatentRates(id, entity, language) {
    const url = lspAwareUrl('company/{id}/ip-rates/{entity}/{language}');
    return resourceWrapper(Vue.resource(url).get({ id, entity, language }));
  }

  resetPatentRates(id, entity, language) {
    const url = lspAwareUrl('company/{id}/ip-rates/reset/{entity}/{language}');
    return resourceWrapper(Vue.resource(url).get({ id, entity, language }));
  }

  updatePatentRates({
    id, entity, language, newRates, defaultCompanyCurrencyCode,
  }) {
    const url = lspAwareUrl('company/{id}/ip-rates/{entity}/{language}/{defaultCompanyCurrencyCode}');
    return resourceWrapper(
      Vue.resource(url).update(
        {
          id, entity, language, defaultCompanyCurrencyCode,
        },
        { payload: newRates },
      ),
    );
  }

  getRequestsByCompanyTimeToDeliver(companyId, deletedTimeToDeliver) {
    const endpointUrl = lspAwareUrl(`company/${companyId}/request/time-to-deliver`);
    return resourceWrapper(Vue.http.get(endpointUrl, {
      params: {
        timeToDeliver: deletedTimeToDeliver,
      },
    }));
  }

  retrieveIndustry(id) {
    const url = lspAwareUrl('company/{id}/industry');
    return resourceWrapper(Vue.resource(url).get({ id }));
  }
}
