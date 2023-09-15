const mongoose = require('mongoose');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const ArInvoiceEntryTemp = new Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    index: true,
  },
  entry: {
    type: mongoose.SchemaTypes.Mixed,
  },
}, {
  collection: 'arInvoiceEntryTemp',
  timestamps: true,
  strict: false,
});

ArInvoiceEntryTemp.plugin(metadata);
ArInvoiceEntryTemp.plugin(lspData);

module.exports = ArInvoiceEntryTemp;
