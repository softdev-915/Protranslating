import _ from 'lodash';

export class AsyncStack {
  constructor() {
    this.stack = [];
    this._isInProgress = false;
  }

  add(fn) {
    this.stack.unshift(fn);
    if (!this._isInProgress) {
      this._processStack();
    }
  }

  async _processStack() {
    if (_.isEmpty(this.stack)) {
      this._isInProgress = false;
      return;
    }
    this._isInProgress = true;
    const fn = this.stack.pop();
    await fn().catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
    });
    this._processStack();
  }
}
