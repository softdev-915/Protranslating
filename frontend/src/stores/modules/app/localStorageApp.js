import BrowserStorage from '../../../utils/browser-storage';

const APP_VERSION_NAMESPACE = 'lms-app-storage';
const APP_VERSION_STORAGE_KEY = 'version';

export default class LocalStorageApp {
  constructor() {
    this.browserStorage = new BrowserStorage(APP_VERSION_NAMESPACE);
  }

  save(payload, key = APP_VERSION_STORAGE_KEY) {
    if (payload) {
      this.browserStorage.saveInCache(key, payload);
    }
  }

  getVersion() {
    return this.browserStorage.findInCache(APP_VERSION_STORAGE_KEY);
  }
}
