const _ = require('lodash');
const ProviderEmailQueue = require('../../../../components/email/provider-email-queue');
const WorkflowEmailSender = require('../workflow-email-sender');
const WorkflowEmailTriggerFactory = require('../workflow-email-trigger-factory');

const TASK_EMAIL = 'service-to-do-provider-notification';
const TASK_CONSECUTIVE_EMAIL = 'service-to-do-provider-consecutive';
const TASK_CONFERENCE_EMAIL = 'service-to-do-provider-conference';

class WorkflowProviderEmailSender extends WorkflowEmailSender {
  constructor(logger, options, lsp, schema, configuration) {
    super(lsp, schema, configuration);
    this.logger = logger;
    this.mock = _.get(options, 'mock', false);
    this.lspId = _.get(options, 'lspId');
    this.serverUrl = _.get(options, 'serverUrl', '');
    this.emailQueue = new ProviderEmailQueue(this.logger, this.schema, this.configuration);
  }

  sendWorkflowEmails(dbRequest, workflow) {
    try {
      const triggerFactory = new WorkflowEmailTriggerFactory(dbRequest);
      const emailTriggers = triggerFactory.findWorkflowEmailsToSend(workflow);
      if (emailTriggers.length) {
        this.logger.info(`Sending ${emailTriggers.length} workflow emails`);
        return this.sendEmails(dbRequest, emailTriggers);
      }
    } catch (err) {
      const message = err.message || err;
      this.logger.warn(`Error sending workflows email. Error ${message}`);
    }
  }

  sendRequestWorkflowEmails(newRequest, originalRequest) {
    try {
      const triggerFactory = new WorkflowEmailTriggerFactory(originalRequest);
      const emailTriggers = triggerFactory.findEmailsToSend(newRequest);
      if (emailTriggers.length) {
        this.logger.info(`Sending ${emailTriggers.length} workflow emails`);
        return this.sendEmails(newRequest, emailTriggers);
      }
    } catch (err) {
      const message = err.message || err;
      this.logger.warn(`Error sending workflows email. Error ${message}`);
    }
  }

  async _sendEmailToProvider(templateName, emailContext) {
    try {
      return this.emailQueue.send({
        templateName,
        context: emailContext,
        mock: this.mock,
        lspId: this.lspId,
      });
    } catch (err) {
      this.logger.debug(`Failed to queue email for provider ${_.get(emailContext, 'user.email')}. Err: ${err}`);
    }
  }

  sendProviderTaskEmail(request, user, task, enterprise) {
    const internalDepartment = _.get(request, 'internalDepartment.name', '');
    let emailTemplate;
    switch (internalDepartment) {
      case 'Consecutive':
        emailTemplate = TASK_CONSECUTIVE_EMAIL;
        break;
      case 'Conference':
        emailTemplate = TASK_CONFERENCE_EMAIL;
        break;
      case 'LMS-75-Consecutive':
        emailTemplate = TASK_CONSECUTIVE_EMAIL;
        break;
      case 'LMS-75-Conference':
        emailTemplate = TASK_CONFERENCE_EMAIL;
        break;
      default:
        emailTemplate = TASK_EMAIL;
        break;
    }
    return this._sendEmailToProvider(emailTemplate, {
      request,
      path: this.serverUrl,
      user,
      task,
      enterprise,
    });
  }
}

module.exports = WorkflowProviderEmailSender;
