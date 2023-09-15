const _ = require('lodash');
const moment = require('moment');
const { buildDateQuery, buildISODateQuery } = require('../../../components/database/mongo/query/date');
const { startsWithSafeRegexp, escapeRegexp } = require('../../../utils/regexp');
const { prefixedNameQuery } = require('../user/user-api-helper');
const { getStatusMatchQuery } = require('../request/request-api-helper');
const { validObjectId, convertToObjectId } = require('../../../utils/schema');

const TASK_STATUS_VALUES = [
  { text: 'Not Started', value: 'notStarted' },
  { text: 'In Progress', value: 'inProgress' },
  { text: 'On Hold', value: 'onHold' },
  { text: 'Completed', value: 'completed' },
  { text: 'Cancelled', value: 'cancelled' },
  { text: 'Approved', value: 'approved' },
];

const BILL_STATUS_VALUES = [
  { text: 'Paid', value: 'paid' },
  { text: 'Posted', value: 'posted' },
];

function buildStatusMatchQuery(statusSearchTerm, statusValues = TASK_STATUS_VALUES) {
  return getStatusMatchQuery(statusSearchTerm, statusValues);
}

const translationExtraQueryParams = () => [
  {
    prop: 'contact',
    transform: (val) => {
      if (val) {
        return prefixedNameQuery(val, 'contact');
      }
      return null;
    },
  },
  {
    prop: 'schedulingContact',
    transform: (val) => {
      if (val) {
        return prefixedNameQuery(val, 'schedulingContact');
      }
      return null;
    },
  },
  {
    prop: 'provider',
    transform: (val) => {
      if (val) {
        return {
          'workflows.tasks.providerTasks.provider.name': new RegExp(`.*${escapeRegexp(val)}.*`, 'i'),
        };
      }
      return null;
    },
  },
  {
    prop: 'billStatus',
    transform: (val) => {
      if (val) {
        return {
          'workflows.tasks.providerTasks.billStatus': new RegExp(`.*${escapeRegexp(val)}.*`, 'i'),
        };
      }
      return null;
    },
  },
  {
    prop: 'sourceDocuments',
    transform: (val) => {
      if (val) {
        return {
          'languageCombinations.documents.name': new RegExp(`.*${escapeRegexp(val)}.*`, 'i'),
        };
      }
      return null;
    },
  },
];

const addDateFields = (dateQueryFactory) => {
  const dateFields = [];
  dateFields.push({ prop: 'taskDueDate', transform: (val, tz) => ({ 'workflows.tasks.providerTasks.taskDueDate': dateQueryFactory(val, tz) }) });
  dateFields.push({ prop: 'cancelledAt', transform: (val, tz) => ({ 'workflows.tasks.providerTasks.cancelledAt': dateQueryFactory(val, tz) }) });
  dateFields.push({ prop: 'approvedAt', transform: (val, tz) => ({ 'workflows.tasks.providerTasks.approvedAt': dateQueryFactory(val, tz) }) });
  dateFields.push({ prop: 'expectedStartDate', transform: (val, tz) => ({ expectedStartDate: dateQueryFactory(val, tz) }) });
  dateFields.push({ prop: 'completedAt', transform: (val, tz) => ({ completedAt: dateQueryFactory(val, tz) }) });
  dateFields.push({ prop: 'updatedAt', transform: (val, tz) => ({ updatedAt: dateQueryFactory(val, tz) }) });
  dateFields.push({ prop: 'createdAt', transform: (val, tz) => ({ createdAt: dateQueryFactory(val, tz) }) });
  dateFields.push({ prop: 'billDate', transform: (val, tz) => ({ 'workflows.tasks.providerTasks.billDate': dateQueryFactory(val, tz) }) });
  return dateFields;
};

const translationFields = (isAggregation = false) => {
  let allFields = [
    { prop: 'no', query: 'no' },
    { prop: 'billNo', query: 'billNo' },
    { prop: 'catTool', query: 'catTool' },
    { prop: 'title', query: 'title' },
    { prop: 'createdBy', query: 'createdBy' },
    { prop: 'approvedBy', query: 'workflows.tasks.providerTasks.approvedBy' },
    { prop: 'billNo', query: 'workflows.tasks.providerTasks.billNo' },
    { prop: 'billCreationError', query: 'workflows.tasks.providerTasks.billCreationError' },
    { prop: 'companyName', query: 'company.name' },
    { prop: 'schedulingCompanyName', query: 'schedulingCompany.name' },
    { prop: 'location', query: 'location.name' },
    { prop: 'referenceNumber', query: 'referenceNumber' },
    { prop: 'recipient', query: 'recipient' },
    { prop: 'projectOverdue', query: 'projectOverdue' },
    { prop: 'requestStatus', query: 'requestStatus' },
    { prop: 'projectManagers', query: 'projectManagers' },
    {
      prop: 'providerTaskId',
      query: 'workflows.tasks.providerTasks._id',
      transform: (val) => {
        const _id = validObjectId(val) ? convertToObjectId(val) : val;
        return { 'workflows.tasks.providerTasks._id': _id };
      },
    },
    {
      prop: 'providerTaskStatus',
      query: 'workflows.tasks.providerTasks.status',
      transform: val => ({ 'workflows.tasks.providerTasks.status': buildStatusMatchQuery(val) }),
    },
    {
      prop: 'billStatus',
      query: 'workflows.tasks.providerTasks.billStatus',
      transform: val => ({ 'workflows.tasks.providerTasks.billStatus': buildStatusMatchQuery(val, BILL_STATUS_VALUES) }),
    },
    { prop: 'providerTaskInstructions', query: 'workflows.tasks.providerTasks.instructions' },
    {
      prop: 'providerTaskBilled',
      query: 'workflows.tasks.providerTasks.billed',
      transform: val => ({ 'workflows.tasks.providerTasks.billed': val === 'true' }),
    },
    {
      prop: 'languageCombination',
      transform: (val) => {
        if (val) {
          const srcTgt = val.split('-');
          if (srcTgt.length === 1) {
            const srcTgtTrimmed = srcTgt[0].trim();
            return {
              $or: [
                { 'workflows.srcLang.name': startsWithSafeRegexp(srcTgtTrimmed) },
                { 'workflows.tgtLang.name': startsWithSafeRegexp(srcTgtTrimmed) },
              ],
            };
          } else if (srcTgt.length === 2) {
            return {
              'workflows.srcLang.name': startsWithSafeRegexp(srcTgt[0].trim()),
              'workflows.tgtLang.name': startsWithSafeRegexp(srcTgt[1].trim()),
            };
          }
          throw new Error('Invalid languages filter');
        }
      },
    },
    { prop: 'task', query: 'workflows.tasks.ability' },
    { prop: 'schedulingStatus',
      transform: (val) => {
        const safeRegexp = startsWithSafeRegexp(val);
        return { 'schedulingStatus.name': safeRegexp };
      },
    },
    {
      prop: 'workflows.tasks._id',
      transform: (val) => {
        let _id = val;
        if (validObjectId(val)) {
          _id = convertToObjectId(val);
        }
        return { 'workflows.tasks._id': _id };
      },
    },
  ];
  if (isAggregation === true) {
    allFields = allFields.concat(addDateFields(buildISODateQuery));
  } else {
    allFields = allFields.concat(buildDateQuery(buildISODateQuery));
  }
  return allFields.concat(translationExtraQueryParams());
};

const filterWorkflows = (request, shouldFilter) => {
  const filteredWorkflows = [];
  if (request.workflows) {
    request.workflows.forEach((w, wi) => {
      let wri = null;
      if (w.tasks) {
        w.tasks.forEach((t, ti) => {
          let tri = null;
          if (t.providerTasks) {
            t.providerTasks.forEach((pt, pti) => {
              const filterElement = shouldFilter({
                request,
                workflow: w,
                workflowIndex: wi,
                task: t,
                taskIndex: ti,
                providerTask: pt,
                providerTaskIndex: pti,
              });
              if (filterElement) {
                let pickedWorkflow;
                if (wri === null) {
                  pickedWorkflow = _.pick(w, ['_id', 'language', 'workflowDueDate']);
                  pickedWorkflow.tasks = [];
                  filteredWorkflows.push(pickedWorkflow);
                  wri = filteredWorkflows.length - 1;
                } else {
                  pickedWorkflow = filteredWorkflows[wri];
                }
                let pickedTask;
                if (tri === null) {
                  pickedTask = _.pick(t, ['_id', 'ability']);
                  pickedTask.providerTasks = [];
                  pickedWorkflow.tasks.push(pickedTask);
                  tri = pickedWorkflow.tasks.length - 1;
                } else {
                  pickedTask = filteredWorkflows[wri].tasks[tri];
                }
                pickedTask.providerTasks.push(pt);
              }
            });
          }
        });
      }
    });
  }
  return filteredWorkflows;
};

const POST_PROCESS_FILTERS = {
  'workflows.tasks.providerTasks.taskDueDate': queryCondition => ({ providerTask }) => {
    const taskDueDateMoment = moment(providerTask.taskDueDate);
    if (queryCondition.$gte.isBefore(taskDueDateMoment) &&
      queryCondition.$lte.isAfter(taskDueDateMoment)) {
      return true;
    }
    return false;
  },
  'workflows.tasks.ability': queryCondition => ({ task }) => {
    const test = queryCondition.test(task.ability);
    return test;
  },
  'workflows.tgtLang.name': queryCondition => ({ workflow }) => {
    const test = queryCondition.test(workflow.tgtLang.name);
    return test;
  },
  'workflows.tasks.providerTasks.status': queryCondition => ({ providerTask }) => {
    const test = queryCondition === providerTask.status;
    return test;
  },
};

const postProcessFilters = query => Object.keys(query)
  .map(queryPath => ({
    func: POST_PROCESS_FILTERS[queryPath],
    queryCondition: query[queryPath],
  }))
  .reduce((accumulator, current) => {
    if (current.func) {
      accumulator.push(current.func(current.queryCondition));
    }
    return accumulator;
  }, []);

const postProcessFilterFactory = (query) => {
  const filters = postProcessFilters(query);
  let shouldFilter;
  if (filters.length) {
    shouldFilter = data => filters.every(f => f(data));
  } else {
    shouldFilter = () => true;
  }
  return request => filterWorkflows(request, shouldFilter);
};

const cloneAndPickTask = (t) => {
  const pickedTask = _.pick(_.cloneDeep(t), [
    '_id',
    'ability',
  ]);
  pickedTask.providerTasks = [];
  return pickedTask;
};

const cloneAndPickWorkflow = w => _.pick(_.cloneDeep(w), [
  '_id',
  'language',
  'workflowDueDate',
]);

/**
 *
 * @typedef PopulableEntityPosition
 * @type {object}
 * @property {number} requestIndex the request index where this object can be found.
 * @property {number} workflowIndex the workflow index where this object can be found.
 * @property {number} taskIndex the task index where this object can be found.
 * @property {number} providerTaskIndex the provider task index where this object can be found.
 *
 * @typedef {allProviders: PopulableEntityPosition, request: object} PopulableRequest
 * @typedef {allProviders: PopulableEntityPosition, requests: array} ArrayPopulableRequest
 *
 * @typedef {function(object):PopulableRequest} RequestProviderTransformation
 * @typedef {function(object):ArrayPopulableRequest} ArrayRequestProviderTransformation
 *
 */

/**
*
* @param {ObjectId} [providerObjectId] optional provider id to filter tasks.
* @returns {RequestProviderTransformation} function that is able to transform requests.
*/
const transformTasksForProviderFactory = providerObjectId => (request) => {
  const cherryPickedRequest = _.pick(request, ['no', 'company', 'contact', 'srcLang', 'tgtLangs', 'status']);
  if (request.contact) {
    cherryPickedRequest.contact = _.pick(cherryPickedRequest.contact, ['_id', 'firstName', 'middleName', 'lastName', 'deleted', 'terminated']);
  }
  const cherryPickedWorkflows = [];
  const allProviders = {};
  _.get(request, 'workflows', []).forEach((w) => {
    // if no suitable provider task is found in this workflow, this will remain null
    let workflowIndex = null;
    const cherryPickedTasks = [];
    _.get(w, 'tasks', []).forEach((t) => {
      let taskIndex = null;
      _.get(t, 'providerTasks', []).forEach((pt) => {
        const isNilProvider = _.isNil(_.get(pt, 'provider._id'));
        if (_.isNil(providerObjectId)
          || (!isNilProvider && !_.isNil(providerObjectId)
          && pt.provider.equals(providerObjectId))) {
          // check if the workflow was previously added
          if (_.isNil(workflowIndex)) {
            cherryPickedWorkflows.push(cloneAndPickWorkflow(w));
            workflowIndex = cherryPickedWorkflows.length - 1;
          }
          // check if the task was previously added
          if (_.isNil(taskIndex)) {
            cherryPickedTasks.push(cloneAndPickTask(t));
            taskIndex = cherryPickedTasks.length - 1;
          }
          // pick the meaningful properties from the provider task
          const pickedProviderTask = _.pick(pt, ['_id', 'provider', 'taskDueDate', 'status']);
          // assign the status to the human readable values
          pickedProviderTask.status = TASK_STATUS_VALUES
            .find(v => v.value === pickedProviderTask.status);
          pickedProviderTask.status = _.get(pickedProviderTask.status, 'text');
          cherryPickedTasks[taskIndex].providerTasks.push(pickedProviderTask);
          const providerTaskIndex = cherryPickedTasks[taskIndex].providerTasks.length - 1;
          // generate an object with all providers to populate
          // with the real indexes to the workflow, task and provider tasks
          if (!isNilProvider) {
            const providerIdStr = pickedProviderTask.provider.toString();
            if (_.isNil(allProviders[providerIdStr])) {
              allProviders[providerIdStr] = [];
            }
            allProviders[providerIdStr].push({
              workflowIndex,
              taskIndex,
              providerTaskIndex,
            });
          }
        }
      });
    });
    if (!_.isNil(workflowIndex)) {
      cherryPickedWorkflows[workflowIndex].tasks = cherryPickedTasks;
    }
  });
  if (cherryPickedWorkflows.length) {
    cherryPickedRequest.workflows = cherryPickedWorkflows;
    return {
      allProviders,
      request: cherryPickedRequest,
    };
  }
  return null;
};

/**
 * merges the data from src into dest.
 * @param {PopulableEntityPosition} src
 * @param {PopulableEntityPosition} dest
 * @param {number} requestIndex
 */
const mergeAllProviders = (src, dest, requestIndex) => {
  Object.keys(src).forEach((providerId) => {
    if (_.isNil(dest[providerId])) {
      dest[providerId] = [];
    }
    src[providerId].forEach((indexes) => {
      indexes.requestIndex = requestIndex;
    });
    dest[providerId] = dest[providerId].concat(src[providerId]);
  });
};

/**
 * Grabs every transformed request, providers and aggregates them into a single object
 * @param {ObjectId} [providerObjectId] optional provider id to filter tasks.
 * @param {array<object>} requests array of requests.
 */
const transformRequestForProviderFactory = (providerObjectId, requests) => {
  const requestTransform = transformTasksForProviderFactory(providerObjectId);
  const allProviders = {};
  const transformedRequests = [];
  requests.forEach((request) => {
    const transformed = requestTransform(request);
    if (transformed) {
      const index = transformedRequests.length;
      mergeAllProviders(transformed.allProviders, allProviders, index);
      transformedRequests.push(transformed.request);
    }
  });
  return {
    allProviders,
    requests: transformedRequests,
  };
};

/**
 *
 * @param {ArrayPopulableRequest} transformationResult the tranformation generated (most likely)
 * by transformRequestForProviderFactory
 * @param {array<User>} dbProviders the users from the database.
 */
const completeRequests = (transformationResult, dbProviders) => {
  const providersMap = {};
  dbProviders.forEach((p) => {
    providersMap[p._id.toString()] = p;
  });
  const providersIds = Object.keys(transformationResult.allProviders);
  providersIds.forEach((pi) => {
    transformationResult.allProviders[pi].forEach((p) => {
      const path = `requests[${p.requestIndex}].workflows[${p.workflowIndex}].tasks[${p.taskIndex}].providerTasks[${p.providerTaskIndex}].provider`;
      const provider = _.get(transformationResult, path);
      // provider SHOULD exist but anything can happen in this crazy world
      if (provider) {
        const dbProvider = providersMap[provider.toString()];
        // dbProvider SHOULD also exist but lets not trust ourselves on this one either
        if (dbProvider) {
          _.set(transformationResult, path, dbProvider);
        }
      }
    });
  });
};

module.exports = {
  completeRequests,
  postProcessFilterFactory,
  transformRequestForProviderFactory,
  transformTasksForProviderFactory,
  translationFields,
  translationExtraQueryParams,
};
