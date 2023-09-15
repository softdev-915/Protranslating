const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lspData = require('../plugins/lsp-data');
const importModulePlugin = require('../plugins/import-module');

const { Schema } = mongoose;
const AbilityExpenseAccountSchema = new Schema({
  expenseAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpenseAccount',
  },
  ability: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ability',
  },
}, {
  collection: 'abilityExpenseAccounts',
  timestamps: true,
});

AbilityExpenseAccountSchema.statics.getExportOptions = () => ({
  headers: [
    'Id',
    'Expense Account',
    'Ability',
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
  alias: {
    Id: '_id',
    'Expense Account': 'expenseAccount',
    Ability: 'ability',
    Inactive: 'deleted',
    'Created at': 'createdAt',
    'Updated at': 'updatedAt',
    'Deleted at': 'deletedAt',
    'Restored at': 'restoredAt',
    'Created by': 'createdBy',
    'Updated by': 'updatedBy',
    'Deleted by': 'deletedBy',
    'Restored by': 'restoredBy',
  },
});

AbilityExpenseAccountSchema.plugin(mongooseDelete, { overrideMethods: true });
AbilityExpenseAccountSchema.plugin(metadata);
AbilityExpenseAccountSchema.plugin(modified);
AbilityExpenseAccountSchema.plugin(lspData);
AbilityExpenseAccountSchema.plugin(importModulePlugin);
AbilityExpenseAccountSchema.index({ lspId: 1, expenseAccount: 1, ability: 1 }, { unique: true });

module.exports = AbilityExpenseAccountSchema;
