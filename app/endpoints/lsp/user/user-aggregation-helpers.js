const _ = require('lodash');

exports._getListQueryPipeline = (columns) => {
  const pipeline = [
    {
      $lookup: {
        from: 'users',
        localField: 'projectManagers',
        foreignField: '_id',
        as: 'pmList',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'contactDetails.salesRep',
        foreignField: '_id',
        as: 'contactDetails.salesRep',
      },
    },
    {
      $unwind: {
        path: '$contactDetails.salesRep',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        salesRepText: {
          $concat: ['$contactDetails.salesRep.firstName', ' ', '$contactDetails.salesRep.lastName'],
        },
        competenceLevels: {
          $switch: {
            branches: [
              { case: { $eq: ['$type', 'Vendor'] }, then: '$vendorDetails.competenceLevels' },
              { case: { $eq: ['$type', 'Staff'] }, then: '$staffDetails.competenceLevels' },
            ],
            default: [],
          },
        },
        internalDepartments: {
          $switch: {
            branches: [
              { case: { $eq: ['$type', 'Vendor'] }, then: '$vendorDetails.internalDepartments' },
              { case: { $eq: ['$type', 'Staff'] }, then: '$staffDetails.internalDepartments' },
            ],
            default: [],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'competenceLevels',
        localField: 'competenceLevels',
        foreignField: '_id',
        as: 'competenceLevels',
      },
    },
    {
      $lookup: {
        from: 'paymentMethods',
        localField: 'vendorDetails.billingInformation.paymentMethod',
        foreignField: '_id',
        as: 'paymentMethod',
      },
    },
    {
      $lookup: {
        from: 'billingTerms',
        localField: 'vendorDetails.billingInformation.billingTerms',
        foreignField: '_id',
        as: 'billingTerms',
      },
    },
    {
      $lookup: {
        from: 'currencies',
        localField: 'vendorDetails.billingInformation.currency',
        foreignField: '_id',
        as: 'currency',
      },
    },
    {
      $lookup: {
        from: 'companies',
        localField: 'company',
        foreignField: '_id',
        as: 'userCompany',
      },
    },
    {
      $addFields: {
        isSyncedText: { $toString: '$siConnector.isSynced' },
        connectorEndedAt: { $toString: '$siConnector.connectorEndedAt' },
        syncError: { $toString: '$siConnector.error' },
      },
    },
    {
      $addFields: {
        typeName: '$type',
        companyName: '$userCompany.name',
        companyId: '$userCompany._id',
        rolesText: {
          $reduce: {
            input: '$roles',
            initialValue: '',
            in: {
              $cond: {
                if: {
                  $eq: [{ $indexOfArray: ['$roles', '$$this'] }, 0],
                },
                then: { $concat: ['$$value', '$$this'] },
                else: { $concat: ['$$value', ', ', '$$this'] },
              },
            },
          },
        },
        pmNames: {
          $reduce: {
            input: '$pmList',
            initialValue: '',
            in: {
              $cond: {
                if: {
                  $eq: [{ $indexOfArray: ['$pmList', '$$this'] }, 0],
                },
                then: { $concat: ['$$value', '$$this.firstName', ' ', '$$this.lastName'] },
                else: { $concat: ['$$value', ', ', '$$this.firstName', ' ', '$$this.lastName'] },
              },
            },
          },
        },
        groupsText: {
          $reduce: {
            input: '$groups',
            initialValue: '',
            in: {
              $cond: {
                if: {
                  $eq: [{ $indexOfArray: ['$groups', '$$this'] }, 0],
                },
                then: { $concat: ['$$value', '$$this.name'] },
                else: { $concat: ['$$value', ', ', '$$this.name'] },
              },
            },
          },
        },
        abilitiesText: {
          $reduce: {
            input: '$abilities',
            initialValue: '',
            in: {
              $cond: {
                if: {
                  $eq: [{ $indexOfArray: ['$abilities', '$$this'] }, 0],
                },
                then: { $concat: ['$$value', '$$this'] },
                else: { $concat: ['$$value', ', ', '$$this'] },
              },
            },
          },
        },
        languageCombinationsText: {
          $reduce: {
            input: '$languageCombinations',
            initialValue: '',
            in: {
              $cond: {
                if: {
                  $eq: [{ $indexOfArray: ['$languageCombinations', '$$this'] }, 0],
                },
                then: { $concat: ['$$value', '$$this'] },
                else: { $concat: ['$$value', ', ', '$$this'] },
              },
            },
          },
        },
        catToolsText: {
          $reduce: {
            input: '$catTools',
            initialValue: '',
            in: {
              $cond: {
                if: {
                  $eq: [{ $indexOfArray: ['$catTools', '$$this'] }, 0],
                },
                then: { $concat: ['$$value', '$$this'] },
                else: { $concat: ['$$value', ', ', '$$this'] },
              },
            },
          },
        },
        inactiveText: {
          $switch: {
            branches: [
              { case: { $eq: ['$deleted', true] }, then: 'true' },
              { case: { $eq: ['$deleted', false] }, then: 'false' },
            ],
            default: '',
          },
        },
        flatRateText: { $toString: '$vendorDetails.billingInformation.flatRate' },
        isOverwrittenText: {
          $switch: {
            branches: [
              { case: { $eq: ['$isOverwritten', true] }, then: 'false' },
              { case: { $eq: ['$isOverwritten', false] }, then: 'true' },
            ],
            default: '',
          },
        },
        terminatedText: {
          $switch: {
            branches: [
              { case: { $eq: ['$terminated', true] }, then: 'true' },
              { case: { $eq: ['$terminated', false] }, then: 'false' },
            ],
            default: 'false',
          },
        },
        isLockedText: {
          $switch: {
            branches: [
              { case: { $eq: ['$isLocked', true] }, then: 'true' },
              { case: { $eq: ['$isLocked', false] }, then: 'false' },
            ],
            default: 'false',
          },
        },
        remoteText: {
          $switch: {
            branches: [
              { case: { $eq: ['$staffDetails.remote', true] }, then: 'true' },
              { case: { $eq: ['$staffDetails.remote', false] }, then: 'false' },
            ],
            default: '',
          },
        },
        competenceLevelsText: {
          $reduce: {
            input: '$competenceLevels',
            initialValue: '',
            in: {
              $cond: {
                if: {
                  $eq: [{ $indexOfArray: ['$competenceLevels', '$$this'] }, 0],
                },
                then: { $concat: ['$$value', '$$this.name'] },
                else: { $concat: ['$$value', ', ', '$$this.name'] },
              },
            },
          },
        },
        paymentMethodName: '$paymentMethod.name',
        billingTermsName: '$billingTerms.name',
        currencyName: '$currency.name',
        form1099Box: '$vendorDetails.billingInformation.form1099Box',
        form1099Type: '$vendorDetails.billingInformation.form1099Type',
      },
    },
  ];

  const cleanStage = {
    $project: {
      competenceLevels: 0,
      internalDepartments: 0,
      paymentMethod: 0,
      billingTerms: 0,
      currency: 0,
      __v: 0,
      pmList: 0,
      securityPolicy: 0,
      userCompany: 0,
    },
  };
  if (_.isString(columns) && !_.isEmpty(columns)) {
    cleanStage.$project = columns
      .split(' ')
      .filter(key => _.isNil(Object.keys(cleanStage.$project).find(k => k === key)))
      .reduce((ac, en) => _.assign(ac, { [en]: 1 }), {});
  }
  pipeline.push(cleanStage);
  return pipeline;
};

exports._getExtraQueryParams = () => [
  'typeName', 'companyName', 'companyId', 'rolesText', 'groupsText', 'abilitiesText', 'languageCombinationsText',
  'catToolsText', 'isSyncedText', 'connectorEndedAt', 'syncError', 'inactiveText', 'pmNames', 'terminatedText', 'isLockedText', 'remoteText', 'vendorDetails.ofac',
  'vendorDetails.gender', 'staffDetails.comments', 'vendorDetails.vendorCompany', 'competenceLevelsText',
  'phoneNumber', 'form1099Box', 'form1099Type', 'internalDepartmentsText', 'vendorDetails.approvalMethod', 'vendorDetails.originCountry.name', 'paymentMethodName',
  'vendorDetails.billingInformation.ptPayOrPayPal', 'billingTermsName', 'currencyName', 'vendorDetails.billingInformation.billPaymentNotes',
  'contactDetails.contactStatus', 'contactDetails.qualificationStatus', 'contactDetails.jobTitle', 'flatRateText',
  'siConnector.isSynced', 'siConnector.connectorEndedAt', 'siConnector.error',
];
