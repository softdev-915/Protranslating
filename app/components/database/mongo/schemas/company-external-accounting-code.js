// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const _ = require('lodash');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const { csvVirtualParser } = require('../../../../utils/csvExporter');
const importModulePlugin = require('../plugins/import-module');
const lmsGrid = require('../plugins/lms-grid');

const Schema = mongoose.Schema;
const CompanyExternalAccountingCodeSchema = new Schema({
  companyExternalAccountingCode: {
    type: String,
    required: true,
  },
  company: {
    _id: {
      type: Schema.ObjectId,
      ref: 'Company',
      required: true,
    },
    name: String,
  },
}, {
  collection: 'companyExternalAccountingCodes',
  timestamps: true,
});

CompanyExternalAccountingCodeSchema.statics.getExportOptions = () => ({
  headers: [
    'ID',
    'Company External Accounting Code',
    'Company',
    'Inactive',
    'Created at',
    'Updated at',
    'Deleted at',
    'Restored at',
    'Created by',
    'Updated by',
    'Deleted by',
    'Restored by',
  ],
});

CompanyExternalAccountingCodeSchema.statics.setCsvTransformations =
  csvBuilderInstance => csvVirtualParser.parseTimeStamps(csvBuilderInstance)
    .virtual('ID', item => _.get(item, '_id', ''))
    .virtual('Company External Accounting Code', item => _.get(item, 'companyExternalAccountingCode', ''))
    .virtual('Company', item => _.get(item, 'company.name', ''))
    .virtual('Inactive', item => _.get(item, 'deleted', ''))
    .virtual('Created at', item => _.defaultTo(item.createdAt, ''))
    .virtual('Created by', item => _.defaultTo(item.createdBy, ''))
    .virtual('Updated at', item => _.defaultTo(item.updatedAt, ''))
    .virtual('Updated by', item => _.defaultTo(item.updatedBy, ''))
    .virtual('Deleted at', item => _.defaultTo(item.deletedAt, ''))
    .virtual('Deleted by', item => _.defaultTo(item.deletedBy, ''));

CompanyExternalAccountingCodeSchema.plugin(mongooseDelete, {
  overrideMethods: true,
});
CompanyExternalAccountingCodeSchema.plugin(metadata);
CompanyExternalAccountingCodeSchema.plugin(modified);
CompanyExternalAccountingCodeSchema.plugin(lspData);
CompanyExternalAccountingCodeSchema.plugin(lmsGrid.aggregation());
CompanyExternalAccountingCodeSchema.plugin(importModulePlugin);
CompanyExternalAccountingCodeSchema.index({
  lspId: 1,
  'company._id': 1,
  companyExternalAccountingCode: 1,
}, { unique: true });

module.exports = CompanyExternalAccountingCodeSchema;
