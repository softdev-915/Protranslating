import contactResource from '../resources/contact';
import resourceWrapper from './resource-wrapper';

export default class ContactService {
  constructor(resource = contactResource) {
    this.resource = resource;
  }

  get(contactId) {
    return resourceWrapper(this.resource.get({ contactId }));
  }

  retrieve(companyId) {
    const params = {};
    if (companyId) {
      params.companyId = companyId;
    }
    return resourceWrapper(this.resource.query(params));
  }

  retrieveHierarchy(companyId) {
    const params = { contactMethod: 'hierarchy' };
    if (companyId) {
      params.companyId = companyId;
    }
    return resourceWrapper(this.resource.get(params));
  }
}
