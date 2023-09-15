const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');

const { Schema } = mongoose;
const ENTITY_SIZES = ['N/A', 'Micro-Entity', 'Small', 'Large'];
const WipoCountrySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  iq: {
    type: Boolean,
    default: false,
  },
  entity: {
    type: Boolean,
    default: false,
  },
  entitySizes: {
    type: [String],
    enum: ENTITY_SIZES,
    default: ['N/A'],
  },
  deDirectIq: {
    type: Boolean,
    default: false,
  },
  frDirectIq: {
    type: Boolean,
    default: false,
  },
}, {
  collection: 'ip_wipo_countries',
  timestamps: true,
});

WipoCountrySchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

WipoCountrySchema.set('toJSON', { virtuals: true });

WipoCountrySchema.plugin(mongooseDelete, { overrideMethods: true });
WipoCountrySchema.plugin(metadata);
WipoCountrySchema.plugin(modified);
WipoCountrySchema.plugin(lspData);
WipoCountrySchema.plugin(lmsGrid.aggregation());
WipoCountrySchema.index({ name: 1, code: 1, lspId: 1 }, { unique: true });

module.exports = WipoCountrySchema;
