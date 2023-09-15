const _ = require('lodash');
const geoip = require('fast-geoip');
const logger = require('../log/logger');

class Geolocation {
  constructor(ip) {
    this.ip = ip;
    this.geo = {};
  }

  async getGeo() {
    if (_.isEmpty(this.geo)) {
      this.geo = await geoip.lookup(this.ip);
    }
    if (_.isEmpty(this.geo)) {
      logger.info(`Failed to retrieve geo by IP ${this.ip}`);
    }
    return _.defaultTo(this.geo, {});
  }

  async getCityAndCountry() {
    const geo = await this.getGeo();
    return _.pick(geo, ['city', 'country']);
  }
}

module.exports = Geolocation;
