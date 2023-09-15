const { Types: { ObjectId } } = require('mongoose');
const _ = require('lodash');
const csvWriter = require('csv-write-stream');
const { RestError } = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const { areObjectIdsEqual } = require('../../../utils/schema');
const { exportFactory, searchFactory } = require('../../../utils/pagination');
const { decimal128ToNumber } = require('../../../utils/bigjs');
const { CsvExport } = require('../../../utils/csvExporter');

const createQuoteRow = (doc) => {
  const row = {
    ID: doc._id.toString(),
    'Request No': doc.no,
    Contact: doc.contactName,
    Title: doc.title,
    'Reception Date': doc.receptionDate,
    'Delivery Date': doc.deliveryDate,
    Price: decimal128ToNumber(_.get(doc, 'foreignInvoiceTotal', 0)),
    Status: doc.status,
    'Created at': doc.createdAt,
    'Updated at': doc.updatedAt,
    'Created by': doc.createdBy,
    'Updated by': doc.updatedBy,
    'Deleted at': doc.deletedAt,
    'Deleted by': doc.deletedBy,
    'Restored at': doc.restoredAt,
    'Restored by': doc.restoredBy,
    'Patent App.Num': _.get(doc, 'ipPatent.patentApplicationNumber', ''),
    'Patent Pub.Num': _.get(doc, 'ipPatent.patentPublicationNumber', ''),
    'Request Type': _.get(doc, 'requestType.name', ''),
  };
  return row;
};

const defaultCSVHeaders = {
  headers: [
    'ID',
    'Request No',
    'Contact',
    'Title',
    'Reception date',
    'Delivery date',
    'Price',
    'Status',
    'Created at',
    'Updated at',
    'Created by',
    'Updated by',
  ],
};

class QuoteLmsApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.mockFlag = options.mock;
    this.requestReadModel = this.schema.RequestSecondary;
  }

  /**
   * Returns the quote list as a csv file
   * @param {Object} filters to filter the quotes returned.
   */
  async quoteExport(filters, res) {
    this.logger.debug(`User ${this.user.email} retrieved a quote list export file`);
    const query = { lspId: this.lspId, ..._.get(filters, 'paginationParams', {}) };

    await this.addQueryCompanyFiltering(query);
    this.logger.debug(`User ${this.user.email} retrieved the requests list`);
    query.sort = _.get(query, 'sort', '-receptionDate');
    try {
      const pipeline = this._getListQueryPipeline();
      const extraQueryParams = this._getListAndExportQueryParams();

      this.logger.debug(`Making main requests query for user: (${this.user.email}`);
      const columnOptions = _.get(filters, 'columnOptions', defaultCSVHeaders);
      const writer = csvWriter(columnOptions);
      const csvFileName = CsvExport.buildProperFilename(query, this.requestReadModel, 'quotes');
      const requestHeaders = {
        'Content-Type': 'text/csv',
        'Content-disposition': `attachment;filename=${csvFileName}.csv`,
      };

      res.writeHead(200, requestHeaders);
      writer.pipe(res);
      const cursor = await exportFactory(this.schema.Request, query, pipeline, extraQueryParams);
      await cursor.eachAsync(async (doc) => {
        const row = createQuoteRow(doc);
        return writer.write(row);
      });
      return res.end();
    } catch (e) {
      if (e instanceof RestError) {
        throw e;
      }
      this.logger.error(`Error populating and filtering requests. Error: ${e}`);
      throw new RestError(500, { message: 'Error retrieving request', stack: e.stack });
    }
  }

  async addQueryCompanyFiltering(query) {
    const { company } = this.user;
    const canRead = ['QUOTE_READ_OWN', 'QUOTE_READ_ALL', 'QUOTE_READ_COMPANY'].some((role) => this.user.has(role));

    if (!canRead) {
      this.logger.debug(`User (${this.user.email} can't access requests`);
      throw new RestError(403, { message: 'You have not privileges to access this resource' });
    }

    if (!this.user.has('QUOTE_READ_ALL')) {
      if (!_.isNil(company)) {
        let subCompanies;

        if (this.user.has('QUOTE_READ_COMPANY')) {
          subCompanies = await this.schema.Company.find({
            $or: [
              { _id: new ObjectId(company._id) },
              { 'parentCompany._id': new ObjectId(company._id) },
              { 'parentCompany.parentCompany._id': new ObjectId(company._id) },
              { 'parentCompany.parentCompany.parentCompany._id': new ObjectId(company._id) },
            ],
          }, { _id: 1 });
          Object.assign(query, {
            'company._id': { $in: subCompanies.map((c) => c._id) },
          });
        } else {
          this.logger.debug(`Filtering quotes by contact (${this.user.email}`);
          Object.assign(query, { 'contact._id': new ObjectId(this.user._id) });
        }
      }
    }
  }

  _getListQuery(filters = {}) {
    const paginationParamsFilter = JSON.parse(filters.paginationParams.filter);
    const query = {
      lspId: this.lspId,
      requireQuotation: true,
    };

    if (!_.has(paginationParamsFilter, 'status')) {
      query.status = { $in: ['Waiting for Quote', 'Waiting for approval'] };
    }
    return Object.assign(query, _.get(filters, 'paginationParams', {}));
  }

  _getListAndExportQueryParams() {
    return [
      'contactName',
    ];
  }

  _getListQueryPipeline() {
    const pipeline = [
      {
        $addFields: {
          contactName: {
            $concat: ['$contact.firstName', ' ', '$contact.lastName'],
          },
        },
      },
      {
        $project: {
          bucketPrefixes: 0,
          documents: 0,
          company: 0,
          location: 0,
          schedulingStatus: 0,
          partners: 0,
          insuranceCompany: 0,
          internalDepartment: 0,
          tgtLangs: 0,
          schedulingCompany: 0,
          schedulingContact: 0,
          pmList: 0,
          projectManagers: 0,
          srcLang: 0,
        },
      },
    ];
    return pipeline;
  }

  async list(filters = {}) {
    const query = this._getListQuery(filters);

    await this.addQueryCompanyFiltering(query);
    const extraQueryParams = this._getListAndExportQueryParams();
    let quoteList = [];

    try {
      const pipeline = this._getListQueryPipeline();

      this.logger.debug(`Retrieving quotes by user: (${this.user.email}`);
      query.sort = _.get(query, 'sort', '-createdAt');
      quoteList = await searchFactory({
        model: this.requestReadModel,
        filters: query,
        extraPipelines: pipeline,
        extraQueryParams,
      }).exec();
      quoteList = quoteList.map((q) => {
        _.set(q, 'invoiceTotal', decimal128ToNumber(_.get(q, 'invoiceTotal', 0)));
        return q;
      });
    } catch (e) {
      const message = e.message || e;

      this.logger.error(`Error retrieving quote list. Error: ${message}`);
      throw new RestError(500, { message: 'Error retrieving quote list', stack: e.stack });
    }
    return {
      list: quoteList,
      total: quoteList.length,
    };
  }

  async findOne(_id) {
    const query = { _id: new ObjectId(_id), lspId: this.lspId };

    await this.addQueryCompanyFiltering(query);
    this.logger.debug(`User ${this.user.email} retrieved a quote`);
    let populateOptions = [];
    const request = await this.schema.Request.findOne(query);

    if (_.isNil(request)) {
      throw new RestError(404, { message: `Quote with id: ${_id} not found` });
    }
    if (!_.isNil(_.get(request, 'contact._id'))) {
      populateOptions = populateOptions.concat([
        {
          path: 'contact._id',
          select: 'email firstName lastName contactDetails.billingAddress',
          options: { withDeleted: true },
        },
        {
          path: 'contact._id.contactDetails.billingAddress.country._id',
          select: 'name',
        },
        {
          path: 'contact._id.contactDetails.billingAddress.state._id',
          select: 'name',
        },

      ]);
    }
    if (!_.isNil(_.get(request, 'schedulingContact._id'))) {
      populateOptions = populateOptions.concat([{
        path: 'schedulingContact._id',
        select: 'firstName lastName email contactDetails.billingAddress',
        options: { withDeleted: true },
      },
      {
        path: 'schedulingContact._id.contactDetails.billingAddress.country._id',
        select: 'name',
      },
      {
        path: 'schedulingContact._id.contactDetails.billingAddress.state._id',
        select: 'name',
      }]);
    }
    const populatedRequest = await this.schema.Request.findOne(query).populate(populateOptions);

    if (_.get(populatedRequest, 'schedulingContact._id')) {
      populatedRequest.schedulingContact = populatedRequest.schedulingContact._id;
    }
    return populatedRequest;
  }

  async quoteDetail(_id) {
    let request = await this.findOne(_id);
    const companyId = _.get(request, 'company._id');
    const company = await this.schema.Company.findOne(
      { _id: companyId, lspId: this.lspId },
      {
        name: 1,
        billingInformation: 1,
        billingAddress: 1,
        parentCompany: 1,
        hierarchy: 1,
        status: 1,
      },
    )
      .populate('billingAddress.country billingInformation.billingTerm billingInformation.paymentMethod billingAddress.state');
    const contact = await this.schema.User.findOneWithDeleted(
      { _id: request.contact._id, lsp: this.lspId },
    ).populate(
      {
        path: 'contactDetails.salesRep',
        select: 'firstName lastName email',
        options: { withDeleted: true },
      },
    );

    request = request.toJSON();
    if (_.get(request, 'quoteTemplateId') || _.get(request, 'emailTemplateId')) {
      const requestTemplates = await this.schema.Template.find({
        _id: {
          $in: [
            new ObjectId(request.quoteTemplateId._id),
            new ObjectId(request.emailTemplateId._id)],
        },
      }).lean();

      request.quoteTemplateId = requestTemplates.find((t) => areObjectIdsEqual(t, request.quoteTemplateId));
      request.emailTemplateId = requestTemplates.find((t) => areObjectIdsEqual(t, request.emailTemplateId));
    }
    request.company = company;
    const contactSalesRep = _.get(contact, 'contactDetails.salesRep', null);

    if (!_.isNil(contactSalesRep)) {
      const { firstName, lastName, email } = contactSalesRep;
      request.contactSalesRep = { firstName, lastName, email };
    }
    return request;
  }
}

module.exports = QuoteLmsApi;
