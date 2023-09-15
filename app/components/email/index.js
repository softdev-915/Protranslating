const _ = require('lodash');
const Promise = require('bluebird');
const emailjs = require('emailjs');
const CloudStorage = require('../cloud-storage');
const configuration = require('../configuration');
const { ACTIVITY_ATTACHMENT_STORAGE_GCS } = require('./email-consts');

class EmailServerConfigFactory {
  constructor(emailConfig) {
    this.emailConfig = emailConfig;
    this.emailConnectionString = _.get(this.emailConfig, 'emailConnectionString');
  }

  parseDefaultConnection() {
    return this._buildEmailConfig(this.emailConnectionString);
  }

  /*
  * Expects configurations like
  * smtp(s)://user:password@host:port
  * smtp(s)://host:port
  */
  _buildEmailConfig(connString) {
    if (_.isEmpty(connString)) {
      throw new Error('Email configuration error: Empty connection string');
    }
    const emailServerConfig = {
      host: '',
      port: '',
      user: '',
      password: '',
      tls: false,
      ssl: false,
      authentication: ['PLAIN', 'LOGIN'],
    };
    const splitProtocol = /\/\//;
    const parts = connString.split(splitProtocol);

    if (parts.length !== 2) {
      throw new Error('Email configuration error: could not detect protocol');
    }
    const credentialsAndServer = parts[1].split(/@/);
    let serverConfig;

    if (credentialsAndServer.length === 1) {
      // there's only server
      delete emailServerConfig.user;
      delete emailServerConfig.password;
      delete emailServerConfig.authentication;
      serverConfig = credentialsAndServer[0].split(':');
    } else if (credentialsAndServer.length === 2) {
      // there's user / pass and server configs
      const userConfig = credentialsAndServer[0].split(':');

      serverConfig = credentialsAndServer[1].split(':');
      [emailServerConfig.user, emailServerConfig.password = ''] = userConfig;
    } else if (credentialsAndServer.length === 3) {
      // special case
      // smtp://email@account.com:pass@host:port
      serverConfig = credentialsAndServer.pop().split(':');
      const userConfig = credentialsAndServer.join('@').split(':');

      [emailServerConfig.user, emailServerConfig.password = ''] = userConfig;
    } else {
      // TODO: fix special case password can have @
      throw new Error('Email configuration error: please check your connection string');
    }
    [emailServerConfig.host, emailServerConfig.port = ''] = serverConfig;

    if (parts[0] === 'smtps:') {
      emailServerConfig.tls = true;
    }
    return emailServerConfig;
  }
}

const flattenEmailTo = (email) => {
  let emails = '';
  const totalTo = email.to.length;

  email.to.forEach((e, index) => {
    if (e.email) {
      emails += `${e.email}<${e.email}>`;
      if (totalTo > index + 1) {
        emails += ', ';
      }
    }
  });
  return emails;
};

const findContentType = (email, contentType) => {
  if (Array.isArray(email.content)) {
    const contentsLen = email.content.length;

    for (let i = 0; i < contentsLen; i++) {
      if (email.content[i].mime === contentType) {
        return email.content[i];
      }
    }
  } else if (email.content.mime === contentType) {
    return email.content;
  }
  return null;
};

class EmailSender {
  constructor(logger, from, emailConfig) {
    this.cloudStorage = new CloudStorage(configuration);
    this.logger = logger;
    this.from = from;
    const emailServerConfigFactory = new EmailServerConfigFactory(emailConfig);
    const emailConfiguration = emailServerConfigFactory.parseDefaultConnection();
    const emailServerFactory = (config) => emailjs.server.connect(config);

    this.server = emailServerFactory(emailConfiguration);
  }

  async send(email) {
    const emailToSend = {
      from: this.from,
      subject: email.subject,
    };

    emailToSend.to = flattenEmailTo(email);
    this.logger.debug(`Preparing email ${email} for "${emailToSend.to}"`);
    const emailText = findContentType(email, 'text/plain');

    if (!_.isEmpty(emailText)) {
      emailToSend.text = emailText;
    } else {
      const content = findContentType(email, 'text/html');

      emailToSend.text = _.get(content, 'data', '');
    }
    if (typeof email['message-id'] !== 'undefined') {
      emailToSend['message-id'] = email['message-id'];
    }
    const attachment = await this._buildAttachment(email);
    if (attachment) {
      emailToSend.attachment = attachment;
    }
    if (emailToSend.text === undefined && emailToSend.attachment === undefined) {
      throw new Error('Could not produce anything sendable');
    }
    return new Promise((resolve, reject) => {
      this.logger.debug(`Sending email to "${emailToSend.to}"`);
      this.server.send(emailToSend, (err, message) => {
        if (err) {
          this.logger.error(`Error sending email to "${emailToSend.to}": ${err}`);
          reject(err);
        } else {
          this.logger.debug(`Email sent to "${emailToSend.to}": ${JSON.stringify(message)}`);
          resolve(message);
        }
      });
    });
  }

  async _buildAttachment(email) {
    const content = findContentType(email, 'text/html');
    const hasAttachments = !_.isNil(email.attachment);
    if (hasAttachments) {
      const attachments = await Promise.map(email.attachment, async (attachment) => {
        const storage = _.get(attachment, 'storage');
        const filePath = _.get(attachment, 'path');
        if (storage !== ACTIVITY_ATTACHMENT_STORAGE_GCS || _.isEmpty(filePath)) {
          return attachment;
        }
        const file = await this.cloudStorage.gcsGetFile(filePath);
        const fileStream = file.createReadStream();
        return {
          stream: fileStream,
          name: attachment.name,
          type: attachment.type,
        };
      });
      return attachments;
    }
    if (content) {
      const attachment = {
        data: content.data,
        type: content.mime,
        charset: 'utf8',
        alternative: true,
        inline: true,
        encoded: false,
      };
      return attachment;
    }
    return null;
  }
}

module.exports = EmailSender;
