const { Types: { ObjectId } } = require('mongoose');
const _ = require('lodash');
const Promise = require('bluebird');
const { RestError } = require('../../../components/api-response');
const rolesUtils = require('../../../utils/roles');
const { areObjectIdsEqual, extractChildArray } = require('../../../utils/schema');
const { bigJsToNumber } = require('../../../utils/bigjs');

const WORKFLOW_TASK_COMPLETED_STATUS = 'completed';
const DOCUMENT_PENDING_UPLOAD_STATE = 'pending';
const getRequestDocuments = (languageCombinations, languageCombinationId) => {
  let documents = [];

  if (_.isEmpty(languageCombinationId)) {
    documents = extractChildArray(languageCombinations, 'documents');
  } else {
    const languageCombination = languageCombinations.find((l) => areObjectIdsEqual(l, languageCombinationId));

    documents = _.get(languageCombination, 'documents', []);
  }
  return documents;
};

const getLanguageCombinationByDocumentId = (request, documentId) => {
  const languageCombination = request.languageCombinations.find(
    (lc) => !_.isNil(_.find(lc.documents, ['_id', documentId])),
  );
  return languageCombination;
};
const simplyId = (o) => o?._id?.toString();
const simplyHumanName = (o) => {
  if (_.get(o, 'firstName')) {
    return `${o.firstName} ${o.lastName}`;
  }
};
const simplyName = (o) => o.name;
const simplyNumber = (o) => o.number;
const extractValuesForComparisonFromRequest = (toCheck) => {
  let value;
  let oldValue;

  if (_.get(toCheck, 'property.getValue')) {
    oldValue = toCheck.property.getValue(toCheck.request);
    value = toCheck.property.getValue(toCheck.edited);
  } else {
    const propertyName = _.get(toCheck, 'property.name');

    oldValue = _.get(toCheck.request, propertyName);
    value = _.get(toCheck.edited, propertyName);
  }
  return { oldValue, value };
};

/*
* Since the workflow edition relies on the _id to see
* if a workflow exists or not, here we create all the necessary
* _id for the entities.
* New entities will have the isNew property equal to true.
*/
const _generateWorkflowIds = (workflow) => {
  if (!workflow._id) {
    workflow._id = new ObjectId();
  }
  if (workflow.tasks && workflow.tasks.length) {
    return Promise.map(workflow.tasks, async (task) => {
      if (!task._id) {
        task._id = new ObjectId();
      }
      if (task.providerTasks && task.providerTasks.length) {
        await Promise.map(task.providerTasks, async (providerTask) => {
          if (!providerTask._id) {
            providerTask._id = new ObjectId();
            if (_.isNil(_.get(providerTask, 'provider._id'))) {
              delete providerTask.provider;
            }
          }
          if (providerTask.files && providerTask.files.length) {
            await Promise.map(providerTask.files, (file) => {
              if (!file._id) {
                file._id = new ObjectId();
              }
            });
          }
        });
      }
      if (!_.isEmpty(task.invoiceDetails)) {
        await Promise.map(task.invoiceDetails, (invoiceDetail) => {
          if (_.isNil(invoiceDetail._id)) {
            invoiceDetail._id = new ObjectId();
          }
        });
      }
    });
  }
  return Promise.resolve();
};

/**
 * @param {Array|Object} workflows workflow array or a workflow.
 */
const generateWorkflowsIds = async (workflows) => {
  const workflowsArray = _.castArray(workflows);
  await Promise.map(workflowsArray, (workflow) => _generateWorkflowIds(workflow));
};

const canOperateOnBehalf = (isUpdate, roles) => {
  if (isUpdate) {
    return rolesUtils.hasRole('REQUEST_UPDATE_ALL', roles)
      || rolesUtils.hasRole('REQUEST_READ_ASSIGNED-TASK', roles);
  }
  return rolesUtils.hasRole('REQUEST_CREATE_ALL', roles);
};
const canOperateWithOtherCompany = (roles, validRoles) => validRoles.some((r) => rolesUtils.hasRole(r, roles));
const _ifExistsCompare = (obj, prop, value) => {
  const val = _.get(obj, prop);
  if (!_.isNil(val) && !_.isNil(value)) {
    return val.toString() === value.toString();
  }
  return false;
};

const _isCompanyOnHierarchy = (user, company) => {
  let userCompanyId = _.get(user, 'company._id');

  if (userCompanyId) {
    userCompanyId = userCompanyId.toString();
  }
  if (company && company._id.toString() === userCompanyId) {
    return true;
  }
  const userCompanyHierarchy = _.get(user, 'company.hierarchy', '');
  if (!_.isEmpty(company.hierarchy) && !_.isEmpty(userCompanyHierarchy)) {
    return !_.isNil(company.hierarchy.match(userCompanyHierarchy));
  }
  return _ifExistsCompare(company, 'parentCompany._id', userCompanyId)
    || _ifExistsCompare(company, 'parentCompany.parentCompany._id', userCompanyId)
    || _ifExistsCompare(company, 'parentCompany.parentCompany.parentCompany._id', userCompanyId);
};

const isAnAuthorizedContact = (roles, user, request, schema, logger) => {
  // Check if the user has the REQUEST_UPDATE_COMPANY role
  if (!roles.includes('REQUEST_UPDATE_COMPANY')) {
    return Promise.resolve(false);
  }
  // Check if the user belongs to the same company as the request
  const userCurrentCompanyId = _.get(user, 'company._id') || false;
  const requestCompanyId = _.get(request, 'company._id', request.company);
  if (userCurrentCompanyId && requestCompanyId === userCurrentCompanyId) {
    return Promise.resolve(true);
  }
  // Check if the user belongs to a parent company as the request
  return schema.Company.findOne({ _id: new ObjectId(requestCompanyId) }, '_id parentCompany')
    .then((reqCompany) => {
      const isAuthorized = _isCompanyOnHierarchy(user, reqCompany);
      return Promise.resolve(isAuthorized);
    }).catch((err) => {
      logger.error(`Unable to determine request update permissions ${request._id} for user ${user._id}`);
      throw new RestError(500, {
        message: 'Unable to determine request update permissions',
        stack: err.stack,
      });
    });
};
const requestProjectManagers = (request) => _.get(request, 'projectManagers', []);
const getCompletedProviderTasksData = (workflows) => {
  const providers = [];

  _.each(workflows, (workflow) => {
    _.each(workflow.tasks, (task) => {
      _.each(task.providerTasks, (pt) => {
        if (pt.status === WORKFLOW_TASK_COMPLETED_STATUS) {
          providers.push({
            user: {
              email: _.get(pt, 'provider.email'),
            },
            taskDueDate: pt.taskDueDate,
            abilities: _.get(pt, 'provider.abilities'),
            languages: _.get(pt, 'provider.languageCombinations'),
          });
        }
      });
    });
  });
  return providers;
};

const findDeliveringProvider = (request) => {
  if (request.workflows) {
    const len = request.workflows.length;

    for (let i = 0; i < len; i++) {
      const w = request.workflows[i];

      if (w.tasks) {
        const deliverTasks = w.tasks.filter((t) => t.ability === 'Validation and Delivery');
        const dlen = deliverTasks.length;

        if (dlen) {
          for (let j = 0; j < dlen; j++) {
            const task = deliverTasks[j];

            if (task.providerTasks && task.providerTasks.length) {
              const deliveringProviderTask = task.providerTasks.find((pt) => pt.provider);

              if (deliveringProviderTask) {
                return deliveringProviderTask.provider;
              }
            }
          }
        }
      }
    }
  }
  return null;
};

const _prospectToSchema = (newTranslationRequest, additionalData, fullData) => {
  const data = {
    lspId: additionalData.lspId,
    title: newTranslationRequest.title,
    purchaseOrder: newTranslationRequest.purchaseOrder,
    poRequired: newTranslationRequest.poRequired,
    requireQuotation: newTranslationRequest.requireQuotation,
    receptionDate: additionalData.receptionDate || new Date(),
    deliveryDate: newTranslationRequest.deliveryDate,
    quoteDueDate: newTranslationRequest.quoteDueDate,
    expectedQuoteCloseDate: newTranslationRequest.expectedQuoteCloseDate,
    company: additionalData.company,
    comments: newTranslationRequest.comments,
    internalComments: newTranslationRequest.internalComments,
    quoteCurrency: newTranslationRequest.quoteCurrency,
    localCurrency: additionalData.localCurrency,
    competenceLevels: _.get(newTranslationRequest, 'competenceLevels', []),
    otherContact: newTranslationRequest.otherContact || null,
    otherCC: newTranslationRequest.otherCC,
    referenceNumber: newTranslationRequest.referenceNumber,
    recipient: newTranslationRequest.recipient,
    rooms: newTranslationRequest.rooms,
    atendees: newTranslationRequest.atendees,
    late: newTranslationRequest.late,
    rush: newTranslationRequest.rush,
    assignmentStatus: newTranslationRequest.assignmentStatus,
    requestType: newTranslationRequest.requestType,
    schedulingStatus: newTranslationRequest.schedulingStatus,
    partners: newTranslationRequest.partners,
    insuranceCompany: newTranslationRequest.insuranceCompany,
    location: newTranslationRequest.location,
    status: additionalData.status,
    languageCombinations: newTranslationRequest.languageCombinations,
    workflows: newTranslationRequest.workflows,
    opportunityNo: _.get(newTranslationRequest, 'opportunityNo'),
    salesRep: _.get(newTranslationRequest, 'salesRep'),
    projectManagers: requestProjectManagers(newTranslationRequest),
    internalDepartment: _.get(newTranslationRequest, 'internalDepartment'),
    softwareRequirements: _.get(newTranslationRequest, 'softwareRequirements'),
    documentTypes: _.get(newTranslationRequest, 'documentTypes'),
    deliveryMethod: _.get(newTranslationRequest, 'deliveryMethod'),
    turnaroundTime: _.get(newTranslationRequest, 'turnaroundTime', ''),
    adjuster: _.get(newTranslationRequest, 'adjuster', ''),
    memo: _.get(newTranslationRequest, 'memo', ''),
    expectedStartDate: newTranslationRequest.expectedStartDate,
    expectedDurationTime: newTranslationRequest.expectedDurationTime,
    isMocked: _.get(additionalData, 'isMocked', false),
    ipPatent: _.get(newTranslationRequest, 'ipPatent', null),
    workflowType: _.get(newTranslationRequest, 'workflowType', 'Standard'),
    dataClassification: _.get(newTranslationRequest, 'dataClassification'),
    mockPm: _.get(newTranslationRequest, 'mockPm', false),
    timeToDeliver: _.get(newTranslationRequest, 'timeToDeliver'),
    hasTimeToDeliverOptions: _.get(newTranslationRequest, 'hasTimeToDeliverOptions', false),
    catTool: _.get(newTranslationRequest, 'catTool'),
    externalAccountingCode: _.get(newTranslationRequest, 'externalAccountingCode'),
    customStringFields: _.get(newTranslationRequest, 'customStringFields'),
    serviceDeliveryTypeRequired: _.get(newTranslationRequest, 'serviceDeliveryTypeRequired'),
    pcSettings: _.get(newTranslationRequest, 'pcSettings'),
    serviceTypeId: _.get(newTranslationRequest, 'serviceTypeId'),
    deliveryTypeId: _.get(newTranslationRequest, 'deliveryTypeId'),
  };
  const contact = newTranslationRequest.contact || additionalData.contact;

  if (contact) {
    data.contact = contact;
  }

  if (fullData) {
    data._id = newTranslationRequest._id || additionalData._id;
  }
  if (!_.isEmpty(newTranslationRequest.schedulingCompany)) {
    data.schedulingCompany = newTranslationRequest.schedulingCompany;
  }
  if (!_.isEmpty(newTranslationRequest.schedulingContact)) {
    data.schedulingContact = newTranslationRequest.schedulingContact;
  }
  if (additionalData.no) {
    data.no = additionalData.no;
  }
  return data;
};

const processValue = (v, render, simple) => {
  // try getting the hash "value" property, if that fails use the hash
  // if that also resolves to falsy then use "v".
  let processedValue = _.get(simple, 'value', simple);

  if (!processedValue && processedValue !== '') {
    processedValue = v;
  }
  try {
    if (render) {
      if (Array.isArray(v)) {
        processedValue = v.map(render).join(', ');
      } else {
        processedValue = render(v);
      }
    }
  } catch (e) {
    // ignore any error
  }
  return processedValue;
};

const _addModification = (toCheck, simplyOld, simplyValue) => {
  const propertyName = _.get(toCheck, 'property.name');
  const { oldValue, value } = extractValuesForComparisonFromRequest(toCheck);
  const { render } = toCheck.property;

  simplyValue = _.defaultTo(simplyValue, value);
  toCheck.modifications.push({
    name: propertyName,
    oldValue: processValue(oldValue, render, simplyOld),
    value: processValue(value, render, simplyValue),
  });
};
const _isDefined = (v) => !_.isUndefined(v) && !_.isNull(v);
const _findDefinedType = (o) => {
  const type = typeof o;

  if (type === 'object') {
    if (Array.isArray(o)) {
      return 'array';
    }
    if (_.isDate(o)) {
      return 'date';
    }
  }
  return type;
};

const _findType = (toCheck) => {
  const { oldValue, value } = extractValuesForComparisonFromRequest(toCheck);

  if (!_isDefined(oldValue) && !_isDefined(value)) {
    return null;
  }
  if (_isDefined(oldValue)) {
    return _findDefinedType(oldValue);
  }
  return _findDefinedType(value);
};

const _findArrayModification = (toCheck) => {
  const { oldValue, value } = extractValuesForComparisonFromRequest(toCheck);
  let simplyOldHash = oldValue;
  let simplyHash = value;

  try {
    if (!_.isNil(_.get(toCheck, 'property.hash'))) {
      simplyOldHash = oldValue ? oldValue.map(toCheck.property.hash) : [];
      simplyHash = value ? value.map(toCheck.property.hash) : [];
    }
  } catch (e) {
    // ignore any error
  }
  if (toCheck.property.findModifications) {
    return toCheck.property.findModifications(toCheck, simplyHash, simplyOldHash);
  }
  const changes = _.xor(simplyOldHash, simplyHash);
  const removedValues = changes.filter((changedValue) => simplyOldHash.find((l) => l === changedValue));
  const addedValues = changes.filter((changedValue) => simplyHash.find((l) => l === changedValue));
  if (!_.isEmpty(removedValues)) {
    _addModification(toCheck, removedValues, '');
  }
  if (!_.isEmpty(addedValues)) {
    _addModification(toCheck, addedValues, '');
  }
};

const _findObjectModification = (toCheck) => {
  const { oldValue, value } = extractValuesForComparisonFromRequest(toCheck);
  const { hash } = toCheck.property;

  if (hash) {
    let simplyOldValue = oldValue;
    let simplyValue = value;

    if (_isDefined(oldValue)) {
      simplyOldValue = hash(oldValue);
    }
    if (_isDefined(value)) {
      simplyValue = hash(value);
    }
    if (_.isNil(simplyOldValue) && _.isNil(simplyValue)) {
      return false;
    }
    if (simplyOldValue !== simplyValue) {
      _addModification(toCheck, simplyOldValue, simplyValue);
      return true;
    }
  } else if (!_.isEqual(oldValue, value)) {
    _addModification(toCheck);
    return true;
  }
};

const _findModification = (toCheck) => {
  let { oldValue, value } = extractValuesForComparisonFromRequest(toCheck);
  const type = _findType(toCheck);

  switch (type) {
    case 'array': {
      _findArrayModification(toCheck);
      break;
    }
    case 'date': {
      // either oldValue or value exist at this point because _findType returned a type.
      if (!_.isDate(oldValue) && !_.isEmpty(oldValue)) {
        oldValue = new Date(oldValue);
      }
      if (!_.isDate(value) && !_.isEmpty(value)) {
        value = new Date(value);
      }
      const oldValueTime = _.isDate(oldValue) ? oldValue.getTime() : oldValue;
      const timeValue = _.isDate(value) ? value.getTime() : value;

      if (!_isDefined(oldValue) || !_isDefined(value)
        || oldValueTime !== timeValue) {
        _addModification(toCheck);
      }
      break;
    }
    case 'object': {
      _findObjectModification(toCheck);
      break;
    }
    default: {
      if (type !== null) {
        if (oldValue !== value) {
          _addModification(toCheck);
          return true;
        }
      }
    }
  }
};
const requestProperties = [
  { name: 'title' },
  { name: 'otherCC' },
  { name: 'comments' },
  { name: 'deliveryDate' },
  { name: 'receptionDate' },
  { name: 'requireQuotation' },
  { name: 'invoices', hash: simplyNumber },
  { name: 'otherContact', hash: simplyId, render: simplyHumanName },
  { name: 'projectManager', hash: simplyId, render: simplyHumanName },
  {
    name: 'srcLangs',
    render: simplyName,
    getValue: (request) => extractChildArray(request.languageCombinations, 'srcLangs'),
    hash: simplyName,
  },
  {
    name: 'tgtLangs',
    render: simplyName,
    getValue: (request) => extractChildArray(request.languageCombinations, 'tgtLangs'),
    hash: simplyName,
  },
  {
    name: 'documents',
    getValue: (request) => extractChildArray(request.languageCombinations, 'documents'),
    findModifications: (toCheck, newDocuments, oldDocuments) => {
      const documentObjects = newDocuments.map((d) => {
        if (_.isFunction(d.toObject)) {
          return d.toObject();
        }
        return d;
      });
      const isDocAlreadyUploaded = (d) => d.md5Hash !== DOCUMENT_PENDING_UPLOAD_STATE && !d.deleted;
      const updatedDocuments = documentObjects.filter(isDocAlreadyUploaded);
      const oldNonDeletedDocuments = oldDocuments.filter(isDocAlreadyUploaded);
      const hasNewDocuments = updatedDocuments.length !== oldNonDeletedDocuments.length;

      if (_.isEmpty(updatedDocuments)) return;
      const documentsMatches = _.intersectionBy(updatedDocuments, oldNonDeletedDocuments, 'md5Hash');
      const haveDocumentsChanged = documentsMatches.length !== oldNonDeletedDocuments.length;

      if (hasNewDocuments || haveDocumentsChanged) {
        const newAndOldDocuments = _.concat(oldNonDeletedDocuments, updatedDocuments);

        toCheck.modifications.push({
          name: 'documents',
          oldValue: _.uniqBy(_.sortBy(oldDocuments, 'name'), '_id'),
          value: _.uniqBy(_.sortBy(newAndOldDocuments, 'name'), '_id'),
        });
      }
    },
  },
];

const _findModifications = (request, edited) => {
  let modifications = [];

  requestProperties.forEach((property) => {
    _findModification({
      request,
      edited,
      modifications,
      property,
    });
  });
  modifications = modifications.filter((m) => {
    if (Array.isArray(m.oldValue) || Array.isArray(m.value)) {
      return m;
    }
    return !_.isEmpty(m.oldValue) && !_.isEmpty(m.value);
  });
  return modifications;
};

const fileList = (request, filter, fileStorageGenerator) => {
  const files = getRequestDocuments(request.languageCombinations).filter(filter);

  if (!files.length) {
    this.logger.info(`Request ${request._id} has no files`);
    throw new RestError(400, { message: 'No documents available to download' });
  }
  return files.map((f) => {
    const fsf = fileStorageGenerator(request, f);

    fsf.__file__name__ = f.name;
    fsf.cloudKey = _.get(f, 'cloudKey');
    return fsf;
  });
};

const finalFilesList = (request, fileStorageFacade) => {
  const fileStorageGenerator = (r, f) => fileStorageFacade
    .translationRequestFinalFile(_.get(r, 'company._id'), r, f);
  const files = request.finalDocuments.filter((d) => !d.deletedByRetentionPolicyAt);

  if (!files.length) {
    this.logger.info(`Request ${request._id} has no files`);
    throw new RestError(400, { message: 'No documents available to download' });
  }
  return files.map((f) => {
    const fsf = fileStorageGenerator(request, f);

    fsf.__file__name__ = f.name;
    fsf.cloudKey = _.get(f, 'cloudKey');
    return fsf;
  });
};

const srcFilesList = (request, fileStorageFacade) => {
  const fileStorageGenerator = (r, f) => fileStorageFacade
    .translationRequestFile(_.get(r, 'company._id'), r, f);
  return fileList(request, (d) => !d.deletedByRetentionPolicyAt, fileStorageGenerator);
};

const fileListFactory = (request, fileStorageFacade, type) => {
  if (type === 'final') {
    return finalFilesList(request, fileStorageFacade);
  }
  return srcFilesList(request, fileStorageFacade);
};

const getStatusMatchQuery = (statusSearchTerm, statusValues) => {
  const statusMatchQuery = {};

  if (_.isEmpty(statusSearchTerm)) {
    return statusMatchQuery;
  }

  const statuses = statusValues
    .filter(({ text }) => {
      if (_.isString(statusSearchTerm)) {
        statusSearchTerm = [statusSearchTerm];
      }
      return statusSearchTerm.some((status) => status.toLowerCase() === text.toLowerCase());
    })
    .map((t) => t.value);

  if (statuses.length) {
    statusMatchQuery.$in = statuses;
  }
  return statusMatchQuery;
};

const getValidStatuses = (status, requestStatuses) => requestStatuses.filter(
  (requestStatus) => requestStatus.toLowerCase().includes(status.toLowerCase()),
);

const isPortalCat = (request = {}) => {
  const catTool = _.defaultTo(request.catTool, '');
  return (/portal.*cat|cat.*portal/i).test(catTool);
};

const getLanguageCombinationsChanges = (oldRequest, newRequest) => {
  const modifications = _findModifications(oldRequest, newRequest);
  return modifications.filter((modification) => modification.name === 'srcLangs' || modification.name === 'tgtLangs');
};
const extractPlainText = (html) => html.replace(/<[^>]+>/g, '').replace(/&[^\s;]+;/g, '');
const getIpCounts = (patent) => {
  let claimWordCount = _.get(patent, 'claimWordCount', 0);
  let claimsWordCount = _.get(patent, 'claimsWordCount', 0);
  if (claimWordCount === 0 && claimsWordCount !== 0) {
    claimWordCount = claimsWordCount;
  }
  if (claimsWordCount === 0 && claimWordCount !== 0) {
    claimsWordCount = claimWordCount;
  }
  const countKeys = [
    'descriptionWordCount',
    'drawingsWordCount',
    'abstractWordCount',
    'specificationWordCount',
    'drawingsPageCount',
    'numberOfTotalPages',
    'numberOfClaims',
    'claimsPageCount',
    'descriptionPageCount',
    'numberOfPriorityApplications',
    'applicantCount',
    'totalNumberOfPages',
    'numberOfIndependentClaims',
    'numberOfDrawings',
  ];
  const counts = {};
  countKeys.forEach((key) => {
    counts[key] = _.toNumber(_.get(patent, key, 0));
  });
  return {
    ...counts,
    claimWordCount,
    claimsWordCount,
  };
};
const assignPatent = (patent, originalPatent) => {
  Object.assign(patent, {
    countries: _.get(patent, 'countries', originalPatent.countries),
    abstractWordCount: _.get(patent, 'abstractWordCount', originalPatent.abstractWordCount),
    descriptionWordCount: _.get(patent, 'descriptionWordCount', originalPatent.descriptionWordCount),
    claimsWordCount: _.get(patent, 'claimsWordCount', originalPatent.claimsWordCount),
    drawingsWordCount: _.get(patent, 'drawingsWordCount', originalPatent.drawingsWordCount),
    drawingsPageCount: _.get(patent, 'drawingsPageCount', originalPatent.drawingsPageCount),
    descriptionPageCount: _.get(patent, 'descriptionPageCount', originalPatent.descriptionPageCount),
    claimsPageCount: _.get(patent, 'claimsPageCount', originalPatent.claimsPageCount),
    numberOfClaims: _.get(patent, 'numberOfClaims', originalPatent.numberOfClaims),
    numberOfDrawings: _.get(patent, 'numberOfDrawings', originalPatent.numberOfDrawings),
    totalNumberOfPages: _.get(patent, 'totalNumberOfPages', originalPatent.totalNumberOfPages),
    numberOfTotalPages: _.get(patent, 'numberOfTotalPages', originalPatent.numberOfTotalPages),
    numberOfPriorityApplications: _.get(
      patent,
      'numberOfPriorityApplications',
      originalPatent.numberOfPriorityApplications,
    ),
    numberOfIndependentClaims: _.get(
      patent,
      'numberOfIndependentClaims',
      originalPatent.numberOfIndependentClaims,
    ),
    total: bigJsToNumber(_.get(patent, 'total', originalPatent.total)),
  });
};

module.exports = {
  getRequestDocuments,
  fileListFactory,
  generateWorkflowsIds,
  isAnAuthorizedContact,
  canOperateOnBehalf,
  canOperateWithOtherCompany,
  findDeliveringProvider,
  _isCompanyOnHierarchy,
  _prospectToSchema,
  requestProjectManagers,
  _findModification,
  _findModifications,
  getCompletedProviderTasksData,
  getStatusMatchQuery,
  getValidStatuses,
  getLanguageCombinationByDocumentId,
  isPortalCat,
  getLanguageCombinationsChanges,
  extractPlainText,
  getIpCounts,
  assignPatent,
};
