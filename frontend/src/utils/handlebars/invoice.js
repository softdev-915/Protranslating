import _ from 'lodash';

const DISCOUNT = 'Discount';
const isDiscountWorkflow = workflow => _.get(workflow, 'tasks.0.ability', '') === DISCOUNT;
const shouldShowTask = workflow => _.some(workflow.tasks,
  task => _.some(task.invoiceDetails, inv => inv.invoice.pdfPrintable));

export const noBreakDownTitle = function (title) {
  const titleSplit = title.split('-');
  return `${titleSplit.slice(0, 2).join('-')}: ${titleSplit.slice(2).join('-')}`;
};

export const isFirstTaskDiscounted = function (workflow, options) {
  const taskAbility = _.get(workflow, 'tasks[0].ability', '');
  if (taskAbility === 'Discount') {
    return options.fn(this);
  }
  return options.inverse(this);
};

export const showWorkflow = function (workflow, options) {
  const showInvoice = shouldShowTask(workflow);
  if (showInvoice) {
    return options.fn(this);
  }
  return options.inverse(this);
};

export const eachLinguistWorkflow = function (workflows, options) {
  const TRANSLATION = 'Translation';
  const PREMIUM_BREAKDOWN = 'Premium Urgency';
  const PROFESSIONAL_BREAKDOWN = 'Professional Urgency';
  const STANDARD_BREAKDOWN = 'Standard-Urgency';
  const serviceTypesBreakdowns = [
    PREMIUM_BREAKDOWN,
    PROFESSIONAL_BREAKDOWN,
    STANDARD_BREAKDOWN,
  ];
  const discountWorkflowIdx = workflows.findIndex(isDiscountWorkflow);
  let discountWorkflow;
  let discountPercentage = 0;
  if (discountWorkflowIdx !== -1) {
    discountWorkflow = workflows[discountWorkflowIdx];
    const description = _.get(discountWorkflow, 'description');
    const parsedDiscountPercentage = parseFloat(description);
    if (!_.isNaN(parsedDiscountPercentage)) {
      discountPercentage = Math.abs(parsedDiscountPercentage);
    }
  }
  let result = '';
  result += options.fn({
    isHeader: true,
    discount: discountWorkflow,
  });
  workflows.forEach((workflow) => {
    if (!shouldShowTask(workflow) || isDiscountWorkflow(workflow)) return;
    let invoiceDetails;
    const invoiceMap = {};
    const tasks = _.get(workflow, 'tasks', []);
    tasks.forEach((task) => {
      const ability = _.get(task, 'ability', '');
      if (ability === DISCOUNT || !ability.includes(TRANSLATION)) return;
      invoiceDetails = _.get(task, 'invoiceDetails');
      invoiceDetails.forEach((inv) => {
        const breakdown = _.get(inv, 'invoice.breakdown.name', '');
        const serviceTypeBreakdown = serviceTypesBreakdowns.find(br => breakdown.startsWith(br));
        if (_.isNil(serviceTypeBreakdown)) return;
        if (!_.isNil(discountWorkflow)) {
          Object.assign(inv, { originalAmount: (_.get(inv, 'invoice.foreignTotal', 0) * 100) / (100 - discountPercentage) });
        }
        invoiceMap[serviceTypeBreakdown] = inv;
      });
      const item = {
        workflow,
        isHeader: false,
        discount: discountWorkflow,
        premiumBreakdown: invoiceMap[PREMIUM_BREAKDOWN],
        professionalBreakdown: invoiceMap[PROFESSIONAL_BREAKDOWN],
        standardBreakdown: invoiceMap[STANDARD_BREAKDOWN],
      };
      result += options.fn(item);
    });
  });
  return result;
};

export const getExtraLanguageCustomField = (custom, field, selectedLang) => _.get(custom, `${field}${selectedLang}`, '');

export const canShowExtraLanguageCustomField = (custom, field, selectedLang) => _.get(custom, `${field}${selectedLang}`, '')
  .replace(/(<([^>]+)>)/gi, '')
  .replace('&nbsp;', '')
  .trim() !== '';
