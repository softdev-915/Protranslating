const NotificationScheduler = require('./notifications');
const BackupScheduler = require('./backups');
const InactivateUserScheduler = require('./user');
const RemoveUserSessionsScheduler = require('./user/remove-user-sessions');
const SchedulerInWrapper = require('./scheduler-job-observer');
const DocumentRetentionScheduler = require('./document-retention');
const CustomQueryScheduler = require('./custom-query');
const SiConnectorScheduler = require('./connector/si-connector');
const { models: mongooseSchema } = require('../database/mongo');
const { SCHEDULER_NAME_LAST_RESULT: CUSTOM_QUERY_SCHEDULER_NAME_LAST_RESULT } = require('../../utils/custom-query');
const BillMonthlyVendorScheduler = require('./bill-monthly-vendor');
const BillInvoicePerPeriodScheduler = require('./bill-invoice-per-period');
const BillFlatRateScheduler = require('./bill-flat-rate');
const BillVariableRateScheduler = require('./bill-variable-rate');
const CcPaymentsScheduler = require('./credit-card-payments');
const RequestTextRecognitionScheduler = require('./pdf-to-mt/pdt-to-mt-recognition-scheduler');
const RequestTextTranslationScheduler = require('./pdf-to-mt/pdt-to-mt-translation-scheduler');
const RequestOCRDeletingScheduler = require('./pdf-to-mt/pdt-to-mt-deleting-scheduler');
const ProviderPoolingOfferScheduler = require('./provider-pooling-offer');
const AutoPmTasksScheduler = require('./auto-pm-tasks');
const InvoicePosterScheduler = require('./invoice-poster');
const ApPaymentPosterScheduler = require('./ap-payment-poster');

const knownSchedulerCallback = {
  forgotPassword: (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('forgotPassword', configuration)),
  'request-creation-email': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('request-creation-email', configuration)),
  'request-creation-pm-email': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('request-creation-pm-email', configuration)),
  'request-delivered-email': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('request-delivered-email', configuration)),
  'quoted-request-creation-pm-email': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('quoted-request-creation-pm-email', configuration)),
  'request-modified-pm-email': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('request-modified-pm-email', configuration)),
  'quote-client-approved-pm-email': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('quote-client-approved-pm-email', configuration)),
  'provider-availability-email': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('provider-availability-email', configuration)),
  'backup-notifications-monthly': (configuration) => new SchedulerInWrapper(mongooseSchema, new BackupScheduler('backup-notifications-monthly', configuration)),
  'service-to-do-provider-notification': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('service-to-do-provider-notification', configuration)),
  'service-to-do-provider-consecutive': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('service-to-do-provider-consecutive', configuration)),
  'service-to-do-provider-conference': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('service-to-do-provider-conference', configuration)),
  'inactivate-user': (configuration, options) => new SchedulerInWrapper(mongooseSchema, new InactivateUserScheduler('inactivate-user', configuration, options)),
  'remove-user-sessions': (configuration, options) => new SchedulerInWrapper(mongooseSchema, new RemoveUserSessionsScheduler('remove-user-sessions', configuration, options)),
  'document-retention-policy': (configuration, options, schema) => new SchedulerInWrapper(mongooseSchema, new DocumentRetentionScheduler('document-retention-policy', configuration, options, schema)),
  'user-feedback-create-for-auditor': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('user-feedback-create-for-auditor', configuration)),
  'user-feedback-update-for-auditor': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('user-feedback-update-for-auditor', configuration)),
  'competence-audit-create': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('competence-audit-create', configuration)),
  'competence-audit-update': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('competence-audit-update', configuration)),
  'bill-pending-approval-provider': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('bill-pending-approval-provider', configuration)),
  'bill-paid-provider': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('bill-paid-provider', configuration)),
  'quote-pending-approval-contact': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('quote-pending-approval-contact', configuration)),
  'custom-query-run': (configuration, options, schema) => new SchedulerInWrapper(mongooseSchema, new CustomQueryScheduler(schema)),
  'custom-query-last-result': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler(CUSTOM_QUERY_SCHEDULER_NAME_LAST_RESULT, configuration)),
  'si-connector': () => new SchedulerInWrapper(mongooseSchema, new SiConnectorScheduler()),
  'bill-invoice-per-period': (configuration, options, schema) => new SchedulerInWrapper(mongooseSchema, new BillInvoicePerPeriodScheduler(schema)),
  'bill-monthly-vendor': (configuration, options, schema) => new SchedulerInWrapper(mongooseSchema, new BillMonthlyVendorScheduler(schema)),
  'bill-flat-rate': (configuration, options, schema) => new SchedulerInWrapper(mongooseSchema, new BillFlatRateScheduler(schema)),
  'bill-variable-rate': (configuration, options, schema) => new SchedulerInWrapper(mongooseSchema, new BillVariableRateScheduler(schema)),
  'credit-card-payments': (configuration, options, schema) => new SchedulerInWrapper(mongooseSchema, new CcPaymentsScheduler(configuration, options, schema)),
  'invoice-submission-notification': (configuration, options) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('invoice-submission-notification', configuration, options, 'Activity')),
  'requesting-customized-quote-email': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('requesting-customized-quote-email', configuration)),
  'requesting-quote-email': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('requesting-quote-email', configuration)),
  'auto-pdf-to-mt-text-recognition': (configuration, options, schema) => new SchedulerInWrapper(mongooseSchema, new RequestTextRecognitionScheduler(schema)),
  'auto-pdf-to-mt-text-translation': (configuration, options, schema) => new SchedulerInWrapper(mongooseSchema, new RequestTextTranslationScheduler(schema)),
  'auto-pdf-to-mt-text-deleting': (configuration, options, schema) => new SchedulerInWrapper(mongooseSchema, new RequestOCRDeletingScheduler(schema)),
  'provider-offers-tasks-notification': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('provider-offers-tasks-notification', configuration)),
  'provider-offers-tasks-urgent-notification': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('provider-offers-tasks-urgent-notification', configuration)),
  'provider-offers-closed-tasks-notification': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('provider-offers-closed-tasks-notification', configuration)),
  'provider-offers-accepted-tasks-notification': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('provider-offers-accepted-tasks-notification', configuration)),
  'provider-offers-expired-tasks-notification': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('provider-offers-expired-tasks-notification', configuration)),
  'task-overdue-notification': (configuration) => new SchedulerInWrapper(mongooseSchema, new NotificationScheduler('task-overdue-notification', configuration)),
  'provider-pooling-offer': (configuration, options, schema) => new SchedulerInWrapper(mongooseSchema, new ProviderPoolingOfferScheduler(configuration, schema)),
  'auto-pm-tasks': (configuration, options, schema) => new SchedulerInWrapper(mongooseSchema, new AutoPmTasksScheduler(configuration, schema)),
  'invoice-poster': () => new SchedulerInWrapper(mongooseSchema, new InvoicePosterScheduler()),
  'ap-payment-poster': () => new SchedulerInWrapper(mongooseSchema, new ApPaymentPosterScheduler()),
};
const availableSchedulers = Object.keys(knownSchedulerCallback);
const schedulerFactory = (scheduler, configuration) => {
  if (knownSchedulerCallback[scheduler.name]) {
    return knownSchedulerCallback[scheduler.name](
      configuration,
      scheduler.options.additionalValues,
      mongooseSchema,
    );
  }
  return null;
};

module.exports = {
  schedulerFactory,
  availableSchedulers,
};
