import lspLogo from '../resources/lsp-logo';
import resourceWrapper from './resource-wrapper';

export default class LspLogo {
  constructor(resource = lspLogo) {
    this.resource = resource;
  }

  get name() {
    return 'lspLogo';
  }

  retrieve(params) {
    return resourceWrapper(this.resource.get({ params: params }));
  }
}
