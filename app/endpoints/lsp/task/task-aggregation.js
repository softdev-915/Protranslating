const _ = require('lodash');
const moment = require('moment');
const { prefixedNameQuery } = require('../user/user-api-helper');
const { escapeRegexp } = require('../../../utils/regexp');
const { getRoles, hasRole } = require('../../../utils/roles');

const buildBillFieldAggregation = (fieldToAdd, fieldToGet) => ({
  $addFields: {
    [`workflows.tasks.providerTasks.${fieldToAdd}`]: {
      $let: {
        vars: {
          firstBill: { $arrayElemAt: ['$bill', 0] },
        },
        in: `$$firstBill.${fieldToGet}`,
      },
    },
  },
});

const aggregationQueryParams = () => [
  {
    prop: 'contact',
    transform: (val) => {
      if (val) {
        return {
          contact: prefixedNameQuery(val, 'contact'),
        };
      }
      return null;
    },
  },
  {
    prop: 'schedulingCompany',
    transform: (val) => {
      if (val) {
        return {
          schedulingCompany: new RegExp(`${escapeRegexp(val)}.*`),
        };
      }
      return null;
    },
  },
  {
    prop: 'schedulingContact',
    transform: (val) => {
      if (val) {
        return {
          schedulingContact: prefixedNameQuery(val, 'schedulingContact'),
        };
      }
      return null;
    },
  },
  {
    prop: 'provider',
    transform: (val) => {
      let regexStr = val;
      val = val.split(' ');
      if (val.length > 1) {
        regexStr = '.*';
        val.forEach((str) => {
          regexStr += `${escapeRegexp(str)}.*`;
        });
      }
      if (val) {
        return {
          'workflows.tasks.providerTasks.provider.name': new RegExp(regexStr, 'i'),
        };
      }
      return null;
    },
  },
  {
    prop: 'requestStatus',
    transform: (val) => {
      if (val) {
        return {
          status: new RegExp(`.*${escapeRegexp(val)}.*`, 'i'),
        };
      }
      return null;
    },
  },
];

const roundMath = value => ({
  $multiply: [
    {
      $switch: {
        branches: [
          { case: { $gt: [value, 0] }, then: 1 },
          { case: { $lt: [value, 0] }, then: -1 },
        ],
        default: 0,
      },
    },
    { $divide: [{ $trunc: { $add: [{ $multiply: [{ $abs: value }, 100] }, 0.5] } }, 100] },
  ],
});

const minChargeLimit = value => ({
  $cond: {
    if: {
      $lt: [{ $toDouble: '$workflows.tasks.providerTasks.minCharge' }, value],
    },
    then: { ...value },
    else: { $toDouble: '$workflows.tasks.providerTasks.minCharge' },
  },
});

const calcProviderTaskTotalAmount = () => minChargeLimit(roundMath({
  $toDouble: {
    $reduce: {
      input: '$workflows.tasks.providerTasks.billDetails',
      initialValue: 0.00,
      in: {
        $add: ['$$value', { $multiply: ['$$this.quantity', '$$this.unitPrice'] }],
      },
    },
  },
}));

const preMatch = [
  'no',
  'referenceNumber',
  'lspId',
  'catTool',
  'title',
  'location.name',
  'workflows.srcLang.name',
  'workflows.tasks.providerTasks',
  'workflows.tasks.providerTasks.provider._id',
  'schedulingStatus.name',
  'completedAt',
  'createdAt',
  'createdBy',
  'projectOverdue',
  'expectedStartDate',
  'status',
  'sourceDocumentsList',
  'recipient',
  '$or',
  'languageCombinations.documents.name',
];

const postWorkflowUndwindMatch = [
  'workflows.tasks._id',
  'languageCombination',
  'workflows.tasks.providerTasks.cancelledAt',
  'workflows.tasks.ability',
  'workflows.tasks.providerTasks.taskDueDate',
  'workflows.tasks.providerTasks.approvedAt',
  'workflows.tasks.providerTasks.status',
  'workflows.tasks.providerTasks.billed',
  'workflows.tasks.providerTasks._id',
  'workflows.tasks.providerTasks.instructions',
  'providerTaskBilled',
  'workflows.tasks.providerTasks.approvedBy',
  'workflows.tasks.providerTasks.billCreationError',
];

const postBillMatch = [
  'workflows.tasks.providerTasks.billNo',
  'workflows.tasks.providerTasks.billDate',
  'workflows.tasks.providerTasks.billStatus',
];
const postCompany = ['company.name', 'requestor.name'];
const postContact = ['contact', 'projectManagers', 'requestorContact'];
const postProvider = [
  'workflows.tasks.providerTasks.provider.name',
  'workflows.tasks.providerTasks.provider._id',
];
const buildMatchObj = (query, matches) => {
  let hasMatches = false;
  let match = {};
  matches.forEach((fieldName) => {
    let q;
    if (_.hasIn(fieldName, 'prop') && !_.isNil(query[fieldName.prop])) {
      const val = _.get(query, fieldName.prop);
      q = fieldName.transform(val);
      match = q;
      hasMatches = true;
    } else {
      q = _.get(query, fieldName);
      if (!_.isNil(q)) {
        hasMatches = true;
        if (q.$or) {
          match.$and = _.get(match, '$and', []);
          match.$and.push(q);
        } else {
          match[fieldName] = q;
        }
      }
    }
  });
  if (hasMatches) {
    return {
      $match: match,
    };
  }
  return null;
};

const buildMatches = query => ({
  preMatch: buildMatchObj(query, preMatch),
  postWorkflowUndwindMatch: buildMatchObj(query, postWorkflowUndwindMatch),
  postBillMatch: buildMatchObj(query, postBillMatch),
  postProvider: buildMatchObj(query, postProvider),
  postCompany: buildMatchObj(query, postCompany),
  postContact: buildMatchObj(query, postContact),
});

const PRE_MATCH = [{
  $addFields: {
    timeSince: {
      $subtract: [
        moment.utc().toDate(),
        { $toDate: '$deliveryDate' },
      ],
    },
  },
}, {
  $addFields: {
    flagDiff: {
      $cond: {
        if: {
          $gt: ['$timeSince', 0],
        },
        then: 'True',
        else: 'False',
      },
    },
    weeksDiff: { $abs: { $trunc: { $divide: ['$timeSince', 7 * 24 * 60 * 60 * 1000] } } },
    daysDiff: { $abs: { $trunc: { $mod: [{ $divide: ['$timeSince', 24 * 60 * 60 * 1000] }, 7] } } },
    hoursDiff: { $abs: { $trunc: { $mod: [{ $divide: ['$timeSince', 60 * 60 * 1000] }, 24] } } },
    minutesDiff: { $abs: { $trunc: { $mod: [{ $divide: ['$timeSince', 60 * 1000] }, 60] } } },
  },
},
{
  $addFields: {
    timeSinceTimestamp: {
      $concat: [
        ' - ',
        { $substr: ['$weeksDiff', 0, -1] },
        'w ',
        { $substr: ['$daysDiff', 0, -1] },
        'd ',
        { $substr: ['$hoursDiff', 0, -1] },
        'h ',
        { $substr: ['$minutesDiff', 0, -1] },
        'm'],
    },
  },
},
{
  $addFields: { timeSinceText: { $concat: ['$flagDiff', '$timeSinceTimestamp'] } },
},
{
  $addFields: {
    projectOverdue: {
      $cond: {
        if: {
          $eq: ['$statusName', 'Completed'],
        },
        then: 'False',
        else: '$timeSinceText',
      },
    },
  },
}];

const WORKFLOW_UNWIND = [
  {
    $unwind: {
      path: '$workflows',
      preserveNullAndEmptyArrays: false,
    },
  }, {
    $unwind: {
      path: '$workflows.tasks',
      preserveNullAndEmptyArrays: false,
    },
  }, {
    $unwind: {
      path: '$workflows.tasks.providerTasks',
      preserveNullAndEmptyArrays: false,
    },
  }, {
    $addFields: {
      providerTaskStatus: '$workflows.tasks.providerTasks.status',
      providerTaskInstructions: '$workflows.tasks.providerTasks.instructions',
      providerTaskBilled: '$workflows.tasks.providerTasks.billed',
      providerId: '$workflows.tasks.providerTasks.provider._id',
      providerTaskId: '$workflows.tasks.providerTasks._id',
      languageCombination: {
        $concat: ['$workflows.srcLang.name', ' - ', '$workflows.tgtLang.name'],
      },
      taskAmount: calcProviderTaskTotalAmount(),
    },
  },
];

const PROJECT_MANAGERS_FIELD = [
  {
    $addFields: {
      projectManagers: {
        $reduce: {
          input: '$projectManagers',
          initialValue: '',
          in: {
            $cond: {
              if: {
                $eq: [{ $indexOfArray: ['$projectManagers', '$$this'] }, 0],
              },
              then: { $concat: ['$$value', '$$this.firstName', ' ', '$$this.lastName'] },
              else: { $concat: ['$$value', ', ', '$$this.firstName', ' ', '$$this.lastName'] },
            },
          },
        },
      },
    },
  },
];

const BILL_FIELDS = [
  {
    $lookup: {
      from: 'bills',
      let: {
        providerId: '$providerId',
        providerTaskId: '$providerTaskId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$vendor', '$$providerId'] },
                {
                  $in: [
                    '$$providerTaskId',
                    {
                      $ifNull: [{
                        $map: {
                          input: '$providerTasksIdList',
                          as: 'item',
                          in: '$$item.providerTaskId',
                        },
                      }, []],
                    },
                  ],
                },
              ],
            },
          },
        },
      ],
      as: 'bill',
    },
  },
  buildBillFieldAggregation('billId', '_id'),
  buildBillFieldAggregation('billNo', 'no'),
  buildBillFieldAggregation('billDate', 'date'),
  buildBillFieldAggregation('billStatus', 'status'),
];

const csvColumns = (user) => {
  const roles = getRoles(user);
  if (hasRole('TASK_READ_OWN', roles) && !hasRole('TASK_READ_ALL', roles)) {
    return [
      { name: 'Request No.', prop: 'no' },
      { name: 'Reference No.', prop: 'referenceNumber' },
      { name: 'ID', prop: 'taskId' },
      { name: 'Provider Task ID', prop: 'providerTaskId' },
      { name: 'Request Status', type: 'string', prop: 'requestStatus' },
      { name: 'Provider Task Status', type: 'string', prop: 'providerTaskStatus' },
      { name: 'Provider Task Instructions', type: 'string', prop: 'providerTaskInstructions' },
      { name: 'Provider Task Billed Status', type: 'string', prop: 'providerTaskBilled' },
      { name: 'Request Title', prop: 'title' },
      { name: 'Provider', prop: 'provider' },
      { name: 'Location Of The Request', prop: 'location' },
      { name: 'Translation Tools', prop: 'catTool' },
      { name: 'Internal Comments', prop: 'internalComments' },
      { name: 'Language Combination', prop: 'languageCombination' },
      { name: 'Created at', prop: 'createdAt' },
      { name: 'Created by', prop: 'createdBy' },
      { name: 'Task', prop: 'task' },
      { name: 'Task Due', prop: 'taskDueDate' },
      { name: 'Task Amount', prop: 'taskAmount' },
      { name: 'Project Managers', prop: 'projectManagers' },
      { name: 'Task Status', prop: 'status' },
      { name: 'Source Documents', prop: 'sourceDocumentsList' },
      { name: 'Approved at', prop: 'approvedAt' },
      { name: 'Approved by', prop: 'approvedBy' },
      { name: 'Bill Id', prop: 'billId' },
      { name: 'Bill No.', prop: 'billNo' },
      { name: 'Bill Date', prop: 'billDate' },
      { name: 'Bill Creation Error', prop: 'billCreationError' },
      { name: 'Bill Status', prop: 'billStatus' },
      { name: 'Recipient', prop: 'recipient' },
      { name: 'Updated at', prop: 'updatedAt' },
      { name: 'Updated by', prop: 'updatedBy' },
      { name: 'Deleted at', prop: 'deletedAt' },
      { name: 'Deleted by', prop: 'deletedBy' },
      { name: 'Restored at', prop: 'restoredAt' },
      { name: 'Restored by', prop: 'restoredBy' },
    ];
  }
  return [
    { name: 'ID', prop: 'taskId' },
    { name: 'Provider Task ID', prop: 'providerTaskId' },
    { name: 'Request No.', prop: 'no' },
    { name: 'Reference No.', prop: 'referenceNumber' },
    { name: 'Request Status', type: 'string', prop: 'requestStatus' },
    { name: 'Request Title', prop: 'title' },
    { name: 'Requestor Contact', prop: 'requestorContact' },
    { name: 'Requestor', prop: 'requestor' },
    { name: 'Location Of The Request', prop: 'location.name' },
    { name: 'Translation Tools', prop: 'catTool' },
    { name: 'Internal Comments', prop: 'internalComments' },
    { name: 'Company', prop: 'companyName' },
    { name: 'Language Combination', prop: 'languageCombination' },
    { name: 'Task', prop: 'task' },
    { name: 'Provider', prop: 'provider' },
    { name: 'Task Due', prop: 'taskDueDate' },
    { name: 'Scheduling Status', prop: 'schedulingStatus' },
    { name: 'Cancelled at', prop: 'cancelledAt' },
    { name: 'Contact', prop: 'contact' },
    { name: 'Project Overdue', prop: 'projectOverdue' },
    { name: 'Project Managers', prop: 'projectManagers' },
    { name: 'Task Status', prop: 'status' },
    { name: 'Task Amount', prop: 'taskAmount' },
    { name: 'Bill Id', prop: 'billId' },
    { name: 'Bill Date', prop: 'billDate' },
    { name: 'Bill Creation Error', prop: 'billCreationError' },
    { name: 'Bill No.', prop: 'billNo' },
    { name: 'Bill sync error', prop: 'billCreationError' },
    { name: 'Bill Status', type: 'string', prop: 'billStatus' },
    { name: 'Provider Task Status', type: 'string', prop: 'providerTaskStatus' },
    { name: 'Provider Task Instructions', type: 'string', prop: 'providerTaskInstructions' },
    { name: 'Provider Task Billed Status', type: 'string', prop: 'providerTaskBilled' },
    { name: 'Request Expected Start', prop: 'expectedStartDate' },
    { name: 'Source Documents', prop: 'sourceDocumentsList' },
    { name: 'Scheduling Contact', prop: 'schedulingContact' },
    { name: 'Scheduling Company', prop: 'schedulingCompany' },
    { name: 'Recipient', prop: 'recipient' },
    { name: 'Completed At', prop: 'completedAt' },
    { name: 'Created by', prop: 'createdBy' },
    { name: 'Created at', prop: 'createdAt' },
    { name: 'Approved by', prop: 'approvedBy' },
    { name: 'Approved at', prop: 'approvedAt' },
    { name: 'Updated at', prop: 'updatedAt' },
    { name: 'Updated by', prop: 'updatedBy' },
    { name: 'Deleted at', prop: 'deletedAt' },
    { name: 'Deleted by', prop: 'deletedBy' },
    { name: 'Restored at', prop: 'restoredAt' },
    { name: 'Restored by', prop: 'restoredBy' },
  ];
};

const buildProject = () => {
  const PROJECT = {
    $project: {
      _id: 1,
      no: 1,
      title: 1,
      status: 1,
      catTool: 1,
      createdAt: 1,
      createdBy: 1,
      billStatus: 1,
      completedAt: 1,
      deliveryDate: 1,
      projectOverdue: 1,
      referenceNumber: 1,
      projectManagers: 1,
      'location.name': 1,
      schedulingStatus: 1,
      internalComments: 1,
      expectedStartDate: 1,
      actualDeliveryDate: 1,
      providerTaskId: 1,
      providerTaskStatus: 1,
      providerTaskInstructions: 1,
      providerTaskBilled: 1,
      languageCombination: 1,
      sourceDocumentsList: 1,
      taskAmount: 1,
      recipient: 1,
    },
  };
  const workflowFields = ['_id', 'srcLang', 'tgtLang', 'workflowDueDate', 'tasks._id', 'tasks.ability'];
  const companyFields = ['_id', 'name'];
  const contactFields = ['_id', 'name', 'firstName', 'middleName', 'lastName', 'deleted', 'terminated'];
  const providerTaskFields = [
    '_id', 'taskDueDate', 'status', 'cancelledAt', 'approvedAt', 'approvedBy',
    'provider._id', 'provider.name', 'provider.deleted', 'provider.terminated',
    'billId', 'billNo', 'billDate', 'billStatus', 'providerTaskInstructions', 'providerTaskBilled', 'billCreationError',
  ];

  const fieldsMap = {
    workflows: workflowFields,
    schedulingCompany: companyFields,
    schedulingContact: contactFields,
    company: companyFields,
    contact: contactFields,
    'workflows.tasks.providerTasks': providerTaskFields,
  };
  Object.keys(fieldsMap).forEach((aggregationFieldName) => {
    const fieldsToAdd = fieldsMap[aggregationFieldName];
    fieldsToAdd.forEach((field) => {
      Object.assign(PROJECT.$project, { [`${aggregationFieldName}.${field}`]: 1 });
    });
  });
  return PROJECT;
};
const buildAggregation = (lspId, query, sort, skip, limit) => {
  let aggregation = [{
    $match: {
      lspId,
      'workflows.0': { $exists: true },
    },
  }];
  const matches = buildMatches(query);
  aggregation = aggregation.concat(PRE_MATCH);
  if (matches.preMatch) {
    aggregation.push(matches.preMatch);
  }
  if (matches.postCompany) {
    aggregation.push(matches.postCompany);
  }
  aggregation = aggregation.concat(PROJECT_MANAGERS_FIELD);
  if (matches.postContact) {
    aggregation.push(matches.postContact);
  }
  aggregation = aggregation.concat(WORKFLOW_UNWIND);
  if (matches.postWorkflowUndwindMatch) {
    aggregation.push(matches.postWorkflowUndwindMatch);
  }
  aggregation = aggregation.concat(BILL_FIELDS);
  if (matches.postBillMatch) {
    aggregation = aggregation.concat(matches.postBillMatch);
  }
  if (matches.postProvider) {
    aggregation.push(matches.postProvider);
  }
  if (!_.isNil(sort) && Object.keys(query).length > 1 && !_.has(sort, '_id')) {
    aggregation.push({
      $sort: sort,
    });
  }
  if (!_.isNil(skip) && skip) {
    aggregation.push({ $skip: skip });
  }
  if (!_.isNil(limit) && limit > 0) {
    aggregation.push({
      $limit: limit,
    });
  }
  aggregation.push(buildProject());
  return aggregation;
};

module.exports = {
  aggregationQueryParams,
  buildAggregation,
  csvColumns,
};
