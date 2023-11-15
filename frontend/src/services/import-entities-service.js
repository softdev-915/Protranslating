import Vue from 'vue';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';

export default class ImportEntitiesService {
  get name() {
    return 'import-entity';
  }

  import(data) {
    return resourceWrapper(Vue.http.post(lspAwareUrl(`${this.name}/import`), data));
  }
}
