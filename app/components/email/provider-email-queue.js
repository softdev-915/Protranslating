const _ = require('lodash');
const EmailQueue = require('./templates');

const ALLOWED_SECONDARY_EMAIL_SCHEDULER_NAMES = [
  'bill-paid-provider',
  'service-to-do-provider-notification',
];

class ProviderEmailQueue extends EmailQueue {
  isAllowedToSendToSecondaryEmail(templateName) {
    return ALLOWED_SECONDARY_EMAIL_SCHEDULER_NAMES.includes(templateName);
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
  async send(email) {
    const inactiveSecondaryEmailNotifications =
      _.get(email, 'context.user.inactiveSecondaryEmailNotifications', true);
    const secondaryEmail = _.get(email, 'context.user.secondaryEmail', '');
    if (
      this.isAllowedToSendToSecondaryEmail(email.templateName)
      && !inactiveSecondaryEmailNotifications
      && !_.isEmpty(secondaryEmail)
    ) {
      email.to = [email.context.user.email, secondaryEmail];
    }
    return super.send(email);
  }
}
module.exports = ProviderEmailQueue;
