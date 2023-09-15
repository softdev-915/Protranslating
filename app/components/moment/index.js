const _ = require('lodash');
const moment = require('moment');
const configuration = require('../configuration');

class MockableMoment {
  constructor(mockServerTime) {
    this._mockServerTime = mockServerTime;
  }

  getDateObject() {
    const envConfig = configuration.environment;
    if (envConfig.NODE_ENV === 'PROD') {
      return moment().utc();
    }
    const mockServerTime = _.defaultTo(this._mockServerTime, '');
    const fullDate = moment.utc(mockServerTime, 'YYYY-MM-DD HH:mm');
    if (fullDate.isValid()) {
      return fullDate;
    }
    return moment().utc();
  }
}

module.exports = MockableMoment;
