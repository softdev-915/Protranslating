import BrowserStorage from '../../../utils/browser-storage';

const RATES_STORAGE_NAMESPACE = 'lms-company-storage';
const RATE_STORAGE_KEY = 'rates';

export default class LocalStorageRate {
  constructor() {
    this.browserStorage = new BrowserStorage(RATES_STORAGE_NAMESPACE, true);
  }

  save(payload) {
    if (payload) {
      this.browserStorage.saveInCache('rates', payload);
    }
  }

  getRates() {
    return BrowserStorage.getFromStorage(RATES_STORAGE_NAMESPACE, RATE_STORAGE_KEY);
  }
}
