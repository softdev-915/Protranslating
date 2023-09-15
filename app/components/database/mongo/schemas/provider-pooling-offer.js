const mongoose = require('mongoose');
const moment = require('moment');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const modified = require('../plugins/modified');
const lmsGrid = require('../plugins/lms-grid');
const lspData = require('../plugins/lsp-data');

const RATE = 'rate';
const COMPLETED_AMOUNT = 'completedForThisCompany';
const TOTAL_IN_QUEUE = 'tasksInQueue';
const DECLINING_REASONS = [
  'exceedsCapacity',
  'annualLeave',
  'providerTaskInstructionsUnclear',
  'outsideAreaOfExpertise',
  'other',
];
const OFFER_STATUS_OPEN = 'Open';
const OFFER_STATUS_CLOSED = 'Closed';
const { Schema } = mongoose;
const PpoSchema = new Schema({
  request: {
    no: {
      type: String,
      required: true,
    },
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Request',
      required: true,
    },
  },
  workflowId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  taskId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  providerTaskId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  abilityId: {
    type: Schema.Types.ObjectId,
    ref: 'Ability',
    required: true,
  },
  languageCombination: {
    ids: [{
      type: Schema.Types.ObjectId,
      ref: 'Language',
      required: false,
    }],
    text: {
      type: String,
      required: false,
    },
  },
  maxRate: {
    type: Number,
  },
  translationUnitId: {
    type: Schema.Types.ObjectId,
    ref: 'TranslationUnit',
    required: true,
  },
  breakdownId: {
    type: Schema.Types.ObjectId,
    ref: 'Breakdown',
    required: false,
  },
  quantity: {
    type: Number,
  },
  startDate: {
    type: Date,
    default: moment().utc(),
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  roundStartedAt: {
    type: Date,
    required: false,
  },
  currentRound: {
    type: Number,
    default: 0,
  },
  filesAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  referenceAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  roundsNo: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        return value >= 1 && value <= 3;
      },
      message: () => 'Incorrect value for No. of Rounds.',
    },
  },
  providersPerRoundNo: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        return value >= 1 && value <= 25;
      },
      message: () => 'Incorrect value for No. of Providers Per Round.',
    },
  },
  isUrgent: {
    type: Boolean,
    default: false,
  },
  sortBy: {
    type: String,
    enum: [RATE, COMPLETED_AMOUNT, TOTAL_IN_QUEUE],
    default: RATE,
    required: true,
  },
  providerTaskInstructions: {
    type: String,
  },
  selectedProviders: [{
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rate: Number,
  }],
  providersQueue: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    default: [],
  },
  notifiedProviders: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    default: [],
  },
  notificationsDetails: {
    type: [{
      providerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      sentDate: {
        type: Date,
      },
      roundNo: {
        type: Number,
      },
    }],
    default: [],
  },
  acceptedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  declinedBy: {
    type: [{
      providerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      decliningReason: {
        type: String,
        enum: DECLINING_REASONS,
      },
    }],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: [OFFER_STATUS_OPEN, OFFER_STATUS_CLOSED],
    default: OFFER_STATUS_OPEN,
  },
  mock: {
    type: Boolean,
    required: false,
  },
}, { timestamps: true, collection: 'providerPoolingOffers' });

PpoSchema.statics.getExportOptions = () => ({
  headers: [
    'ID',
    'Language Combination',
    'Notification Sent',
    'Notification Sent Date and Time',
    'Round No.',
    'Offer Status',
    'Provider Address',
    'Provider ID',
    'Provider Name',
    'Provider Rate',
    'Provider Task',
    'Provider Task ID',
    'Reason for Declining',
    'Request No.',
    'Response Status',
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

PpoSchema.plugin(mongooseDelete, { indexFields: true, overrideMethods: true });
PpoSchema.plugin(metadata);
PpoSchema.plugin(modified);
PpoSchema.plugin(lspData);
PpoSchema.plugin(lmsGrid.aggregation());

module.exports = PpoSchema;
