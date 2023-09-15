const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');
const lmsGrid = require('../plugins/lms-grid');
const importModulePlugin = require('../plugins/import-module');

const DEFAULT_LOGO = 'BIG Language Solutions_logo.svg';
const Schema = mongoose.Schema;
const formattedExtraFields = [
  'apostilleInPrefecture',
  'legalizationInPrefecture',
  'applicationVoucher',
  'notaryAsseveration',
  'asseverationByNotaryPublicForNotaryPublic',
  'asseverationNotaryPublicOfClientPaidByClient',
  'asseverationByRegisteredTranslator',
  'asseverationInCourt',
  'lawlinguistsSelfCertification',
  'deadlineAcceptanceAndDeadlineForSendingSeparateDocument',
  'highAmount',
  'legalizationInConsulate',
  'changeInProgress',
  'documentCountNotFinal',
  'partsInCommon',
  'remainsPossible',
  'translationWithTrack',
  'freeTranslation',
].reduce((formattedFields, field) => {
  const languages = ['English', 'Spanish', 'Italian', 'French', 'German'];
  languages.forEach((language) => {
    formattedFields[`${field}${language}`] = {
      type: String,
      default: '',
    };
  });
  return formattedFields;
}, {});
const extraFieldsVariables = Object.keys(formattedExtraFields).reduce((formattedFields, field) => {
  formattedFields[field] = '';
  return formattedFields;
}, {});
const TemplateSchema = new Schema({
  name: {
    type: String,
    required: true,
    __lms: {
      csvHeader: 'Name',
      gridSearchable: true,
    },
  },
  type: {
    type: String,
    required: true,
    enum: ['Quote Email', 'Invoice Email', 'Quote', 'Invoice', 'Generic Email', 'Bill'],
    __lms: {
      csvHeader: 'Type',
      gridSearchable: true,
    },
  },
  template: {
    type: String,
    required: true,
  },
  footerTemplate: {
    type: Schema.ObjectId,
    ref: 'FooterTemplate',
    required: false,
  },
  logoName: {
    type: String,
    default: DEFAULT_LOGO,
  },
  emailCustomFields: {
    termsAndConditions: {
      type: String,
      default: '',
    },
    cancellationPolicy: {
      type: String,
      default: '',
    },
  },
  customFields: {
    memo: {
      type: String,
      default: '',
    },
    audioFeed: {
      type: String,
      default: '',
    },
    paymentTerms: {
      type: String,
      default: '',
    },
    receiverDistribution: {
      type: String,
      default: '',
    },
    termsAndConditions: {
      type: String,
      default: '',
    },
    equipment: {
      type: String,
      default: '',
    },
    setup: {
      type: String,
      default: '',
    },
    cancelDate: {
      type: String,
      default: '',
    },
    cancellationPolicy: {
      type: String,
      default: '',
    },
    additionalHours: {
      type: String,
      default: '',
    },
    materialTerms: {
      type: String,
      default: '',
    },
    overtime: {
      type: String,
      default: '',
    },
    quoteNotes: {
      type: String,
      default: '',
    },
    numberOfWords: {
      type: String,
      default: '',
    },
    languagesExtra: {
      type: String,
      default: '',
    },
    ...formattedExtraFields,
    quoteTermsAndConditions: {
      type: String,
      default: '',
    },
    selectableTermsAndConditions: {
      type: Object,
      default: {
        type: '',
        value: '',
        options: [],
      },
    },
    rates: {
      type: String,
      enum: ['2 decimals', '3 decimals', '4 decimals'],
      default: '2 decimals',
    },
    recipient: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      enum: ['English', 'German', 'Italian', 'Spanish', 'French'],
      default: 'English',
    },
    vatOptionsForTotalAmount: {
      type: String,
      default: '',
    },
    vatRate: {
      type: String,
      enum: ['19%', '21%', '22%', '0%'],
      default: '22%',
    },
    vatAmount: {
      type: String,
      default: '0.00',
    },
    externalAccountingCodeLabel: {
      type: String,
      default: '',
    },
  },
  groupTaskItemsPerWorkflow: {
    type: Boolean,
    default: false,
  },
  hideCustomSaveToTemplate: {
    type: Boolean,
    default: false,
  },
  hiddenFields: [{
    type: String,
  }],
  hideableFields: [{
    type: String,
  }],
}, {
  collection: 'templates',
  timestamps: true,
});

// Part of the basic check
TemplateSchema.virtual('readDate').get(function () {
  return this.updatedAt;
});

// eslint-disable-next-line prefer-arrow-callback
TemplateSchema.virtual('variables').get(function () {
  return {
    path: 'https://portal.protranslating.com/',
    templateLogo: `/static/lsp-logos/${this.logoName}`,
    billingTerms: 'Net 45',
    contactBillingAddress: {
      line1: '',
      line2: '',
      zip: '',
      city: 'Miami',
      state: {
        name: 'Florida',
      },
      country: {
        name: 'United states',
      },
    },
    documents: [{
      _id: '5fee81d0dafb15022d6e5a8a',
      completed: false,
      createdAt: new Date(),
      createdBy: 'e2e@sample.com',
      encoding: '7bit',
      final: false,
      ip: '35.196.92.138',
      isInternal: false,
      isReference: false,
      mime: 'text/plain',
      name: 'textfile.txt',
      size: 9,
      updatedAt: new Date(),
    }],
    lspId: '58f60d08963daf9a13ce1889',
    languageCombinationList: 'English - Spanish,French,Japanese',
    lsp: {
      _id: '58f60d08963daf9a13ce1889',
      description: 'Translation Services (written) - test environment',
      name: 'Big Language Solutions',
      logoImage: '',
      addressInformation: {
        city: 'Miami',
        state: {
          name: 'Florida',
        },
        country: {
          name: 'United states',
        },
        zip: '669',
      },
    },
    request: {
      _id: '58f60d08963daf9a13ce1889',
      no: 'R-789653',
      catTool: 'MemoQ',
      purchaseOrder: 'Purcharse order',
      requestContactName: 'John Doe',
      contact: {
        firstName: '',
        middleName: '',
        lastName: '',
        billingAddress: {
          line1: '',
          line2: '',
          zip: '',
          city: 'Miami',
          state: {
            name: 'Florida',
          },
          country: {
            name: 'United states',
          },
        },
      },
      projectedCostTotal: 0,
      projectedCostGp: 0,
      invoiceTotal: 0,
      foreignInvoiceTotal: 0,
      foreignProjectedCostTotal: 0,
      billTotal: 0,
      billGp: 0,
      foreignBillTotal: 0,
      schedulingCompany: {
        name: 'ACME',
      },
      requestSchedulingContactName: 'John Doe',
      schedulingContact: {
        firstName: 'John',
        lastName: 'Doe 3',
      },
      externalAccountingCode: {
        _id: null,
        name: '',
      },
      company: {
        _id: '5f783a4db2c269004d7cb42e',
        billingAddress: {
          line1: '',
          line2: '',
          zip: '',
          city: 'Miami',
          state: {
            name: 'Florida',
          },
          country: {
            name: 'United states',
          },
        },
        billingInformation: {
          quoteCurrency: {
            _id: '',
            name: '',
            isoCode: '',
          },
          purchaseOrderRequired: false,
          billingTerm: {
            _id: '',
            name: '',
          },
          paymentMethod: {
            _id: '',
            name: '',
          },
          onHold: false,
          mandatoryWorkflow: false,
          onHoldReason: '',
          grossProfit: '100',
          notes: '',
        },
        billingTerms: '',
        deleted: false,
        hierarchy: 'LMS62C1',
        id: '5f783a4db2c269004d7cb42e',
        internalDepartments: [{
          _id: '',
          name: '',
        }],
        locations: [{
          _id: '',
          name: '',
        }],
        mandatoryRequestContact: true,
        name: 'LMS62C1',
      },
      otherContact: {
        firstName: 'Alice',
        lastName: 'Doe',
      },
      receptionDate: new Date(),
      title: 'New translation request',
      deliveryDate: new Date(),
      comments: 'Translation request comment',
      status: 'Request status',
      location: {
        name: 'Location',
        address: '',
        phone: '',
        city: '',
        suite: '',
        country: {
          name: '',
        },
        state: {
          name: '',
        },
        zip: '',
      },
      languageCombinationList: 'English - Spanish',
      finalDocuments: [{
        deleted: false,
        final: false,
        isReference: false,
        name: 'final document name',
      }],
      documents: [{
        deleted: false,
        final: false,
        isReference: false,
        name: 'document name',
      }],
      languageCombinations: [{
        srcLangs: [{
          name: 'English',
          isoCode: 'ENG',
        }],
        tgtLangs: [{
          name: 'Spanish',
          isoCode: 'SPA',
        }],
      }],
      requireQuotation: false,
      createdAt: new Date(),
      createdBy: new Date(),
      quoteDueDate: new Date(),
      expectedQuoteCloseDate: new Date(),
      deliveryMethod: {
        name: 'delivery method 01',
      },
      documentTypes: [{
        name: 'Excel',
      }],
      internalDepartment: {
        _id: '5fedcfb5229279011fccbd3f',
        name: 'LMS62 department01',
      },
      repSignOff: false,
      salesRep: '{{ username request.salesRep }}',
      turnaroundTime: '3 business days',
      softwareRequirements: [{
        name: 'Software requirement 01',
      }],
      projectManagers: [{
        email: 'pmEmail@sample.com',
        firstName: 'PM',
        lastName: 'last name',
        middleName: 'middle name',
      }],
      workflowTotals: {
        invoice: 231,
        projectedCost: 0,
      },
      invoices: [{
        quantity: 0,
        unitPrice: 0,
        total: 0,
        shouldPrintMinCharge: false,
        foreignTotal: 0,
        workflow: {
          srcLang: {
            name: 'Spanish',
          },
          tgtLang: {
            name: 'English',
          },
          subtotal: '100',
          foreignSubtotal: '110',
        },
        task: {
          ability: 'Translation',
          description: 'task description',
          total: 0,
          minCharge: 0,
          foreignTotal: 0,
          foreignMinCharge: 0,
        },
      }],
      actualDeliveryDate: new Date(),
      actualStartDate: new Date(),
      adjuster: '',
      assignmentStatus: new Date(),
      atendees: 0,
      expectedStartDate: new Date(),
      internalComments: '',
      isQuoteApproved: false,
      languageCombinationsText: 'English - Spanish,French,Japanese;',
      late: false,
      localCurrency: {
        _id: '5bc23977ed78e1c6d320c0b2',
        isoCode: 'USD',
        name: 'US Dollar',
      },
      memo: '',
      opportunityNo: '',
      otherCC: ['email@gmail.com'],
      partners: [{
        _id: '',
        name: '',
      }],
      poRequired: false,
      quoteCurrency: {
        _id: '5bc23977ed78e1c6d320c0b2',
        isoCode: 'USD',
        name: 'US Dollar',
      },
      recipient: '',
      rooms: 0,
      rush: false,
      billingTerms: 'Request billing terms',
      requestCurrency: 'EUR',
      sourceDocumentsList: 'textfile.txt, test.txt',
      updatedAt: new Date(),
      updatedBy: 'e2e@sample.com',
      workflows: [{
        description: 'workflow description',
        discount: 5,
        subtotal: 288,
        language: {
          isoCode: 'ISO3',
          name: 'workflow target language',
        },
        tasks: [{
          ability: 'ability01',
          description: 'task description',
          providerTasks: [{
            transactionDetails: [{
              invoice: {
                currency: {
                  name: 'USD',
                  isoCode: 'USD',
                },
                breakdown: {
                  name: 'fuzzy01',
                },
                minimumCharge: 2,
                quantity: 10,
                total: 303,
                translationUnit: {
                  name: 'Words',
                },
                unitPrice: 0.1,
              },
            }],
          }],
        }],
        workflowDueDate: new Date(),
      }],
    },
    lspLogo: 'lsp logo',
    custom: {
      memo: '',
      audioFeed: '',
      receiverDistribution: '',
      paymentTerms: '',
      termsAndConditions: '',
      overtime: '',
      materialTerms: '',
      setup: '',
      equipment: '',
      cancelDate: '',
      cancellationPolicy: '',
      additionalHours: '',
      quoteNotes: '',
      numberOfWords: '',
      languagesExtra: '',
      ...extraFieldsVariables,
      quoteTermsAndConditions: '',
      selectableTermsAndConditions: {
        type: '',
        value: '',
      },
      rates: '2 decimals',
      recipient: '',
      language: 'English',
      vatOptionsForTotalAmount: '',
      vatRate: '22%',
      vatAmount: '',
      externalAccountingCodeLabel: '',
    },
    emailCustom: {
      termsAndConditions: '',
      cancellationPolicy: '',
    },
  };
});

// Allow virtuals to be converted to JSON
TemplateSchema.set('toJSON', { virtuals: true });

TemplateSchema.index({ name: 1, lspId: 1 }, { unique: true });
TemplateSchema.plugin(mongooseDelete, { overrideMethods: true });
TemplateSchema.plugin(lspData);
TemplateSchema.plugin(lmsGrid.aggregation());
TemplateSchema.plugin(metadata);
TemplateSchema.plugin(importModulePlugin);

module.exports = TemplateSchema;
