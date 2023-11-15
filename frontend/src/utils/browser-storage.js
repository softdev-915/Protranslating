/* global window */
import _ from 'lodash';

const PREFIX = 'protr';

export default class BrowserStorage {
  constructor(namespace, persistent = false) {
    this.namespace = namespace;
    this.persistent = persistent;
  }

  removeFromCache(key) {
    const storage = this._properStorage();
    return storage.removeItem(this._properKey(key));
  }

  existsInCache(key) {
    const storage = this._properStorage();
    return !_.isNil(storage.getItem(this._properKey(key)));
  }

  saveInCache(key, value) {
    const storage = this._properStorage();
    this._saveInStorage(storage, key, value);
  }

  findInCache(key) {
    const storage = this._properStorage();
    const json = this._findInStorage(storage, key);
    return json;
  }

  _saveInStorage(storage, key, value) {
    const json = JSON.stringify(value);
    storage.setItem(this._properKey(key), json);
  }

  _findInStorage(storage, key) {
    const value = storage.getItem(this._properKey(key));
    if (_.isNil(value)) return null;
    return JSON.parse(value);
  }

  _properStorage() {
    let storage = window.sessionStorage;
    if (this.persistent) {
      storage = window.localStorage;
    }
    return storage;
  }

  _properKey(key) {
    return `${PREFIX}.${this.namespace}.${key}`;
  }

  static getStorage(namespace) {
    const storage = window.localStorage;
    const key = `${PREFIX}.${namespace}`;
    const value = storage.getItem(key);
    const json = (value) ? JSON.parse(value) : {};
    return json;
  }

  static getFromStorage(namespace, prop) {
    const storage = window.localStorage;
    const key = `${PREFIX}.${namespace}.${prop}`;
    const value = storage.getItem(key);
    const json = (value) ? JSON.parse(value) : {};
    return json;
  }
}
