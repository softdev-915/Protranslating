import BrowserStorage from '../browser-storage';

const OFFER_STORAGE_NAMESPACE = 'lms-offer-storage';
const OFFER_STORAGE_KEY = 'offer';

export default class LocalStorageOffer {
  constructor() {
    this.browserStorage = new BrowserStorage(OFFER_STORAGE_NAMESPACE, true);
  }
  save(payload) {
    if (payload) {
      this.browserStorage.saveInCache('offer', payload);
    }
  }
  getOffer() {
    return BrowserStorage.getFromStorage(OFFER_STORAGE_NAMESPACE, OFFER_STORAGE_KEY);
  }
}
