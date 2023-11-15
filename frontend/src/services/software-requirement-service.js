import SoftwareRequirementResource from '../resources/software-requirement';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Name', type: 'string', prop: 'name', visible: true,
  },
  {
    name: 'Inactive', type: 'string', prop: 'deletedText', visible: true,
  },
]);

export default class SoftwareRequirementService {
  constructor(resource = SoftwareRequirementResource) {
    this.resource = resource;
  }

  get name() {
    return 'software-requirement';
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

  retrieveCsv() {
    return lspAwareUrl('software-requirement/export');
  }

  create(newSoftwareRequirement) {
    return resourceWrapper(this.resource.save(newSoftwareRequirement));
  }

  edit(newSoftwareRequirement) {
    return resourceWrapper(this.resource.update({
      id: newSoftwareRequirement._id,
    }, newSoftwareRequirement));
  }
}
