const mongoose = require('mongoose');
const _ = require('lodash');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const { csvVirtualParser } = require('../../../../utils/csvExporter');
const importModulePlugin = require('../plugins/import-module');

const BILL_CREATION_DAY_MAX = 28;
const BILL_CREATION_DAY_MIN = 1;
const { Schema } = mongoose;
const CompanyDepartmentRelationshipSchema = new Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
  },
  internalDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InternalDepartment',
  },
  billCreationDay: {
    type: Number,
    validate: {
      validator(v) {
        return v <= BILL_CREATION_DAY_MAX && v >= BILL_CREATION_DAY_MIN;
      },
      message: () => 'Please provider integer between 1-28',
    },
  },
  acceptInvoicePerPeriod: {
    type: Boolean,
    default: false,
  },
}, {
  collection: 'companyDepartmentRelationships',
  timestamps: true,
});

CompanyDepartmentRelationshipSchema.statics.getExportOptions = () => ({
  headers: [
    'ID',
    'Company',
    'LSP Internal department',
    'Bill Creation Day',
    'Accept Invoice Per Period',
    'Inactive',
    'Created by',
    'Created at',
    'Updated at',
    'Updated by',
    'Deleted at',
    'Deleted by',
    'Restored by',
    'Restored at',
  ],
});

CompanyDepartmentRelationshipSchema.statics
  .setCsvTransformations = (csvBuilderInstance) => csvVirtualParser
    .parseTimeStamps(csvBuilderInstance)
    .virtual('ID', (item) => _.get(item, '_id', ''))
    .virtual('Company', (item) => _.get(item, 'company.name', ''))
    .virtual('LSP Internal department', (item) => _.get(item, 'internalDepartment.name', ''))
    .virtual('Bill Creation Day', (item) => _.get(item, 'billCreationDay', ''))
    .virtual('Inactive', (item) => _.get(item, 'deleted', ''))
    .virtual('Created at', (item) => _.defaultTo(item.createdAt, ''))
    .virtual('Created by', (item) => _.defaultTo(item.createdBy, ''))
    .virtual('Updated at', (item) => _.defaultTo(item.updatedAt, ''))
    .virtual('Updated by', (item) => _.defaultTo(item.updatedBy, ''))
    .virtual('Deleted at', (item) => _.defaultTo(item.deletedAt, ''))
    .virtual('Deleted by', (item) => _.defaultTo(item.deletedBy, ''))
    .virtual('Restored by', (item) => _.defaultTo(item.restoredBy, ''))
    .virtual('Restored at', (item) => _.defaultTo(item.restoredAt, ''))
    .virtual('Accept Invoice Per Period', (item) => _.get(item, 'acceptInvoicePerPeriod', ''));

CompanyDepartmentRelationshipSchema.plugin(mongooseDelete, {
  overrideMethods: true,
});
CompanyDepartmentRelationshipSchema.plugin(metadata);
CompanyDepartmentRelationshipSchema.plugin(modified);
CompanyDepartmentRelationshipSchema.plugin(lspData);
CompanyDepartmentRelationshipSchema.plugin(importModulePlugin);
CompanyDepartmentRelationshipSchema.index({
  lspId: 1,
  company: 1,
  internalDepartment: 1,
}, { unique: true });

module.exports = CompanyDepartmentRelationshipSchema;
