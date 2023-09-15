const _ = require('lodash');

const INVOICED_STATUS = 'Invoiced';
const PARTIALLY_INVOICED_STATUS = 'Partially Invoiced';
const CANCELLED_STATUS = 'Cancelled';
const NOT_INVOICED_STATUS = 'Not Invoiced';
const getRequestInvoiceStatus = (request) => {
  const hasWorkflows = request.workflows.length > 0;
  const hasWorkflowTasks = request.workflows.every(w => !_.isNil(w.tasks));
  if (!hasWorkflows || !hasWorkflowTasks) {
    return;
  }
  const hasSomeInvoicedDetails = request.workflows.some(workflow =>
    workflow.tasks.some((task) => {
      if (task.status === CANCELLED_STATUS || _.isNil(task.invoiceDetails)) return false;
      return task.invoiceDetails.some(invoiceDetail => _.get(invoiceDetail, 'invoice.isInvoiced', false));
    }),
  );
  const allTasksAreInvoicedOrCancelled = request.workflows
    .every(workflow =>
      workflow.tasks.every(task =>
        task.status === INVOICED_STATUS ||
        task.status === CANCELLED_STATUS));
  const hasAllTasksCancelled = request.workflows.every(workflow =>
    workflow.tasks.every(task => task.status === CANCELLED_STATUS));
  if (hasAllTasksCancelled) {
    return CANCELLED_STATUS;
  }
  if (allTasksAreInvoicedOrCancelled) {
    return INVOICED_STATUS;
  }
  if (hasSomeInvoicedDetails) {
    return PARTIALLY_INVOICED_STATUS;
  }
  return NOT_INVOICED_STATUS;
};

const getCustomFieldsForTemplate = (invoice, template) => {
  let customFields;
  const customFieldsSaved = _.get(invoice, 'templates.invoice.customFields', {});
  if (!_.isEmpty(customFieldsSaved)) {
    customFields = customFieldsSaved;
  } else {
    customFields = _.get(template, 'customFields', {});
  }
  return customFields;
};

const getHiddenFieldsForTemplate = (invoice, template) => {
  let hiddenFields;
  const hiddenFieldsSaved = _.get(invoice, 'templates.invoice.hiddenFields', []);
  if (!_.isEmpty(hiddenFieldsSaved)) {
    hiddenFields = hiddenFieldsSaved;
  } else {
    hiddenFields = _.get(template, 'hiddenFields', []);
  }
  return hiddenFields;
};

module.exports = {
  getRequestInvoiceStatus,
  getCustomFieldsForTemplate,
  getHiddenFieldsForTemplate,
};
