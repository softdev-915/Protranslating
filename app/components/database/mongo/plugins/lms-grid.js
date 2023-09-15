const _ = require('lodash');
const { mongooseAggregation } = require('../../../../utils/pagination/aggregation-builder');

const DEFAULT_OPTIONS = {
  _id: {
    csvHeader: 'Id',
    gridSearchable: true,
  },
  lspId: {
    csvHeader: false,
    gridSearchable: false,
  },
  updatedBy: {
    csvHeader: 'Updated By',
    gridSearchable: true,
  },
  updatedAt: {
    csvHeader: 'Updated At',
    gridSearchable: true,
  },
  createdBy: {
    csvHeader: 'Created By',
    gridSearchable: true,
  },
  createdAt: {
    csvHeader: 'Created At',
    gridSearchable: true,
  },
  deletedBy: {
    csvHeader: 'Deleted By',
    gridSearchable: true,
  },
  restoredBy: {
    csvHeader: 'Restored By',
    gridSearchable: true,
  },
  deletedAt: {
    csvHeader: 'Deleted At',
    gridSearchable: true,
  },
  restoredAt: {
    csvHeader: 'Restored At',
    gridSearchable: true,
  },
  deleted: {
    csvHeader: 'Inactive',
    gridSearchable: true,
  },
};

module.exports = {
  options: () => ({ ...DEFAULT_OPTIONS }),
  aggregation: (lmsOptions = DEFAULT_OPTIONS) => (schema) => {
    if (lmsOptions) {
      Object.keys(lmsOptions).forEach((key) => {
        if (schema.paths[key]) {
          _.set(schema.paths[key], 'options.__lms', lmsOptions[key]);
        }
      });
    }
    schema.statics.gridAggregation = function () {
      return mongooseAggregation(this);
    };
  },
};
