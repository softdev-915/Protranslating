import moment from 'moment';
import BrowserStorage from '../utils/browser-storage';
import sessionObserver from '../utils/observers/session';

const PROVIDER_STORAGE_NAMESPACE = 'lms-provider-storage';
const PROVIDER_STORAGE_KEY = 'providers';
const EXPIRY = 'provider-cache-expiry';
const DEFAULT_CACHE_TIMEOUT = 2;

export default class LocalStorageProvider {
  constructor(cacheTimeout) {
    // when refreshing page, destroy the cache
    this.shouldCache = false;
    this.browserStorage = new BrowserStorage(PROVIDER_STORAGE_NAMESPACE);
    this.cacheTimeout = cacheTimeout || DEFAULT_CACHE_TIMEOUT;
    sessionObserver.addObserver(this);
  }

  save(payload) {
    if (payload) {
      this.browserStorage.saveInCache(PROVIDER_STORAGE_KEY, payload);
      this.saveNextExpiry();
    }
  }

  saveNextExpiry() {
    const expiry = this.nextExpiry();
    this.browserStorage.saveInCache(EXPIRY, expiry.format());
  }

  nextExpiry() {
    if (this.cacheTimeout) {
      const now = moment.utc();
      return now.add(this.cacheTimeout, 'minutes');
    }
    return null;
  }

  onLogin() {
    // nothing to do
  }

  onLogout() {
    this.browserStorage.removeFromCache(PROVIDER_STORAGE_KEY);
  }

  isCacheExpired() {
    const expiry = this.browserStorage.findInCache(EXPIRY);
    if (expiry) {
      const now = moment.utc();
      const diff = now.diff(moment.utc(expiry), 'seconds');
      return diff > 0;
    }
    return false;
  }

  getProviders() {
    if (this.isCacheExpired() || !this.shouldCache) {
      this.shouldCache = true;
      this.browserStorage.removeFromCache(PROVIDER_STORAGE_KEY);
    }
    return BrowserStorage.getFromStorage(PROVIDER_STORAGE_NAMESPACE, PROVIDER_STORAGE_KEY);
  }
}
