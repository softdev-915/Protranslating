const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment');
const mongooseDelete = require('mongoose-delete');
const modified = require('../plugins/modified');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');
const { companyDefaultPopulate, userLspPopulate } = require('../../../../utils/schema');

const { Schema } = mongoose;
const { ObjectId } = Schema;
const WON_ON_STATUS = 'Won';
const OpportunityDocumentSchema = new Schema({
  name: {
    type: String,
    __lms: {
      csvHeader: 'Documents',
      gridSearchable: true,
    },
  },
  isReference: Boolean,
  mime: String,
  encoding: String,
  size: Number,
  url: String,
}, { timestamps: true });

const OpportunitySchema = new Schema({
  no: {
    type: String,
    __lms: {
      csvHeader: 'Opportunity No.',
      gridSearchable: true,
    },
  },
  title: {
    type: String,
    __lms: {
      csvHeader: 'Title',
      gridSearchable: true,
    },
  },
  lostReason: {
    type: String,
    enum: [
      'Price',
      'Quality',
      'No need',
      'Managing it in-house',
      'Technology needs',
      'No response',
      'Another vendor selected',
    ],
  },
  status: {
    type: String,
    enum: ['Gathering information', 'Quoting', 'Won', 'Lost'],
    default: 'Gathering information',
    __lms: {
      csvHeader: 'Status',
      gridSearchable: true,
    },
  },
  probability: {
    type: Number,
    __lms: {
      csvHeader: 'Probability',
      gridSearchable: true,
    },
  },
  srcLang: {
    type: {
      name: {
        type: String,
        __lms: {
          csvHeader: 'Source Language',
          gridSearchable: true,
        },
      },
      isoCode: String,
      cultureCode: String,
    },
  },
  tgtLangs: {
    type: [{
      name: {
        type: String,
        __lms: {
          csvHeader: 'Target Languages',
          gridSearchable: true,
        },
      },
      isoCode: String,
      cultureCode: String,
    }],
    default: [],
  },
  notes: String,
  estimatedValue: {
    type: Number,
    __lms: {
      csvHeader: 'Estimated value',
    },
  },
  company: {
    type: ObjectId,
    ref: 'Company',
    __lms: {
      csvHeader: 'Company',
      gridSearchable: true,
    },
  },
  contact: {
    type: ObjectId,
    ref: 'User',
    __lms: {
      csvHeader: 'Contact',
      gridSearchable: true,
    },
  },
  documents: {
    type: [OpportunityDocumentSchema],
    default: [],
    __lms: {
      csvHeader: 'Documents',
      gridSearchable: false,
    },
  },
  salesRep: {
    type: ObjectId,
    ref: 'User',
    __lms: {
      csvHeader: 'Sales Rep',
      gridSearchable: true,
    },
  },
  secondaryContacts: [{
    type: ObjectId,
    default: [],
    ref: 'User',
    __lms: {
      csvHeader: 'Secondary contacts',
      gridSearchable: true,
    },
  }],
  expectedCloseDate: {
    type: Date,
    __lms: {
      csvHeader: 'Expected close date',
      gridSearchable: true,
    },
  },
  wonOnDate: {
    type: Date,
    __lms: {
      csvHeader: 'Won on',
      gridSearchable: true,
    },
  },
  bucketPrefixes: {
    type: [String],
    default: [],
  },
}, {
  collection: 'opportunities',
  timestamps: true,
});

// Part of the basic check
OpportunitySchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// Allow virtuals to be converted to JSON
OpportunitySchema.set('toJSON', { virtuals: true });
OpportunitySchema.plugin(metadata);
OpportunitySchema.plugin(modified);
OpportunitySchema.plugin(lspData);
OpportunitySchema.plugin(lmsGrid.aggregation());
OpportunitySchema.plugin(importModulePlugin);
OpportunitySchema.index({ lspId: 1, no: 1 }, { unique: true });
OpportunityDocumentSchema.plugin(mongooseDelete, { overrideMethods: true });

OpportunitySchema.pre('save', function (next) {
  const doc = this;
  const { Counter } = mongoose.models;

  // Set number only if it's a new record
  if (doc.no) {
    next();
  } else {
    Counter.nextOpportunityNumber(doc.lspId, (err, model) => {
      if (!err) {
        doc.no = `O${model.date}-${model.seq}`;
      }
      next(err);
    });
  }
});

OpportunitySchema.pre('save', function (next) {
  const doc = this;

  if (doc.isModified('status')) {
    if (doc.status === WON_ON_STATUS && this.wonOnDate === null) {
      this.wonOnDate = moment().toDate();
    }
  }
  next();
});

// Secondary contacts validation
OpportunitySchema.pre('save', async function (next) {
  const doc = this;

  if (doc.secondaryContacts && doc.isModified('secondaryContacts')) {
    try {
      const ids = doc.secondaryContacts.map((s) => new mongoose.Types.ObjectId(s._id));
      const contactsFound = await mongoose.models.User.findWithDeleted({
        _id: { $in: ids },
        type: 'Contact',
        lsp: doc.lspId,
        terminated: false,
      });

      // Check all secondary contacts exist
      if (contactsFound.length !== doc.secondaryContacts.length) {
        throw new Error('Some secondary contacts where not found');
      }
    } catch (err) {
      const message = err.message || err;

      throw new Error(`Error occured validating opportunity secondary contacts: ${message}`);
    }
  }
  next();
});

// Sales rep validation
OpportunitySchema.pre('save', async function (next) {
  const doc = this;
  const { User } = mongoose.models;

  if (doc.salesRep && doc.isModified('salesRep')) {
    try {
      const user = await User.findOneWithDeleted({
        _id: doc.salesRep,
        lsp: doc.lspId,
        terminated: false,
      });

      if (user === null) {
        throw new Error('Sales rep selected does not exist or is terminated');
      }
    } catch (err) {
      const message = err.message || err;

      throw new Error(`Error occured validating opportunity sales rep: ${message}`);
    }
  }
  next();
});

// Contact validation
OpportunitySchema.pre('save', async function (next) {
  const doc = this;
  const { User } = mongoose.models;

  // Validate contact belongs to the company selected
  if (doc.contact && doc.isModified('contact')) {
    try {
      const contact = await User.findOneWithDeleted({
        _id: doc.contact,
        type: 'Contact',
        lsp: doc.lspId,
        terminated: false,
      });

      if (contact === null) {
        throw new Error('Selected contact does not exist or is terminated');
      }
    } catch (err) {
      const message = err.message || err;

      throw new Error(`Error occured while validating opportunity contact: ${message}`);
    }
  }
  next();
});

OpportunitySchema.statics.findOneAndPopulate = function (query, overridePopulateOptions, cb) {
  const DEFAULT_POPULATE_OPTIONS = [
    {
      path: 'contact',
      select: userLspPopulate(),
      options: { withDeleted: true },
    },
    {
      path: 'company',
      select: companyDefaultPopulate,
      options: { withDeleted: true },
    },
    {
      path: 'secondaryContacts',
      select: userLspPopulate(),
      options: { withDeleted: true },
    },
    {
      path: 'salesRep',
      select: userLspPopulate(),
      options: { withDeleted: true },
    },
  ];
  const populateOptions = _.defaultTo(overridePopulateOptions, DEFAULT_POPULATE_OPTIONS);

  return this.findOne(query).populate(populateOptions).lean().exec(cb);
};

module.exports = OpportunitySchema;
