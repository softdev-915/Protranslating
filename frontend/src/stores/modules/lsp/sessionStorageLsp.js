import _ from 'lodash';
import BrowserStorage from '../../../utils/browser-storage';

const LSP_STORAGE_NAMESPACE = 'lms-lsp-storage';
const LSP_STORAGE_KEY = 'lsp';

export default class SessionStorageLsp {
  constructor() {
    this.browserStorage = new BrowserStorage(LSP_STORAGE_NAMESPACE);
  }

  save(payload) {
    this.browserStorage.saveInCache(LSP_STORAGE_KEY, payload);
  }

  getLsp() {
    const lsp = this.browserStorage.findInCache(LSP_STORAGE_KEY);
    return _.isEmpty(lsp) ? {} : lsp;
  }

  getLspLogo() {
    const lsp = this.getLsp();
    return _.get(lsp, 'logoImage');
  }
}
