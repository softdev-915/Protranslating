import competenceLevelResource from '../resources/competence-level';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = extendColumns([
  { name: 'ID', type: 'string', prop: '_id', visible: false },
  { name: 'Name', type: 'string', prop: 'name', visible: true },
  { name: 'Inactive', type: 'string', prop: 'deletedText', visible: true },
]);

export default class CompetenceLevelService {
  constructor(resource = competenceLevelResource) {
    this.resource = resource;
  }

  get columns() {
    return COLUMNS;
  }

  get(competenceLevelId) {
    return resourceWrapper(this.resource.get({ competenceLevelId }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('user/competence/export');
  }

  create(competenceLevel) {
    return resourceWrapper(this.resource.save(competenceLevel));
  }

  edit(competenceLevel) {
    return resourceWrapper(this.resource
      .update({ competenceLevelId: competenceLevel._id }, competenceLevel));
  }
}
