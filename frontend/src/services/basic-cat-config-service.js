import Promise from 'bluebird';
import sessionObserver from '../utils/observers/session';
import resourceWrapper from './resource-wrapper';
import catConfigResource from '../resources/cat-config';
import BrowserStorage from '../utils/browser-storage';

const CAT_CONFIG = 'cat-config';

export default class BasicCATTranslationService {
  constructor(resource = catConfigResource) {
    this.resource = resource;
    this.browserStorage = new BrowserStorage(CAT_CONFIG);
    sessionObserver.addObserver(this);
  }

  retrieve(userId) {
    const config = this.browserStorage.findInCache(userId);
    if (!config) {
      return resourceWrapper(this.resource.get({ userId })).then((c) => {
        const properConfig = c.data.config;
        this.browserStorage.saveInCache(userId, properConfig);
        return properConfig;
      });
    }
    return Promise.resolve(config);
  }

  save(userId, config) {
    const storedConfig = this.browserStorage.findInCache(userId) || {};
    Object.assign(storedConfig, config);
    this.browserStorage.saveInCache(userId, storedConfig);
    return resourceWrapper(this.resource.update({ userId }, storedConfig));
  }

  onLogin() {
    // nothing to do
  }

  onLogout(user) {
    if (user) {
      this.browserStorage.removeFromCache(user._id);
    }
  }
}
