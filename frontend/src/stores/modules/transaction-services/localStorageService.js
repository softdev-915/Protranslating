import BrowserStorage from '../../../utils/browser-storage';

const SERVICES_STORAGE_NAMESPACE = 'lms-request-storage';
const SERVICES_STORAGE_KEY = 'services';

export default class LocalStorageService {
  constructor() {
    this.browserStorage = new BrowserStorage(SERVICES_STORAGE_NAMESPACE);
  }

  save(payload) {
    if (payload) {
      this.browserStorage.saveInCache('services', payload);
    }
  }

  getServices() {
    return BrowserStorage.getFromStorage(SERVICES_STORAGE_NAMESPACE, SERVICES_STORAGE_KEY);
  }
}
