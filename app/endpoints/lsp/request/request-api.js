// eslint-disable-next-line global-require
const { Types: { ObjectId }, isValidObjectId } = global.mongoose || require('mongoose');
const moment = require('moment');
const _ = require('lodash');
const Promise = require('bluebird');
const csvWriter = require('csv-write-stream');
const handlebars = require('handlebars');
const helpers = require('helpers-for-handlebars');
const {
  forEachProviderTask,
  WORKFLOW_TASK_STATUSES,
  cancelWorkflowProviderTaskStatus,
  isUserPartOfWorkflow,
} = require('./workflow-helpers');
const requestAPIHelper = require('./request-api-helper');
const { cleanToAssignObject } = require('./request-api-user-permission-helper');
const AbstractRequestAPI = require('./abstract-request-api');
const { RestError } = require('../../../components/api-response');
const ServerURLFactory = require('../../../components/application/server-url-factory');
const EmailQueue = require('../../../components/email/templates');
const FilePathFactory = require('../../../components/file-storage/file-path-factory');
const rolesUtils = require('../../../utils/roles');
const { extractChildArray } = require('../../../utils/arrays');
const { areObjectIdsEqual, validObjectId } = require('../../../utils/schema');
const { searchFactory, exportFactory } = require('../../../utils/pagination');
const {
  contactSelect, companyDefaultPopulate, pushPopulates, requestContactSelect, contactWithProjectManagerSelect,
} = require('../../../utils/schema');
const { CsvExport } = require('../../../utils/csvExporter');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { parsePaginationFilter } = require('../../../utils/request');
const { decimal128ToNumber, sum, bigJsToNumber } = require('../../../utils/bigjs');
const EpoTranslationFeeAPI = require('../ip/ip_epo/api-translation-fee');
const EpoCountryAPI = require('../ip/ip_epo/api-country');
const EpoAPI = require('../ip/ip_epo/api');
const WipoTranslationFeeAPI = require('../ip/ip_wipo/api-translation-fee');
const WipoAPI = require('../ip/ip_wipo/api');
const EmailNotificationQueue = require('../../../components/email/queue');
const ProviderEmailQueue = require('../../../components/email/provider-email-queue');
const WorkflowProviderEmailSender = require('./workflow/workflow-provider-email-sender');
const PortalCatApi = require('../portalcat/portalcat-api');
const WorkflowApi = require('./workflow/workflow-api');
const { emptyWorkflow } = require('./workflow-default-values');
const MockableMoment = require('../../../components/moment');
const CompanyAPI = require('../company/company-api');
const NodbTranslationFeeAPI = require('../ip/ip_nodb/api-translation-fee');
const NodbTranslationFeeFilingAPI = require('../ip/ip_nodb/api-translation-fee-filing');

const REQUEST_IN_PROGRESS_STATUS = 'In progress';
const VALID_CONTACT_READ_WORKFLOW_ROLES = ['CONTACT-WORKFLOW_READ_OWN', 'CONTACT-WORKFLOW_READ_COMPANY'];
const TASK_ABILITY_CAT_PREFLIGHT = 'CAT Preflight';
const CONTACT = 'Contact';
const REQUEST_STATUSES = ['In progress', 'Waiting for Quote', 'Waiting for approval', 'Waiting for Client PO', 'To be processed', 'On Hold', 'Completed', 'Cancelled'];
const REQUEST_WAITING_STATUSES = ['Waiting for Quote', 'Waiting for approval'];
const REQUEST_WAITING_FOR_QUOTE = 'Waiting for Quote';
const REQUEST_WAITING_FOR_APPROVAL_STATUS = 'Waiting for approval';
const REQUEST_TO_BE_PROCESSED_STATUS = 'To be processed';
const REQUEST_COMPLETED_STATUS = 'Completed';
const REQUEST_DELIVERED_STATUS = 'Delivered';
const REQUEST_CANCELLED_STATUS = 'Cancelled';
const REQUEST_ON_HOLD_STATUS = 'On Hold';
const PROVIDER_TASK_APPROVED_STATUS = 'approved';
const PROVIDER_TASK_CANCELLED_STATUS = 'cancelled';
const PROVIDER_TASK_COMPLETED_STATUS = 'completed';
const REQUEST_CREATION_EMAIL = 'request-creation-email';
const REQUEST_CREATION_PM_EMAIL = 'request-creation-pm-email';
const REQUEST_DELIVERED_EMAIL = 'request-delivered-email';
const QUOTED_REQUEST_CREATION_PM_EMAIL = 'quoted-request-creation-pm-email';
const QUOTED_REQUEST_APPROVED_PM_EMAIL = 'quote-client-approved-pm-email';
const REQUEST_MODIFIED_PM_EMAIL = 'request-modified-pm-email';
const REQUEST_MODIFIED_CONTACT_EMAIL = 'request-modified-pm-email';
const BILL_PENDING_APPROVAL_PROVIDER_EMAIL = 'bill-pending-approval-provider';
const TRANSLATION_ONLY_QUOTE = 'Patent Translation Quote';
const VALID_COMPANY_REQUEST_EDITION_ROLES = [
  'COMPANY_READ_ALL',
  'PM-USER_READ_ALL',
  'WORKFLOW_READ_OWN',
];
const CONTACT_TYPE = 'Contact';
const TASK_FINANCIAL_FIELDS = ['invoiceDetails', 'total', 'foreignTotal', 'minCharge', 'foreignMinCharge'];
const PROVIDER_TASK_FINANCIAL_FIELDS = ['subtotal', 'foreignSubtotal', 'billDetails'];
const REQUEST_FINANCIAL_FIELDS = [
  'projectedCostTotal',
  'foreignProjectedCostTotal',
  'projectedCostGp',
  'billTotal',
  'foreignBillTotal',
  'billGp',
  'invoiceTotal',
  'foreignInvoiceTotal',
];
const CONTACT_READ_OWN_FIELDS_PROJECTION = [
  '_id',
  'no',
  'contactName',
  'contactEmail',
  'comments',
  'languageCombinationsText',
  'sourceDocumentsList',
  'companyName',
  'companyHierarchy',
  'quoteRequiredText',
  'title',
  'otherCC',
  'pmNames',
  'requestType.name',
  'purchaseOrder',
  'poRequiredText',
  'otherContactName',
  'deliveryDate',
  'quoteDueDate',
  'expectedQuoteCloseDate',
  'turnaroundTime',
  'statusName',
  'status',
  'requestType',
  'finalDocs',
  'completedAt',
  'requestInvoiceStatus',
  'timeSinceText',
  'createdBy',
  'createdAt',
  'updatedBy',
  'updatedAt',
  'inactiveText',
  'restoredBy',
  'restoredAt',
];
const REQUEST_TYPE_IP_NAME = 'IP';
const REQUEST_LIST_FIELDS = [
  '_id',
  'no',
  'opportunityNo',
  'referenceNumber',
  'contactName',
  'contactEmail',
  'comments',
  'languageCombinationsText',
  'sourceDocumentsList',
  'companyName',
  'companyHierarchy',
  'lateText',
  'rushText',
  'departmentNotes',
  'assignmentStatusName',
  'quoteRequiredText',
  'title',
  'otherCC',
  'pmNames',
  'schedulingCompanyName',
  'schedulingContactName',
  'memo',
  'billGp',
  'billTotal',
  'projectedCostTotal',
  'projectedCostGp',
  'invoiceTotal',
  'internalDepartmentName',
  'locationName',
  'schedulingStatusName',
  'recipient',
  'requestType.name',
  'locationName',
  'partnerNames',
  'insuranceCompanyName',
  'rooms',
  'atendees',
  'expectedStartDate',
  'actualStartDate',
  'actualDeliveryDate',
  'expectedDurationTime',
  'receptionDate',
  'purchaseOrder',
  'poRequiredText',
  'otherContactName',
  'deliveryDate',
  'quoteDueDate',
  'expectedQuoteCloseDate',
  'turnaroundTime',
  'status',
  'projectedCostGp',
  'finalDocs',
  'cancelledAt',
  'completedAt',
  'invoiceCompanyName',
  'invoiceContactName',
  'requestInvoiceStatus',
  'timeSinceText',
  'deliveredAt',
];
const AUTO_TRANSLATE_WORKFLOW_TYPE = 'Auto Scan PDF to MT Text';
const PORTALCAT_PIPELINE_TYPE_IMPORT = 'import';
const PORTALCAT_PIPELINE_TYPE_EXPORT = 'export';
const PORTALCAT_PIPELINE_TYPE_MT = 'mt';
const PORTALCAT_PIPELINE_TYPE_QA = 'qa';
const PORTALCAT_PIPELINE_TYPE_LOCKING = 'locking';
const PIPELINE_OPERATION_TASK_SCOPE = 'task';
const IP_SRC_LANGUAGES_ISO = ['ENG', 'GER', 'FRE'];
const NODB_NAME = 'Direct Filing/Paris Convention';
const WIPO_NAME = 'PCT National Phase';
const EPO_NAME = 'EP Validation';
const WORKFLOW_CREATION_STRATEGY_NEW = 'CREATE_NEW';
const PIPELINE_OPERATION_TYPE_CREATE = 'create';
const IP_INTERNAL_DEPARTMENT_NAME = 'Intellectual Property';
const createRequestRow = (doc) => {
  const row = {
    'Request No.': doc.no,
    'Reference Number': doc.referenceNumber,
    Contact: doc.contactName,
    'Contact Email': doc.contactEmail,
    Company: doc.companyName,
    'Company Hierarchy': doc.companyHierarchy,
    Title: doc.title,
    'Competence Levels': _.get(doc, 'competenceLevels', []).map((c) => c.name).join(', '),
    'Project Managers': doc.pmNames,
    'Reception date': doc.receptionDate,
    'Delivery Date': doc.deliveryDate,
    'Request Status': _.get(doc, 'statusName', doc.status),
    Status: _.get(doc, 'statusName', doc.status),
    Overdue: _.get(doc, 'timeSinceText', ''),
    'Final Documents': doc.finalDocs,
    'Created by': doc.createdBy,
    'Created at': doc.createdAt,
    'Updated by': doc.updatedBy,
    'Updated at': doc.updatedAt,
    Inactive: doc.inactiveText,
    'Restored by': doc.restoredBy,
    'Restored at': doc.restoredAt,
    Cancelled: doc.cancelledAt,
    Completed: doc.completedAt,
    Partners: doc.partnerNames,
    'Quote Target Date & Time': doc.quoteDueDate,
    'Quote Expected Close Date': doc.expectedQuoteCloseDate,
    'Assignment Status': doc.assignmentStatusName,
    Late: doc.lateText,
    Rush: doc.rushText,
    'Complaint/Nonconformance': doc.complaintText,
    'PO required': doc.poRequiredText,
    'Department Notes': doc.departmentNotes,
    'Scheduling Status': doc.schedulingStatusName,
    Memo: doc.memo,
    'Scheduling Company': doc.schedulingCompanyName,
    'Scheduling Contact': doc.schedulingContactName,
    'Invoice total': decimal128ToNumber(doc.invoiceTotal),
    'Projected cost total': decimal128ToNumber(doc.projectedCostTotal),
    'Foreign Bill total': decimal128ToNumber(doc.foreignBillTotal),
    'Actual Billable Cost Total': decimal128ToNumber(doc.billTotal),
    'Request Type': _.get(doc, 'requestType.name'),
    'Actual GP %': _.get(doc, 'billGp'),
    'Also Deliver To': _.get(doc, 'otherContactName'),
    'Cancelled at': _.get(doc, 'cancelledAt', ''),
    'Delivered at': _.get(doc, 'deliveredAt', ''),
    'Completed at': _.get(doc, 'completedAt', ''),
    'Expected Duration': _.get(doc, 'expectedDurationTime', ''),
    ID: doc._id,
    'Insurance Company': _.get(doc, 'insuranceCompanyName'),
    'Invoice Total': _.get(doc, 'invoiceTotal'),
    'Invoice to Company': _.get(doc, 'invoiceCompanyName'),
    'Invoice to Contact': _.get(doc, 'invoiceContactName'),
    'LSP Internal Department': _.get(doc, 'internalDepartmentName'),
    'Location of the Request': _.get(doc, 'locationName'),
    'Number of Attendees': _.get(doc, 'atendees'),
    'Number of Rooms': _.get(doc, 'rooms'),
    'Opportunity No.': _.get(doc, 'opportunityNo'),
    'Other CC': _.get(doc, 'otherCC'),
    'Projected Total Cost': _.get(doc, 'projectedCostTotal'),
    'Quote required': _.get(doc, 'quoteRequiredText'),
    Recipient: _.get(doc, 'recipient'),
    'Request Actual End': _.get(doc, 'actualEndDate'),
    'Request Actual Start': _.get(doc, 'actualStartDate'),
    'Request Expected Start': _.get(doc, 'expectedStartDate'),
    'Request Invoice Status': _.get(doc, 'requestInvoiceStatus'),
    'Turnaround time notes': _.get(doc, 'turnaroundTime'),
    PO: _.get(doc, 'purchaseOrder'),
    'Projected GP': _.get(doc, 'projectedCostGp'),
    'Patent App.Num': _.get(doc, 'ipPatent.patentApplicationNumber', ''),
    'Patent Pub.Num': _.get(doc, 'ipPatent.patentPublicationNumber', ''),
    'Source Documents': _.get(doc, 'sourceDocumentsList'),
    'Language Combinations': _.get(doc, 'languageCombinationsText', '').replace(/;/g, '-'),
  };
  return row;
};

helpers({ handlebars });

const isEpo = (publicationNumber) => publicationNumber.includes('EP');
const isWipo = (applicationNumber) => applicationNumber.includes('PCT');
const isTranslationOnly = (service) => service === TRANSLATION_ONLY_QUOTE;
const isNoDB = (databaseName) => databaseName === NODB_NAME;
const calculateTotal = (total, country, translationOnly) => {
  if (!translationOnly) {
    return sum(total, country.total);
  }
  return sum(total, country.translationFee);
};
const NODB_FIELD_MAPPING = {
  translationFee: 'translationFeeCalculated',
  officialFee: 'officialFee',
  agencyFeeFixed: 'agencyFeeFixed',
  agencyFee: 'agencyFee',
  officialLanguage: 'filingLanguage',
};

const EPO_FIELD_MAPPING = {
  translationFee: 'calculatedFee',
  officialFee: 'officialFee',
  agencyFeeFixed: 'agencyFeeFixed',
  agencyFee: 'agencyFeeCalculated',
  officialLanguage: 'officialFilingLanguage',
};

const WIPO_FIELD_MAPPING = {
  translationFee: 'translationFeeCalculated',
  officialFee: 'officialFeeCalculated',
  agencyFee: 'agencyFeeCalculated',
  agencyFeeFixed: 'agencyFeeFixed',
  officialLanguage: 'filingLanguage',
};

const getPatentFieldMappingByDatabase = (databaseName) => {
  if (databaseName.includes(EPO_NAME)) {
    return EPO_FIELD_MAPPING;
  }
  if (databaseName.includes(WIPO_NAME)) {
    return WIPO_FIELD_MAPPING;
  }
  return NODB_FIELD_MAPPING;
};
class RequestAPI extends AbstractRequestAPI {
  constructor(options) {
    super(options);
    this.emailQueue = new ProviderEmailQueue(this.logger, this.schema, this.configuration);
    this.FilePathFactory = FilePathFactory;
    this.mockFlag = options.mock;
    this.mockServerTime = options.mockServerTime;
    this.mockRequestBilled = options.mockRequestBilled;
    const serverURLFactory = new ServerURLFactory(this.configuration);

    this.serverUrl = serverURLFactory.buildServerURL();
    this.emailNotificationQueue = new EmailNotificationQueue(this.logger, this.schema);
    this.workflowProviderEmailSender = new WorkflowProviderEmailSender(
      this.logger,
      {
        mock: this.mock,
        lspId: this.lspId,
        serverUrl: this.serverUrl,
      },
      this.user.lsp,
      this.schema,
      this.configuration,
    );

    this.canOnlyUpdateOwnTasks = this.user.has('TASK_UPDATE_OWN')
      && this.user.hasNot([
        'TASK_UPDATE_ALL',
        'WORKFLOW_UPDATE_OWN',
        'WORKFLOW_UPDATE_ALL',
      ]);

    this.canUpdateCompanyRequest = this.user.has('REQUEST_UPDATE_COMPANY');
    this.canOnlyUpdateAssignedTask = this.canOnlyUpdateOwnTasks
      && this.user.hasNot([
        'REQUEST_UPDATE_ALL',
        'REQUEST_UPDATE_OWN',
      ]);

    this.canReadAllTaskFinancial = this.user.has('TASK-FINANCIAL_READ_ALL');
    this.canReadOwnTaskFinancial = this.user.has('TASK-FINANCIAL_READ_OWN');
    this.canReadOwnRegulatoryFields = this.user.has('TASK-REGULATORY-FIELDS_READ_OWN');
    this.canReadWorkflowRegulatoryFields = this.user.has('TASK-REGULATORY-FIELDS_READ_WORKFLOW');
    this.canReadAllRegulatoryFields = this.user.has('TASK-REGULATORY-FIELDS_READ_ALL');
    this.canHaveDescription = this.user.has('WORKFLOW_READ_ALL')
      || this.user.type === CONTACT_TYPE || this.user.hasNot(['CONTACT-WORKFLOW_READ_OWN', 'CONTACT-WORKFLOW_READ_COMPANY']);
    this.workflowApi = new WorkflowApi({
      logger: this.logger,
      user: this.user,
      configuration: this.configuration,
      requestApi: this,
      mockRequestBilled: this.mockRequestBilled,
    });
    this.portalCatApi = new PortalCatApi(this.logger, {
      user: this.user,
      configuration: this.configuration,
    }, this, this.workflowApi);
  }

  /**
   * Returns the request list as a csv file
   * @param {Object} requestFilters to filter the requests returned.
   */
  async requestExport(filters, res) {
    this.logger.debug(`User ${this.user.email} retrieved a catTool list export file`);
    const query = { lspId: this.lspId, ..._.get(filters, 'paginationParams', {}) };

    if (!_.isEmpty(filters.statuses)) {
      this.logger.debug(`Filtering requests by status for user (${this.user.email})`);
      query.status = { $in: filters.statuses };
    }
    this._filterContactRequest(query);
    await this.addQueryCompanyFiltering(query);
    this.logger.debug(`User ${this.user.email} retrieved the requests list`);
    query.sort = _.get(query, 'sort', '-receptionDate');
    try {
      const pipeline = this._getListQueryPipeline();

      // Fix timeSince sorting, timeSince is special and it's not whitelisted
      if (typeof query.sort === 'string' && query.sort.match(/timeSinceText/)) {
        query.sort = query.sort.replace('timeSinceText', 'timeSince');
      }

      const extraQueryParams = this._getListAndExportQueryParams();

      this.logger.debug(`Making main requests query for user: (${this.user.email}`);
      let columnOptions = [];
      const userIsContact = this.user.type === CONTACT;
      const canOnlyReadOwnRequest = this.user.has(['REQUEST_READ_OWN', 'REQUEST_READ_COMPANY'])
        && !this.user.has('REQUEST_READ_ALL');
      if (userIsContact && canOnlyReadOwnRequest) {
        columnOptions = _.get(filters, 'columnOptions', this.schema.Request.getContactExportOptions());
      } else {
        columnOptions = _.get(filters, 'columnOptions', this.schema.Request.getExportOptions());
      }
      const writer = csvWriter(columnOptions);
      const supportsIpQuoting = _.get(this.user, 'lsp.supportsIpQuoting', false);
      const csvFileName = CsvExport.buildProperFilename(
        query,
        this.requestReadModel,
        supportsIpQuoting ? 'orders' : 'requests',
      );
      const requestHeaders = {
        'Content-Type': 'text/csv',
        'Content-disposition': `attachment;filename=${csvFileName}.csv`,
      };

      res.writeHead(200, requestHeaders);
      writer.pipe(res);
      const cursor = await exportFactory(this.schema.Request, query, pipeline, extraQueryParams);
      await cursor.eachAsync(async (doc) => {
        const row = createRequestRow(doc);
        return writer.write(row);
      });
      return res.end();
    } catch (e) {
      if (e instanceof RestError) {
        throw e;
      }
      this.logger.error(`Error populating and filtering requests. Error: ${e}`);
      throw new RestError(500, { message: 'Error retrieving request', stack: e.stack });
    }
  }

  _getListAndExportQueryParams() {
    return [
      'companyName',
      'contactName',
      'contactEmail',
      'statusName',
      'schedulingStatusName',
      'locationName',
      'insuranceCompanyName',
      'internalDepartmentName',
      'pmNames',
      'partnerNames',
      'lateText',
      'poRequiredText',
      'rushText',
      'complaintText',
      'assignmentStatusName',
      'departmentNotes',
      'schedulingCompanyName',
      'schedulingContactName',
      'languageCombinationsText',
      'finalDocs',
      'timeSinceText',
      'quoteRequiredText',
      'invoiceCompanyName',
      'invoiceContactName',
      'otherContactName',
      'companyHierarchy',
    ];
  }

  _getListQueryPipeline() {
    const pipeline = [
      {
        $addFields: {
          finalDocs: {
            $reduce: {
              input: {
                $filter: {
                  input: '$finalDocuments',
                  as: 'doc',
                  cond: { $eq: ['$$doc.final', true] },
                },
              },
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: ['$$value', ''],
                  },
                  then: { $concat: ['$$value', '$$this.name'] },
                  else: { $concat: ['$$value', ', ', '$$this.name'] },
                },
              },
            },
          },
          targetLangs: {
            $reduce: {
              input: '$tgtLangs',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$tgtLangs', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this.name'] },
                  else: { $concat: ['$$value', ', ', '$$this.name'] },
                },
              },
            },
          },
          pmNames: {
            $reduce: {
              input: '$projectManagers',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$projectManagers', '$$this'] }, 0],
                  },
                  then: {
                    $concat: [
                      '$$value',
                      '$$this.firstName',
                      ' ',
                      '$$this.lastName',
                    ],
                  },
                  else: {
                    $concat: [
                      '$$value',
                      ', ',
                      '$$this.firstName',
                      ' ',
                      '$$this.lastName',
                    ],
                  },
                },
              },
            },
          },
          partnerNames: {
            $reduce: {
              input: '$partners',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$partners', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this.name'] },
                  else: { $concat: ['$$value', ', ', '$$this.name'] },
                },
              },
            },
          },
          schedulingStatusName: '$schedulingStatus.name',
          locationName: '$location.name',
          companyHierarchy: '$company.hierarchy',
          insuranceCompanyName: '$insuranceCompany.name',
          internalDepartmentName: '$internalDepartment.name',
        },
      },
      {
        $addFields: {
          rushText: {
            $toString: '$rush',
          },
          lateText: {
            $toString: '$late',
          },
          complaintText: {
            $toString: '$complaint',
          },
          poRequiredText: {
            $toString: '$poRequired',
          },
          assignmentStatusName: '$assignmentStatus.name',
          schedulingCompanyName: '$schedulingCompany.name',
          schedulingContactName: {
            $concat: [
              '$schedulingContact.firstName',
              ' ',
              '$schedulingContact.lastName',
            ],
          },
          companyName: '$company.name',
          companyId: '$company._id',
          contactName: {
            $concat: ['$contact.firstName', ' ', '$contact.lastName'],
          },
          invoiceCompanyName: '$invoiceCompany.name',
          invoiceContactName: {
            $concat: ['$invoiceContact.firstName', ' ', '$invoiceContact.lastName'],
          },
          otherContactName: {
            $concat: ['$otherContact.firstName', ' ', '$otherContact.lastName'],
          },
          contactEmail: '$contact.email',
          timeSince: {
            $subtract: [new Date(), { $toDate: '$deliveryDate' }],
          },
        },
      },
      {
        $addFields: {
          flagDiff: {
            $cond: {
              if: {
                $gt: ['$timeSince', 0],
              },
              then: 'True',
              else: 'False',
            },
          },
          weeksDiff: {
            $abs: {
              $trunc: {
                $divide: ['$timeSince', 7 * 24 * 60 * 60 * 1000],
              },
            },
          },
          daysDiff: {
            $abs: {
              $trunc: {
                $mod: [{ $divide: ['$timeSince', 24 * 60 * 60 * 1000] }, 7],
              },
            },
          },
          hoursDiff: {
            $abs: {
              $trunc: {
                $mod: [{ $divide: ['$timeSince', 60 * 60 * 1000] }, 24],
              },
            },
          },
          minutesDiff: {
            $abs: {
              $trunc: {
                $mod: [{ $divide: ['$timeSince', 60 * 1000] }, 60],
              },
            },
          },
        },
      },
      {
        $addFields: {
          timeSinceTimestamp: {
            $concat: [
              ' - ',
              { $substr: ['$weeksDiff', 0, -1] },
              'w ',
              { $substr: ['$daysDiff', 0, -1] },
              'd ',
              { $substr: ['$hoursDiff', 0, -1] },
              'h ',
              { $substr: ['$minutesDiff', 0, -1] },
              'm',
            ],
          },
        },
      },
      {
        $addFields: {
          timeSinceText: {
            $concat: ['$flagDiff', '$timeSinceTimestamp'],
          },
          quoteRequiredText: {
            $toString: '$requireQuotation',
          },
        },
      },
      {
        $addFields: {
          timeSinceText: {
            $cond: {
              if: {
                $eq: ['$statusName', 'Completed'],
              },
              then: 'False',
              else: '$timeSinceText',
            },
          },
          timeSince: {
            $cond: {
              if: {
                $eq: ['$statusName', 'Completed'],
              },
              then: 0,
              else: '$timeSince',
            },
          },
        },
      },
      {
        $project: this.buildQueryProjectionBasedOnUserRoles(),
      },
    ];
    return pipeline;
  }

  async listAllRequestsForUser(user) {
    // this method is being called by list quotes
    this.logger.debug(`Getting requests for user: ${user.email}`);
    const query = { lspId: this.lspId };

    await this.addQueryCompanyFiltering(query);
    this.logger.debug(`User ${user.email} retrieved the requests list`);
    let requestsList;

    try {
      requestsList = await this.schema.Request.find(query).sort({ receptionDate: -1 });
    } catch (e) {
      const message = e.message || e;
      this.logger.error(`Error populating and filtering requests. Error: ${message}`);
      throw new RestError(500, { message: 'Error retrieving request', stack: e.stack });
    }
    return {
      list: requestsList,
      total: requestsList.length,
    };
  }

  _addCollation(filters) {
    const FIELDS_THAT_SHOULD_USE_COLLATION = ['status'];
    let collation = {};

    try {
      let filtersApplied = _.get(filters, 'paginationParams.filter', {});

      if (!_.isObject(filtersApplied)) {
        filtersApplied = JSON.parse(filtersApplied);
      }
      if (FIELDS_THAT_SHOULD_USE_COLLATION.some((field) => _.has(filtersApplied, field))) {
        collation = _.clone(filters.locale);
        delete filters.locale;
      } else {
        collation = {
          locale: 'simple',
        };
      }
      return collation;
    } catch (error) {
      return {};
    }
  }

  async addQueryCompanyFiltering(query) {
    const { company } = this.user;
    const canRead = this.user.has([
      'REQUEST_READ_COMPANY',
      'REQUEST_READ_ALL',
      'REQUEST_READ_OWN',
      'REQUEST_READ_ASSIGNED-TASK',
    ]);

    if (!canRead) {
      this.logger.debug(`User (${this.user.email} can't access requests`);
      throw new RestError(403, { message: 'You have not privileges to access this resource' });
    }
    const contactQuery = { 'contact._id': new ObjectId(this.user._id) };

    if (!this.user.has('REQUEST_READ_ALL')) {
      if (!_.isNil(company)) {
        let subCompanies;
        if (this.user.has(['REQUEST_READ_COMPANY'])) {
          subCompanies = await this.schema.Company.find({
            $or: [
              { _id: new ObjectId(company._id) },
              { 'parentCompany._id': new ObjectId(company._id) },
              { 'parentCompany.parentCompany._id': new ObjectId(company._id) },
              { 'parentCompany.parentCompany.parentCompany._id': new ObjectId(company._id) },
            ],
          }, { _id: 1 });
          const subCompanyQuery = {
            'company._id': { $in: subCompanies.map((c) => c._id) },
          };
          if (this.user.has('REQUEST_READ_OWN')) {
            Object.assign(query, {
              $or: [subCompanyQuery, contactQuery],
            });
          } else {
            Object.assign(query, subCompanyQuery);
          }
        } else if (this.user.has('TASK_READ_OWN')) {
          Object.assign(query, {
            'workflows.tasks.providerTasks.provider._id': new ObjectId(this.user._id),
          });
        } else {
          this.logger.debug(`Filtering requests by contact (${this.user.email}`);
          Object.assign(query, contactQuery);
        }
      }
    }
  }

  async list(filters = {}) {
    const paginationFilters = parsePaginationFilter(_.get(filters, 'paginationParams.filter', {}));

    if (!_.isEmpty(paginationFilters.status)) {
      filters.statuses = REQUEST_STATUSES
        .filter((status) => status.toLowerCase() === paginationFilters.status.toLowerCase());
    }
    const collation = this._addCollation(filters);
    const query = {

      lspId: this.lspId,
      ..._.get(filters, 'paginationParams', {}),
    };

    if (filters.statuses && filters.statuses.length) {
      this.logger.debug(
        `Filtering requests by status for user (${this.user.email})`,
      );
      query.status = { $in: filters.statuses };
    }
    this._filterContactRequest(query);
    const opportunityNoFilter = _.get(query, 'filter.opportunityNo', '');

    if (opportunityNoFilter === 'NA') {
      delete query.filter.opportunityNo;
      query.opportunityNo = null;
    }
    await this.addQueryCompanyFiltering(query);
    this.logger.debug(`User ${this.user.email} retrieved the requests list`);
    query.sort = _.get(query, 'sort', '-createdAt');
    let requestsList;

    try {
      const pipeline = this._getListQueryPipeline();
      this.logger.debug(`Requests pipeline ${JSON.stringify(pipeline)}`);
      // Fix timeSince sorting, timeSince is special and it's not whitelisted
      if (typeof query.sort === 'string' && query.sort.match(/timeSinceText/)) {
        query.sort = query.sort.replace('timeSinceText', 'timeSince');
      }

      const extraQueryParams = this._getListAndExportQueryParams();

      this.logger.debug(`Making main requests query for user: (${this.user.email}`);
      requestsList = await searchFactory({
        model: this.requestReadModel,
        filters: query,
        extraPipelines: pipeline,
        extraQueryParams,
        collation,
      });
      requestsList = requestsList.map((r) => {
        REQUEST_FINANCIAL_FIELDS.forEach((field) => {
          _.set(r, field, decimal128ToNumber(_.get(r, field, 0)));
        });
        return r;
      });
    } catch (e) {
      const message = e.message || e;

      this.logger.error(`Error populating and filtering requests. Error: ${message}`);
      throw new RestError(500, { message: 'Error retrieving request', stack: e.stack });
    }
    return {
      list: requestsList,
      total: requestsList.length,
    };
  }

  _filterContactRequest(query) {
    if (this.user.type === CONTACT && this.user.has(['QUOTE_READ_OWN', 'QUOTE_UPDATE_OWN'])) {
      const nonQuoteRequestQuery = {
        $nin: ['Waiting for approval', 'Waiting for Quote'],
      };
      if (_.isNil(query.status)) {
        query.status = {};
      }
      Object.assign(query.status, nonQuoteRequestQuery);
    }
  }

  /**
   * Returns true if user is part of the request, meaning
   * if user email matches Also deliver to, is Contact, is Sales rep, is a pm for the request
   * @param {Object} request request to inspect
   */
  _isUserPartOfRequest(request) {
    const projectManagers = _.get(request, 'projectManagers', []);
    const contactId = _.get(request, 'contact._id', '');
    const otherContactId = _.get(request, 'otherContact._id', '');
    const salesRepId = _.get(request, 'salesRep._id', '');
    // Check if user is part of the request somehow
    const isRequestPm = projectManagers.some(
      (pm) => pm._id.toString() === this.user._id.toString(),
    );
    const isOtherContact = otherContactId.toString() === this.user._id.toString();
    const isRequestContact = contactId.toString() === this.user._id.toString();
    const isSalesRep = salesRepId.toString() === this.user._id.toString();
    return isRequestContact || isRequestPm || isSalesRep || isOtherContact;
  }

  async _formatWorkflows(request, withCATData) {
    const canContactReadWorkflow = this.user.type === CONTACT
      && VALID_CONTACT_READ_WORKFLOW_ROLES.some(((role) => this.user.has(role)));
    if (!canContactReadWorkflow && !this.user.has('WORKFLOW_READ_ALL') && !this.user.has('WORKFLOW_READ_OWN')) {
      request.workflows = undefined;
    } else if (!canContactReadWorkflow && !this.user.has('WORKFLOW_READ_ALL') && !this.user.has('QUOTE_READ_COMPANY')) {
      request.workflows = request.workflows.filter((w) => w.tasks.some((t) => t.providerTasks.some((p) => areObjectIdsEqual(_.get(p, 'provider._id', ''), this.user._id))));
    }
    if (_.isEmpty(request.workflows)) {
      return;
    }
    if (!this.user.has('TASK-FINANCIAL_READ_ALL')) {
      forEachProviderTask(request, ({ task, providerTask }) => {
        if (_.has(task, 'invoiceDetails')) {
          _.unset(task, 'invoiceDetails');
        }
        const isOwnTask = areObjectIdsEqual(
          _.get(providerTask, 'provider._id'),
          this.user._id,
        );
        if (_.has(providerTask, 'billDetails') && (!this.user.has('TASK-FINANCIAL_READ_OWN') || !isOwnTask)) {
          _.unset(providerTask, 'billDetails');
        }
      });
    }
    request.workflows = await Promise.mapSeries(
      request.workflows,
      (workflow) => this.removeRegulatoryFieldsFromWorkflow(workflow),
    );
    if (withCATData && requestAPIHelper.isPortalCat(request)) {
      await Promise.map(
        request.workflows,
        (workflow) => this.workflowApi.populateWorkflowWithCATData(workflow, request),
      );
    }
  }

  async findOne(_id, customProjection, withCATData = false) {
    const query = { _id: new ObjectId(_id), lspId: this.lspId };
    const canReadAll = this.user.has('REQUEST_READ_ALL');
    const canOnlyReadOwnRequest = this.user.has('REQUEST_READ_OWN') && this.user.has('REQUEST_READ_COMPANY')
      && !canReadAll;
    await this.addQueryCompanyFiltering(query);
    this.logger.debug(`User ${this.user.email} retrieved a request`);
    let projection = '-bucketPrefixes';
    const userIsContact = this.user.type === CONTACT;
    let hiddenFields = [
      '-bucketPrefixes',
      'expectedStartDate',
      'actualStartDate',
      'actualDeliveryDate',
      'internalDepartment',
      'partners',
      'insuranceCompany',
      'recipient',
      'rooms',
      'atendees',
      'expectedDurationTime',
      'schedulingCompany',
      'schedulingContact',
      'schedulingStatus',
      'opportunityNo',
    ];

    if (!this.user.has('TASK-FINANCIAL_READ_ALL')) {
      hiddenFields = hiddenFields.concat(REQUEST_FINANCIAL_FIELDS);
    }
    if ((canOnlyReadOwnRequest && userIsContact)
      || (this.user.has('REQUEST_READ_ASSIGNED-TASK') && !canReadAll && !this.user.has('REQUEST_READ_OWN'))) {
      if (userIsContact) {
        hiddenFields.push('internalComments', 'location');
        const canReadStatistics = this.user.has(['STATISTICS_READ_OWN', 'STATISTICS_READ_COMPANY', 'STATISTICS_READ_ALL']);
        if (!canReadStatistics) {
          hiddenFields.push('catTool');
        }
      } else {
        hiddenFields = hiddenFields.concat([
          'late',
          'rush',
          'requireQuotation',
          'poRequired',
          'purchaseOrder',
          'targetDate',
          'otherCC',
          'otherContact',
          'salesRep',
          'deliveryDate',
          'adjuster',
          'departmentNotes',
          'assignmentStatus',
          'memo',
        ]);
      }

      projection = hiddenFields.join(' -');
    }
    if (!_.isNil(customProjection)) {
      projection = customProjection;
    }
    const populateFields = [
      {
        path: 'company._id workflows.tasks.providerTasks.offer',
        select: 'mandatoryRequestContact _id status isActive currentRound',
        options: { withDeleted: true },
      },
      { path: 'company.pcSettings.lockedSegments.segmentsToLock', select: 'name' },
    ];
    let request = await this.schema.Request.findOne(query).populate(populateFields)
      .select(projection).exec();
    // WORKFLOW_READ_OWN and READ_ALL restriction
    // Filter workflows that have at least one provider task that belongs to the loggedin user
    if (!_.isNull(request)) {
      request = request.toJSON();
      const populatedCompany = _.get(request.company, '_id', false);
      const { _id: id, mandatoryRequestContact } = populatedCompany;
      let notes = '';
      let isMandatoryExternalAccountingCode = false;
      if (canReadAll) {
        const company = await this.schema.Company.findOne({
          _id: new ObjectId(id),
          lspId: this.lspId,
        }, 'notes isMandatoryExternalAccountingCode')
          .lean();
        notes = !_.isEmpty(company.notes) ? requestAPIHelper.extractPlainText(company.notes) : '';
        isMandatoryExternalAccountingCode = company.isMandatoryExternalAccountingCode;
      }
      Object.assign(request.company, {
        mandatoryRequestContact,
        _id: id,
        notes,
        isMandatoryExternalAccountingCode,
      });
      request.readDate = request.updatedAt;
      await this._formatWorkflows(request, withCATData);
      return request;
    }
    throw new RestError(404, { message: `Request ${_id} not found` });
  }

  async removeNonAllowedFields(request) {
    if (this.user.is(CONTACT)
      && !this.user.has('CONTACT-WORKFLOW_READ_COMPANY')
      && !this.user.has('REQUEST_READ_ASSIGNED-TASK')
      && _.get(this.user, 'email') !== _.get(request, 'contact.email')) {
      request.workflows = [];
    }
    if (!this.user.has('TASK-FINANCIAL_READ_ALL')) {
      request = _.omit(request, REQUEST_FINANCIAL_FIELDS);
    }
    if (request.workflowType !== AUTO_TRANSLATE_WORKFLOW_TYPE) {
      request.languageCombinations = request.languageCombinations.map((l) => {
        l.documents = l.documents.map((d) => _.omit(d, 'isTranslated'));
        return l;
      });
    }
    const canReadExpectedQuoteCloseDate = ['REQUEST_READ_ALL', 'REQUEST_CREATE_ALL', 'REQUEST_UPDATE_ALL'].some((r) => this.user.has(r));
    if (!canReadExpectedQuoteCloseDate) {
      request = _.omit(request, ['expectedQuoteCloseDate']);
    }
    if (!_.isEmpty(request.workflows)) {
      await Promise.map(request.workflows, (workflow) => this.removeNonAllowedFieldsFromWorkflow(workflow));
    }
    return request;
  }

  async removeNonAllowedFieldsFromWorkflow(workflow) {
    workflow.tasks = await Promise.map(workflow.tasks, (task) => {
      if (!this.canReadAllTaskFinancial) {
        task = _.omit(task, TASK_FINANCIAL_FIELDS);
        task.providerTasks = task.providerTasks.map((providerTask) => {
          const isOwnTask = areObjectIdsEqual(_.get(providerTask, 'provider._id'), this.user._id);
          if (this.canReadOwnTaskFinancial && isOwnTask) {
            return providerTask;
          }
          return _.omit(providerTask, PROVIDER_TASK_FINANCIAL_FIELDS);
        });
      }
      if (!this.canHaveDescription) {
        task = _.omit(task, ['description']);
      }
      return task;
    });
  }

  async findOneWithWorkflows(requestId, { withCATData = false } = {}) {
    const request = await this.findOne(requestId, null, withCATData);
    await this.removeNonAllowedFields(request);
    return request;
  }

  _validateExpectedQuoteCloseDate(request) {
    const quoteDueDate = _.get(request, 'quoteDueDate');
    const expectedQuoteCloseDate = _.get(request, 'expectedQuoteCloseDate');
    return quoteDueDate && expectedQuoteCloseDate
      && moment(expectedQuoteCloseDate).isBefore(moment(quoteDueDate));
  }

  _checkCompany(companyId, creation = true) {
    this.logger.debug(`Checking that ${this.user.email} can view company: ${companyId}`);
    return this.schema.Company.findOne({
      _id: new ObjectId(companyId),
      lspId: this.lspId,
    }, 'cidr name hierarchy billingInformation.quoteCurrency status internalDepartments deleted availableTimeToDeliver mtSettings pcSettings.mtThreshold pcSettings.lockedSegments')
      .lean()
      .then((company) => {
        if (!company) {
          this.logger.info(`Company ${companyId} does not exist or is inactive`);
          throw new RestError(400, { message: `Company ${companyId} does not exist or is inactive` });
        }
        // If user has TASK_UPDATE_OWN, they can update the request because
        // it is related to a workflow
        if (_.has(company, 'billingInformation.quoteCurrency._id')) {
          company.quoteCurrency = company.billingInformation.quoteCurrency._id;
        }
        if (this.user.has('TASK_UPDATE_OWN')) {
          return company;
        }
        let mandatoryRoles;

        if (creation) {
          mandatoryRoles = ['REQUEST_CREATE_ALL', 'REQUEST_CREATE_COMPANY', 'REQUEST_CREATE_OWN'];
        } else {
          mandatoryRoles = ['REQUEST_UPDATE_ALL', 'REQUEST_UPDATE_COMPANY', 'REQUEST_UPDATE_OWN'];
        }

        if (mandatoryRoles.some((role) => !this.user.has(role))
          && !requestAPIHelper._isCompanyOnHierarchy(this.user, company)
        ) {
          this.logger.info(`User ${this.user.email} cannot access the company ${companyId}`);
          throw new RestError(403, {
            message: `The user cannot ${creation ? 'create' : 'update'} a request on behalf of the given contact`,
          });
        }
        return company;
      });
  }

  _validateContact(contactId, populate, previous) {
    if (!contactId) {
      return;
    }
    const { lspId } = this;
    const population = [
      {
        path: 'company',
        select: companyDefaultPopulate,
      },
    ];

    if (populate) {
      pushPopulates(populate, population);
    }
    return this.schema.User.findOneAndPopulate(
      {
        _id: contactId,
        lsp: lspId,
      },
      population,
      requestContactSelect(),
    ).then((contact) => {
      if (!contact) {
        this.logger.info(`Contact ${contactId} does not exist`);
        throw new RestError(400, {
          message: `Contact ${contactId} does not exist`,
        });
      }
      if (contact.terminated && (!previous || !areObjectIdsEqual(previous._id, contactId))) {
        throw new RestError(400, { message: `Contact ${contactId} is terminated` });
      }
      return contact;
    });
  }

  _validateStatusChange(originalRequest, newRequest) {
    const originalStatus = _.get(originalRequest, 'status');
    const newStatus = _.get(newRequest, 'status', originalStatus);
    const isQuoteApproved = _.get(originalRequest, 'isQuoteApproved');
    const requireQuotation = _.get(newRequest, 'requireQuotation');
    const originalStatusIsWaitingStatus = REQUEST_WAITING_STATUSES.includes(originalStatus);
    const newStatusIsWaitingStatus = REQUEST_WAITING_STATUSES.includes(newStatus);
    let error = null;
    if (
      originalStatusIsWaitingStatus
      && !(newStatusIsWaitingStatus || newStatus === REQUEST_CANCELLED_STATUS)
    ) {
      error = 'Status cannot be updated before the quote is Approved or Cancelled';
    } else if (
      originalStatus === REQUEST_CANCELLED_STATUS
      && newStatus !== REQUEST_CANCELLED_STATUS
    ) {
      error = 'Status cannot be updated once the quote is Cancelled';
    } else if (
      [REQUEST_TO_BE_PROCESSED_STATUS, REQUEST_ON_HOLD_STATUS].includes(originalStatus)
      && newStatusIsWaitingStatus
    ) {
      if (!requireQuotation) {
        error = 'This status is only eligible for quotes';
      } else if (isQuoteApproved) {
        error = 'Status cannot be updated after the quote is Approved or Cancelled';
      }
    } else if (
      [REQUEST_IN_PROGRESS_STATUS, REQUEST_DELIVERED_STATUS].includes(originalStatus)
      && (newStatusIsWaitingStatus || newStatus === REQUEST_TO_BE_PROCESSED_STATUS)
    ) {
      const status = originalStatus === REQUEST_IN_PROGRESS_STATUS ? 'In Progress' : 'Delivered';
      error = `Status cannot be selected once the request is ${status}`;
    } else if (REQUEST_COMPLETED_STATUS === originalRequest && originalRequest !== newRequest) {
      error = 'Status cannot be updated once the request is Completed';
    }
    if (!_.isNil(originalRequest.deliveredAt) && newStatus === REQUEST_IN_PROGRESS_STATUS) {
      error = 'Status cannot be selected once the request was delivered';
    }
    if (!_.isNull(error)) {
      throw new RestError(400, {
        message: error,
      });
    }
  }

  async _validateProjectManagers(request) {
    if (!_.isEmpty(request.projectManagers)) {
      const len = request.projectManagers.length;
      let pmsIds;

      try {
        pmsIds = request.projectManagers.map((p) => new ObjectId(_.get(p, '_id', p)));
      } catch (e) {
        const message = e.message || e;

        this.logger.info(`Bad project manager provided: ${message}`);
        throw new RestError(400, {
          message: 'Invalid project manager provided',
        });
      }
      const pms = await this.schema.User.findWithDeleted({
        lsp: this.lspId,
        _id: { $in: pmsIds },
      }).select(contactSelect());

      if (pms.length !== len) {
        const given = pmsIds.map((p) => p.toString()).join(', ');
        const found = pms.map((p) => p._id.toString()).join(', ');

        this.logger.info(
          `Some project managers were not found. Given "${given}", found "${found}"`,
        );
        throw new RestError(400, {
          message: "Some project managers don't exist",
        });
      }
      this.logger.debug('Successful project managers validation');
      request.projectManagers = pms;
    }
  }

  async _validateContacts(request, dbRequest) {
    const roles = rolesUtils.getRoles(this.user);
    let isUpdate = false;

    if (dbRequest) {
      isUpdate = true;
    }
    const action = isUpdate ? 'update' : 'create';
    let isSameOrParentCompany = false;

    if (isUpdate) {
      // Check if the company, the contact and the other contact
      // are on the same hierarchy of company
      isSameOrParentCompany = await requestAPIHelper.isAnAuthorizedContact(
        roles,
        this.user,
        request,
        this.schema,
        this.logger,
      );
    }
    const operatesOnBehalf = requestAPIHelper.canOperateOnBehalf(
      isUpdate,
      roles,
    );
    const operateOtherCompany = requestAPIHelper.canOperateWithOtherCompany(
      roles,
      VALID_COMPANY_REQUEST_EDITION_ROLES,
    );
    let otherContact = null;

    if (_.isEmpty(_.get(request, 'contact')) && !operatesOnBehalf) {
      request.contact = this.user._id;
    }
    if (!_.isEmpty(_.get(request, 'contact'))) {
      if (!isSameOrParentCompany && !areObjectIdsEqual(request.contact, this.user._id)) {
        if (!operatesOnBehalf) {
          throw new RestError(403, {
            message: `Cannot ${action} request on behalf of other users`,
          });
        }
        const contactProjectManagers = {
          path: 'projectManagers',
          select: contactSelect(),
          options: { withDeleted: true },
        };
        const contact = await this._validateContact(
          request.contact,
          contactProjectManagers,
          _.get(dbRequest, 'contact'),
        );

        if (!contact) {
          throw new RestError(400, {
            message: `Contact ${request.contact} does not exist`,
          });
        }
        if (!isUpdate && contact.projectManagers) {
          this.logger.info('Setting default project managers');
          request.projectManagers = contact.projectManagers;
        }
        if (contact.type !== CONTACT) {
          throw new RestError(400, { message: 'The given contact is not a contact' });
        }
        if (!contact || !contact.company) {
          this.logger.error(`User ${request.contact} is not a contact or has no company`);
          throw new RestError(400, { message: 'Contact provider is not a contact' });
        }
        if (
          !operateOtherCompany
          && !requestAPIHelper._isCompanyOnHierarchy(contact.company)
        ) {
          this.logger.info(`User ${this.user.email} has no access to use contact ${contact._id}`);
          throw new RestError(403, { message: `Cannot ${action} request on behalf of other users` });
        }
        request.contact = contact;
      } else {
        request.contact = await this.schema.User.findOneWithDeleted({
          _id: this.user._id,
        }).populate([
          {
            path: 'projectManagers',
            select: contactWithProjectManagerSelect(),
            options: { withDeleted: true },
          },
        ]);
        if (request.contact) {
          if (!isUpdate && request.contact && request.contact.projectManagers) {
            this.logger.info('Setting default project managers');
            request.projectManagers = request.contact.projectManagers;
          }
        }
      }
    }
    if (request.otherContact) {
      otherContact = await this._validateContact(
        request.otherContact,
        null,
        _.get(dbRequest, 'otherContact'),
      );
      if (otherContact.type !== CONTACT) {
        this.logger.error(`User ${request.otherContact} is not a contact`);
        throw new RestError(400, {
          message: 'The given other contact is not a contact',
        });
      }
      // check if additional contact is in the same hierarchy than the
      // given company.
      if (
        !isSameOrParentCompany
        && !operateOtherCompany
        && !requestAPIHelper._isCompanyOnHierarchy(this.user, otherContact.company)
      ) {
        this.logger.info(`User ${this.user.email} has no access to use contact ${otherContact._id}`);
        throw new RestError(403, { message: "Cannot bind to other contact which don't have access to" });
      }
    }
    request.otherContact = _.pick(
      otherContact,
      ['_id', 'email', 'firstName', 'lastName', 'middleName', 'deleted', 'terminated'],
    );
    return request;
  }

  async saveRequest(dbRequest, options) {
    const companyId = _.get(dbRequest, 'company._id', dbRequest.company);
    try {
      await dbRequest.save(options);
      if (requestAPIHelper.isPortalCat(dbRequest)) {
        await Promise.map(
          _.defaultTo(dbRequest.languageCombinations, []),
          (languageCombination) => this.portalCatApi.ensureTm({
            languageCombination, companyId,
          }),
        );
      }
    } catch (err) {
      this.logger.error(`Error saving request ${dbRequest.no}. Error: ${err}`);
      throw new RestError(500, {
        message: `Error saving request ${dbRequest.no}`,
        stack: _.get(err, 'stack', err.message),
      });
    }
    return dbRequest.toObject();
  }

  checkForLanguageCombination(request, requestType) {
    const isRequestTypeIp = requestType === REQUEST_TYPE_IP_NAME;
    if (!isRequestTypeIp && _.isEmpty(request.languageCombinations)) {
      this.logger.error(`No Language Combination provided for request ${request._id}`);
      throw new RestError(400, { message: 'At least one Language Combination must be provided' });
    }
  }

  async create(newTranslationRequest) {
    const requestType = _.get(newTranslationRequest, 'requestType.name');
    const isRequestTypeIp = requestType === REQUEST_TYPE_IP_NAME;
    if (newTranslationRequest.mockPm) {
      const [internal, competence] = await Promise.all([
        this.schema.InternalDepartment.findOne({ name: 'NA' }),
        this.schema.CompetenceLevel.findOne({ name: 'NA' }),
      ]);
      newTranslationRequest.internalDepartment = { _id: internal._id, name: internal.name };
      newTranslationRequest.competenceLevels = [{ _id: competence._id, name: competence.name }];
    }
    // prevent _id injection
    delete newTranslationRequest._id;
    const { lspId } = this;
    const userIsContact = this.user.type === CONTACT;
    const canUseAnyCompany = this.user.has(['REQUEST_CREATE_COMPANY', 'REQUEST_CREATE_ALL']);

    if (userIsContact && !canUseAnyCompany) {
      newTranslationRequest.company = _.get(this, 'user.company._id');
    }
    this.checkForLanguageCombination(newTranslationRequest, requestType);
    this._validateExpectedQuoteCloseDate(newTranslationRequest);
    if (!newTranslationRequest.company) {
      this.logger.info('No company provided');
      throw new RestError(400, { message: 'Company must be provided' });
    }
    this.logger.debug(`Checking company ${newTranslationRequest.company}`);
    const company = await this._checkCompany(newTranslationRequest.company);
    const includeInClientStatistics = _.get(company, 'pcSettings.lockedSegments.includeInClientStatistics', false);
    const includeInProviderStatistics = _.get(company, 'pcSettings.lockedSegments.includeInProviderStatistics', false);
    newTranslationRequest.pcSettings = {
      lockedSegments: {
        includeInClientStatistics,
        includeInProviderStatistics,
      },
    };

    // TODO check if additional contact is in the same hierarchy than the
    // given company.
    this.logger.debug('Validating request contact and other contact');
    await this._validateContacts(newTranslationRequest, null);
    this.logger.debug('Validating project managers');
    await this._validateProjectManagers(newTranslationRequest);
    let status = '';
    if (isRequestTypeIp) {
      status = newTranslationRequest.status;
      const internalDepartment = await this.schema.InternalDepartment.findOne({
        name: IP_INTERNAL_DEPARTMENT_NAME,
      }).lean();
      if (!_.isNil(internalDepartment)) {
        newTranslationRequest.internalDepartment = {
          _id: internalDepartment._id, name: internalDepartment.name,
        };
      }
    } else {
      status = newTranslationRequest.requireQuotation ? 'Waiting for Quote' : 'To be processed';
    }
    const lspLocalCurrency = this.user.lsp.currencyExchangeDetails.find((e) => _.get(e, 'base._id', e.base).toString()
      === _.get(e, 'quote._id', e.quote).toString()
      && e.quotation === 1);
    const lspLocalCurrencyDb = await this.schema.Currency.findOne({
      _id: new ObjectId(lspLocalCurrency.base._id),
    }).lean();
    let companyCurrency = newTranslationRequest.quoteCurrency;

    if (_.isNil(companyCurrency)) {
      companyCurrency = await this.schema.Currency.findOne({
        _id: new ObjectId(company.quoteCurrency),
      }).lean();
    }

    const availableTimeToDeliver = _.get(company, 'availableTimeToDeliver', []);
    newTranslationRequest.hasTimeToDeliverOptions = availableTimeToDeliver.length > 0;

    this.logger.debug(`Request will be created with status ${status}`);
    newTranslationRequest.quoteCurrency = _.pick(companyCurrency, ['_id', 'name', 'isoCode', 'symbol']);
    let isMocked = (this.isTestingUser() || this.mockFlag) && this.environmentName !== 'PROD';
    if (!this.mock) {
      isMocked = false;
    }
    const newRequestProspect = requestAPIHelper._prospectToSchema(
      newTranslationRequest,
      {
        lspId,
        company,
        receptionDate: moment().utc().toDate(),
        isMocked,
        contact: _.get(newTranslationRequest, 'contact', this.user._id),
        status,
        localCurrency: _.pick(lspLocalCurrencyDb, ['_id', 'name', 'isoCode']),
      },
    );

    newRequestProspect.exchangeRate = await this.schema.Request.getExchangeRate(
      newRequestProspect,
    );
    const newRequest = new this.schema.Request(newRequestProspect);
    const serverTime = new MockableMoment(this.mockServerTime).getDateObject();
    newRequest.mockServerTime(serverTime);
    let newRequestCreated = null;

    try {
      this.logger.info('Creating new request');
      newRequestCreated = await newRequest.save();
      if (requestAPIHelper.isPortalCat(newRequestCreated)) {
        await Promise.map(
          _.defaultTo(newRequest.languageCombinations, []),
          (languageCombination) => this.portalCatApi.ensureTm({
            languageCombination, companyId: company,
          }),
        );
      }
    } catch (e) {
      this.logger.error(`Error creating request. Error: ${e.message}`);
      if (e instanceof RestError) {
        throw e;
      }
      throw new RestError(500, { message: `Error creating translation request: ${e.message}` });
    }
    this.logger.info('Successfully created new request');
    const fullRequest = requestAPIHelper._prospectToSchema(
      newTranslationRequest,
      {
        _id: newRequest._id,
        no: newRequestCreated.no,
        lspId,
        company,
        contact: newTranslationRequest.contact,
        status,
      },
      true,
    );

    this.sendRequestCreationEmails(fullRequest, newTranslationRequest);
    if (this.user.lsp.name === 'BIG IP') {
      this.sendCustomizedQuoteNotification(newRequestCreated, requestType);
    }
    // the newyly created request should have populated fields
    newRequestCreated.company = company;
    if (this.user.type === CONTACT) {
      const userPreferredLangs = _.get(this, 'user.preferences.preferredLanguageCombination', {});
      const requestPreferredLangs = _.find(
        newTranslationRequest.languageCombinations,
        (lc) => lc.preferredLanguageCombination,
      );
      const hasPreferredLangsChanged = !_.isEqual(userPreferredLangs, requestPreferredLangs);

      if ((!_.isEmpty(_.defaultTo(requestPreferredLangs, {})) && hasPreferredLangsChanged)) {
        await this.schema.User.updateOne({
          _id: new ObjectId(this.user._id),
        }, {
          $set: {
            'preferences.preferredLanguageCombination': _.omit(requestPreferredLangs, ['documents', 'preferredLanguageCombination']),
          },
        });
      }
    }
    const populatedRequest = await this.findOne(newRequestCreated._id);
    return populatedRequest;
  }

  removeNonEditableFields(request) {
    const canOnlyReadOwnRequest = this.user.has(['REQUEST_READ_OWN', 'REQUEST_READ_COMPANY'])
      && !this.user.has('REQUEST_UPDATE_ALL');
    if (canOnlyReadOwnRequest) {
      request = _.omit(request, [
        'expectedStartDate',
        'deliveryDate',
        'receptionDate',
        'actualStartDate',
        'actualDeliveryDate',
        'location',
        'schedulingStatus',
        'partners',
        'insuranceCompany',
        'assignmentStatus',
        'internalDepartment',
        'schedulingCompany',
        'schedulingContact',
        'projectManagers',
        'invoiceCompany',
        'invoiceContact',
        'deliveryMethod',
        'requestType',
      ]);
    }
    return request;
  }

  async edit(user, newRequest) {
    newRequest = this.removeNonEditableFields(newRequest);
    const { lspId } = this;
    this.logger.debug('Checking existing request company');
    let canUpdateRequest = this.user.has('REQUEST_UPDATE_ALL-TASK');
    const canUpdateExpectedQuoteCloseDate = ['REQUEST_CREATE_ALL', 'REQUEST_UPDATE_ALL'].some((r) => this.user.has(r));
    let requestId;

    try {
      requestId = new ObjectId(newRequest._id);
    } catch (e) {
      this.logger.error(`Bad requestId provided: ${newRequest._id}`);
      throw new RestError(400, { message: 'The given requestId is invalid' });
    }
    if (canUpdateExpectedQuoteCloseDate) {
      this._validateExpectedQuoteCloseDate(newRequest);
    }
    this.logger.debug('Fetching original request');
    let dbRequest;
    let company;
    let companyId;

    try {
      this.logger.debug(`Retrieving request with _id ${requestId.toString()}`);
      dbRequest = await this.schema.Request.findOne({ _id: requestId, lspId });
      const requestType = _.get(dbRequest, 'requestType.name');
      this.checkForLanguageCombination(newRequest, requestType);
      const hasQuoteCurrencyChanged = (!_.isEmpty(dbRequest.quoteCurrency) || !_.isEmpty(newRequest.quoteCurrency))
        && !areObjectIdsEqual(dbRequest.quoteCurrency, newRequest.quoteCurrency);
      if (hasQuoteCurrencyChanged && dbRequest.workflows.length > 0) {
        throw new RestError(400, { message: 'Error updating request. Currency can not be updated' });
      }
      if (hasQuoteCurrencyChanged) {
        dbRequest.quoteCurrency = newRequest.quoteCurrency;
        dbRequest.exchangeRate = await this.schema.Request.getExchangeRate(
          dbRequest,
        );
      }
      newRequest.receptionDate = dbRequest.receptionDate;
      newRequest.no = dbRequest.no;
      company = dbRequest.company;
      delete newRequest.hasTimeToDeliverOptions;
      companyId = _.get(company, '_id', company);
      if (this.canOnlyUpdateAssignedTask) {
        Object.assign(newRequest, _.pick(dbRequest, [
          'late',
          'rush',
          'complaint',
          'requireQuotation',
          'poRequired',
          'purchaseOrder',
          'targetDate',
          'otherCC',
          'otherContact',
          'salesRep',
          'deliveryDate',
          'adjuster',
          'departmentNotes',
          'assignmentStatus',
          'memo',
        ]));
      }
      if (_.isNil(companyId)) {
        this.logger.error(`Request with _id ${dbRequest._id} has an inactive company`);
        throw new Error('Request company is inactive');
      }
    } catch (e) {
      const message = e.message || e;

      this.logger.error(`Error fetching request ${newRequest._id}. Error: ${message}`);
      throw new RestError(500, { message: `Error editing request: ${message}`, stack: e.stack });
    }
    const originalRequest = dbRequest.toObject();

    if (originalRequest.isQuoteApproved) {
      const requestCurrency = _.get(originalRequest, 'quoteCurrency._id');
      const newCurrency = _.get(newRequest, 'quoteCurrency._id');

      if (!areObjectIdsEqual(requestCurrency, newCurrency)) {
        const message = 'Request currency cannot be changed if request quote is approved';

        this.logger.error(`Error editing request ${newRequest._id}. ${message}`);
        throw new RestError(403, { message: `Error editing request: ${message}` });
      }
    }
    if (!this.user.has('REQUEST_UPDATE_ALL-TASK') && !this.canContactEditLanguageCombinations(originalRequest)) {
      this.logger.debug('Validating language combinations for user without REQUEST_UPDATE_ALL');
      const newLanguageCombinations = _.flatten(newRequest.languageCombinations.map((l) => ({
        srcLangs: l.srcLangs,
        tgtLangs: l.tgtLangs,
      })));
      const dbLanguageCombinations = _.flatten(dbRequest.languageCombinations.map((l) => {
        const languageCombinationObject = l.toObject();
        return {
          srcLangs: languageCombinationObject.srcLangs,
          tgtLangs: languageCombinationObject.tgtLangs,
        };
      }));

      if (newLanguageCombinations.length < dbLanguageCombinations.length) {
        this.logger.debug(`User tried to  delete a language combination from request with id ${dbRequest._id.toString()}`);
        throw new RestError(400, { message: 'You are not allowed to remove language combinations' });
      }
      const languageDifferences = _.differenceWith(
        newLanguageCombinations,
        dbLanguageCombinations,

        (o1, o2) => _.isEqual(o1, o2),
      );
      if (!_.isEmpty(languageDifferences)) {
        this.logger.debug(`User tried to update languages in a language combination from request with id ${dbRequest._id.toString()}`);
        throw new RestError(400, { message: 'You are not allowed to update a language combination for this request' });
      }
    }
    this._validateStatusChange(originalRequest, newRequest);
    if (dbRequest.status === REQUEST_WAITING_FOR_QUOTE
      && dbRequest.requireQuotation
      && !newRequest.requireQuotation) {
      newRequest.status = REQUEST_TO_BE_PROCESSED_STATUS;
    }
    if (dbRequest.status === REQUEST_DELIVERED_STATUS) {
      this.updatePurchaseOrder(newRequest, dbRequest);
      this.updateCustomFields(newRequest, dbRequest);
      this.updateExternalAccountingCode(newRequest, dbRequest);

      const newStatus = _.get(newRequest, 'status', '');
      const newTitle = _.get(newRequest, 'title');
      if (_.isEmpty(newStatus) || newStatus === dbRequest.status) {
        dbRequest.title = newTitle;
        await this.saveRequest(dbRequest);
        await this.afterRequestSaveHook(originalRequest, newRequest, false);
        return { originalRequest, request: newRequest };
      }
      if (newStatus === REQUEST_COMPLETED_STATUS) {
        newRequest = {
          ...originalRequest,
          status: newStatus,
          title: newTitle,
          updatedAt: _.get(newRequest, 'updatedAt'),
        };
      }
    }
    if (originalRequest.status === REQUEST_COMPLETED_STATUS
      && newRequest.status === REQUEST_COMPLETED_STATUS) {
      if (!areObjectIdsEqual(newRequest.invoiceContact, originalRequest.invoiceContact)) {
        dbRequest.invoiceContact = newRequest.invoiceContact;
      }
      return this.editCompleted(newRequest, dbRequest);
    }
    if (newRequest.status === REQUEST_COMPLETED_STATUS) {
      this._assertRequestCanBeCompleted(newRequest);
    }
    this.logger.info(`Company _id for the request is still ${company._id}`);
    if (_.isNil(dbRequest)) {
      this.logger.info(`User ${user.email} has provided an unexistent request id`);
      throw new RestError(404, { message: `Request ${requestId} does not exist` });
    }
    const requestCompanyId = _.get(dbRequest, 'company._id');
    const contactId = _.get(dbRequest, 'contact._id', '');

    if (!canUpdateRequest) {
      if (this.user.has('REQUEST_READ_OWN') && areObjectIdsEqual(contactId, this.user._id)) {
        canUpdateRequest = true;
      } else if (this.canUpdateCompanyRequest && validObjectId(requestCompanyId) && user.company) {
        canUpdateRequest = this.doesUserBelongsToRequestCompany(dbRequest);
      }
    }
    if (!canUpdateRequest
      && !this.canUpdateCompanyRequest
      && !this.user.has('REQUEST_READ_ASSIGNED-TASK')) {
      throw new RestError(403, { message: 'The user is not authorized to update this request' });
    }
    if (!canUpdateExpectedQuoteCloseDate) {
      newRequest.expectedQuoteCloseDate = dbRequest.expectedQuoteCloseDate;
    }
    if (canUpdateRequest) {
      const canUpdateInternalDocument = this.user.has('INTERNAL-DOCUMENT_UPDATE_ALL');

      this.logger.debug('Validating contacts');
      await this._validateContacts(Object.assign(newRequest, { company }), dbRequest);
      this.logger.debug('Validating project managers');
      await this._validateProjectManagers(newRequest);
      const dbRequestDocuments = requestAPIHelper
        .getRequestDocuments(originalRequest.languageCombinations);
      const newRequestDocuments = requestAPIHelper
        .getRequestDocuments(newRequest.languageCombinations);
      if (requestAPIHelper.isPortalCat(newRequest)) {
        const dbRemovedDocuments = dbRequestDocuments.filter((d) => d.isRemovedFromPortalCat);
        const newRemovedDocuments = newRequestDocuments.filter((d) => d.isRemovedFromPortalCat);
        const isNewDocumentRemovedFromPortalCat = !_.isEqual(
          dbRemovedDocuments.length,
          newRemovedDocuments.length,
        );
        if (isNewDocumentRemovedFromPortalCat) {
          newRequest.pcSettings.statisticsGenerated = false;
        }
      }
      if (!canUpdateInternalDocument) {
        const dbInternalDocuments = dbRequestDocuments.filter((d) => d.isInternal);
        const newInternalDocuments = newRequestDocuments.filter((d) => d.isInternal);
        const internalDocumentsChanges = _.differenceBy(dbInternalDocuments, newInternalDocuments, 'isInternal');

        if (!_.isEmpty(internalDocumentsChanges)) {
          throw new RestError(400, { message: 'You are not allowed to create internal documents' });
        }
      }
      await this._optimisticLock(dbRequest, newRequest);
      let toAssign = newRequest;

      if (!_.isEmpty(_.get(toAssign, 'location._id')) && !areObjectIdsEqual(dbRequest.location._id, toAssign.location._id)) {
        const locationInDb = await this.schema.Location.findOne({
          _id: new ObjectId(toAssign.location._id),
        }).populate('country._id state._id').lean();
        const location = _.pick(locationInDb, [
          '_id', 'name', 'phone', 'address', 'suite', 'state', 'city', 'country', 'zip',
        ]);

        Object.assign(location, {
          country: _.get(location, 'country.name'),
          state: _.get(location, 'state.name'),
        });
        toAssign.location = location;
      }
      toAssign = _.omit(_.pickBy(toAssign, (f) => !_.isNil(f)), ['contact', 'company', 'finalDocuments', 'workflows', 'quoteCurrency', 'exchangeRate']);
      cleanToAssignObject(toAssign, this.user.type);
      Object.keys(toAssign).forEach((key) => {
        dbRequest[key] = toAssign[key];
      });
    }
    const canUpdateWorkflow = this.user.has([
      'WORKFLOW_UPDATE_OWN',
      'WORKFLOW_UPDATE_ALL',
      'REQUEST_READ_ASSIGNED-TASK',
    ]);
    if (dbRequest.status === REQUEST_CANCELLED_STATUS) {
      if (canUpdateWorkflow) {
        cancelWorkflowProviderTaskStatus(dbRequest);
      } else {
        forEachProviderTask(dbRequest, ({ providerTask }) => {
          const isProviderTaskFinished = [
            PROVIDER_TASK_APPROVED_STATUS,
            PROVIDER_TASK_CANCELLED_STATUS,
            PROVIDER_TASK_COMPLETED_STATUS,
          ].includes(providerTask.status);
          if (!isProviderTaskFinished) {
            throw new RestError(400, {
              message: 'This request cannot be canceled until all provider tasks in the request are "Approved", "Completed" or "Canceled".',
            });
          }
        });
      }
    }
    if (dbRequest.status === REQUEST_COMPLETED_STATUS) {
      forEachProviderTask(dbRequest, ({ providerTask }) => {
        const isProviderTaskFinished = [
          PROVIDER_TASK_APPROVED_STATUS,
          PROVIDER_TASK_CANCELLED_STATUS,
        ].includes(providerTask.status);

        if (!isProviderTaskFinished) {
          throw new RestError(400, {
            message: 'This request cannot be completed until all provider tasks in the request are "Approved" or "Canceled".',
          });
        }
      });
    }
    await this.saveRequest(dbRequest);
    try {
      this.logger.debug(`Overriding request company with company ${JSON.stringify(company)}`);
      if (company) {
        dbRequest.company = company;
      } else {
        this.logger.error(`Request with _id ${dbRequest._id} has no company`);
      }
      await this.afterRequestSaveHook(originalRequest, newRequest, false);
    } catch (err) {
      this.logger.error(`Error executing after request save hook. Error: ${err}`);
    }
    return { originalRequest, request: newRequest };
  }

  removeNotRelevantWorkflows(request) {
    const { languageCombinations = [], workflows = [] } = request;
    const srcLangs = _.flatMap(languageCombinations, (combination) => combination.srcLangs);
    const tgtLangs = _.flatMap(languageCombinations, (combination) => combination.tgtLangs);
    request.workflows = workflows.filter((workflow) => {
      const {
        srcLang: { isoCode: srcIsoCode = '' } = {},
        tgtLang: { isoCode: tgtIsoCode = '' } = {},
      } = workflow;
      const srcLangExists = srcLangs.some((lang) => lang.isoCode === srcIsoCode);
      const tgtLangExists = tgtLangs.some((lang) => lang.isoCode === tgtIsoCode);
      return (_.isEmpty(srcIsoCode) || srcLangExists)
        && (_.isEmpty(tgtIsoCode) || tgtLangExists);
    });
  }

  async saveRequestQuoteData(requestId, templatesData) {
    const {
      quoteTemplateId,
      emailTemplateId,
      quoteCustomFields,
      emailCustomFields,
      serviceTypeId,
      deliveryTypeId,
      hiddenFields,
    } = templatesData;
    const fieldsToUpdate = {
      quoteTemplateId: new ObjectId(quoteTemplateId),
      emailTemplateId: new ObjectId(emailTemplateId),
    };

    if (!_.isNil(quoteCustomFields)) {
      fieldsToUpdate.quoteCustomFields = quoteCustomFields;
    }

    if (!_.isNil(emailCustomFields)) {
      fieldsToUpdate.emailCustomFields = emailCustomFields;
    }

    if (!_.isNil(serviceTypeId)) {
      fieldsToUpdate.serviceTypeId = serviceTypeId;
    }

    if (!_.isNil(deliveryTypeId)) {
      fieldsToUpdate.deliveryTypeId = deliveryTypeId;
    }

    if (!_.isNil(hiddenFields)) {
      fieldsToUpdate.quoteHiddenFields = hiddenFields;
    }

    this.logger.debug(`Editing request quote ad request with id ${requestId}`);
    return await this.schema.Request.findOneAndUpdate(
      {
        _id: new ObjectId(requestId),
        lspId: this.lspId,
      },
      { $set: fieldsToUpdate },
      { new: true },
    );
  }

  _assertRequestCanBeCompleted(request) {
    const allowedTaskStatuses = [WORKFLOW_TASK_STATUSES.approved,
      WORKFLOW_TASK_STATUSES.invoiced, WORKFLOW_TASK_STATUSES.cancelled];
    const taskStatusErrorMessage = `The request status cannot be changed to completed because all workflow tasks must have one of the following statuses ${allowedTaskStatuses.join(', ')}`;

    _.each(request.workflows, (workflow) => {
      _.each(workflow.tasks, ({ status }) => {
        if (!allowedTaskStatuses.includes(status)) {
          this.logger.error(`${taskStatusErrorMessage}. Current task status ${status}`);
          throw new RestError(403, { message: taskStatusErrorMessage });
        }
      });
    });
  }

  updateExternalAccountingCode(newRequest, dbRequest) {
    if (!_.has(newRequest, 'externalAccountingCode')) {
      return;
    }
    const canUpdateExternalAccountingCode = this.user.has(['REQUEST-EXTERNAL-ACCOUNTING-CODE_UPDATE_ALL']);
    const externalAccountingCodeId = _.get(newRequest, 'externalAccountingCode._id', '');
    const externalAccountingCodeIdInDb = _.get(dbRequest, 'externalAccountingCode._id', '');
    if ((_.isNil(externalAccountingCodeId) || !isValidObjectId(externalAccountingCodeId))
      && (_.isNil(externalAccountingCodeIdInDb) || !isValidObjectId(externalAccountingCodeIdInDb))) {
      return;
    }
    const externalAccountingCodeChanged = !areObjectIdsEqual(
      externalAccountingCodeId,
      externalAccountingCodeIdInDb,
    );
    if (externalAccountingCodeChanged && !canUpdateExternalAccountingCode) {
      throw new RestError(400, { message: 'You are not allowed to update external accounting code' });
    }
    dbRequest.externalAccountingCode = _.get(newRequest, 'externalAccountingCode', {});
  }

  updatePurchaseOrder(newRequest, dbRequest) {
    const canUpdatePO = this.user.has('REQUEST-PO_UPDATE_ALL');

    if (newRequest.poRequired !== dbRequest.poRequired
      || newRequest.purchaseOrder !== dbRequest.purchaseOrder) {
      if (!canUpdatePO) {
        throw new RestError(403, { message: 'User does not have permission to edit purchase order of the completed request' });
      }
      dbRequest.poRequired = newRequest.poRequired;
      if (dbRequest.poRequired && !_.isEmpty(newRequest.purchaseOrder)) {
        dbRequest.purchaseOrder = newRequest.purchaseOrder;
      } else if (!dbRequest.poRequired) {
        dbRequest.purchaseOrder = '';
      }
    }
  }

  updateCustomFields(newRequest, dbRequest) {
    if (!_.has(newRequest, 'customStringFields')) {
      return;
    }
    const canUpdateCustomFields = this.user.has(['REQUEST-CUSTOM-FIELDS_UPDATE_ALL', 'REQUEST-CUSTOM-FIELDS_UPDATE_OWN']);
    const hasUpdateRole = this.user.has(['REQUEST_UPDATE_ALL', 'REQUEST_UPDATE_OWN', 'REQUEST_UPDATE_COMPANY']);
    const customFields = _.get(newRequest, 'customStringFields', []);
    const dbCustomFields = _.get(dbRequest, 'customStringFields', []);
    const customFieldsChanges = _.differenceBy(customFields, dbCustomFields, 'value');
    if (!_.isEmpty(customFieldsChanges) && !(canUpdateCustomFields && hasUpdateRole)) {
      throw new RestError(400, { message: 'You are not allowed to update custom fields' });
    }
    dbRequest.customStringFields = customFields;
  }

  async editCompleted(newRequest, dbRequest) {
    await this.updateCustomFields(newRequest, dbRequest);
    this.logger.debug(`Editing completed request with id ${dbRequest._id}`);
    await this.updatePurchaseOrder(newRequest, dbRequest);
    this.updateExternalAccountingCode(newRequest, dbRequest);
    await this.saveRequest(dbRequest);
    const updatedRequest = await this.findOneWithWorkflows(dbRequest._id);
    return updatedRequest;
  }

  sendRequestCreationEmails(fullRequest, newTranslationRequest) {
    try {
      const emailPromises = [];
      const pms = requestAPIHelper.requestProjectManagers(newTranslationRequest);
      let pmEmailFactory = this._sendPMRequestCreatedEmail;

      if (newTranslationRequest.requireQuotation) {
        pmEmailFactory = this._sendPMQuotedRequestCreatedEmail;
      }
      pms.forEach((pm) => {
        emailPromises.push(pmEmailFactory.call(this, fullRequest, pm));
      });
      Promise.map(emailPromises, (promise) => promise);
      this.logger.debug('Sending new request emails');
      const otherCCFormattedList = _.get(fullRequest, 'otherCC', []).map((email) => ({ email }));
      const emailList = [fullRequest.contact, fullRequest.otherContact, ...otherCCFormattedList];
      return Promise.map(emailList, (user) => {
        if (!_.isEmpty(user.email)) {
          return this._sendCreateEmail(user, { request: fullRequest });
        }
      }).catch((err) => {
        this.logger.debug(`Error sending "request created" notification emails: ${err}`);
      });
    } catch (e) {
      const message = e.message || e;

      this.logger.debug(`Error sending email: Error: ${message}`);
    }
  }

  async _sendCreateEmail(user, data) {
    const templateName = REQUEST_CREATION_EMAIL;
    const { mockFlag: mock, lspId } = this;
    const context = {
      request: data.request,
      path: data.path,
      user,
    };

    try {
      await this.emailQueue.send({
        templateName, context, mock, lspId,
      });
    } catch (e) {
      const message = e.message || e;

      this.logger.debug(`Error sending request creation email: ${message}`);
    }
  }

  async sendCustomizedQuoteNotification(request, requestType) {
    const isWaitingQuote = request.status === 'Waiting for Quote';
    const isAnnuityQuotationRequired = _.get(request, 'ipPatent.isAnnuityQuotationRequired', false);
    const CUSTOM_TEMPLATE = 'requesting-customized-quote-email';
    const APPROVE_TEMPLATE = 'requesting-quote-email';
    const EXCLUDE_REQUEST_TYPE = 'Standard';
    const templateName = isWaitingQuote || isAnnuityQuotationRequired
      ? CUSTOM_TEMPLATE : APPROVE_TEMPLATE;
    const userData = await this.schema.User.findOne({ _id: new ObjectId(this.user._id) });
    const pms = await this.schema.User.find({ _id: { $in: userData.projectManagers } });
    const scheduler = await this.schema.Scheduler.findOne({
      name: templateName,
      lspId: this.lspId,
    });

    if (!scheduler) {
      this.logger.error(`There is no email template for name "${templateName}"`);
      throw new RestError(503, { message: 'Failed to send email to user' });
    }
    if (isWaitingQuote) {
      Promise.each(pms, (pm) => this._emailBuilderForCustomNotification(request, pm, templateName));
    } else if (requestType !== EXCLUDE_REQUEST_TYPE) {
      await this._emailBuilderForCustomNotification(request, this.user, templateName);
    }
  }

  async _emailBuilderForCustomNotification(request, user, templateName) {
    const emailContext = {
      request: {
        _id: request._id,
        no: request.no,
        title: request.title,
        turnaroundTime: request.turnaroundTime,
      },
      user,
      lsp: {
        name: this.user.lsp.name,
      },
    };

    await this.emailQueue.send({
      templateName,
      context: emailContext,
      mock: this.mockFlag,
      lspId: this.lspId,
    });
  }

  deleteDocumentsFromCloud(originalRequest, requestComparison) {
    const deletedLanguageCombinations = _.differenceWith(
      originalRequest.languageCombinations,
      requestComparison.languageCombinations,

      areObjectIdsEqual,
    );

    if (!_.isEmpty(deletedLanguageCombinations)) {
      const documentsToDelete = extractChildArray(deletedLanguageCombinations, 'documents');
      return Promise.map(documentsToDelete, (document) => this.cloudStorage.deleteFile(document.cloudKey));
    }
  }

  sendRequestEditedEmails(requestComparison, modifications) {
    this.sendPMRequestEditedEmail(requestComparison, modifications);
    this.sendContactRequestEditedEmail(requestComparison, modifications);
  }

  async getAccumulatedModifications(requestId) {
    const notifications = await this.schema.Notification.find({
      recordId: requestId,
      error: null,
      processed: null,
    }).sort({ createdAt: -1 }).lean();
    return _.get(notifications[0], 'modifications', []);
  }

  async getAllModifications(modifications, requestId) {
    const accumulatedModification = await this.getAccumulatedModifications(requestId);
    const printableDocuments = this._getPrintableDocumentsForEmail(modifications);

    if (!_.isArray(modifications)) {
      modifications = [modifications];
    }
    // remove documents from modification
    modifications = modifications.filter((m) => !_.isEqual(m.name, 'documents') && _.isNil(m.deletedDocuments));
    // create a unique array of the accumulated modifications
    let mergedModifications = _.unionBy(modifications, accumulatedModification, 'name');
    const docs = accumulatedModification.filter((doc) => _.isEqual(doc.name, 'document'));
    const accumulatedDocs = _.concat(docs, printableDocuments);

    mergedModifications = _.union(mergedModifications, accumulatedDocs);
    return mergedModifications;
  }

  async afterRequestSaveHook(
    originalRequest,
    newRequest,
    isNewRequest,
    customModifications,
  ) {
    let requestComparison = newRequest;
    let modifications;

    if (_.isFunction(newRequest.toObject)) {
      requestComparison = newRequest.toObject();
    }
    this.deleteDocumentsFromCloud(originalRequest, requestComparison);
    if (
      _.isNil(originalRequest.deliveredAt)
      && originalRequest.status !== REQUEST_DELIVERED_STATUS
      && originalRequest.status !== requestComparison.status
      && requestComparison.status === REQUEST_DELIVERED_STATUS
    ) {
      const requestToSend = JSON.parse(JSON.stringify(requestComparison));

      if (!_.isEmpty(originalRequest.no)) {
        requestToSend.no = originalRequest.no;
      }
      this._sendDeliveredRequestEmails(requestToSend);
    }
    if (!_.isNil(customModifications)) {
      modifications = customModifications;
    } else {
      modifications = requestAPIHelper._findModifications(originalRequest, requestComparison);
    }
    const isCompleted = newRequest.status === REQUEST_COMPLETED_STATUS;
    if (!_.isNil(modifications) && !isNewRequest && !isCompleted) {
      const accumulatedModifications = await this.getAllModifications(modifications, originalRequest._id);
      this.sendRequestEditedEmails(requestComparison, accumulatedModifications);
    }
    const workflows = _.get(originalRequest, 'workflows', []);
    if (originalRequest.status !== REQUEST_IN_PROGRESS_STATUS
      && newRequest.status === REQUEST_IN_PROGRESS_STATUS
      && workflows.length > 0) {
      try {
        Promise.map(workflows, (workflow) => this.workflowProviderEmailSender
          .sendRequestWorkflowEmails(newRequest, workflow));
      } catch (err) {
        this.logger.error(`Error executing after request save hook. Error: ${err}`);
      }
    }
    this.triggerPortalCatPipelines(originalRequest, requestComparison);
    return Promise.resolve();
  }

  async createWorkflowsForLanguageCombination(request, languageCombination) {
    const newWorkflows = [];
    const languageCombinationPairs = _.flatten(languageCombination.srcLangs.map(
      (srcLang) => languageCombination.tgtLangs.map((tgtLang) => [srcLang, tgtLang]),
    ));
    await Promise.mapSeries(languageCombinationPairs, async (langPair) => {
      const [srcLang, tgtLang] = langPair;
      const useMt = await this._getCompanyUseMtSetting({
        srcLangIsoCode: srcLang.isoCode,
        tgtLangIsoCode: tgtLang.isoCode,
        companyId: _.get(request, 'company._id', request.company),
      });
      const newWorkflow = {
        ...emptyWorkflow(),
        _id: new ObjectId(),
        srcLang,
        tgtLang,
        useMt,
        workflowDueDate: _.get(request, 'deliveryDate'),
      };
      const translationUnit = await this.schema.TranslationUnit.findOne({ name: 'Hours', lspId: this.lspId }).lean();
      _.set(newWorkflow, 'tasks[0].ability', TASK_ABILITY_CAT_PREFLIGHT);
      _.set(newWorkflow, 'tasks[0].providerTasks[0].taskDueDate', _.get(request, 'deliveryDate'));
      _.set(newWorkflow, 'tasks[0].invoiceDetails[0].invoice.translationUnit', translationUnit);
      _.set(newWorkflow, 'tasks[0].invoiceDetails[0].projectedCost.translationUnit', translationUnit);
      newWorkflows.push(newWorkflow);
    });
    return newWorkflows;
  }

  async _getCompanyUseMtSetting({ srcLangIsoCode, tgtLangIsoCode, companyId }) {
    const company = await this.schema.Company.findById(companyId, 'mtSettings');
    const { languageCombinations = [], useMt } = company.mtSettings;
    const languageCombination = languageCombinations.find((combination) => combination.srcLang === srcLangIsoCode && combination.tgtLang === tgtLangIsoCode);
    return useMt && !_.isNil(languageCombination);
  }

  triggerPortalCatPipelines(oldRequest, newRequest) {
    if (!requestAPIHelper.isPortalCat(newRequest)) {
      return;
    }
    const oldLanguageCombinations = _.get(oldRequest, 'languageCombinations', []);
    const newLanguageCombinations = _.get(newRequest, 'languageCombinations', []);
    const oldWorkflows = _.get(oldRequest, 'workflows', []);
    const newWorkflows = _.get(newRequest, 'workflows', []);
    this._triggerPortalCatPipelinesBasedOnLc({
      request: newRequest,
      oldLanguageCombinations,
      newLanguageCombinations,
    });
    this._triggerPortalCatPipelinesBasedOnWorkflows({
      request: newRequest,
      oldWorkflows,
      newWorkflows,
    });
  }

  _triggerPortalCatPipelinesBasedOnLc({
    request,
    oldLanguageCombinations,
    newLanguageCombinations,
  }) {
    return Promise.map(oldLanguageCombinations, async (oldCombination) => {
      const newCombination = newLanguageCombinations
        .find((combination) => areObjectIdsEqual(oldCombination._id, combination._id));
      if (_.isNil(newCombination)) {
        return;
      }
      const srcLangsDiff = _.differenceBy(newCombination.srcLangs, oldCombination.srcLangs, 'isoCode');
      const tgtLangsDiff = _.differenceBy(newCombination.tgtLangs, oldCombination.tgtLangs, 'isoCode');
      if (!_.isEmpty(srcLangsDiff)) {
        await this._initializePortalCatPipelines({
          request,
          languageCombination: newCombination,
          srcLangs: srcLangsDiff,
          tgtLangs: newCombination.tgtLangs,
        });
      }
      if (!_.isEmpty(tgtLangsDiff)) {
        await this._initializePortalCatPipelines({
          request,
          languageCombination: newCombination,
          srcLangs: newCombination.srcLangs,
          tgtLangs: tgtLangsDiff,
        });
      }
    })
      .catch((err) => this.logger.error(`Error triggering pipelines based on LC. Error: ${err.message}`));
  }

  _triggerPortalCatPipelinesBasedOnWorkflows({
    request,
    oldWorkflows,
    newWorkflows,
  }) {
    Promise.each(newWorkflows, async (newWorkflow) => {
      const oldWorkflow = oldWorkflows
        .find((workflow) => areObjectIdsEqual(newWorkflow._id, workflow._id));
      const shouldTrigger = (_.isNil(oldWorkflow) && newWorkflow.useMt)
        || (!_.isNil(oldWorkflow) && oldWorkflow.useMt !== newWorkflow.useMt);
      if (shouldTrigger) {
        const pipelines = await this.portalCatApi.getPipelines({
          requestId: request._id,
          workflowId: newWorkflow._id,
          type: PORTALCAT_PIPELINE_TYPE_MT,
        });
        const allDocuments = requestAPIHelper.getRequestDocuments(request.languageCombinations);
        const filteredPipelines = pipelines.filter((pipeline) => {
          const document = allDocuments.find((doc) => areObjectIdsEqual(doc._id, pipeline.fileId));
          return !_.isNil(document) && !document.deleted;
        });
        if (!_.isEmpty(filteredPipelines)) {
          await this.portalCatApi.manipulatePipelines({
            requestId: request._id,
            scope: PIPELINE_OPERATION_TASK_SCOPE,
            pipelineId: _.first(filteredPipelines)._id,
            workflowId: newWorkflow._id,
          });
        }
      }
    }).catch((err) => this.logger.error(`Error triggering pipelines based on workflows. Error: ${err.message}`));
  }

  _initializePortalCatPipelines({
    request, languageCombination, srcLangs, tgtLangs,
  }) {
    return Promise.map(
      srcLangs,
      (srcLang) => Promise.map(
        tgtLangs,
        async (tgtLang) => {
          await this.portalCatApi.createPipelines({
            requestId: request._id,
            languageCombinationId: languageCombination._id,
            srcLangFilter: srcLang.isoCode,
            tgtLangFilter: tgtLang.isoCode,
            types: [
              PORTALCAT_PIPELINE_TYPE_IMPORT,
              PORTALCAT_PIPELINE_TYPE_QA,
              PORTALCAT_PIPELINE_TYPE_MT,
              PORTALCAT_PIPELINE_TYPE_EXPORT,
            ],
          });
          await Promise.mapSeries(
            [
              PORTALCAT_PIPELINE_TYPE_IMPORT,
              PORTALCAT_PIPELINE_TYPE_MT,
            ],
            async (type) => {
              const runOperation = await this.portalCatApi.buildPcOperation({
                operation: 'run',
                type,
                languageCombinations: [languageCombination],
                srcLangFilter: srcLang.isoCode,
                tgtLangFilter: tgtLang.isoCode,
                request,
              });
              return this.portalCatApi.performPipelinesOperations({
                requestId: request._id,
                operations: [runOperation],
              });
            },
          );
        },
      ),
    );
  }

  _sendDeliveredRequestEmails(request) {
    const path = EmailQueue.serverURL(this.configuration, '');
    const otherCCFormattedList = _.get(request, 'otherCC', []).map((email) => ({ email }));
    return Promise.map([request.contact, request.otherContact, ...otherCCFormattedList], (user) => {
      try {
        const userEmail = _.get(user, 'email', user);
        this.logger.debug(`Queing request completed email by ${userEmail}`);

        if (_.isString(userEmail)) {
          const emailContext = {
            request,
            finalDocuments: request.finalDocuments,
            path,
            user,
          };
          return this.emailQueue.send({
            templateName: REQUEST_DELIVERED_EMAIL,
            context: emailContext,
            mock: this.mockFlag,
            lspId: this.lspId,
          });
        }
      } catch (err) {
        const message = err.message || err;
        this.logger.debug(`Error queuing completed email. Error ${message}`);
      }
    }).catch((err) => {
      this.logger.debug(`Error sending "request completed" notification emails: ${err}`);
    });
  }

  _sendPMQuotedRequestCreatedEmail(request, pm) {
    return this._sendEmail(QUOTED_REQUEST_CREATION_PM_EMAIL, {
      request,
      path: this.serverUrl,
      user: pm,
    });
  }

  _sendPMQuotedRequestApprovedEmail(request, pm) {
    const emailContext = this._buildQuoteApprovedEmail(request, pm);
    return this.emailQueue.send({
      templateName: QUOTED_REQUEST_APPROVED_PM_EMAIL,
      context: emailContext,
      mock: this.mockFlag,
      lspId: this.lspId,
    });
  }

  async approveQuote(requestId) {
    if (!validObjectId(requestId)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const query = { _id: new ObjectId(requestId), lspId: this.lspId };
    const request = await this.schema.Request.findOne(query);
    if (!this.user.has('QUOTE_UPDATE_ALL')
      && ['QUOTE_UPDATE_COMPANY', 'QUOTE_UPDATE_OWN'].some((role) => this.user.has(role))
      && !requestAPIHelper._isCompanyOnHierarchy(this.user, request.company)) {
      this.logger.info(`User ${this.user.email} cannot access the company ${request.company._id.toString()}`);
      throw new RestError(403, { message: 'The user cannot approve the quote for this company' });
    }
    if (_.isEmpty(request)) {
      this.logger.debug(`Error approving quote for request ${request._id}. Request was not found`);
      throw new RestError(404, { message: `Request ${request._id} not found` });
    }
    if (request.status !== REQUEST_WAITING_FOR_APPROVAL_STATUS) {
      this.logger.debug(`Error approving quote for request ${request._id}. Request status is not "Waiting for approval"`);
      throw new RestError(404, { message: 'Request status is not "Waiting for approval"' });
    }
    const emailPromises = [];
    const pms = _.get(request, 'projectManagers', []);

    if (_.get(pms, 'length', 0) > 0) {
      const pmEmailFactory = this._sendPMQuotedRequestApprovedEmail;

      pms.forEach((pm) => {
        emailPromises.push(() => {
          try {
            pmEmailFactory.call(this, request, pm);
          } catch (err) {
            const message = err || err.message;

            this.logger.debug(
              `Error ocurred when trying to send email to project manager: ${message}`,
            );
          }
        });
      });
      this.logger.debug('Sending approved quote email to request project managers');
      Promise.mapSeries(emailPromises, (f) => f(), { concurrency: 3 }).catch((err) => {
        this.logger.debug(`Failed to send quote approved emails to project managers ${this.user.email} for request ${requestId}: ${err}`);
      });
      try {
        const populatedRequest = await this.schema.Request.findOneAndUpdate(query, {
          $set: {
            status: REQUEST_TO_BE_PROCESSED_STATUS,
            isQuoteApproved: true,
            quoteApprovalDate: moment().utc().toDate(),
          },
        }, { new: true });
        this.logger.debug(`User ${this.user.email} approved quote for request ${requestId}`);
        return populatedRequest;
      } catch (err) {
        const message = err.message || err;

        this.logger.debug(`Failed to update request with id ${request._id} after approving quote. Err: ${message}`);
        throw new RestError(500, { message: 'Request status could not be updated' });
      }
    }
  }

  _buildQuoteApprovedEmail(request, pm) {
    const pmName = `${_.get(pm, 'firstName')} ${_.get(pm, 'lastName')}`;
    const requestId = request._id.toString();
    const emailContext = {
      path: `https://portal.protranslating.com/requests/${requestId}/details/quote`,
      user: {
        lsp: this.lspId,
        PMName: pmName,
        email: _.get(pm, 'email'),
      },
      quote: {
        requestNo: _.get(request, 'no', ''),
        quoteNum: _.get(request, 'no', ''),
        companyName: _.get(request, 'company.name', ''),
        approvedBy: `${this.user.firstName} ${this.user.lastName}`,
      },
    };
    return emailContext;
  }

  _sendPMRequestCreatedEmail(request, pm) {
    return this._sendEmail(REQUEST_CREATION_PM_EMAIL, {
      request,
      path: this.serverUrl,
      user: pm,
    });
  }

  sendContactRequestEditedEmail(request, modifications) {
    const { contact, otherContact, otherCC } = request;
    const otherCCFormattedList = _.defaultTo(otherCC, []).map((email) => ({ email }));

    Promise.map([contact, otherContact, ...otherCCFormattedList], (user) => {
      if (!_.isEmpty(_.get(user, 'email', ''))) {
        return this._sendEmail(REQUEST_MODIFIED_CONTACT_EMAIL, {
          request,
          path: this.serverUrl,
          user,
          modifications,
        });
      }
    }).catch((err) => {
      this.logger.debug(`Error sending "request modified" notification emails to contacts: ${err}`);
    });
  }

  sendPMRequestEditedEmail(request, modifications) {
    const projectManagers = requestAPIHelper.requestProjectManagers(request);
    const pmEmailList = projectManagers.filter((pm) => !areObjectIdsEqual(pm, this.user));

    if (!_.isEmpty(pmEmailList)) {
      Promise.map(pmEmailList, (pm) => this._sendEmail(REQUEST_MODIFIED_PM_EMAIL, {
        request,
        path: this.serverUrl,
        user: pm,
        modifications,
      }))
        .catch((err) => {
          this.logger.debug(`Error sending "request modified" notification emails: ${err}`);
        });
    }
  }

  _sendVendorCompletedProviderTaskEmail(templatesData) {
    templatesData.forEach((td) => this.emailQueue.send({
      templateName: BILL_PENDING_APPROVAL_PROVIDER_EMAIL,
      context: td,
      mock: this.mockFlag,
      lspId: this.lspId,
    }));
  }

  _getPrintableDocumentsForEmail(modifications) {
    let oldDocuments;
    let newDocuments;

    if (_.isEmpty(modifications)) {
      return [];
    }
    const deletedDocuments = _.get(modifications, 'deletedDocuments');

    if (!_.isNil(deletedDocuments)) {
      newDocuments = modifications.newDocuments;
      oldDocuments = _.concat(newDocuments, deletedDocuments);
    } else {
      const documentModifications = modifications.find((m) => m.name === 'documents');

      if (!_.isEmpty(documentModifications)) {
        newDocuments = documentModifications.value;
        oldDocuments = documentModifications.oldValue;
      }
    }
    const uniqueOldDocuments = _.uniqBy(_.sortBy(oldDocuments, 'name').filter((d) => !d.isReference), 'name');
    const uniqueNewDocuments = _.uniqBy(_.sortBy(newDocuments, 'name').filter((d) => !d.deleted && !d.isReference), 'name');
    let largestArray;

    if (uniqueOldDocuments.length > uniqueNewDocuments.length) {
      largestArray = uniqueOldDocuments;
    } else {
      largestArray = uniqueNewDocuments;
    }
    const printableDocuments = [];
    const name = 'document';

    largestArray.forEach((doc, i) => {
      let oldValue = '';
      let value = '';

      if (!_.isNil(oldDocuments[i])) {
        oldValue = oldDocuments[i].name;
      }
      if (!_.isNil(uniqueNewDocuments[i])) {
        value = uniqueNewDocuments[i].name;
      }
      printableDocuments.push({ name, oldValue, value });
    });
    return _.defaultTo(printableDocuments, []);
  }

  async buildRequestModifiedNotification(notificationObj) {
    try {
      this.logger.debug('About to build notification for request-modified-pm email');
      const notification = await this.emailQueue.build(notificationObj);
      Object.assign(notification, {
        modifications: _.get(notificationObj, 'context.modifications'),
        recordId: _.get(notificationObj, 'context.request._id'),
      });
      this.emailNotificationQueue.upsertNotification(notification);
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Failed to queue email: ${message} => stack: ${err.stack}`);
    }
  }

  _sendEmail(templateName, { request, user, modifications = [] }) {
    if (!_.isEmpty(user.inactiveNotifications)) return;
    const context = {
      path: this.serverUrl,
      user,
      request,
      modifications,
    };
    const printableDocuments = context.modifications.filter((m) => _.get(m, 'name') === 'document');

    if (!_.isEmpty(printableDocuments)) {
      Object.assign(context, {
        documents: printableDocuments,
        referenceDocuments: printableDocuments.filter((d) => !d.deleted && d.isReference),
      });
    }
    if (_.isEqual(templateName, REQUEST_MODIFIED_PM_EMAIL)) {
      return this.buildRequestModifiedNotification({
        templateName,
        context,
        mock: this.mockFlag,
        lspId: this.lspId,
      });
    }
    return this.emailQueue.send({
      templateName,
      context,
      mock: this.mockFlag,
      lspId: this.lspId,
    });
  }

  _buildProviderEmailTemplatesData(request, transactions, lspName) {
    // getting provider tasks data: provider email, taskDueDate, abilities, languages
    const providerTasks = requestAPIHelper.getCompletedProviderTasksData(
      request.workflows,
    );
    return providerTasks.map((pt) => {
      const transaction = _.find(
        transactions,
        (tr) => _.get(tr, 'provider.email', '') === _.get(pt, 'user.email'),
      );
      return {
        ...pt,
        lspName,
        request: {
          no: request.no,
        },
        transaction: {
          no: _.get(transaction, 'no', ''),
          _id: _.get(transaction, '_id', ''),
        },
      };
    });
  }

  doesUserBelongsToRequestCompany(request) {
    // If user can edit rates for the company
    // in order to check if the user has permission to edit this request
    // we need to determine if this user belongs to the request's company.
    // We must ensure that both values exist, hence this algorithm.
    const requestCompany = _.get(request, 'company._id', request.company);
    const userCompany = _.get(this.user, 'company', '');
    const userCompanyId = _.get(userCompany, '_id', userCompany);

    if (
      requestCompany
      && userCompanyId
      && requestCompany.toString() === userCompanyId.toString()
    ) {
      return true;
    }
    return request.company.hierarchy.match(this.user.company.name);
  }

  async _optimisticLock(requestInDb, request) {
    const message = 'This request was changed from a different browser window or tab. To see the new content, open this page in a new tab or refresh this page.';
    if (this.mockFlag && request.title === 'outdated') {
      throw new RestError(409, { message });
    }
    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(
      this.user,
      this.logger,

      {
        entityName: 'request',
        entityPromise: () => this.findOne(request._id),
      },
    );

    try {
      return await concurrencyReadDateChecker.failIfOldEntity(requestInDb);
    } catch (e) {
      throw new RestError(409, { message });
    }
  }

  async updatePatent(requestId, patent, translationOnly = false) {
    try {
      const originalRequest = await this.findOne(requestId, {
        quoteCurrency: 1, ipPatent: 1, languageCombinations: 1,
      });
      patent.countries = _.get(originalRequest, 'ipPatent.countries', []);
      const request = { _id: requestId, ipPatent: patent };
      if (isEpo(_.get(patent, 'patentPublicationNumber', ''))) {
        await this.recalculateEpoFee(request, originalRequest, translationOnly);
      } else if (isWipo(_.get(patent, 'patentApplicationNumber', ''))) {
        await this.recalculateWipoFee(request, originalRequest, translationOnly);
      } else {
        await this.recalculateNoDbFee(request, originalRequest, translationOnly);
      }

      const recalculatedPatent = _.get(request, 'ipPatent');
      const keys = [
        'abstractWordCount',
        'countries',
        'descriptionWordCount',
        'claimsWordCount',
        'drawingsWordCount',
        'drawingsPageCount',
        'descriptionPageCount',
        'claimsPageCount',
        'numberOfClaims',
        'numberOfDrawings',
        'specificationWordCount',
        'numberOfIndependentClaims',
        'totalNumberOfPages',
        'numberOfPriorityApplications',
        'total',
      ];
      const update = {};

      keys.forEach((key) => {
        update[`ipPatent.${key}`] = recalculatedPatent[key];
      });
      return this.schema.Request.findOneAndUpdate({
        _id: requestId,
      }, {
        $set: update,
      }, { new: true, projection: { ipPatent: 1 } });
    } catch (e) {
      this.logger.error(`Error recalculating patent fee for request ${requestId}. Error: ${e.message}`);
      if (e instanceof RestError) {
        throw e;
      }
      throw new RestError(500, { message: 'Error recalculating patent fee', stack: e.stack });
    }
  }

  async forceUpdatePatentFee(requestId, countries) {
    const request = await this.findOne(requestId, {
      quoteCurrency: 1,
      'ipPatent.service': 1,
      'ipPatent.countries': 1,
      'ipPatent.claimsTranslationFees': 1,
    });
    const isTranslationOnlyQuote = _.get(request, 'ipPatent.service') === TRANSLATION_ONLY_QUOTE;
    const countryNames = countries.map((c) => c.name);
    let patentTotal = 0;

    _.forEach(request.ipPatent.countries, (country) => {
      let total = 0;
      const updatedCountry = countries.find((c) => c.name === country.name);

      if (countryNames.includes(country.name)) {
        if (!_.isNil(_.get(updatedCountry, 'translationFee'))) {
          country.translationFee = updatedCountry.translationFee;
        }
        if (!_.isNil(_.get(updatedCountry, 'agencyFeeFixed'))) {
          country.agencyFeeFixed = updatedCountry.agencyFeeFixed;
        }
        if (!_.isNil(_.get(updatedCountry, 'agencyFee'))) {
          country.agencyFee = updatedCountry.agencyFee;
        }
        if (!_.isNil(_.get(updatedCountry, 'officialFee'))) {
          country.officialFee = updatedCountry.officialFee;
        }
      }
      total = sum(total, country.translationFee);
      if (!isTranslationOnlyQuote) {
        const agencyFeeField = !_.isNil(_.get(country, 'agencyFee'))
          ? 'agencyFee' : 'agencyFeeFixed';
        total = sum(total, country[agencyFeeField]);
        total = sum(total, country.officialFee);
      }
      country.total = bigJsToNumber(total);
      patentTotal = sum(patentTotal, total);
      _.forEach(request.ipPatent.claimsTranslationFees, (fee) => {
        patentTotal = sum(patentTotal, fee.calculatedFee);
      });
    });
    return this.schema.Request.findOneAndUpdate({
      _id: requestId,
    }, {
      $set: {
        'ipPatent.countries': request.ipPatent.countries,
        'ipPatent.total': bigJsToNumber(patentTotal),
      },
    }, { new: true });
  }

  async recalculateEpoFee(request, originalRequest, translationOnly = false) {
    const epoTranslationFeeAPI = new EpoTranslationFeeAPI(this.logger, {
      user: this.user,
    });
    const epoAPI = new EpoAPI(this.logger, {
      user: this.user,
    });
    const epoCountryAPI = new EpoCountryAPI(this.logger, {
      user: this.user,
    });
    const companyAPI = new CompanyAPI(this.logger, { user: this.user });
    const patent = _.get(request, 'ipPatent');
    const epo = await epoAPI.findByPatentNumber(patent.patentPublicationNumber);
    const { list: countryList } = await epoCountryAPI.list();
    const patentCountryNames = request.ipPatent.countries.map((c) => c.name);
    const {
      defaultCompanyCurrencyCode, entityIpRates: companyIpRates,
    } = await companyAPI.getIpRates(originalRequest.company._id, 'epo', epo.sourceLanguage.toLowerCase());
    const filter = {
      epoId: epo._id,
      countries: countryList.filter((c) => patentCountryNames.includes(c.name)).map((c) => c.name),
      defaultCompanyCurrencyCode,
      companyIpRates,
    };
    const patentCounts = requestAPIHelper.getIpCounts(patent);
    const originalCounts = requestAPIHelper.getIpCounts(originalRequest.ipPatent);
    const isSamePatentsCount = _.isEqual(originalCounts, patentCounts);
    const { list: fees } = await epoTranslationFeeAPI
      .list({ translationOnly, ...filter, ...patentCounts });
    const requestCountries = await this.getCountryFees(request, originalRequest, fees, !isSamePatentsCount);
    let patentTotal = fees.reduce((total, fee) => {
      if (!translationOnly) {
        return sum(total, epoTranslationFeeAPI.feeTotal(fee));
      }
      return sum(fee.translationFee, total);
    }, 0);

    _.forEach(request.ipPatent.claimsTranslationFees, (fee) => {
      patentTotal = sum(patentTotal, fee.calculatedFee);
    });
    patent.claimsTranslationFees = _.get(patent, 'claimsTranslationFees', originalRequest.ipPatent.claimsTranslationFees);
    patent.countries = requestCountries;
    requestAPIHelper.assignPatent(patent, _.get(originalRequest, 'ipPatent', {}), patentTotal);
  }

  async recalculateWipoFee(request, originalRequest, translationOnly = false) {
    const patent = _.get(request, 'ipPatent');
    const wipoTranslationFeeAPI = new WipoTranslationFeeAPI(this.logger, {
      user: this.user,
    });
    const wipoAPI = new WipoAPI(this.logger, {
      user: this.user,
    });
    const wipo = await wipoAPI.findByPatentNumber(patent.patentPublicationNumber);
    const patentCountries = _.get(request, 'ipPatent.countries');
    const iqCountries = patentCountries.filter((country) => country.instantQuote && country.name !== 'English Translation');
    const originalCounts = requestAPIHelper.getIpCounts(originalRequest.ipPatent);
    const patentCounts = requestAPIHelper.getIpCounts(patent);
    const isSamePatentsCount = _.isEqual(originalCounts, patentCounts);
    patentCounts.numberOfTotalPages = _.get(patentCounts, 'totalNumberOfPages', 0);
    const filters = {
      translationOnly,
      wipoId: wipo._id,
      countries: iqCountries
        .map((c) => ({ name: c.name, shouldTranslateDirectly: c.directTranslation || true })),
      entities: iqCountries.map((c) => c.activeEntity || ''),
      companyId: _.get(originalRequest, 'company._id'),
      ...patentCounts,
    };
    const { list: fees } = await wipoTranslationFeeAPI.list(filters);
    const requestCountries = await this.getCountryFees(request, originalRequest, fees, !isSamePatentsCount);
    const patentTotal = requestCountries
      .reduce((total, country) => calculateTotal(total, country, translationOnly), 0);
    patent.total = patentTotal;
    patent.countries = requestCountries;
    requestAPIHelper.assignPatent(patent, _.get(originalRequest, 'ipPatent', {}));
  }

  async recalculateNoDbFee(request, originalRequest, translationOnly) {
    const patent = _.get(request, 'ipPatent', {});
    const sourceLangName = _.get(originalRequest, 'languageCombinations.0.srcLangs.0.name');
    const noDbTranslationFeeAPI = new NodbTranslationFeeAPI(this.logger, {
      user: this.user,
    });
    const noDBTranslationFeeFilingApi = new NodbTranslationFeeFilingAPI(this.logger, {
      user: this.user,
    });
    const companyAPI = new CompanyAPI(this.logger, { user: this.user });
    const {
      defaultCompanyCurrencyCode, entityIpRates: companyIpRates,
    } = await companyAPI.getIpRates(originalRequest.company._id, 'nodb', 'en');
    const isTranslationOnlyQuote = isTranslationOnly(_.get(originalRequest, 'ipPatent.service'));
    const nodbFeeApi = isTranslationOnlyQuote ? noDbTranslationFeeAPI : noDBTranslationFeeFilingApi;
    const patentCounts = requestAPIHelper.getIpCounts(patent);
    const iqCountries = patent.countries.filter((country) => country.instantQuote);
    const filters = {
      countries: iqCountries.map((c) => c.name),
      companyIpRates,
      ...patentCounts,
      defaultCompanyCurrencyCode,
    };
    const originalCounts = requestAPIHelper.getIpCounts(originalRequest.ipPatent);
    const isSamePatentsCount = _.isEqual(originalCounts, patentCounts);
    let { list: fees } = await nodbFeeApi.list({ ...filters, ...patentCounts });

    fees = fees.map((fee) => ({ ...fee, sourceLanguage: sourceLangName }));
    const requestCountries = await this.getCountryFees(request, originalRequest, fees, !isSamePatentsCount);
    const patentTotal = requestCountries
      .reduce((total, country) => calculateTotal(total, country, translationOnly), 0);
    patent.countries = requestCountries;
    patent.total = patentTotal;
    requestAPIHelper.assignPatent(patent, _.get(originalRequest, 'ipPatent', {}));
  }

  buildQueryProjectionBasedOnUserRoles() {
    const canOnlyReadOwnRequest = this.user.has(['REQUEST_READ_OWN', 'REQUEST_READ_COMPANY'])
      && !this.user.has('REQUEST_READ_ALL');
    const listProjection = {
      bucketPrefixes: 0,
      documents: 0,
      'company.billingInformation': 0,
      'company.retention': 0,
      'company.cidr': 0,
      'company.contact': 0,
      'company.salesRep': 0,
      'company.status': 0,
      'company.pursuitActive': 0,
      'company.industry': 0,
      'company.customerTierLevel': 0,
      'company.website': 0,
      'company.primaryPhoneNumber': 0,
      'company.notes': 0,
      'company.mailingAddress': 0,
      'company.billingAddress': 0,
      'company.billingEmail': 0,
      'company.serviceAgreement': 0,
      'company.internalDepartments': 0,
      'company.locations': 0,
      'company.mandatoryRequestContact': 0,
      'company.serviceAgreementText': 0,
      'company.locationsText': 0,
      'company.purchaseOrderRequiredText': 0,
      'company.grossProfitText': 0,
      'company.onHoldText': 0,
      'company.securityPolicy': 0,
      'company.isOverwritten': 0,
      'company.pcSettings': 0,
      location: 0,
      schedulingStatus: 0,
      partners: 0,
      insuranceCompany: 0,
      internalDepartment: 0,
      tgtLangs: 0,
      contact: 0,
      schedulingCompany: 0,
      schedulingContact: 0,
      pmList: 0,
      projectManagers: 0,
      srcLang: 0,
      workflows: 0,
    };
    if (this.user.type === CONTACT && canOnlyReadOwnRequest) {
      const fieldsToExclude = _.difference(REQUEST_LIST_FIELDS, CONTACT_READ_OWN_FIELDS_PROJECTION);
      fieldsToExclude.forEach((field) => {
        Object.assign(listProjection, { [field]: 0 });
      });
    }
    return listProjection;
  }

  async requestsByCompanyTimeToDeliver(companyId, timeToDeliver) {
    const { lspId } = this;
    const requests = await this.schema.Request.find({
      lspId,
      'company._id': companyId,
      hasTimeToDeliverOptions: true,
      timeToDeliver: {
        $in: timeToDeliver,
      },
    }, '_id').lean();
    return requests;
  }

  async updateIpRequestStatus(request, originalRequest) {
    const ipPatent = _.get(request, 'ipPatent');
    const newCountries = _.get(ipPatent, 'countries', []).filter((c) => c.name !== 'Annuity Payment');
    const updatedCustomCountries = newCountries.filter((c) => !c.instantQuote);
    let isQuoteRequired = updatedCustomCountries.some((c) => c.total === 0);
    const sourceIsoCode = _.get(request, 'languageCombinations.0.srcLangs.0.isoCode', '');
    const isIpSourceLanguage = IP_SRC_LANGUAGES_ISO.includes(sourceIsoCode);
    const applicationNumber = _.get(ipPatent, 'patentApplicationNumber', '');
    const areIpCountsEqual = _.isEqual(
      requestAPIHelper.getIpCounts(_.get(originalRequest, 'ipPatent', {})),
      requestAPIHelper.getIpCounts(ipPatent),
    );

    if (
      (isWipo(applicationNumber) && !isIpSourceLanguage)
      || (isNoDB(ipPatent.database) && (!isTranslationOnly(ipPatent.service) || sourceIsoCode !== 'ENG'))
    ) {
      const originalCountryNames = _.get(originalRequest, 'ipPatent.countries', []).map((c) => c.name);
      const updatedCountryNames = newCountries.map((c) => c.name);
      const addedCountries = _.difference(updatedCountryNames, originalCountryNames);
      if (!_.isEmpty(addedCountries) || !areIpCountsEqual) {
        isQuoteRequired = true;
      }
    }

    if (
      !REQUEST_WAITING_STATUSES.includes(originalRequest.status)
      || !originalRequest.requireQuotation
    ) {
      throw new RestError(400, { message: 'Cannot update request status. Request should be quote' });
    }

    request.status = isQuoteRequired
      ? REQUEST_WAITING_FOR_QUOTE : REQUEST_WAITING_FOR_APPROVAL_STATUS;
  }

  async canContactEditLanguageCombinations(originalRequest) {
    const isUserContact = this.user.type === CONTACT;
    const contactId = _.get(originalRequest, 'contact._id', '');
    const canUpdateIpQuote = this.user.has('IP-QUOTE_UPDATE_OWN') && areObjectIdsEqual(contactId, this.user._id);
    const isStatusWaitingForApproval = _.get(originalRequest, 'status', '') === REQUEST_WAITING_FOR_APPROVAL_STATUS;
    const requestType = _.get(originalRequest, 'requestType.name');
    const isIpRequest = requestType === REQUEST_TYPE_IP_NAME;
    return isIpRequest && isStatusWaitingForApproval && isUserContact && canUpdateIpQuote;
  }

  async removeRegulatoryFieldsFromWorkflow(workflow) {
    if (
      this.canReadAllRegulatoryFields
      || (this.canReadWorkflowRegulatoryFields && isUserPartOfWorkflow(workflow, this.user._id))
    ) {
      return workflow;
    }
    workflow.tasks = await Promise.map(workflow.tasks, async (task) => {
      let isOwnTask = false;
      task.providerTasks = await Promise.map(task.providerTasks, async (providerTask) => {
        const isOwnProviderTask = areObjectIdsEqual(_.get(providerTask, 'provider._id', ''), this.user._id);
        if (isOwnProviderTask) {
          isOwnTask = true;
        }
        if (!(this.canReadOwnRegulatoryFields && isOwnProviderTask)) {
          providerTask.files = await Promise.map(providerTask.files, (file) => _.omit(file, ['createdBy', 'deletedAt', 'deletedBy', 'retentionTime']));
          _.unset(providerTask, ['provider.name']);
        }
        return providerTask;
      });
      if (!(this.canReadOwnRegulatoryFields && isOwnTask)) {
        _.unset(task, ['ability.name']);
      }
      return task;
    });
    return workflow;
  }

  async getCountryFees(
    request,
    originalRequest,
    fees,
    shouldRemapExisted = true,
  ) {
    const countries = _.get(request, 'ipPatent.countries', []);
    const originalCountries = _.get(originalRequest, 'ipPatent.countries', []);
    const sourceLangName = _.get(originalRequest, 'languageCombinations.0.srcLangs.0.name');
    const isTranslationOnlyQuote = isTranslationOnly(_.get(originalRequest, 'ipPatent.service'));
    return await Promise.map(countries, async (country) => {
      const existedCountry = originalCountries.find((c) => c.name === country.name);
      if (!shouldRemapExisted && !_.isNil(existedCountry)) {
        return _.clone(existedCountry);
      }
      const countryFees = fees.find((fee) => _.isEqual(fee.country, country.name));
      const zeroFees = isTranslationOnlyQuote
        ? {
          translationFee: 0,
          total: 0,
        } : {
          agencyFee: 0,
          agencyFeeFixed: 0,
          officialFee: 0,
          translationFee: 0,
          total: 0,
        };
      Object.assign(country, zeroFees);
      if (_.isNil(countryFees)) {
        return country;
      }
      const currencyIsoCode = _.get(originalRequest, 'quoteCurrency.isoCode');
      const feeByIsoCode = {};
      const fieldMapping = getPatentFieldMappingByDatabase(_.get(originalRequest, 'ipPatent.database'));
      if (isNoDB(_.get(originalRequest, 'ipPatent.database')) && !isTranslationOnlyQuote) {
        delete fieldMapping.translationFee;
        feeByIsoCode.translationFee = 0;
      }
      await Promise.map(Object.entries(fieldMapping), ([key, value]) => {
        if (key === 'officialLanguage') {
          feeByIsoCode[key] = _.get(countryFees, value, '');
          return;
        }
        feeByIsoCode[key] = _.toNumber(_.get(countryFees, `${value}.${currencyIsoCode}`, 0));
      });
      return Object.assign(
        countryFees,
        {
          name: countryFees.country,
          sourceLanguage: sourceLangName,
          instantQuote: country.instantQuote,
          directTranslation: countryFees.directTranslation,
          ...feeByIsoCode,
          total: isTranslationOnlyQuote
            ? feeByIsoCode.translationFee : this.totalCountryFee(feeByIsoCode),
        },
        !isTranslationOnlyQuote && {
          activeEntity: _.get(country, 'activeEntity'),
        },
      );
    });
  }

  totalCountryFee({
    translationFee, agencyFee, officialFee, agencyFeeFixed,
  }) {
    return [
      translationFee,
      agencyFee,
      officialFee,
      agencyFeeFixed].reduce((total, fee) => sum(total, Number(fee)), 0).toFixed(2);
  }

  async _createPCatPipelines({
    requestId, files = [], workflows = [], languageCombination,
  }) {
    try {
      const pipelineTypes = [
        PORTALCAT_PIPELINE_TYPE_IMPORT,
        PORTALCAT_PIPELINE_TYPE_QA,
        PORTALCAT_PIPELINE_TYPE_MT,
        PORTALCAT_PIPELINE_TYPE_EXPORT,
        PORTALCAT_PIPELINE_TYPE_LOCKING,
      ];
      const operations = [];
      await Promise.map(files, (fileId) => Promise.map(
        workflows,
        async (workflow) => {
          const operation = await Promise.map(pipelineTypes, async (type) => {
            const existingPipelines = await this.portalCatApi.getPipelines({
              requestId, fileId, type, workflowId: workflow._id,
            });
            if (!_.isEmpty(existingPipelines)) {
              return;
            }
            return this.portalCatApi.buildPcOperation({
              operation: PIPELINE_OPERATION_TYPE_CREATE,
              type,
              languageCombinations: [languageCombination],
              documentId: fileId,
              srcLangFilter: workflow.srcLang.isoCode,
              tgtLangFilter: workflow.tgtLang.isoCode,
              workflowId: workflow._id,
            });
          });
          operations.push(...operation.filter(_.identity));
        },
      ));
      if (!_.isEmpty(operations)) {
        await this.portalCatApi.performPipelinesOperations({
          requestId,
          operations,
        });
      }
    } catch (error) {
      this.logger.error(`Error creating pipelines. Error: ${error.message}`);
    }
  }

  async _runPCatPipelines({
    requestId,
    files = [],
    workflows = [],
    languageCombination,
    pipelineTypes = [],
  }) {
    try {
      await Promise.map(pipelineTypes, async (type) => {
        const operations = [];
        await Promise.map(files, (fileId) => Promise.map(
          workflows,
          async (workflow) => {
            const operation = await this.portalCatApi.buildPcOperation({
              operation: 'run',
              type,
              languageCombinations: [languageCombination],
              documentId: fileId,
              srcLangFilter: workflow.srcLang.isoCode,
              tgtLangFilter: workflow.tgtLang.isoCode,
              workflowId: workflow._id,
            });
            operations.push(operation);
          },
        ));
        await this.portalCatApi.performPipelinesOperations({ requestId, operations });
      });
    } catch (err) {
      this.logger.error(`Error running pipelines. Error: ${err.message}`);
    }
  }

  async importFilesToPCat(requestId, body) {
    const request = await this.schema.Request.findById(requestId).lean();
    if (!requestAPIHelper.isPortalCat(request)) {
      return request;
    }
    const { files = [], workflowCreationStrategy } = body;
    const languageCombination = requestAPIHelper.getLanguageCombinationByDocumentId(request, new ObjectId(_.first(files)));
    if (_.isNil(languageCombination)) {
      throw new RestError(400, 'Invalid document id');
    }
    languageCombination.documents.forEach((document) => {
      if (files.includes(document._id.toString())) {
        document.isPortalCat = true;
      }
    });
    let workflowsForPipelines;
    if (workflowCreationStrategy === WORKFLOW_CREATION_STRATEGY_NEW) {
      workflowsForPipelines = await this.createWorkflowsForLanguageCombination(request, languageCombination);
      request.workflows.push(...workflowsForPipelines);
    } else {
      const languageCombinationPairs = _.flatten(languageCombination.srcLangs.map(
        (srcLang) => languageCombination.tgtLangs.map((tgtLang) => [srcLang, tgtLang]),
      ));
      workflowsForPipelines = await Promise.reduce(languageCombinationPairs, async (workflows, [srcLang, tgtLang]) => {
        let workflow = request.workflows.find(
          (w) => w.srcLang.name === srcLang.name && w.tgtLang.name === tgtLang.name,
        );
        if (_.isNil(workflow)) {
          workflow = await this.createWorkflowsForLanguageCombination(request, {
            srcLangs: [srcLang],
            tgtLangs: [tgtLang],
          });
          workflow = _.first(workflow);
          request.workflows.push(workflow);
        }
        workflows.push(workflow);
        return workflows;
      }, []);
    }
    await this.schema.Request.findOneAndUpdate(
      { _id: requestId },
      {
        $set: {
          workflows: request.workflows,
          'languageCombinations.$[languageCombination]': languageCombination,
        },
      },
      {
        timestamps: false,
        arrayFilters: [{ 'languageCombination._id': languageCombination._id }],
      },
    );
    await this._createPCatPipelines({
      requestId, files, workflows: workflowsForPipelines, languageCombination,
    });
    this._runPCatPipelines({
      requestId,
      files,
      workflows: workflowsForPipelines,
      languageCombination,
      pipelineTypes: [PORTALCAT_PIPELINE_TYPE_IMPORT, PORTALCAT_PIPELINE_TYPE_MT],
    });
    await this.portalCatApi.performRequestAnalysis(requestId);
    this._runPCatPipelines({
      requestId,
      files,
      workflows: workflowsForPipelines,
      languageCombination,
      pipelineTypes: [PORTALCAT_PIPELINE_TYPE_LOCKING],
    });
    const updatedRequest = await this.findOneWithWorkflows(requestId, { withCATData: true });
    this.workflowApi.assignPortalCatSegments(null, updatedRequest, files)
      .catch((err) => this.logger.error(`Error assigning portalcat segments. Error: ${err.message}`));
    const statisticsGenerated = false;
    await this.markStatisticsGenerated(requestId.toString(), statisticsGenerated);
    updatedRequest.pcSettings.statisticsGenerated = statisticsGenerated;
    return updatedRequest;
  }

  async markStatisticsGenerated(requestId, statisticsGenerated = false) {
    const request = await this.schema.Request.findById(requestId);
    request.pcSettings.statisticsGenerated = statisticsGenerated;
    await request.save();
  }
}

module.exports = RequestAPI;
