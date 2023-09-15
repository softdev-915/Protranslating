const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const LocationSchema = new Schema({
  lspId: {
    type: Schema.ObjectId,
    ref: 'lsp',
    required: [true, 'lspId is required'],
  },
  name: {
    type: String,
    required: [true, 'name is required'],
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
  address: {
    type: String,
    __lms: {
      csvHeader: 'Address',
      gridSearchable: true,
    },
  },
  suite: {
    type: String,
    __lms: {
      csvHeader: 'Suite#',
      gridSearchable: true,
    },
  },
  city: {
    type: String,
    __lms: {
      csvHeader: 'City',
      gridSearchable: true,
    },
  },
  country: {
    _id: { type: Schema.ObjectId, ref: 'Country' },
    name: {
      type: String,
      __lms: {
        csvHeader: 'Country',
        gridSearchable: true,
      },
    },
  },
  state: {
    _id: { type: Schema.ObjectId, ref: 'State' },
    name: {
      type: String,
      __lms: {
        csvHeader: 'State',
        gridSearchable: true,
      },
    },
  },
  phone: {
    type: String,
    __lms: {
      csvHeader: 'Phone',
      gridSearchable: true,
    },
  },
  zip: {
    type: String,
    __lms: {
      csvHeader: 'Zip',
      gridSearchable: true,
    },
  },
}, {
  collection: 'locations',
  timestamps: true,
});

LocationSchema.pre('save', function () {
  const { Country } = mongoose.models;

  return Country.assertCountyAndStateValid(this.country, this.state);
});

LocationSchema.statics.postSave = function (location, modifications) {
  const { Company } = mongoose.models;
  const { Request } = mongoose.models;

  if (modifications.indexOf('name') !== -1) {
    return Promise.all([
      Company.updateMany({
        lspId: location.lspId,
        'locations._id': location._id,
      }, {
        $set: {
          'locations.$.name': location.name,
        },
      }),
      Request.updateMany({
        lspId: location.lspId,
        'location._id': location._id,
      }, {
        $set: {
          'location.name': location.name,
        },
      }),
    ]);
  }
};

LocationSchema.plugin(lspData);
LocationSchema.plugin(metadata);
LocationSchema.plugin(modified);
LocationSchema.plugin(mongooseDelete, { overrideMethods: true });
LocationSchema.plugin(lmsGrid.aggregation());
LocationSchema.plugin(importModulePlugin);
LocationSchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = LocationSchema;
