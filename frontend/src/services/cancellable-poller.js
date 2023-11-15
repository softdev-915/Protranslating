import _ from 'lodash';
import Promise from 'bluebird';

export class CancellablePoller {
  constructor(func, interval = 1000) {
    if (_.isNil(func)) {
      throw new Error('Function to poll is missing');
    }
    this.func = func;
    this.interval = interval;
  }

  async _poll(cb) {
    if (this.cancelled) {
      return;
    }
    let error;
    let result;
    try {
      await Promise.delay(this.interval);
      result = await this.func();
    } catch (e) {
      error = e;
    }
    await cb(result, error, this);
    if (!this.cancelled) {
      await this._poll(cb);
    }
  }

  start(cb) {
    this.cancelled = false;
    return this._poll(cb);
  }

  cancel() {
    this.cancelled = true;
  }
}
