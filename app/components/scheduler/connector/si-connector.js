const _ = require('lodash');
const logger = require('../../log/scheduler-logger');
const SiConnectorAPI = require('../../../connectors/si/si-connector-api');

class SiConnectorScheduler {
  constructor() {
    this.logger = logger;
  }

  async run(job, done) {
    const lspId = _.get(job, 'attrs.data.lspId');

    this.logger.debug(`SIConnector: running scheduler for lspId ${lspId}`);
    const params = _.get(job, 'attrs.data.params', {});

    try {
      const siAPI = new SiConnectorAPI({ mock: false, mockSchedulerInstantSync: false });
      this.logger.debug(`SIConnector: syncing all entities for lspId ${lspId}`);
      if (_.isString(params.entity)) {
        await siAPI.syncSingleEntity(lspId, params);
      } else {
        await siAPI.syncAllEntities(lspId);
      }
    } catch (e) {
      this.logger.error(`Fail to run si-connector scheduler. ${e}`);
    }
    return done();
  }
}

module.exports = SiConnectorScheduler;
