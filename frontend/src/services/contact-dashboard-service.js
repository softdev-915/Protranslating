import resourceWrapper from './resource-wrapper';
import ContactDashboardResource from '../resources/contact-dashboard';

export default class ContactDashboardService {
  constructor(resource = ContactDashboardResource) {
    this.resource = resource;
  }

  getRequestKpiData() {
    return resourceWrapper(this.resource.get({ dashboardMethod: 'request-kpi' }));
  }

  getInvoiceKpiData(datePeriod, paginationParams = { limit: 10, page: 1 }) {
    return resourceWrapper(this.resource.get({ dashboardMethod: 'invoice-kpi', datePeriod, ...paginationParams }));
  }

  getLanguageKpiData(
    sourceLanguage,
    targetLanguage,
    datePeriod,
    paginationParams = { limit: 10, page: 1 },
  ) {
    const params = {
      sourceLanguage,
      targetLanguage,
      datePeriod,
      ...paginationParams,
    };
    return resourceWrapper(this.resource.get({ dashboardMethod: 'language-kpi', ...params }));
  }
}
