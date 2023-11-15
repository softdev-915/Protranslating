import _ from 'lodash';
import bigjs from 'big.js';
import moment from 'moment';

export const PROJECT_MANAGEMENT_TASK = 'project management';
export const PORTALCAT_PREFLIGHT_TASK = 'cat preflight';
export const REFLOW_TASK = 'Reflow';
export const PORTALCAT_SUPPORTED_TASKS = [
  'pemt', 'qa', 'translation', 'editing', PORTALCAT_PREFLIGHT_TASK, REFLOW_TASK, PROJECT_MANAGEMENT_TASK,
];

export const ANALYSIS_IMPORT_TYPE_BILL = 'bill';
export const READ_ALL_WORKFLOW_ROLES = [
  'TASK_READ_ALL',
  'WORKFLOW_READ_ALL',
  'WORKFLOW_UPDATE_ALL',
];
const DISCOUNT_ABILITY = 'Discount';
export const emptyGenericTransaction = () => ({
  breakdown: {
    _id: null,
    name: '',
  },
  currency: {
    _id: null,
    name: '',
  },
  translationUnit: {
    _id: null,
    name: '',
  },
  totalAmount: 0,
  unitPrice: 0,
  minimumCharge: 0,
  quantity: 0,
});
export const emptyBill = () => emptyGenericTransaction();
const emptyProjectedCost = () => emptyGenericTransaction();
export const emptyInvoice = () => {
  const invoice = {
    ...emptyGenericTransaction(),
    key: _.uniqueId(new Date().getTime()),
    visible: false,
  };
  return invoice;
};
export const isValidDate = (date) => (moment.isMoment(date) ? date.isValid() : !_.isEmpty(date));

export const isProjectManagementTask = (task = '') => !!task.match(new RegExp(PROJECT_MANAGEMENT_TASK, 'ig'));

export const isPortalCatPreflightTask = (task = '') => !!task.match(new RegExp(PORTALCAT_PREFLIGHT_TASK, 'ig'));

export const isPortalCatSupported = (task = '') => {
  if (_.isNil(task)) {
    return false;
  }
  const catTaskRegExp = PORTALCAT_SUPPORTED_TASKS.map((supportedTask) => `(${supportedTask})`).join('|');
  return !!task.match(new RegExp(catTaskRegExp, 'ig'));
};

export const emptyInvoiceDetail = () => ({
  _id: null,
  invoice: emptyInvoice(),
  projectedCost: emptyProjectedCost(),
});

export const emptyBillDetail = () => ({
  _id: null,
  breakdown: {
    _id: null,
    name: '',
  },
  currency: {
    _id: null,
    name: '',
  },
  translationUnit: {
    _id: null,
    name: '',
  },
  total: 0,
  unitPrice: 0,
  quantity: 0,
});

export const emptyQuantity = () => ({
  amount: 0,
  units: '',
});

export const emptyProviderTask = () => ({
  _id: null,
  provider: null,
  taskDueDate: null,
  instructions: '',
  status: 'notStarted',
  files: [],
  notes: '',
  minCharge: 0,
  quantity: [emptyQuantity()],
  billDetails: [emptyBillDetail()],
  offer: null,
});

export const emptyTask = () => ({
  _id: null,
  ability: null,
  description: '',
  minCharge: 0,
  includedInGroup: false,
  invoiceDetails: [emptyInvoiceDetail()],
  providerTasks: [emptyProviderTask()],
});

export const emptyWorkflow = () => ({
  _id: null,
  index: 0,
  deleted: false,
  srcLang: {
    name: '',
    isoCode: '',
  },
  tgtLang: {
    name: '',
    isoCode: '',
  },
  description: '',
  subtotal: 0,
  workflowDueDate: null,
  discount: 0,
  tasks: [emptyTask()],
  documents: [],
  useMt: false,
});

export const emptyWorkflowFiles = () => ({
  canEditTask: false,
  canEditAll: false,
  canReadAllTasks: false,
  canDownloadFiles: false,
  isApprovedOrCancelled: false,
  lockPreviouslyCompleted: true,
  isOwnTaskCompleted: false,
  canReadRegulatoryFields: false,
  workflowId: null,
  taskId: null,
  providerTaskId: null,
  workflowIndex: -1,
  taskIndex: -1,
  providerTaskIndex: -1,
  files: [],
});

export const emptyWorkflowNote = () => ({
  canEditTask: false,
  lockPreviouslyCompleted: true,
  isApprovedOrCancelled: false,
  workflowId: null,
  taskId: null,
  providerTaskId: null,
  workflowIndex: -1,
  taskIndex: -1,
  providerTaskIndex: -1,
  note: '',
});

export const emptyAbilitySelected = () => ({
  value: '',
  text: '',
  description: '',
  languageCombination: false,
  internalDepartmentRequired: false,
  competenceLevelRequired: false,
  catTool: false,
});

const isValidBillDetail = (bill) => _.isNumber(bill.quantity) && _.isNumber(bill.unitPrice);

export const isValidProviderTask = (shouldNotContainProvider, providerTask, canReadFinancialFields) => {
  const hasDueDate = isValidDate(providerTask.taskDueDate);
  const provider = _.get(providerTask, 'provider');
  const hasNoProvider = (!shouldNotContainProvider && _.isEmpty(provider))
      || shouldNotContainProvider;
  let areValidBillDetails = true;
  if (_.has(providerTask, 'billDetails') && canReadFinancialFields) {
    areValidBillDetails = providerTask.billDetails.every((bill) => isValidBillDetail(bill));
  }
  return hasDueDate && hasNoProvider && areValidBillDetails;
};

const isValidInvoiceDetail = (task, invoiceDetail, canReadTranslationUnit) => {
  const { invoice } = invoiceDetail;
  if (!_.isNumber(invoice.unitPrice)) {
    return false;
  }
  if (!_.isNumber(invoice.quantity)) {
    return false;
  }
  if (
    _.isEmpty(_.get(invoice.translationUnit, '_id', ''))
    && _.get(task, 'ability', '') !== DISCOUNT_ABILITY
    && canReadTranslationUnit
  ) {
    return false;
  }
  if (_.get(invoice, 'quantity', 0) < 0) {
    return false;
  }
  const unitPrice = _.get(invoice, 'unitPrice', 0);
  if (task.ability === DISCOUNT_ABILITY) {
    return unitPrice < 0;
  }
  return unitPrice >= 0;
};

export const isValidTask = (workflow, task, abilityList, canReadFinancialFields, canReadTranslationUnit) => {
  if (_.isNil(task)) {
    return false;
  }
  if (_.isEmpty(task.ability)) {
    return false;
  }
  const ability = _.find(abilityList, (a) => _.get(a, 'name', _.get(a, 'text')) === task.ability);
  if (_.isNil(ability)) {
    return false;
  }
  let shouldNotContainProvider = true;
  if (_.get(ability, 'languageCombination')
      && _.isEmpty(_.get(workflow, 'srcLang.name'))
      && _.isEmpty(_.get(workflow, 'tgtLang.name'))) {
    shouldNotContainProvider = false;
  }
  let areValidInvoiceDetails = true;
  if (_.has(task, 'invoiceDetails') && canReadFinancialFields) {
    areValidInvoiceDetails = task.invoiceDetails.every((invoiceDetail) => isValidInvoiceDetail(task, invoiceDetail, canReadTranslationUnit));
  }
  return areValidInvoiceDetails
      && task.providerTasks.every((pt) => isValidProviderTask(shouldNotContainProvider, pt, canReadFinancialFields));
};

export const isValidWorkflow = (workflow, abilityList, canReadFinancialFields, canReadTranslationUnit) => {
  if (!isValidDate(_.get(workflow, 'workflowDueDate'))) {
    return false;
  }
  const hasSrcLang = !_.isEmpty(_.get(workflow, 'tgtLang.name'));
  const hasTgtLang = !_.isEmpty(_.get(workflow, 'srcLang.name'));
  if ((hasSrcLang && !hasTgtLang) || (!hasSrcLang && hasTgtLang)) {
    return false;
  }
  if (_.isEmpty(workflow.tasks) || _.isEmpty(abilityList)) {
    return true;
  }
  return workflow.tasks.every((task) => isValidTask(workflow, task, abilityList, canReadFinancialFields, canReadTranslationUnit));
};

export const areValidWorkflows = (workflows) => _.isEmpty(workflows) || workflows.every((w) => isValidWorkflow(w));

const setCurrencyValue = (obj, toNumber = false) => {
  if (obj === 0 || _.isNil(obj)) {
    return 0;
  }
  if (toNumber) {
    if (_.has(obj, 'constructor')) {
      obj = obj.toNumber();
    }
  } else {
    obj = bigjs(obj);
  }
  return obj;
};

export const parseWorkflowCurrencyFields = (workflow, toNumber = false) => {
  const workflowCurrencyFields = ['subtotal'];
  const taskCurrencyFields = ['minCharge'];
  const generalCurrencyFields = ['unitPrice'];
  _.keys(workflow).forEach((key) => {
    if (workflowCurrencyFields.includes(key)) {
      workflow[key] = setCurrencyValue(workflow[key], toNumber);
    }
  });
  if (!_.isNil(workflow.tasks)) {
    workflow.tasks.forEach((task) => {
      _.keys(task).forEach((taskKey) => {
        if (taskCurrencyFields.includes(taskKey)) {
          task[taskKey] = setCurrencyValue(task[taskKey], toNumber);
        }
      });
      if (!_.isEmpty(task.providerTasks)) {
        task.providerTasks.forEach((providerTask) => {
          if (!_.isEmpty(providerTask.billDetails)) {
            providerTask.billDetails.forEach((bill) => {
              _.keys(bill).forEach((billKey) => {
                if (generalCurrencyFields.includes(billKey)) {
                  bill[billKey] = setCurrencyValue(bill[billKey], toNumber);
                }
              });
            });
          }
        });
      }
      if (!_.isEmpty(task.invoiceDetails)) {
        task.invoiceDetails.forEach((invoiceDetail) => {
          _.keys(invoiceDetail.invoice).forEach((invoiceKey) => {
            if (generalCurrencyFields.includes(invoiceKey)) {
              invoiceDetail.invoice[invoiceKey] = setCurrencyValue(invoiceDetail.invoice[invoiceKey], toNumber);
            }
          });
          _.keys(invoiceDetail.projectedCost).forEach((projectedCostKey) => {
            if (generalCurrencyFields.includes(projectedCostKey)) {
              invoiceDetail.projectedCost[projectedCostKey] = setCurrencyValue(invoiceDetail.projectedCost[projectedCostKey], toNumber);
            }
          });
        });
      }
    });
  }
  return workflow;
};

export const getProviderMatchingRateDetail = (filters, rates = []) => {
  let matchingRateDetail = {};
  _.each(rates, (rate) => {
    const ability = _.get(rate, 'ability.name', '');
    const languageCombinationRequired = _.get(filters, 'ability.languageCombination', false);
    const targetLanguage = _.get(rate, 'targetLanguage.name', '');
    const sourceLanguage = _.get(rate, 'sourceLanguage.name', '');
    const company = _.get(rate, 'company.name', '');
    const internalDepartment = _.get(rate, 'internalDepartment.name', '');
    const catTool = _.get(rate, 'catTool', '');
    const matchingConditions = [_.get(filters, 'ability.text', '') === ability];
    if (languageCombinationRequired) {
      matchingConditions.push(_.get(filters, 'sourceLanguage', '') === sourceLanguage);
      matchingConditions.push(_.get(filters, 'targetLanguage', '') === targetLanguage);
    }
    if (!_.isEmpty(company)) {
      matchingConditions.push(_.get(filters, 'company.hierarchy', '') === company);
    }
    if (!_.isEmpty(internalDepartment)) {
      matchingConditions.push(_.get(filters, 'internalDepartment.name', '') === internalDepartment);
    }
    if (!_.isEmpty(catTool)) {
      matchingConditions.push(_.get(filters, 'catTool', '') === catTool);
    }
    if (matchingConditions.every((cond) => cond)) {
      _.each(rate.rateDetails, (rateDetail) => {
        const breakdown = _.get(rateDetail, 'breakdown.name', '');
        const selectedBreakdown = _.get(filters, 'breakdown', '');
        const rateTranslationUnit = _.get(rateDetail, 'translationUnit.name', '');
        const selectedTranslationUnit = _.get(filters, 'translationUnit', '');
        if (breakdown === selectedBreakdown && rateTranslationUnit === selectedTranslationUnit) {
          if (!matchingRateDetail.matches
            || (matchingRateDetail.matches
              && matchingConditions.length > matchingRateDetail.matches)
          ) {
            matchingRateDetail = { ...rateDetail, matches: matchingConditions.length };
          }
        }
      });
    }
  });
  delete matchingRateDetail.matches;
  return matchingRateDetail;
};

export const forEachProviderTask = (requestOrWorkflows, callback) => {
  const workflows = _.get(requestOrWorkflows, 'workflows', _.defaultTo(requestOrWorkflows, []));
  _.forEach(workflows, (w, wi) => {
    const tasks = _.get(w, 'tasks', []);
    _.forEach(tasks, (t, ti) => {
      const providerTasks = _.get(t, 'providerTasks', []);
      _.forEach(providerTasks, (pt, pti) => {
        callback({
          request: requestOrWorkflows,
          workflow: w,
          workflowIndex: wi,
          task: t,
          taskIndex: ti,
          providerTask: pt,
          providerTaskIndex: pti,
        });
      });
    });
  });
};

// Delete provider task files with flag deleted
export const transformWorkflow = (workflow) => {
  const workflowCurrencyFields = ['subtotal', 'foreignSubtotal'];
  const taskCurrencyFields = ['total', 'foreignMinCharge'];
  const generalCurrencyFields = ['foreignSubtotal', 'subtotal', 'total', 'foreignTotal'];
  let transformedWorkflow = _.cloneDeep(workflow);
  delete transformedWorkflow.wasPasted;
  transformedWorkflow = parseWorkflowCurrencyFields(transformedWorkflow, true);
  transformedWorkflow = _.omit(transformedWorkflow, workflowCurrencyFields);
  transformedWorkflow._id = _.defaultTo(transformedWorkflow._id, '');
  if (!_.isEmpty(transformedWorkflow.tasks)) {
    transformedWorkflow.tasks.forEach((t) => {
      t = _.omit(t, taskCurrencyFields);
      if (!_.isEmpty(t.invoiceDetails)) {
        t.invoiceDetails.forEach((invoiceDetail) => {
          ['breakdown', 'translationUnit', '_id'].forEach((field) => {
            if (_.isEmpty(_.get(invoiceDetail, `invoice.${field}._id`))) {
              _.unset(invoiceDetail, `invoice.${field}`);
              invoiceDetail.invoice = _.omit(
                invoiceDetail.invoice,
                generalCurrencyFields,
              );
            }
            if (_.isEmpty(_.get(invoiceDetail, `projectedCost.${field}._id`))) {
              _.unset(invoiceDetail, `projectedCost.${field}`);
              invoiceDetail.projectedCost = _.omit(
                invoiceDetail.projectedCost,
                generalCurrencyFields,
              );
            }
          });
        });
      }
      t.providerTasks.forEach((p) => {
        if (_.isEmpty(_.get(p, 'provider._id'))) {
          _.unset(p, 'provider');
        }
        if (!_.isEmpty(p.billDetails)) {
          p.billDetails.forEach((bill) => {
            ['breakdown', 'translationUnit'].forEach((field) => {
              if (_.isEmpty(_.get(bill, `${field}._id`))) {
                _.unset(bill, field);
              }
            });
          });
        }
      });
    });
  }
  return transformedWorkflow;
};

export const transformWorkflows = (workflows) => {
  const transformedWorkflows = workflows.map((w) => transformWorkflow(w));
  return transformedWorkflows;
};

export const compareWorkflows = (activeValue, originalValue) => {
  const EXCLUDED_KEYS = ['key'];
  const ID_KEYS = ['breakdown', 'translationUnit'];
  if (_.isArray(originalValue)) {
    return originalValue.some((item, index) => compareWorkflows(activeValue[index], item));
  }
  if (_.isObject(originalValue)) {
    return Object.keys(originalValue).some((key) => {
      if (EXCLUDED_KEYS.includes(key)) {
        return false;
      }
      if (ID_KEYS.includes(key)) {
        const originalId = _.get(activeValue, `${key}._id`);
        const activeId = _.get(originalValue, `${key}._id`);
        return compareWorkflows(originalId, activeId);
      }
      return compareWorkflows(_.get(activeValue, key), _.get(originalValue, key));
    });
  }
  const isEmpty = (_.isNil(originalValue) || originalValue === '')
    && (_.isNil(activeValue) || originalValue === '');
  const notEqual = !isEmpty && originalValue !== activeValue;
  return notEqual;
};

export const getProgressByTask = (ability, progressByTasks) => {
  switch (true) {
    case new RegExp('Translation', 'i').test(ability):
      return _.get(progressByTasks, 'translationProgress');
    case new RegExp('Editing', 'i').test(ability):
      return _.get(progressByTasks, 'editingProgress');
    case new RegExp('PEMT', 'i').test(ability):
      return _.get(progressByTasks, 'editingProgress');
    case new RegExp('QA', 'i').test(ability):
      return _.get(progressByTasks, 'qaProgress');
    default: break;
  }
};
