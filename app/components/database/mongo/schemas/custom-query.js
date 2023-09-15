const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const mongooseUniqueValidator = require('mongoose-unique-validator');
const _ = require('lodash');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');
const { validateArrayRequired } = require('../validators');
const {
  FIELD_FUNCTIONS,
  FILTER_GROUP_LOGICAL_OPERATORS,
  ORDER_BY_SORT_OPTIONS,
  getEntitiesText,
  getFieldsText,
  getFilterText,
  getGroupByText,
  getOrderByText,
  modifyDateFilters,
} = require('../../../../utils/custom-query');

const CustomQueryEntity = new mongoose.Schema({
  name: { type: String, required: true },
  refFrom: { type: String },
}, { _id: false });

const CustomQueryFilterGroupQuery = new mongoose.Schema({
  logicalOperator: { type: 'string', enum: FILTER_GROUP_LOGICAL_OPERATORS },
  children: { type: [{}], validate: validateArrayRequired },
}, { _id: false });

const CustomQueryFilterGroup = new mongoose.Schema({
  type: { type: String },
  query: { type: CustomQueryFilterGroupQuery },
}, { _id: false });

const CustomQueryFieldData = new mongoose.Schema({
  refFrom: { type: String },
  path: { type: String, required: true },
}, { _id: false });

const CustomQueryField = new mongoose.Schema({
  function: { type: String, enum: FIELD_FUNCTIONS },
  field: { type: CustomQueryFieldData, required: true },
  alias: { type: String },
}, { _id: false });

const CustomQueryOrderBy = new mongoose.Schema({
  fieldData: { type: CustomQueryField, required: true },
  sort: { type: String, enum: ORDER_BY_SORT_OPTIONS, required: true },
}, { _id: false });

const CustomQueryMock = new mongoose.Schema({
  currentDateOnNextRun: { type: Date },
}, { _id: false });

const CustomQuerySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    __lms: { gridSearchable: true },
  },
  entities: { type: [CustomQueryEntity], validate: validateArrayRequired },
  fields: { type: [CustomQueryField], required: true },
  filter: { type: CustomQueryFilterGroup },
  groupBy: { type: [CustomQueryFieldData], default: undefined },
  orderBy: { type: [CustomQueryOrderBy], default: undefined },
  lastRunBy: { type: String },
  lastRunAt: { type: Date },
  mock: { type: CustomQueryMock },
  isExecuting: { type: Boolean, default: false },
  lastExecutionStartedAt: { type: Date },
}, {
  collection: 'customQueries',
  timestamps: true,
  toJSON: { virtuals: true },
});

CustomQuerySchema.pre('save', function (next) {
  if (!_.isEmpty(this.filter)) {
    this.filter = modifyDateFilters(this.filter);
  }
  next();
});

CustomQuerySchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

CustomQuerySchema.statics.setCsvTransformations = (csvBuilderInstance) => csvBuilderInstance
  .virtual('Entities', ({ entities = [] }) => getEntitiesText(entities))
  .virtual('Fields', ({ fields = [] }) => getFieldsText(fields))
  .virtual('Filter', ({ filter = {} }) => getFilterText(filter))
  .virtual('Group by', ({ groupBy = [] }) => getGroupByText(groupBy))
  .virtual('Order by', ({ orderBy = [] }) => getOrderByText(orderBy))
  .virtual('Last run at', ({ lastRunAt }) => _.defaultTo(lastRunAt, ''))
  .virtual('Last run by', ({ lastRunBy }) => _.defaultTo(lastRunBy, ''))
  .virtual('Inactive', ({ deleted = false }) => (deleted ? 'true' : 'false'))
  .virtual('Created by', ({ createdBy }) => _.defaultTo(createdBy, ''))
  .virtual('Created at', ({ createdAt }) => _.defaultTo(createdAt, ''))
  .virtual('Updated by', ({ updatedBy }) => _.defaultTo(updatedBy, ''))
  .virtual('Updated at', ({ updatedAt }) => _.defaultTo(updatedAt, ''))
  .virtual('Deleted by', ({ deletedBy }) => _.defaultTo(deletedBy, ''))
  .virtual('Deleted at', ({ deletedAt }) => _.defaultTo(deletedAt, ''))
  .virtual('Restored by', ({ restoredBy }) => _.defaultTo(restoredBy, ''))
  .virtual('Restored at', ({ restoredAt }) => _.defaultTo(restoredAt, ''));

CustomQuerySchema.statics.getExportOptions = () => ({
  headers: [
    'Name',
    'Entities',
    'Fields',
    'Filter',
    'Group by',
    'Order by',
    'Created by',
    'Created at',
    'Updated by',
    'Updated at',
    'Inactive',
    'Deleted by',
    'Deleted at',
    'Restored by',
    'Restored at',
    'Last run at',
    'Last run by',
  ],
  alias: { Name: 'name' },
});

CustomQuerySchema.plugin(mongooseDelete, { overrideMethods: true });
CustomQuerySchema.plugin(metadata);
CustomQuerySchema.plugin(modified);
CustomQuerySchema.plugin(lspData);
CustomQuerySchema.plugin(lmsGrid.aggregation());
CustomQuerySchema.plugin(mongooseUniqueValidator);
CustomQuerySchema.index({ lspId: 1, name: 1 }, { unique: true });

module.exports = CustomQuerySchema;
