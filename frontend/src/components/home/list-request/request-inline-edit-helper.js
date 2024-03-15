import _ from 'lodash';
import moment from 'moment';
import { getId } from '../../../utils/request-entity';

const PENDING_DOCUMENT_STATE = 'pending';
const TOTAL_REQUEST_FIELDS = [
  'foreignInvoiceTotal',
  'projectedCostTotal',
  'invoiceForeignTotal',
  'billTotal',
  'projectedCostGp',
  'foreignBillTotal',
  'billGp',
  'foreignProjectedCostTotal',
  'invoiceTotal',
];
const WORKFLOW_TYPE_STANDARD = 'Standard';
const DEFAULT_DATA_CLASSIFICATION = 'Public';

export const isActiveDocument = d =>
  !_.isNil(d) &&
  !d.removed &&
  !d.deleted &&
  (_.get(d, 'md5Hash') !== PENDING_DOCUMENT_STATE || _.isEmpty(_.get(d, 'md5Hash', '')));

export const getRequestDocuments = (languageCombinations, languageCombinationId) => {
  let documents = [];
  if (_.isEmpty(languageCombinationId)) {
    documents = _.flatten(_.map(languageCombinations, (l) => l.documents));
  } else {
    const languageCombination = languageCombinations.find((l) => (l._id === languageCombinationId));
    documents = _.get(languageCombination, 'documents', []);
  }
  return documents.filter(d => isActiveDocument(d));
};

const transformProjectManagers = (projectManagers = []) =>
  projectManagers.map(pm => _.get(pm, '_id', pm));
const languageCombinationsIgnoredFields = ['isTranslated'];
const transformLanguageCombinations = languageCombinations =>
  languageCombinations.map((l) => {
    l.documents = l.documents.map((document) => {
      Object.keys(document).forEach((key) => {
        if (!languageCombinationsIgnoredFields.includes(key) && _.isNil(document[key])) {
          document[key] = '';
        }
      });
      return document;
    });
    return l;
  });

export const transformRequest = (request) => {
  const picked = _.pick(request, [
    'title',
    'competenceLevels',
    'referenceNumber',
    'recipient',
    'rooms',
    'atendees',
    'expectedStartDate',
    'actualDeliveryDate',
    'actualStartDate',
    'expectedDurationTime',
    'deliveryDate',
    'internalComments',
    'softwareRequirements',
    'documentTypes',
    'comments',
    'requireQuotation',
    'late',
    'rush',
    'complaint',
    'departmentNotes',
    'workflowTemplate',
    'workflows',
    'readDate',
    'poRequired',
    'adjuster',
    'memo',
    'invoiceCompany',
    'invoiceContact',
    'assignmentStatus',
    'deliveryMethod',
    'requestType',
    'schedulingCompany',
    'schedulingContact',
    'schedulingStatus',
    'location',
    'insuranceCompany',
    'turnaroundTime',
    'workflowType',
    'dataClassification',
    'timeToDeliver',
    'pcSettings',
    'externalAccountingCode',
    'customStringFields',
    'serviceDeliveryTypeRequired',
    'serviceTypeId',
    'deliveryTypeId',
    'repSignOff',
  ]);
  let transformedRequest = {
    ...picked,
    purchaseOrder: _.get(request, 'purchaseOrder', ''),
    poRequired: _.get(request, 'poRequired', false),
    company: getId(request.company),
    otherCC: _.isEmpty(_.get(request, 'otherCC', '')) ? [] : request.otherCC,
    projectManagers: transformProjectManagers(request.projectManagers),
    catTool: _.get(request, 'catTool', ''),
  };
  transformedRequest.requireQuotation = _.get(picked, 'requireQuotation', false);
  transformedRequest.poRequired = _.get(picked, 'poRequired', false);
  if (request._id) {
    transformedRequest._id = request._id;
  }
  transformedRequest.languageCombinations = transformLanguageCombinations(
    request.languageCombinations,
  );
  if (request._id && request.status) {
    transformedRequest.status = request.status;
  }
  const nullableDates = ['expectedStartDate', 'deliveryDate', 'receptionDate', 'actualStartDate', 'actualDeliveryDate'];
  _.forEach(nullableDates, (field) => {
    if (_.isEmpty(transformedRequest[field]) ||
      (moment.isMoment(transformedRequest[field]) &&
      !moment(transformedRequest[field]).isValid())) {
      transformedRequest[field] = '';
    }
  });
  const nullableObjects = [
    'invoiceCompany',
    'invoiceContact',
    'requestType',
    'schedulingCompany',
    'schedulingContact',
    'schedulingStatus',
    'insuranceCompany',
  ];
  _.forEach(nullableObjects, (field) => {
    if (_.isEmpty(_.get(transformedRequest, `${field}._id`))) {
      transformedRequest[field] = null;
    }
  });
  const emptiableObjects = ['deliveryMethod', 'assignmentStatus'];
  _.forEach(emptiableObjects, (field) => {
    if (_.isEmpty(_.get(transformedRequest, `${field}._id`))) {
      transformedRequest[field] = '';
    }
  });
  const notRequiredFieldsByContactCreation = ['quoteCurrency', 'internalDepartment'];
  _.forEach(notRequiredFieldsByContactCreation, (field) => {
    if (_.get(request, `${field}._id`)) {
      transformedRequest[field] = request[field];
    }
  });
  if (request.contact) {
    transformedRequest.contact = getId(request.contact);
  }
  if (request.otherContact) {
    transformedRequest.otherContact = getId(request.otherContact);
  }
  if (!_.isEmpty(request.opportunityNo)) {
    transformedRequest.opportunityNo = request.opportunityNo;
  }
  if (request.salesRep && !_.isNil(_.get(request, 'salesRep._id'))) {
    transformedRequest.salesRep = request.salesRep;
  }
  if (request.quoteDueDate) {
    transformedRequest.quoteDueDate = request.quoteDueDate;
  }
  if (request.expectedQuoteCloseDate) {
    transformedRequest.expectedQuoteCloseDate = request.expectedQuoteCloseDate;
  }
  if (request.partners) {
    transformedRequest.partners = request.partners;
  }
  transformedRequest = _.omit(transformedRequest, TOTAL_REQUEST_FIELDS);
  return _.pickBy(transformedRequest, (fieldValue) => !_.isNil(fieldValue));
};

export const newTemplate = (defaultValues = {}) => ({
  _id: null,
  title: '',
  requireQuotation: false,
  purchaseOrder: '',
  timeToDeliver: '',
  hasTimeToDeliverOptions: false,
  languageCombinations: [{
    tgtLangs: [],
    srcLangs: [],
    documents: [],
  }],
  deliveryDate: '',
  late: false,
  rush: false,
  departmentNotes: '',
  expectedStartDate: null,
  expectedDurationTime: 0,
  recipient: '',
  rooms: 0,
  atendees: 0,
  poRequired: false,
  company: null,
  contact: null,
  otherContact: null,
  otherCC: [],
  comments: '',
  competenceLevels: [],
  schedulingContact: {
    _id: '',
    firstName: '',
    lastName: '',
  },
  schedulingCompany: {
    _id: '',
    name: '',
    hierarchy: '',
  },
  quoteCurrency: {
    _id: '',
    name: '',
    isoCode: '',
  },
  insuranceCompany: {
    _id: '',
    name: '',
    hierarchy: '',
  },
  invoiceCompany: {
    _id: null,
    name: '',
    hierarchy: '',
  },
  invoiceContact: {
    _id: null,
    firstName: '',
    lastName: '',
  },
  memo: '',
  catTool: '',
  adjuster: '',
  documents: [],
  workflows: [],
  projectManagers: [],
  internalDepartment: '',
  documentTypes: [],
  deliveryMethod: '',
  requestType: {
    _id: null,
    name: '',
  },
  dataClassification: DEFAULT_DATA_CLASSIFICATION,
  serviceDeliveryTypeRequired: false,
  serviceTypeId: null,
  deliveryTypeId: null,
  workflowType: WORKFLOW_TYPE_STANDARD,
  schedulingStatus: {
    _id: null,
    name: '',
  },
  assignmentStatus: {
    _id: null,
    name: '',
  },
  location: {
    _id: null,
    name: '',
    address: '',
    suite: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
  },
  softwareRequirements: [],
  internalComments: '',
  requestInvoiceStatus: '',
  externalAccountingCode: {
    _id: null,
    name: '',
  },
  pcSettings: {
    statisticsGenerated: true,
    lockedSegments: {
      includeInClientStatistics: false,
      includeInProviderStatistics: false,
    },
  },
  customStringFields: [],
  ...defaultValues,
});

export const isFileAlreadyAddedToRequest = (request, filename) => {
  const nonDeletedDocuments = request.languageCombinations.map(({ documents }) =>
    documents.filter(d => !d.deleted),
  );
  const doesFilenameExistInSource = _.find(nonDeletedDocuments, documents =>
    _.find(documents, { name: filename }),
  );
  if (doesFilenameExistInSource) {
    return true;
  }
  const doesFilenameExistInFinal = _.find(request.finalDocuments, { name: filename });
  if (doesFilenameExistInFinal) {
    return true;
  }
  const doesFilenameExistInWorkflow = _.find(request.workflows, workflow =>
    _.find(workflow.tasks, task => _.find(task.providerTasks, providerTask =>
      _.find(providerTask.files, { name: filename }))),
  );
  if (doesFilenameExistInWorkflow) {
    return true;
  }
  return false;
};
