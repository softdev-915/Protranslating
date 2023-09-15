const moment = require('moment');
const _ = require('lodash');
const { sanitizeHTML } = require('../../../utils/security/html-sanitize');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const buildApplicationScheduler = require('../../../components/scheduler');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { searchFactory } = require('../../../utils/pagination');
const { exportFactory } = require('../../../utils/pagination');
const { CsvExport } = require('../../../utils/csvExporter');

const { RestError } = apiResponse;
const EVERY_PATTERN = /[0-9.]+\s(seconds|minutes|hours|days|weeks|months|years)/i;
const EVERY_CRONJOB_PATTERN = /.+ .+ .+ .+ .+.*/;
const isValidEvery = (every) => (EVERY_PATTERN.test(every) || EVERY_CRONJOB_PATTERN.test(every));

class SchedulerAPI extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
    this.applicationSchedulerFactory = (conf) => buildApplicationScheduler(conf);
    this.mock = _.get(options, 'mock', false);
    this.mockServerTime = _.get(options, 'mockServerTime');
  }

  getPipeline() {
    const pipeline = [
      {
        $addFields: {
          inactiveText: {
            $switch: {
              branches: [
                { case: { $eq: ['$deleted', true] }, then: 'true' },
                { case: { $eq: ['$deleted', false] }, then: 'false' },
              ],
              default: '',
            },
          },
        },
      },
    ];
    return pipeline;
  }

  /**
   * Returns the scheduler list as a csv file
   * @param {Object} schedulerFilters to filter the list returned.
   */
  async schedulerExport(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the schedulers list as a csv file`);
    let query = {
      lspId: this.lspId,
    };
    const pipeline = this.getPipeline();
    const extraQueryParams = ['inactiveText'];

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    const cursor = await exportFactory(
      this.schema.Scheduler,
      query,
      pipeline,
      extraQueryParams,
      filters.__tz,
    );
    const csvExporter = new CsvExport(cursor, {
      schema: this.schema.Scheduler,
      lspId: this.lspId,
      configuration: this.configuration,
      logger: this.logger,
      filters: query,
    });
    return csvExporter.export();
  }

  /**
   * Returns the scheduler's list
   * @param {Object} schedulerFilters to filter the schedulers returned.
   * @param {String} schedulerFilters.id the scheduler's id to filter.
   */
  async schedulerList(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the schedulers list`);
    let list = [];
    let query = {
      lspId: this.lspId,
    };

    if (filters && filters._id) {
      query._id = filters._id;
    }
    // Search specific scheduler
    if (!_.isEmpty(query._id)) {
      list = await this.schema.Scheduler.findWithDeleted(query);
    } else {
      const pipeline = this.getPipeline();
      const extraQueryParams = ['inactiveText'];

      // Search all schedulers
      query = Object.assign(query, _.get(filters, 'paginationParams', {}));
      list = await searchFactory({
        model: this.schema.Scheduler,
        filters: query,
        extraPipelines: pipeline,
        extraQueryParams,
        utcOffsetInMinutes: filters.__tz,
      });
    }
    return {
      list,
      total: list.length,
    };
  }

  async update(user, scheduler, lspId) {
    if ((!scheduler.every || !isValidEvery(scheduler.every)) && !scheduler.schedule) {
      throw new RestError(400, { message: 'Invalid schedule config' });
    }
    if (!this.lspId.equals(lspId)) {
      throw new RestError(403, { message: 'You are not allowed to update this record' });
    }
    const dbScheduler = await this.schema.Scheduler.findOneWithDeleted({
      _id: scheduler._id,
      lspId: this.lspId,
    });

    if (!dbScheduler) {
      throw new RestError(404, { message: 'Scheduler does not exist' });
    }
    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(user, this.logger, {
      entityName: 'scheduler',
    });
    await concurrencyReadDateChecker.failIfOldEntity(dbScheduler);
    if (scheduler.email) {
      // avoid ovewriting vars
      const email = {
        from: scheduler.email.from,
        subject: scheduler.email.subject,
        template: sanitizeHTML(scheduler.email.template),
      };

      if (dbScheduler.email) {
        Object.assign(dbScheduler.email, email);
      } else {
        dbScheduler.email = email;
      }
    } else {
      dbScheduler.email = null;
    }
    if (scheduler.every) {
      dbScheduler.every = scheduler.every;
      dbScheduler.schedule = null;
    } else {
      dbScheduler.schedule = moment.utc(scheduler.schedule).toDate();
      dbScheduler.every = null;
    }
    if (scheduler.deleted) {
      dbScheduler.deleted = true;
      dbScheduler.deletedAt = new Date();
      dbScheduler.deletedBy = user.email;
    } else {
      dbScheduler.deleted = false;
      dbScheduler.deletedAt = null;
      dbScheduler.updatedAt = new Date();
    }
    dbScheduler.options = scheduler.options;
    dbScheduler.lspId = this.lspId;
    await dbScheduler.save();
    const applicationScheduler = await this.applicationSchedulerFactory(
      this.configuration,
      this.logger,

      '5 seconds',
    );
    await applicationScheduler.cancelJob({ name: `${dbScheduler.name}-${lspId}` });
    if (!scheduler.deleted) {
      applicationScheduler.setupJob(dbScheduler);
    }
    return dbScheduler;
  }

  async runNow(params = {}) {
    const { NODE_ENV } = this.configuration.environment;
    const isProd = NODE_ENV === 'PROD';
    Object.assign(params, {
      mock: this.mock,
      mockServerTime: this.mockServerTime,
    });
    const { user, schedulerId } = params;

    this.logger.debug(`User ${user.email} triggered an execution of the scheduler with id: ${schedulerId}`);
    const dbScheduler = await this.schema.Scheduler.findOneWithDeleted({
      _id: schedulerId,
      lspId: this.lspId,
    });

    if (!dbScheduler) {
      throw new RestError(404, { message: 'Scheduler does not exist' });
    }
    if (dbScheduler.deleted) {
      throw new RestError(503, { message: 'Scheduler is inactive and can\'t be run' });
    }
    if (dbScheduler.name === 'si-connector' && isProd) {
      throw new RestError(403, { message: 'You are not allowed to run the scheduler' });
    }
    const applicationScheduler = await this.applicationSchedulerFactory(this.configuration, this.logger);
    applicationScheduler.runNow(dbScheduler, params)
      .catch((err) => {
        this.logger.error(`Error running manually triggered scheduler: ${err}`);
      });
  }
}

module.exports = SchedulerAPI;
