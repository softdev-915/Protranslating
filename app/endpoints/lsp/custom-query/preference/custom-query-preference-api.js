const _ = require('lodash');
const Promise = require('bluebird');
const SchemaAwareAPI = require('../../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../../utils/concurrency');
const CustomQueryScheduler = require('../../../../components/scheduler/custom-query/index');

class CustomQueryPreferenceApi extends SchemaAwareAPI {
  get(customQueryId) {
    return this.schema.CustomQueryPreference.findOneWithDeleted({
      customQueryId,
      lspId: _.get(this, 'lspId', ''),
      userId: _.get(this, 'user._id', ''),
    });
  }

  async checkForcedRunAllowance(customQueryId) {
    const findCustomQuery = this.schema.CustomQuery.findOne({
      _id: customQueryId, lspId: this.lspId,
    });
    const findPreference = this.schema.CustomQueryPreference.findOne({
      customQueryId, lspId: this.lspId, userId: _.get(this, 'user._id'),
    });
    const findLsp = this.schema.Lsp.findById(this.lspId);
    const [customQuery, preference, lsp] = await Promise.all([
      findCustomQuery, findPreference, findLsp,
    ]);
    const lastRunAt = _.get(preference, 'lastRunAt');
    let now;
    let reportCache;
    if (this.environmentName === 'PROD') {
      now = new Date();
      reportCache = _.get(lsp, 'customQuerySettings.reportCache', 0);
    } else {
      now = _.get(customQuery, 'mock.currentDateOnNextRun', new Date());
      reportCache = _.defaultTo(this.flags.mockReportCache, _.get(lsp, 'customQuerySettings.reportCache', 0));
    }
    const cachedTime = now.getTime() - (reportCache * 6e4);

    if (_.isDate(lastRunAt) && lastRunAt.getTime() >= cachedTime) {
      throw new Error(`This query was run less than ${reportCache} minutes ago which is the configured caching period at LSP level. Feel free to download the results from the custom query grid`);
    }
  }

  async save(data) {
    const { isRunForced = false } = data;

    if (isRunForced) {
      await this.checkForcedRunAllowance(data.customQueryId);
    }
    const user = _.get(this, 'user', {});

    Object.assign(data, { lspId: this.lspId, userId: user._id });
    let customQueryPreference = await this.schema.CustomQueryPreference.findOneWithDeleted({
      customQueryId: data.customQueryId, lspId: this.lspId, userId: user._id,
    });

    if (_.isNil(customQueryPreference)) {
      customQueryPreference = new this.schema.CustomQueryPreference();
    } else {
      const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(user, this.logger, {
        entityName: 'customQueryPreference',
      });
      await concurrencyReadDateChecker.failIfOldEntity(customQueryPreference);
    }
    customQueryPreference.safeAssign(data);
    await customQueryPreference.save();
    return customQueryPreference;
  }

  triggerScheduler(flags) {
    return new CustomQueryScheduler(this.schema).run({
      attrs: {
        data: { lspId: this.lspId },
        flags,
      },
    });
  }
}

module.exports = CustomQueryPreferenceApi;
