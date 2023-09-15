const _ = require('lodash');

class Cache {
  constructor(func, context = null) {
    this.context = context;
    this.func = func;
    this.data = {};
  }

  _getKey(args) {
    return JSON.stringify(args);
  }

  async call(...args) {
    const key = this._getKey(args);
    if (_.isEmpty(this.data[key])) {
      this.data[key] = await this.func.apply(this.context, args);
    }
    return this.data[key];
  }

  callSync(...args) {
    const key = this._getKey(args);
    if (_.isEmpty(this.data[key])) {
      this.data[key] = this.func.apply(this.context, args);
    }
    return this.data[key];
  }
}

module.exports = Cache;
