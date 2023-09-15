const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const DATABASES = ['WIPO', 'EPO', 'No DB'];
const IpCurrencySchema = new Schema({
  isoCode: {
    type: String,
    required: true,
  },
  database: {
    type: String,
    enum: DATABASES,
    required: true,
  },
  sign: {
    type: String,
    required: true,
  },
  default: {
    type: Boolean,
    default: false,
  },
}, {
  collection: 'ip_currencies',
  timestamps: true,
});

IpCurrencySchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

IpCurrencySchema.set('toJSON', { virtuals: true });

IpCurrencySchema.plugin(mongooseDelete, { overrideMethods: true });
IpCurrencySchema.plugin(metadata);
IpCurrencySchema.plugin(modified);
IpCurrencySchema.plugin(lspData);
IpCurrencySchema.plugin(lmsGrid.aggregation());
IpCurrencySchema.index({ isoCode: 1, database: 1, lspId: 1 }, { unique: true });

module.exports = IpCurrencySchema;
