import languageResource from '../resources/language';
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
    name: 'ISO Code', type: 'string', prop: 'isoCode', visible: true,
  },
  {
    name: 'Inactive', type: 'string', prop: 'deletedText', visible: true,
  },
]);

export default class LanguageService {
  constructor(resource = languageResource) {
    this.resource = resource;
  }

  get name() {
    return 'language';
  }

  get columns() {
    return COLUMNS;
  }

  get(languageId) {
    return resourceWrapper(this.resource.get({ languageId }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('language/export');
  }

  create(language) {
    return resourceWrapper(this.resource.save(language));
  }

  edit(language) {
    return resourceWrapper(this.resource.update({ languageId: language._id }, language));
  }
}
