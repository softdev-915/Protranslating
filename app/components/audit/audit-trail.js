const _ = require('lodash');
const moment = require('moment');
const auditUtils = require('./audit-utils');
const logger = require('../log/logger');

class AuditTrail {
  constructor(options) {
    this.propertiesFilter = _.get(options, 'propertiesFilter');
    this.shouldStoreBody = _.get(options, 'shouldStoreBody');
    this.lspId = _.get(options, 'lspId');
    this.record = {};
  }

  writeLog(payload) {
    const finishTimestamp = moment.utc().toDate();
    Object.assign(this.record, { updatedAt: finishTimestamp }, payload);
    const output = Object.keys(this.record)
      .reduce((out, key) => `${out}${key}=${JSON.stringify(this.record[key])}, `, '');
    let prefix = '';
    if (_.isObject(payload.req)) {
      prefix = `${payload.req.method} ${payload.req.url}`;
    } else if (_.isObject(_.get(payload, 'res.req'))) {
      prefix = `${payload.res.req.method} ${payload.res.req.url} Status code: ${payload.res.statusCode}`;
    }
    const fullOutput = `${prefix} ${output}`;
    logger.info(`${fullOutput.replace(/\n+/g, '')}`);
  }

  storeRequest(req) {
    this.record = auditUtils.buildAudit(req, this.propertiesFilter);
    const filteredReq = auditUtils
      .filterRequest(req, this.propertiesFilter, this.shouldStoreBody);
    return this.writeLog({ req: filteredReq });
  }

  storeResponse(res) {
    const filteredRes = auditUtils
      .filterResponse(res, this.propertiesFilter, this.shouldStoreBody);
    return this.writeLog({ res: filteredRes });
  }
}

module.exports = AuditTrail;
