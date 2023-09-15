const mongoose = require('mongoose');
const metadata = require('../plugins/metadata');

const { Schema } = mongoose;
const TranslationUnitSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
}, { collection: 'paymentGateways', timestamps: true });

TranslationUnitSchema.plugin(metadata);
TranslationUnitSchema.index({ name: 1 }, { unique: true });

module.exports = TranslationUnitSchema;
