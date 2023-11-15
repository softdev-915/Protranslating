/* global window */
import BrowserStorage from '../browser-storage';

export default class LocalStorageWorkflow {
  constructor(namespace) {
    this.namespace = namespace;
    this.browserStorage = new BrowserStorage(namespace, true);
  }

  save(payload, key) {
    if (payload) {
      this.browserStorage.saveInCache(key, payload);
    }
  }
  getWorkflows(key) {
    return BrowserStorage.getFromStorage(this.namespace, key);
  }
}
