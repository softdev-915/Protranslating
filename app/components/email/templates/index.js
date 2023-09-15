const _ = require('lodash');
const handlebars = require('handlebars');
const helpers = require('helpers-for-handlebars');
const { v4: uuidV4 } = require('uuid');
const { shouldBuildNotification } = require('../email-notification-trigger');
const EmailNotificationQueue = require('../queue');
const ServerURLFactory = require('../../application/server-url-factory');
const loadCustomHelpers = require('../../../utils/handlebars');

helpers({ handlebars });
loadCustomHelpers(handlebars);

class EmailQueue {
  constructor(logger, schema, configuration) {
    this.logger = logger;
    this.schema = schema;
    this.configuration = configuration;
    this.emailNotificationQueue = new EmailNotificationQueue(logger, schema);
  }

  static serverURL(configuration, path) {
    const serverURLFactory = new ServerURLFactory(configuration);
    const serverURL = serverURLFactory.buildServerURL();

    return `${serverURL}${path}`;
  }

  /**
   * Builds the notification object that triggers the email sender.
   * @param {object}  email
   * @param {string}  email.subject subject's handlebars template string.
   * @param {string}  email.templateName the template name.
   * @param {string}  email.template email's body handlebars template string.
   * @param {object}  email.context context data to build the email.
   * @param {object}  email.context.user target user.
   * @param {string}  email.context.user.email target email address.
   * @param {object}  email.context.user.lsp user's lsp
   * @param {boolean} email.mock whether if this email is a mock or not.
   */
  _build(email) {
    this.logger.debug(`Building email: ${JSON.stringify(email)}`);
    const compiledTemplate = handlebars.compile(email.template);
    const compiledSubject = handlebars.compile(email.subject);
    const emailText = compiledTemplate(email.context);
    const emailSubject = compiledSubject(email.context);
    const defaultContent = [{
      mime: 'text/html',
      data: emailText,
    }];
    const lspId = _.get(email, 'lspId');
    const to = _.get(email, 'to', []);
    const emailTo = [];

    if (to.length === 0) {
      emailTo.push({
        email: _.get(email, 'context.user.email'),
        lastName: _.get(email, 'context.user.lastName'),
        firstName: _.get(email, 'context.user.firstName'),
      });
    } else {
      to.forEach((toAddress) => {
        if (_.isString(toAddress)) {
          emailTo.push({
            email: toAddress,
          });
        } else {
          emailTo.push(toAddress);
        }
      });
    }
    this.logger.debug(`Will send email to: ${to.join(', ')}`);
    // TODO get email from config
    const builtEmail = {
      email: {
        subject: emailSubject,
        'message-id': uuidV4(),
        to: emailTo,
        from: _.get(email, 'from', 'support@biglanguage.com'),
        content: _.get(email, 'content', defaultContent),
        attachment: _.get(email, 'attachment', null),
      },
      type: email.templateName,
      // Set mock=true if you want to avoid sending a real email
      mock: email.mock,
      lspId,
    };
    if (!_.isNil(email.recordId)) {
      builtEmail.recordId = email.recordId;
    }
    const scheduledAt = _.get(email, 'scheduledAt');

    if (!_.isNil(scheduledAt)) {
      builtEmail.scheduledAt = scheduledAt;
    }

    return builtEmail;
  }

  /**
   * Builds the notification object that triggers the email sender.
   * @param {object}  email
   * @param {string}  email.templateName the template name.
   * @param {object}  email.context context data to build the email.
   * @param {object}  email.context.user target user.
   * @param {string}  email.context.user.email target email address.
   * @param {object}  email.context.user.lsp user's lsp
   * @param {boolean} email.mock whether if this email is a mock or not.
   */
  async build(email) {
    const lspId = _.get(email, 'lspId');
    let scheduler;

    if (_.get(email, 'useScheduler', true)) {
      scheduler = await this.schema.Scheduler.findOne({
        name: email.templateName,
        lspId,
      }, {
        name: 1,
        'email.template': 1,
        'email.subject': 1,
      });

      this.logger.debug(`Scheduler found: ${_.get(scheduler, 'name')}`);
      if (!scheduler) {
        return null;
      }
    } else {
      scheduler = email.scheduler;
    }
    Object.assign(email, {
      from: _.get(scheduler, 'email.from'),
      template: scheduler.email.template,
      subject: scheduler.email.subject,
    });
    return this._build(email);
  }

  /**
   * Builds the notification object that triggers the email sender.
   * @param {object}  email
   * @param {string}  email.templateName the template name.
   * @param {object}  email.context context data to build the email.
   * @param {object}  email.context.user target user.
   * @param {string}  email.context.user.email target email address.
   * @param {object}  email.context.user.lsp (optional) user lsp
   * @param {boolean} email.mock whether if this email is a mock or not.
   */
  async send(email) {
    const user = _.get(email, 'context.user');

    if (!_.isNil(user)) {
      const lspId = _.get(email, 'lspId');

      this.logger.debug('About to send email');
      const userIdentity = _.get(user, '_id', _.get(user, 'email', 'unknown'));

      this.logger.debug('User exists');
      if (!lspId) {
        this.logger.debug(`User ${userIdentity} has no lsp`);
        throw new Error(`User ${userIdentity} has no lsp`);
      }
      const inactiveNotifications = _.get(user, 'inactiveNotifications', []);

      this.logger.debug(`User inactive notifications: ${inactiveNotifications}`);
      const templateName = _.get(email, 'templateName');

      if (user.terminated) {
        this.logger.debug(`User ${userIdentity} is terminated. Email will not be sent`);

        // if user is terminated, then don't send anything.
        return false;
      }
      // Check if user has notifications turned off for this template
      if (!shouldBuildNotification(inactiveNotifications, templateName)) {
        this.logger.debug(`User ${userIdentity} can't receive emails because ${templateName} is added to the inactive notifications list array.`);

        return false;
      }
    }
    try {
      this.logger.debug('About to build notification for email');
      const notification = await this.build(email);

      await this.emailNotificationQueue.queueNotification(notification);

      return true;
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Failed to queue email: ${message} => stack: ${err.stack}`);
    }

    // no target email to send.
    return false;
  }
}

module.exports = EmailQueue;
