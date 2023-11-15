import footerTemplateResource from '../resources/footer-template';
import resourceWrapper from './resource-wrapper';
import BasicService from './basic-service';
import extendColumns from '../utils/shared-columns';

const COLUMNS = extendColumns([
  { name: 'ID', type: 'string', prop: '_id', visible: true },
  { name: 'Name', type: 'string', prop: 'name', visible: true },
  { name: 'Description', type: 'string', prop: 'description', visible: true },
  { name: 'Inactive', type: 'boolean', prop: 'deleted', visible: true },
]);

export default class FooterTemplateService extends BasicService {
  constructor(resource = footerTemplateResource) {
    super(resource, 'footer-template', COLUMNS);
  }

  get name() {
    return 'footer-template-service';
  }

  get columns() {
    return COLUMNS;
  }

  get(id) {
    return resourceWrapper(this.resource.query({ id }));
  }

  retrieve(params) {
    this.params = Object.assign({}, this.params, params);
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  create(footerTemplate) {
    return resourceWrapper(this.resource.save(footerTemplate));
  }

  edit(footerTemplate) {
    return resourceWrapper(this.resource.update({ id: footerTemplate._id }, footerTemplate));
  }

  nameList(params) {
    return resourceWrapper(this.resource.get({ nameList: 'nameList', params }));
  }
}
