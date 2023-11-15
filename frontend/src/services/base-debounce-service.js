import _ from 'lodash';

const DEFAULT_THROTTLE_TIMEOUT_MS = 1000;

/**
 * Provides a wrapper to throttle service methods.
 * Usage: class SomeEntityService extends BaseDebounceService
 */
export default class BaseDebounceService {
  constructor(throttleTimeOut = DEFAULT_THROTTLE_TIMEOUT_MS) {
    this.create = _.throttle(this.create.bind(this), throttleTimeOut);
    this.edit = _.throttle(this.edit.bind(this), throttleTimeOut);
  }
}
