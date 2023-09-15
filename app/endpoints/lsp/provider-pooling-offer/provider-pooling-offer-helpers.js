const moment = require('moment');
const _ = require('lodash');
const mongoose = require('mongoose');
const { convertToObjectId, safeConvertToObjectId } = require('../../../utils/schema');
const { startsWithSafeRegexp } = require('../../../utils/regexp');

const { ObjectId } = mongoose.Types;
const RATE_SORT_OPTION = 'rate';
const FILTERABLE_PROPS = {
  _id: ObjectId,
  name: String,
  address: String,
  rate: Number,
  tasksInQueue: Number,
  completedForThisCompany: Number,
  providerId: ObjectId,
  providerName: String,
  providerAddress: String,
  providerEmailAddress: String,
  providerTaskId: ObjectId,
  providerTaskName: String,
  requestNo: String,
  languageCombination: String,
  providerRate: Number,
  isLawyer: Boolean,
  isPracticing: Boolean,
  isBarRegistered: Boolean,
  isActive: String,
  createdAt: String,
  createdBy: String,
  updatedAt: String,
  updatedBy: String,
  isNotificationSent: String,
  responseStatus: String,
  decliningReason: String,
  roundNo: Number,
  notificationSentTime: String,
  offerId: ObjectId,
};
const getSortParams = (sortOption, defaultSort) => {
  const sortBy = {};
  if (sortOption) {
    let multiplier = 1;
    let sort = sortOption;
    if (sort.startsWith('-')) {
      multiplier = -1;
      sort = sort.slice(1);
    }
    const sortOrder = sort === RATE_SORT_OPTION ? 1 : -1;
    sortBy[sort] = sortOrder * multiplier;
  }
  return { $sort: _.merge(sortBy, defaultSort) };
};

const getTypedFilter = (value, key) => {
  let castedValue = _.isBoolean(value) ? value : value.trim();

  if (FILTERABLE_PROPS[key] === String) {
    castedValue = startsWithSafeRegexp(castedValue);
  }
  if (FILTERABLE_PROPS[key] === Number) {
    castedValue = Number(castedValue);
  }
  if (FILTERABLE_PROPS[key] === ObjectId) {
    castedValue = safeConvertToObjectId(castedValue);
  }
  return { [key]: castedValue };
};

const getAfterAggregationFilters = (params) => {
  const filters = _.pick(params.filter, Object.keys(FILTERABLE_PROPS));
  const matchStage = Object.keys(filters)
    .reduce((match, key) => Object.assign(match, getTypedFilter(filters[key], key)), {});
  return _.isEmpty(matchStage) ? [] : [{ $match: matchStage }];
};

const getVendorRatesQuery = (params) => {
  const query = [
    { $eq: ['$$rate.ability.name', params.abilityName] },
  ];

  if (!_.isEmpty(params.srcIso)) {
    query.push({ $eq: ['$$rate.sourceLanguage.isoCode', params.srcIso] });
  }
  if (!_.isEmpty(params.tgtIso)) {
    query.push({ $eq: ['$$rate.targetLanguage.isoCode', params.tgtIso] });
  }
  if (!_.isEmpty(params.internalDepartment)) {
    query.push({ $eq: ['$$rate.internalDepartment', convertToObjectId(params.internalDepartment._id)] });
  }
  return query;
};

const getVendorRateDetailsQuery = (params) => {
  const query = [
    { $eq: ['$$rateDetail.currency._id', convertToObjectId(params.currencyId)] },
    { $eq: ['$$rateDetail.translationUnit._id', convertToObjectId(params.translationUnitId)] },
  ];
  if (!_.isEmpty(params.breakdownId)) {
    query.push({ $eq: ['$$rateDetail.breakdown._id', convertToObjectId(params.breakdownId)] });
  }
  if (_.isNumber(params.maxRate)) {
    query.push({ $lte: ['$$rateDetail.price', params.maxRate] });
  }
  return query;
};

const buildInitialProvidersMatch = (params) => {
  const stage = {
    _id: { $nin: params.nin.map(_id => convertToObjectId(_id)) },
    type: 'Vendor',
    terminated: { $ne: true },
    lastLoginAt: { $gte: moment().subtract(4, 'months').toDate() },
    lsp: convertToObjectId(params.lspId),
    abilities: params.abilityName,
    'vendorDetails.competenceLevels': {
      $in: params.competenceLevels.map(cl => convertToObjectId(cl._id)),
    },
  };
  if (!_.isEmpty(params.languageCombination)) {
    stage.languageCombinations = params.languageCombination;
  }
  if (!_.isEmpty(params.internalDepartment)) {
    stage['vendorDetails.internalDepartments'] = convertToObjectId(params.internalDepartment._id);
  }
  if (params.onlyActive) {
    Object.assign(stage, {
      'vendorDetails.escalated': { $ne: true },
      'vendorDetails.turnOffOffers': { $ne: true },
    });
  }
  return stage;
};
const buildOfferDetailsAggregation = (requestId, workflowId, taskId) => [
  {
    $match: {
      _id: convertToObjectId(requestId),
    },
  },
  {
    $addFields: {
      workflows: {
        $filter: {
          input: '$workflows',
          as: 'wf',
          cond: { $eq: ['$$wf._id', convertToObjectId(workflowId)] },
        },
      },
    },
  },
  {
    $addFields: {
      workflow: {
        $arrayElemAt: ['$workflows', 0],
      },
    },
  },
  {
    $addFields: {
      'workflow.tasks': {
        $filter: {
          input: '$workflow.tasks',
          as: 'task',
          cond: { $eq: ['$$task._id', convertToObjectId(taskId)] },
        },
      },
    },
  },
  {
    $addFields: {
      'workflow.task': {
        $arrayElemAt: ['$workflow.tasks', 0],
      },
    },
  },
  {
    $project: {
      no: 1,
      quoteCurrency: 1,
      workflow: {
        task: 1,
        srcLang: 1,
        tgtLang: 1,
      },
      company: {
        _id: 1,
      },
      languageCombinations: 1,
      internalDepartment: 1,
      competenceLevels: 1,
    },
  },
];

const buildProviderGridPipelines = (params, paginationParams) => [
  // Matching all the vendors with needed ability from current lsp
  {
    $match: buildInitialProvidersMatch(params),
  },
  // Getting rid of not needed props and filtering the rates
  {
    $project: {
      isEcalated: '$vendorDetails.escalated',
      hasTurnedOffOffers: '$vendorDetails.turnOffOffers',
      name: {
        $concat: [
          '$firstName',
          ' ',
          '$lastName',
        ],
      },
      providerEmailAddress: '$email',
      address: {
        $concat: [
          '$vendorDetails.address.city',
          ', ',
          '$vendorDetails.address.state.name',
          ', ',
          '$vendorDetails.address.country.name',
        ],
      },
      isLawyer: '$vendorDetails.isLawyer',
      isPracticing: '$vendorDetails.isPracticing',
      isBarRegistered: '$vendorDetails.isBarRegistered',
      rates: {
        $filter: {
          input: '$vendorDetails.rates',
          as: 'rate',
          cond: {
            $and: [
              ...getVendorRatesQuery(params),
            ],
          },
        },
      },
    },
  },
  // Getting rid of providers that do not have required rates
  {
    $match: {
      rates: {
        $not: { $size: 0 },
      },
    },
  },
  // Merge rate details as the rates might be more than 1 element.
  {
    $project: {
      name: 1,
      providerEmailAddress: 1,
      address: 1,
      isEcalated: 1,
      hasTurnedOffOffers: 1,
      isLawyer: 1,
      isPracticing: 1,
      isBarRegistered: 1,
      rateDetailsFromRates: {
        $reduce: {
          input: '$rates',
          initialValue: [],
          in: { $concatArrays: ['$$value', '$$this.rateDetails'] },
        },
      },
    },
  },
  // Filtering merged rateDetails by required params
  {
    $addFields: {
      rateDetails: {
        $filter: {
          input: '$rateDetailsFromRates',
          as: 'rateDetail',
          cond: {
            $and: [
              ...getVendorRateDetailsQuery(params),
            ],
          },
        },
      },
    },
  },
  // Getting rid of providers that do not have required rate details
  {
    $match: {
      rateDetails: { $not: { $size: 0 } },
    },
  },
  {
    $addFields: {
      rateDetail: { $arrayElemAt: ['$rateDetails', 0] },
    },
  },
  getSortParams(paginationParams.sort, { name: 1 }),
  {
    $lookup: {
      from: 'requests',
      let: {
        theLspId: '$lsp',
        theProviderId: '$_id',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              lspId: '$$theLspId',
            },
            createdAt: { $gte: moment().subtract(20, 'days').toDate() },
          },
        },
        {
          $addFields: {
            providerId: '$$theProviderId',
          },
        },
        {
          $project: {
            _id: 1,
            'company._id': 1,
            providerId: 1,
            tasks: {
              $reduce: {
                input: '$workflows',
                initialValue: [],
                in: {
                  $concatArrays: [
                    '$$value',
                    '$$this.tasks',
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            'company._id': 1,
            providerId: 1,
            providerTasks: {
              $reduce: {
                input: '$tasks',
                initialValue: [],
                in: {
                  $concatArrays: [
                    '$$value',
                    '$$this.providerTasks',
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            tasksInQueue: {
              $reduce: {
                input: '$providerTasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    {
                      $cond: [
                        {
                          $and: [
                            { $in: ['$$this.status', ['inProgress', 'notStarted']] },
                            { $eq: ['$$this.provider._id', '$providerId'] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  ],
                },
              },
            },
            completedForThisCompany: {
              $cond: {
                if: { $ne: ['$company._id', params.companyId] },
                then: 0,
                else: {
                  $reduce: {
                    input: '$providerTasks',
                    initialValue: 0,
                    in: {
                      $add: [
                        '$$value',
                        {
                          $cond: [
                            {
                              $and: [
                                { $in: ['$$this.status', ['completed', 'approved']] },
                                { $eq: ['$$this.provider._id', '$providerId'] },
                              ],
                            },
                            1,
                            0,
                          ],
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      ],
      as: 'requests',
    },
  },
  {
    $project: {
      name: 1,
      address: 1,
      providerEmailAddress: 1,
      isLawyer: 1,
      isPracticing: 1,
      isBarRegistered: 1,
      rate: '$rateDetail.price',
      isEcalated: 1,
      hasTurnedOffOffers: 1,
      tasksInQueue: {
        $reduce: {
          input: '$requests',
          initialValue: 0,
          in: {
            $add: [
              '$$value',
              '$$this.tasksInQueue',
            ],
          },
        },
      },
      completedForThisCompany: {
        $reduce: {
          input: '$requests',
          initialValue: 0,
          in: {
            $add: [
              '$$value',
              '$$this.completedForThisCompany',
            ],
          },
        },
      },
    },
  },
  {
    $addFields: {
      selected: {
        $cond: [
          { $in: ['$_id', params.selectedProviders] }, 1, 0,
        ],
      },
    },
  },
  ...getAfterAggregationFilters(paginationParams),
  { $skip: paginationParams.skip },
  { $limit: paginationParams.limit },
];
const includesIso = (languages, isoCode) => languages.some(l => l.isoCode === isoCode);
const getPoolingOfferNotificationsPipelinesWithoutPagination = query => ([
  {
    $addFields: {
      languageCombination: '$languageCombination.text',
    },
  },
  {
    $lookup: {
      from: 'abilities',
      localField: 'abilityId',
      foreignField: '_id',
      as: 'abilityId',
    },
  },
  { $unwind: { path: '$abilityId', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'users',
      localField: 'selectedProviders._id',
      foreignField: '_id',
      as: 'providerDetails',
    },
  },
  { $unwind: { path: '$selectedProviders', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'users',
      localField: 'selectedProviders._id',
      foreignField: '_id',
      as: 'providerDetails',
    },
  },
  { $unwind: { path: '$providerDetails', preserveNullAndEmptyArrays: true } },
  {
    $addFields: {
      providerId: '$providerDetails._id',
      isNotificationSent: { $in: ['$providerDetails._id', '$notifiedProviders'] },
      declinedBy: {
        $filter: {
          input: '$declinedBy',
          as: 'declined',
          cond: { $eq: ['$$declined.providerId', '$providerDetails._id'] },
        },
      },
    },
  },
  {
    $addFields: {
      responseStatus: {
        $switch: {
          branches: [
            { case: { $eq: ['$providerId', '$acceptedBy'] }, then: 'Accepted' },
            { case: { $in: ['$providerId', '$declinedBy.providerId'] }, then: 'Declined' },
            { case: { $and: [{ $eq: ['$isNotificationSent', true] }, { $eq: ['$status', 'Open'] }] }, then: 'Pending' },
          ],
          default: 'No Response',
        },
      },
      declinedBy: {
        $arrayElemAt: ['$declinedBy', 0],
      },
    },
  },
  {
    $addFields: {
      notificationDetails: {
        $filter: {
          input: '$notificationsDetails',
          as: 'notificationDetail',
          cond: { $eq: ['$$notificationDetail.providerId', '$providerDetails._id'] },
        },
      },
    },
  },
  {
    $addFields: {
      notificationDetails: {
        $arrayElemAt: ['$notificationDetails', 0],
      },
    },
  },
  {
    $addFields: {
      notificationSentTime: {
        $cond: {
          if: { $eq: ['$notificationDetails', null] },
          then: '',
          else: '$notificationDetails.sentDate',
        },
      },
    },
  },
  {
    $addFields: {
      roundNo: {
        $cond: {
          if: { $eq: ['$notificationDetails', null] },
          then: '',
          else: '$notificationDetails.roundNo',
        },
      },
    },
  },
  {
    $addFields: {
      decliningReason: {
        $cond: {
          if: {
            $eq: ['$responseStatus', 'Declined'],
          },
          then: '$declinedBy.decliningReason',
          else: '',
        },
      },
    },
  },
  {
    $project: {
      offerId: '$_id',
      providerId: 1,
      providerName: {
        $concat: [
          '$providerDetails.firstName',
          ' ',
          '$providerDetails.lastName',
        ],
      },
      providerAddress: {
        $concat: [
          '$providerDetails.vendorDetails.address.city',
          ', ',
          '$providerDetails.vendorDetails.address.state.name',
          ', ',
          '$providerDetails.vendorDetails.address.country.name',
        ],
      },
      providerTaskId: '$abilityId._id',
      providerTaskName: '$abilityId.name',
      requestNo: '$request.no',
      languageCombination: 1,
      providerRate: '$selectedProviders.rate',
      status: 1,
      createdAt: 1,
      createdBy: 1,
      updatedAt: 1,
      updatedBy: 1,
      isNotificationSent: 1,
      responseStatus: 1,
      decliningReason: 1,
      notificationSentTime: 1,
      roundNo: 1,
    },
  },
  ...getAfterAggregationFilters(query),
  getSortParams(query.sort, { providerName: 1 }),
]);

const getPoolingOfferNotificationsPipelines = query => ([
  ...getPoolingOfferNotificationsPipelinesWithoutPagination(query),
  { $skip: query.skip },
  { $limit: query.limit },
]);

const buildProviderOffersAggregationPipelines = providerId => ([
  { $match: { isActive: true } },
  { $match: { acceptedBy: { $exists: false } } },
  { $match: { notifiedProviders: { $in: [providerId] } } },
  {
    $addFields: {
      declinedBy: {
        $map: {
          input: '$declinedBy',
          as: 'declinedProvider',
          in: '$$declinedProvider.providerId',
        },
      },
    },
  },
  { $match: { declinedBy: { $not: { $in: [providerId] } } } },
  {
    $lookup: {
      from: 'abilities',
      localField: 'abilityId',
      foreignField: '_id',
      as: 'abilityId',
    },
  },
  { $unwind: { path: '$abilityId', preserveNullAndEmptyArrays: true } },
  { $project: {
    _id: 1,
    providerTaskInstructions: 1,
    no: '$request.no',
    language: '$languageCombination.text',
    ability: '$abilityId.name',
    taskDueDate: '$dueDate',
    updatedAt: 1,
  } },
]);

const getProviderMatchingRateDetail = (filters, rates = []) => {
  let matchingRateDetail = { rateDetail: null };
  _.each(rates, (rate) => {
    const ability = _.get(rate, 'ability.name', '');
    const languageCombinationRequired = _.get(rate, 'ability.languageCombination', false);
    const targetLanguage = _.get(rate, 'targetLanguage.isoCode', '');
    const sourceLanguage = _.get(rate, 'sourceLanguage.isoCode', '');
    const company = _.get(rate, 'company.name', '');
    const internalDepartment = _.get(rate, 'internalDepartment.name', '');
    const catTool = _.get(rate, 'catTool', '');
    const matchingConditions = [filters.ability === ability];
    if (languageCombinationRequired) {
      matchingConditions.push(_.get(filters, 'sourceLanguage', '') === sourceLanguage);
      matchingConditions.push(_.get(filters, 'targetLanguage', '') === targetLanguage);
    }
    if (!_.isEmpty(company)) {
      matchingConditions.push(_.get(filters, 'company.hierarchy', '') === company);
    }
    if (!_.isEmpty(internalDepartment)) {
      matchingConditions.push(_.get(filters, 'internalDepartment.name', '') === internalDepartment);
    }
    if (!_.isEmpty(catTool)) {
      matchingConditions.push(_.get(filters, 'catTool', '') === catTool);
    }
    if (matchingConditions.every(cond => cond)) {
      _.each(rate.rateDetails, (rateDetail) => {
        const breakdown = _.get(rateDetail, 'breakdown.name', '');
        const filtersBreakdown = _.get(filters, 'breakdown', '');
        const rateTranslationUnit = _.get(rateDetail, 'translationUnit.name', '');
        const filtersTranslationUnit = _.get(filters, 'translationUnit', '');
        if (breakdown === filtersBreakdown && rateTranslationUnit === filtersTranslationUnit) {
          if (!matchingRateDetail.matches
            || (matchingRateDetail.matches
              && matchingConditions.length > matchingRateDetail.matches)
          ) {
            matchingRateDetail = { rateDetail, matches: matchingConditions.length };
          }
        }
      });
    }
  });
  return matchingRateDetail.rateDetail;
};

module.exports = {
  buildOfferDetailsAggregation,
  includesIso,
  buildProviderGridPipelines,
  getPoolingOfferNotificationsPipelines,
  getPoolingOfferNotificationsPipelinesWithoutPagination,
  buildProviderOffersAggregationPipelines,
  getProviderMatchingRateDetail,
  RATE_SORT_OPTION,
};

