
import _ from 'lodash';
import { getCookie, setCookie } from 'tiny-cookie';
import { store } from '../../stores/store';
import BrowserStorage from '../browser-storage';

const FLAGS_STORAGE = 'lms-flags-storage';
const HEADERS_PREFIX = 'lms-';
const flags = [
  { name: 'mock', type: 'boolean', defaultValue: false },
  { name: 'mockTz', type: 'string', defaultValue: '00' },
  { name: 'mockServerTime', type: 'string', resetIfNotProvided: true, defaultValue: '' },
  { name: 'mockEmailSendingFail', type: 'string', resetIfNotProvided: false, defaultValue: '' },
  { name: 'mockSchedulerInstantSync', type: 'boolean', defaultValue: false },
  { name: 'mockSchedulerInactive', type: 'boolean', defaultValue: false },
  { name: 'shouldMockSiAuthFail', type: 'boolean', defaultValue: false },
  { name: 'shouldMockSiSyncFail', type: 'boolean', defaultValue: false },
  { name: 'shouldMockSiUserSyncFail', type: 'boolean', defaultValue: false },
  { name: 'shouldMockSiDisabled', type: 'boolean', defaultValue: false },
  { name: 'shouldMockNoResponseFromCs', type: 'boolean', defaultValue: false },
  { name: 'siMockSyncFrom', type: 'string', defaultValue: '' },
  { name: 'mockSessionTimeout', type: 'string', defaultValue: null },
  { name: 'shouldMockCreationError', type: 'boolean', defaultValue: false },
  { name: 'shouldMockUpdateError', type: 'boolean', defaultValue: false },
  { name: 'shouldMockCsNotReceivedRequest', type: 'boolean', defaultValue: false },
  { name: 'mockTrSearchNoResponseFromCs', type: 'boolean', defaultValue: false },
  { name: 'mockTrDetailsNoResponseFromCs', type: 'boolean', defaultValue: false },
  { name: 'mockTrStatus', type: 'string', defaultValue: null },
  { name: 'mockVendorPaymentPeriodStartDate', type: 'string', defaultValue: null },
  { name: 'shouldSyncTerminatedEntity', type: 'boolean', defaultValue: false },
  { name: 'mockVersion', type: 'string', defaultValue: '' },
  { name: 'mockBillDueDate', type: 'string', defaultValue: null },
  { name: 'mockProduction', type: 'boolean', defaultValue: false },
  { name: 'mockImportModuleEntities', type: 'string', defaultValue: null },
  { name: 'mockPayloadXMLType', type: 'string', defaultValue: 'create' },
  { name: 'mockBigFileUploading', type: 'boolean', defaultValue: false },
  { name: 'syncEntityOnCreation', type: 'boolean', defaultValue: true },
  { name: 'syncEntityOnRetrieval', type: 'boolean', defaultValue: false },
  { name: 'mockMonthlyConsumedQuota', type: 'string', default: '' },
  { name: 'mockReportCache', type: 'string', defaultValue: '' },
  { name: 'arApScriptEntityPrefix', type: 'string', resetIfNotProvided: true, defaultValue: '' },
  { name: 'mockSiConnectorRunNow', type: 'boolean', resetIfNotProvided: true, defaultValue: false },
  { name: 'mockRequestBilled', type: 'boolean', resetIfNotProvided: true, defaultValue: null },
  { name: 'mockLocation', type: 'string', defaultValue: '' },
  { name: 'mockTimezone', type: 'string', defaultValue: '' },
  { name: 'mockIp', type: 'string', defaultValue: '' },
  { name: 'mockSegmentationRulesEmpty', type: 'boolean', defaultValue: false },
];
const flagsStoreMapping = {};
flags.forEach((f) => {
  flagsStoreMapping[f.name] = f.name;
});
const parseFlagRawValue = (value, flagName) => {
  const flag = flags.find(({ name }) => name === flagName);
  if (flag.type === 'boolean') {
    return (value === 'true');
  }
  if (flag.type === 'string') {
    return value;
  }
};

export default class SessionFlags {
  constructor() {
    this.params = {};
    this.allFlags = {};
    const existingFlags = this.readExistingFlags();
    this.browserStorage = new BrowserStorage(FLAGS_STORAGE);
    flags.forEach(({ name }) => {
      if (!_.isNil(existingFlags[name])) {
        this.browserStorage.saveInCache(name, existingFlags[name].toString());
        setCookie(name, existingFlags[name].toString(), {
          expires: '10Y',
          secure: (window.location.protocol === 'https:'),
        });
      }
    });
  }

  detectFlags() {
    this.parseFlags();
    this.persistFlags();
  }

  getFlags() {
    flags.forEach(({ name }) => {
      this.allFlags[name] = this.getFlag(name);
    });
    return this.allFlags;
  }

  getFlag(name) {
    if (_.isNil(this.allFlags[name])) {
      const value = this.browserStorage.findInCache(flagsStoreMapping[name]);
      this.allFlags[name] = parseFlagRawValue(value, name);
    }
    return this.allFlags[name];
  }

  readExistingFlags() {
    const allFlags = {};
    flags.forEach(({ name, defaultValue }) => {
      const flagLocalStorageValue = BrowserStorage.getFromStorage(FLAGS_STORAGE,
        flagsStoreMapping[name]);
      const isFlagStored = !_.isEmpty(flagLocalStorageValue);
      if (isFlagStored) {
        allFlags[name] = parseFlagRawValue(flagLocalStorageValue, name);
      }
      if (!allFlags[name]) {
        // try to get it from cookies
        const cookieFlagValue = getCookie(flagsStoreMapping[name]);
        if (cookieFlagValue !== null) {
          allFlags[name] = parseFlagRawValue(cookieFlagValue, name);
        } else {
          // Set default value from store
          allFlags[name] = defaultValue;
        }
      }
      const action = store._actions[`features/set${name}`][0];
      action(allFlags[name]);
    });
    return allFlags;
  }

  static getCurrentFlags() {
    const allFlags = {};
    flags.forEach(({ name }) => {
      allFlags[name] = parseFlagRawValue(BrowserStorage.getFromStorage(FLAGS_STORAGE, name), name);
      // try to get it from cookies
      if (!allFlags[name]) {
        allFlags[name] = parseFlagRawValue(getCookie(name), name);
      }
    });
    return allFlags;
  }

  interceptor(request) {
    // modify headers
    flags.forEach(({ name }) => {
      this.allFlags[name] = this.browserStorage.findInCache(name);
      // try to get it from cookies
      if (!this.allFlags[name]) {
        this.allFlags[name] = getCookie(name);
      }
      request.headers.set(HEADERS_PREFIX + name, this.allFlags[name]);
    });
    return request;
  }

  parseFlags() {
    // We need to parse query flags, because before load
    // this.$route.query and to.query returns empty object
    const query = window.location.search.substr(1);
    // Only high level params
    query.split('&').forEach((part) => {
      const item = part.split('=');
      this.params[item[0]] = decodeURIComponent(item[1]);
    });
  }

  persistFlags() {
    flags.forEach(({
      name, type, resetIfNotProvided, defaultValue,
    }) => {
      const action = store._actions[`features/set${name}`][0];
      if (!_.isUndefined(this.params[name])) {
        if (type === 'boolean') {
          if (this.params[name] === 'true') {
            action(true);
            this.browserStorage.saveInCache(name, 'true');
            setCookie(name, 'true', {
              expires: '10Y',
              secure: (window.location.protocol === 'https:'),
            });
          } else {
            action(false);
            this.browserStorage.saveInCache(name, 'false');
            setCookie(name, 'false', {
              expires: '10Y',
              secure: (window.location.protocol === 'https:'),
            });
          }
        } else if (type === 'string') {
          action(this.params[name]);
          this.browserStorage.saveInCache(name, this.params[name]);
          setCookie(name, this.params[name], {
            expires: '10Y',
            secure: (window.location.protocol === 'https:'),
          });
        }
      } else if (resetIfNotProvided) {
        action(defaultValue);
        this.browserStorage.saveInCache(name, defaultValue);
        setCookie(name, defaultValue, {
          expires: '10Y',
          secure: (window.location.protocol === 'https:'),
        });
      }
    });
  }
}
