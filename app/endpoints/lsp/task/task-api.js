const _ = require('lodash');
const { Types: { ObjectId } } = require('mongoose');
const csvWriter = require('csv-write-stream');
const TaskCSVTransform = require('./csv-transform-stream');
const AbstractRequestAPI = require('../request/abstract-request-api');
const { aggregationQueryParams, buildAggregation, csvColumns } = require('./task-aggregation');
const { pipeWithErrors } = require('../../../utils/stream');
const { csvStream, utfBOM, properAggregationFilename } = require('../../../utils/pagination/aggregation-builder');
const { getProperLimit, buildPaginationQuery } = require('../../../utils/pagination');
const { hasRole, getRoles } = require('../../../utils/roles');
const { startsWithSafeRegexp } = require('../../../utils/regexp');
const { RestError } = require('../../../components/api-response');
const {
  translationFields,
} = require('./task-api-helpers');

const PROVIDER_CURRENT_TASK_STATUS = 'current';
const PROVIDER_PENDING_TASK_STATUS = 'pending';
const PROVIDER_FUTURE_TASK_STATUS = 'future';
const PROVIDER_TASK_CANCELLED_STATUS = 'cancelled';
const PROVIDER_TASK_COMPLETED_STATUS = 'completed';
const TASK_SORT_TRANSLATION = {
  no: 'no',
  title: 'title',
  companyName: 'company.name',
  schedulingCompanyName: 'schedulingCompany.name',
  languageCombination: ['workflows.srcLang.name', 'workflows.tgtLang.name'],
  schedulingContact: ['schedulingContact.firstName', 'schedulingContact.lastName'],
  contact: ['contact.firstName', 'contact.lastName'],
  task: 'workflows.tasks.ability',
  provider: ['workflows.tasks.providerTasks.provider.firstName', 'workflows.tasks.providerTasks.provider.lastName'],
  taskDueDate: 'workflows.tasks.providerTasks.taskDueDate',
  schedulingStatus: 'schedulingStatus.name',
  cancelledAt: 'workflows.tasks.providerTasks.cancelledAt',
  status: 'workflows.tasks.providerTasks.status',
};

const transformSort = (filters) => {
  let sort = _.get(filters, 'paginationParams.sort');
  if (_.isNil(sort)) return null;
  let dir = 1;
  if (sort.startsWith('-')) {
    sort = sort.substring(1);
    dir = -1;
  }
  const sortKey = _.get(TASK_SORT_TRANSLATION, sort);
  const querySort = {};
  if (Array.isArray(sortKey)) {
    sortKey.forEach((k) => {
      querySort[k] = dir;
    });
  } else {
    querySort[sortKey] = dir;
  }
  return querySort;
};

const taskTransformQuery = (filters, query, translationFieldsMap, extraQueryParamsMap) => {
  const extraQueryParams = [];
  const strTz = _.get(filters, '__tz', 0);
  const tz = parseInt(strTz, 10);
  if (isNaN(tz)) {
    throw new RestError(400, { message: `__tz value "${strTz}" is not valid` });
  }
  if (_.get(filters, 'paginationParams.filter')) {
    const filter = JSON.parse(filters.paginationParams.filter);
    translationFieldsMap.forEach((tf) => {
      const val = _.get(filter, tf.prop);
      if (!_.isNil(val)) {
        if (_.isNil(tf.transform)) {
          query[tf.query] = startsWithSafeRegexp(val);
        } else {
          Object.assign(query, tf.transform(val, tz));
        }
      }
    });
    if (!_.isNil(extraQueryParamsMap)) {
      extraQueryParamsMap.forEach((eqp) => {
        const val = _.get(filter, eqp.prop);
        if (!_.isNil(val)) {
          extraQueryParams.push(eqp.transform(val));
        }
      });
    }
  }
  return extraQueryParams;
};

class TaskApi extends AbstractRequestAPI {
  async aggregateTasks(filters) {
    let requests;
    const aggregation = this._buildAggregation(filters, true);
    try {
      requests = await this.requestReadModel.aggregate(aggregation).allowDiskUse(true);
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error aggregating task for grid. Error: ${message}`);
      throw new RestError(500, { message: 'Failed to retrieve tasks' });
    }
    return {
      list: requests,
      total: requests.length,
    };
  }

  async aggregateTasksCSV(filters) {
    let stream;
    let tzOffset;
    try {
      const filtersParsed = JSON.parse(filters.paginationParams.filter);
      tzOffset = filtersParsed.__tz;
    } catch (e) {
      const message = e.message || e;
      this.logger.error(`error parsing filters. Error: ${message}`);
      tzOffset = 0;
    }
    const aggregation = this._buildAggregation(filters, false);
    try {
      const aggregationStream = this.schema.RequestSecondary
        .aggregate(aggregation)
        .allowDiskUse(true)
        .cursor({ batchSize: 10 });
      const taskCSVTransform = new TaskCSVTransform(this.schema.Request.getHumanReadableStatuses(),
        tzOffset);
      const csvPreprocessingStream = csvStream(csvColumns(this.user));
      const csvWriterStream = csvWriter();
      stream = utfBOM();
      pipeWithErrors(aggregationStream, taskCSVTransform);
      pipeWithErrors(taskCSVTransform, csvPreprocessingStream);
      pipeWithErrors(csvPreprocessingStream, csvWriterStream);
      pipeWithErrors(csvWriterStream, stream);
      const fileName = properAggregationFilename({ filters: filters.paginationParams }, 'tasks');
      stream.__filename = fileName;
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error transforming to csv. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return stream;
  }

  list(user, providerId, priorityStatus) {
    this.logger.debug(`User ${user.email} retrieved the task list`);
    return this.taskList(user, providerId, priorityStatus);
  }
  async taskList(user, providerId = user._id, priorityStatus) {
    const properProviderId = new ObjectId(providerId);
    const aggregation = [
      {
        $match: {
          lspId: this.lspId,
          'workflows.0': { $exists: true },
          status: { $nin: ['Cancelled', 'Completed'] },
        },
      },
      { $unwind: { path: '$workflows', preserveNullAndEmptyArrays: false } },
      { $unwind: { path: '$workflows.tasks', preserveNullAndEmptyArrays: false } },
      { $unwind: { path: '$workflows.tasks.providerTasks', preserveNullAndEmptyArrays: false } },
      {
        $match: {
          'workflows.tasks.providerTasks.status': { $ne: PROVIDER_TASK_CANCELLED_STATUS },
        },
      },
    ];
    if (priorityStatus) {
      aggregation.push({
        $match: {
          'workflows.tasks.providerTasks.provider._id': properProviderId,
          'workflows.tasks.providerTasks.priorityStatus': priorityStatus,
        },
      });
    } else {
      aggregation.push({
        $match: {
          'workflows.tasks.providerTasks.provider._id': properProviderId,
          'workflows.tasks.providerTasks.priorityStatus': {
            $nin: [PROVIDER_TASK_COMPLETED_STATUS, PROVIDER_TASK_CANCELLED_STATUS],
          },
        },
      });
    }
    aggregation.push({
      $project: {
        no: 1,
        'workflows.srcLang.name': 1,
        'workflows.tgtLang.name': 1,
        'workflows.tasks.ability': 1,
        'workflows.tasks.providerTasks.provider._id': 1,
        'workflows.tasks.providerTasks.status': 1,
        'workflows.tasks.providerTasks.priorityStatus': 1,
        'workflows.tasks.providerTasks.taskDueDate': 1,
      },
    });
    const tasks = await this.schema.RequestSecondary.aggregate(aggregation);
    const taskBuckets = [];
    tasks.forEach((r) => {
      taskBuckets.push({
        no: r.no,
        requestId: r._id,
        status: _.get(r, 'workflows.tasks.providerTasks.status'),
        priorityStatus: _.get(r, 'workflows.tasks.providerTasks.priorityStatus'),
        ability: _.get(r, 'workflows.tasks.ability'),
        taskDueDate: _.get(r, 'workflows.tasks.providerTasks.taskDueDate'),
        language: `${_.get(r, 'workflows.srcLang.name', '')} - ${_.get(r, 'workflows.tgtLang.name', '')}`,
      });
    });
    return taskBuckets;
  }

  async retrieveVendorTasksCount() {
    try {
      const userId = _.get(this, 'user._id');
      const userTasks = await this.list(this.user, userId);
      const currentTasks = userTasks
        .filter(task => task.priorityStatus === PROVIDER_CURRENT_TASK_STATUS);
      const pendingTasks = userTasks
        .filter(task => task.priorityStatus === PROVIDER_PENDING_TASK_STATUS);
      const futureTasks = userTasks
        .filter(task => task.priorityStatus === PROVIDER_FUTURE_TASK_STATUS);
      return {
        currentTasksCount: currentTasks.length,
        pendingTasksCount: pendingTasks.length,
        futureTasksCount: futureTasks.length,
        totalTasksCount: currentTasks.length + pendingTasks.length + futureTasks.length,
      };
    } catch (e) {
      const message = e.message || e;
      this.logger.info(`Failed to retrieve vendor tasks count. Error: ${message}`);
    }
  }

  _buildAggregation(filters, shouldSkip = false) {
    let providerIdFilter = null;
    if (!hasRole('TASK_READ_ALL', getRoles(this.user))) {
      providerIdFilter = new ObjectId(this.user._id);
    }
    const transformedQuery = {
      'workflows.0': { $exists: true },
    };
    let extraQueryParams;
    const tFields = translationFields(true);
    const eqParams = aggregationQueryParams();
    try {
      extraQueryParams = taskTransformQuery(filters, transformedQuery, tFields, eqParams);
    } catch (e) {
      const message = e.message || e;
      this.logger.info(`Query will produce empty results. Reason: ${message}`);
      return {
        list: [],
        total: 0,
      };
    }
    const paginationQuery = buildPaginationQuery(filters.paginationParams);
    let limit = getProperLimit(filters);
    let skip = 0;
    if (shouldSkip) {
      skip = paginationQuery.skip;
    } else {
      skip = null;
      limit = null;
    }
    const sort = transformSort(filters);
    const query = Object.assign({}, transformedQuery);
    if (extraQueryParams && extraQueryParams.length) {
      extraQueryParams.forEach((eqp) => {
        Object.assign(query, eqp);
      });
    }
    if (providerIdFilter) {
      query['workflows.tasks.providerTasks.provider._id'] = providerIdFilter;
    }
    return buildAggregation(this.lspId, query, sort, skip, limit);
  }
}

module.exports = TaskApi;
