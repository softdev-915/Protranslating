// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');

// eslint-disable-next-line padding-line-between-statements
const IpRateSchema = new mongoose.Schema({
  country: {
    type: String,
  },
  translationRate: {
    type: String,
  },
  agencyFee: {
    type: String,
  },
}, { _id: false });

const IpRatesSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
  },
  entity: {
    type: String,
  },
  languageCode: {
    type: String,
  },
  defaultCompanyCurrencyCode: {
    type: String,
    required: true,
  },
  rates: {
    type: [IpRateSchema],
    required: false,
    default: [],
  },
}, { collection: 'ipRates', timestamps: true });

module.exports = IpRatesSchema;
