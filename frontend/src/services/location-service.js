import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';
import locationResource from '../resources/location';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Name', type: 'string', prop: 'name', visible: true,
  },
  {
    name: 'Country', prop: 'country', val: (l) => (l.country && l.country.name) || '', type: 'string', visible: false,
  },
  {
    name: 'State', prop: 'state', val: (l) => (l.state && l.state.name) || '', type: 'string', visible: true,
  },
  {
    name: 'City', prop: 'city', type: 'string', visible: true,
  },
  {
    name: 'Address', prop: 'address', type: 'string', visible: true,
  },
  {
    name: 'Suite#', prop: 'suite', type: 'string', visible: true,
  },
  {
    name: 'Phone', prop: 'phone', type: 'string', visible: false,
  },
  {
    name: 'Zip', prop: 'zip', type: 'string', visible: false,
  },
  {
    name: 'Created By', type: 'string', prop: 'createdBy', visible: true,
  },
  {
    name: 'Created  At', type: 'string', prop: 'createdAt', visible: true,
  },
  {
    name: 'Inactive', type: 'boolean', prop: 'deleted', visible: false,
  },
]);

export default class locationService {
  constructor(resource = locationResource) {
    this.resource = resource;
  }

  get columns() {
    return COLUMNS;
  }

  get(locationId) {
    return resourceWrapper(this.resource.get({ locationId }));
  }

  retrieve(params) {
    return resourceWrapper(this.resource.get({ params }));
  }

  retrieveCsv() {
    return lspAwareUrl('location/export');
  }

  create(location) {
    return resourceWrapper(this.resource.save(location));
  }

  edit(location) {
    const locationId = location._id;
    return resourceWrapper(this.resource.update({ locationId }, location));
  }
}
