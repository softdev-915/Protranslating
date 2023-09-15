const _ = require('lodash');
const path = require('path');
const moment = require('moment');
const Promise = require('bluebird');
const EmailQueue = require('../../../../components/email/templates');
const { RestError } = require('../../../../components/api-response');
const CloudStorage = require('../../../../components/cloud-storage');
const { models: mongooseSchema } = require('../../../../components/database/mongo');
const FilePathFactory = require('../../../../components/file-storage/file-path-factory');

const UNKNOWN_COMPANY_NAME = 'Unknown';
const CONTACT_US_TEMPLATE_NAME = 'contact-us-notification';
const USER_CONTACT_US_TICKET_VENDOR = 'Vendor';

class ContactUsApi {
  constructor(logger, options) {
    this.logger = logger;
    this.lspId = options.lspId;
    this.mock = options.mock;
    this.configuration = options.configuration;
  }

  async deleteDocumentProspect(documentId) {
    const document = await mongooseSchema.DocumentProspect.findOne({
      _id: documentId,
    });
    const cloudStorage = new CloudStorage(this.configuration, this.logger);
    const filePathFactory = new FilePathFactory(this.lspId, this.configuration, this.logger);

    if (!document) {
      throw new RestError(404, { message: `Document ${documentId} does not exist` });
    }

    let cloudKey = _.get(document, 'cloudKey', false);

    if (!cloudKey) {
      const extension = path.extname(document.name);

      cloudKey = filePathFactory
        .entityDocumentProspect(document._id.toString(), 'prospectDocuments', document, extension, true);
    }

    try {
      await cloudStorage.deleteFile(cloudKey, true);
    } catch (e) {
      this.logger.error(`Error deleting document file ${document.name} with id ${documentId}. Error: ${e.message}`);
      throw new RestError(500, { message: `Error deleting file for document ${documentId}` });
    }
    try {
      await document.delete();
    } catch (e) {
      this.logger.error(`Mongo Error deleting DocumentProspect with id ${documentId}. Error: ${e.message}`);
      throw new RestError(500, { message: `Error deleting file for document ${documentId}` });
    }

    return document;
  }

  async upsertUser(contactUsForm, userTemplate) {
    const now = moment().utc().toDate();
    let userInDb = await mongooseSchema.User.findOneWithDeleted({
      lsp: this.lspId,
      email: contactUsForm.email,
    });
    const files = _.get(contactUsForm, 'files', []);

    if (!userInDb) {
      const newUser = _.assign({
        firstName: contactUsForm.name,
        lastName: contactUsForm.lastName,
        lsp: this.lspId,
        email: contactUsForm.email,
        registeredOn: now,
      }, userTemplate);

      userInDb = mongooseSchema.User(newUser);
    }
    const unkownCompany = await this._getUnknownCompany();

    _.assign(userInDb, {
      company: {
        _id: unkownCompany._id,
        name: unkownCompany.name,
      },
      lastContactUsOn: now,
      lastRegistrationComment: contactUsForm.comment,
    });
    await userInDb.save();

    await this._deleteOldDocuments(userInDb);
    await this._processDocuments(userInDb, files);
    await this._processNotifications(userInDb, contactUsForm);

    return userInDb;
  }

  async _getUnknownCompany() {
    let companyInDb = await mongooseSchema.Company.findOne({
      lspId: this.lspId,
      name: UNKNOWN_COMPANY_NAME,
    });

    if (!companyInDb) {
      const newCompany = {
        lspId: this.lspId,
        name: UNKNOWN_COMPANY_NAME,
      };

      companyInDb = await mongooseSchema.Company(newCompany).save();
    }

    return companyInDb;
  }

  async _processNotifications(userInDb, form) {
    const userId = userInDb._id.toString();
    const emailQueue = new EmailQueue(this.logger, mongooseSchema, this.configuration);
    const files = _.get(userInDb, 'lastFilesFromRegistration', []).map((f) => ({
      name: f.name,
      id: f._id.toString(),
      url: EmailQueue.serverURL(
        this.configuration,
        `api/lsp/${this.lspId}/user/${userId}/document/registration/${f._id.toString()}/filename/${f.name}`,
      ),
    }));
    const emailContext = {
      form: { ...form, files },
      user: userInDb,
    };
    const lsp = await mongooseSchema.Lsp.findOne({ _id: this.lspId });

    if (!lsp) {
      throw new RestError(400, { message: 'Lsp was not found' });
    }

    const emails = form.userType === USER_CONTACT_US_TICKET_VENDOR
      ? lsp.contactUsVendorEmails : lsp.contactUsContactEmails;

    try {
      await emailQueue.send({
        templateName: CONTACT_US_TEMPLATE_NAME,
        context: emailContext,
        lspId: this.lspId,
        mock: this.mock,
        to: emails.map((email) => ({ email })),
      });
    } catch (e) {
      const message = e.message || JSON.stringify(e);

      this.logger.debug(`Error sending ${CONTACT_US_TEMPLATE_NAME} emails: ${message}`);
    }
  }

  async _processDocuments(user, files) {
    const userId = _.get(user, '_id').toString();

    if (!userId) {
      throw new RestError(400, { message: 'User does not have an id' });
    }

    this.logger.debug(`Moving uploaded documents for user ${user._id}`);
    const newFiles = await Promise.mapSeries(
      files,
      (file) => this._moveDocumentProspect(userId, file),
    );

    this.logger.debug(`Contact us form files moved to final destination for user ${user._id}`);
    user.lastFilesFromRegistration = newFiles;
    await user.save();
    await mongooseSchema.DocumentProspect.deleteMany({ _id: { $in: files.map((f) => f._id) } });
  }

  async _moveDocumentProspect(userId, document) {
    const newDocument = _.assign({ failed: false }, document);
    const cloudStorage = new CloudStorage(this.configuration, this.logger);
    const filePathFactory = new FilePathFactory(this.lspId, this.configuration, this.logger);

    try {
      const newFileKey = filePathFactory.lastFilesFromRegistration(userId, document._id.toString());

      await cloudStorage.moveFile(document.cloudKey, newFileKey);
    } catch (e) {
      newDocument.failed = true;
      this.logger.error(`Error uploading files to AWS bucket. Error: ${e.message}`);
    }

    return newDocument;
  }

  async _deleteOldDocuments(user) {
    const userId = _.get(user, '_id').toString();
    const oldFiles = _.get(user, 'lastFilesFromRegistration', []);
    const cloudStorage = new CloudStorage(this.configuration, this.logger);
    const filePathFactory = new FilePathFactory(this.lspId, this.configuration, this.logger);

    if (!userId) {
      throw new RestError(400, { message: 'User does not have an id' });
    }

    this.logger.debug(`Deleting old documents for user ${user._id}`);
    await Promise.each(oldFiles, (file) => {
      const filePath = filePathFactory.lastFilesFromRegistration(userId, file._id.toString());

      return cloudStorage.deleteFile(filePath);
    })
      .then(() => this.logger.debug(`Deleted old documents for user ${user._id}`))
      .catch((e) => { this.logger.error(`Error deleting old user files. Error: ${e.message}`); });
  }
}

module.exports = ContactUsApi;
