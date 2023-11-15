import _isEmpty from 'lodash/isEmpty';
import BrowserStorage from '../../../utils/browser-storage';

const AUTH_STORAGE_NAMESPACE = 'lms-auth-storage';
const AUTH_CSRF_TOKEN_STORAGE_KEY = 'csrf-token';

export default class LocalStorageAuth {
  constructor() {
    this.browserStorage = new BrowserStorage(AUTH_STORAGE_NAMESPACE);
  }

  saveCSRFToken(token) {
    if (_isEmpty(token)) {
      return;
    }
    this.browserStorage.saveInCache(AUTH_CSRF_TOKEN_STORAGE_KEY, token);
  }

  deleteCSRFToken() {
    this.browserStorage.removeFromCache(AUTH_CSRF_TOKEN_STORAGE_KEY);
  }

  getCSRFToken() {
    return this.browserStorage.findInCache(AUTH_CSRF_TOKEN_STORAGE_KEY);
  }
}
