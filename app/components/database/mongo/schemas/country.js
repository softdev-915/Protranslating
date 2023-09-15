const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const CountrySchema = new Schema({
  name: {
    type: String,
  },
  code: {
    type: String,
  },
}, {
  collection: 'countries',
});

CountrySchema.statics.assertCountyAndStateValid = async function (countryId, stateId) {
  const { State } = mongoose.models;
  const { Country } = mongoose.models;

  if (countryId) {
    const country = await Country.findById(countryId);

    if (!country) {
      throw new Error('Country was not found in db.');
    }

    if (stateId) {
      const state = await State.findOne({
        _id: stateId,
        country: countryId,
      });

      if (!state) {
        throw new Error(`Country "${country.name}" does not have provided state.`);
      }
    }
  }
};

CountrySchema.plugin(mongooseDelete, { overrideMethods: true });
CountrySchema.plugin(metadata);
CountrySchema.plugin(modified);
CountrySchema.plugin(lmsGrid.aggregation());
CountrySchema.plugin(importModulePlugin);

module.exports = CountrySchema;
