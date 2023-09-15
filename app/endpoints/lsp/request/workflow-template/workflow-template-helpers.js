const _ = require('lodash');

const PROVIDER_TASK_OMIT_PROPS = [
  '_id',
  'minCharge',
  'files',
  'total',
  'taskDueDate',
  'instructions',
  'notes',
  'offer',
];

const INVOICE_DETAILS_OMIT_PROPS = [
  '_id',
  'projectedCost.foreignTotal',
  'projectedCost.total',
  'projectedCost.unitPrice',
  'invoice.unitPrice',
  'invoice.total',
  'invoice.foreignTotal',
  'invoice.foreignUnitPrice',
];

const BILL_DETAIL_OMIT_PROPS = [
  '_id',
  'unitPrice',
  'total',
  'quantity',
];

const TASK_OMIT_PROPS = [
  '_id',
  'description',
  'minCharge',
  'foreignMinCharge',
  'total',
  'foreignTotal',
  'foreignSubtotal',
];

const WORKFLOW_OMIT_PROPS = [
  '_id',
  'workflowDueDate',
  'subtotal',
  'foreignSubtotal',
  'projectedCostTotal',
  'createdAt',
  'updatedAt',
];
const ensureNotEmpty = language => (_.isEmpty(language) ? 'None' : language);
const reduceWorkflowsLanguages = (combinations, workflow) => {
  const srcLangName = _.get(workflow, 'srcLang.name');
  const tgtLangName = _.get(workflow, 'tgtLang.name');
  combinations.add(`${ensureNotEmpty(srcLangName)}-${ensureNotEmpty(tgtLangName)}`);
  return combinations;
};
const sanitizeInvoiceDetails = invoiceDetails => _.omit(invoiceDetails, INVOICE_DETAILS_OMIT_PROPS);
const sanitizeBillDetails = billDetails => _.omit(billDetails, BILL_DETAIL_OMIT_PROPS);
const sanitizeProviderTasks = (providerTask) => {
  providerTask.billDetails = providerTask.billDetails.map(sanitizeBillDetails);
  return _.omit(providerTask, PROVIDER_TASK_OMIT_PROPS);
};

const sanitizeTasks = (task) => {
  task.invoiceDetails = task.invoiceDetails.map(sanitizeInvoiceDetails);
  task.providerTasks = task.providerTasks.map(sanitizeProviderTasks);
  return _.omit(task, TASK_OMIT_PROPS);
};

const sanitizeWorkflow = (workflow) => {
  workflow.tasks = workflow.tasks.map(sanitizeTasks);
  return _.omit(workflow, WORKFLOW_OMIT_PROPS);
};

const prepareCompanyAndVendorFilters = (workflow, request) => {
  const { srcLang, tgtLang } = workflow;
  const srcLangName = _.get(srcLang, 'name');
  const tgtLangName = _.get(tgtLang, 'name');
  const quoteCurrency = _.get(request, 'quoteCurrency', {});
  const localCurrency = _.get(request, 'localCurrency', {});
  const internalDepartmentId = _.get(request, 'internalDepartment._id');
  const languageCombination = `${srcLangName} - ${tgtLangName}`;
  const companyRateFilters = {
    quoteCurrency,
    localCurrency,
    internalDepartmentId,
    srcLang,
    tgtLang,
  };
  const vendorRateFilters = {
    sourceLanguage: _.get(srcLang, 'isoCode'),
    targetLanguage: _.get(tgtLang, 'isoCode'),
    internalDepartment: _.get(request, 'internalDepartment', {}),
    catTool: _.get(request, 'catTool', ''),
    company: _.get(request, 'company', ''),
  };
  const companyMinimumChargeFilters = {
    company: _.get(request, 'company._id', ''),
    currencyId: _.get(request, 'quoteCurrency._id'),
    languageCombination,
  };
  const vendorMinimunChargeFilters = { languageCombination };
  return {
    companyMinimumChargeFilters,
    companyRateFilters,
    vendorRateFilters,
    vendorMinimunChargeFilters,
  };
};

module.exports = {
  sanitizeWorkflow,
  prepareCompanyAndVendorFilters,
  reduceWorkflowsLanguages,
};
