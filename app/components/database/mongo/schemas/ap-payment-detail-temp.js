const mongoose = require('mongoose');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const ApPaymentDetailTemp = new Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    index: true,
  },
  entry: {
    type: mongoose.SchemaTypes.Mixed,
  },
}, {
  collection: 'apPaymentDetailTemp',
  timestamps: true,
  strict: false,
});

ApPaymentDetailTemp.plugin(metadata);
ApPaymentDetailTemp.plugin(lspData);

module.exports = ApPaymentDetailTemp;
