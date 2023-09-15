const _ = require('lodash');
const { Types: { ObjectId } } = require('mongoose');
const Promise = require('bluebird');
const apiResponse = require('../../../components/api-response');
const EmailQueue = require('../../../components/email/templates');
const { validObjectId } = require('../../../utils/schema');
const FilePathFactory = require('../../../components/file-storage/file-path-factory');
const AbstractRequestAPI = require('../request/abstract-request-api');
const { searchFactory, exportFactory } = require('../../../utils/pagination');
const { getRoles, hasRole } = require('../../../utils/roles');
const { parsePaginationFilter } = require('../../../utils/request');
const { CsvExport } = require('../../../utils/csvExporter');
const { provideTransaction } = require('../../../components/database/mongo/utils');

const createRow = (doc) => {
  const row = {
    ID: doc._id,
    'Adjustment No': doc.adjustmentNo,
    'Reference Bill No': doc.referenceBillNo,
    'Adjustment Date': doc.date,
    Type: doc.type,
    Status: doc.status,
    Synced: _.get(doc, 'siConnector.isSynced'),
    'Sync Error': _.get(doc, 'siConnector.error'),
    'Last Sync Date': _.get(doc, 'siConnector.connectorStartedAt'),
    'Vendor Name': doc.vendorName,
    'Vendor ID': doc.vendorId,
    'GL Posting Date': doc.glPostingDate,
    'Adjustment Balance': doc.adjustmentBalance,
    'Amount Paid': doc.amountPaid,
    'Adjustment Total': doc.adjustmentTotal,
    Description: doc.description,
    'Created at': doc.createdBy,
    'Created by': doc.createdAt,
    'Updated by': doc.updatedBy,
    'Updated at': doc.updatedAt,
    Inactive: doc.inactiveText,
    'Restored by': doc.restoredBy,
    'Restored at': doc.restoredAt,
  };
  return row;
};
const { RestError } = apiResponse;
const BILL_ADJUSTMENT_BILL_POPULATE_PROJECTION = {
  no: 1,
};
const SORT_BILL_ADJUSTMENT_FIELDS = { updatedAt: -1 };
const TYPE_DEBIT_MEMO = 'Debit Memo';

class BillAdjustmentApi extends AbstractRequestAPI {
  constructor(options) {
    super(options);
    this.FilePathFactory = FilePathFactory;
    this.emailQueue = new EmailQueue(
      this.logger,
      this.schema,
      this.configuration,
    );
    this.mock = _.get(options, 'mock', false);
    this.syncEntityOnCreation = _.get(options, 'syncEntityOnCreation', false);
  }

  _getBeforeMatchPipeline() {
    return [{
      $addFields: {
        isSyncedText: { $toString: '$siConnector.isSynced' },
      },
    }];
  }

  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (!_.isEmpty(_.get(filters, '_id', ''))) {
      query._id = filters._id;
    }
    query.sort = _.get(filters, 'paginationParams.sort', '-updatedAt');
    let pipeline = [];
    const userRoles = getRoles(this.user);
    let match = {};

    if (hasRole('BILL-ADJUSTMENT_READ_OWN', userRoles) && !hasRole('BILL-ADJUSTMENT_READ_ALL', userRoles)) {
      match = {
        vendor: new ObjectId(this.user._id),
      };
    }
    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    const filter = parsePaginationFilter(_.get(query, 'filter', '{}'));

    if (_.get(filter, 'hasPositiveBalance', false)) {
      Object.assign(match, {
        adjustmentBalance: { $gt: 0 },
      });
    }
    if (_.has(filter, 'isSynced')) {
      Object.assign(match, {
        'siConnector.isSynced': filter.isSynced,
      });
    }
    pipeline = [{
      $match: match,
    }];
    pipeline = _.concat(pipeline, [
      {
        $lookup: {
          from: 'users',
          let: { vendorId: { $toObjectId: '$vendor' } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$vendorId'],
                },
              },
            },
            {
              $project: {
                _id: 1, firstName: 1, lastName: 1, 'vendorDetails.vendorCompany': 1,
              },
            },
          ],
          as: 'billAdjustmentVendor',
        },
      },
      {
        $addFields: {
          vendorObj: { $arrayElemAt: ['$billAdjustmentVendor', 0] },
        },
      },
      {
        $addFields: {
          vendorName: {
            $switch: {
              branches: [
                {
                  case: { $eq: [{ $ifNull: ['$vendorObj.vendorDetails.vendorCompany', ''] }, ''] },
                  then: { $concat: ['$vendorObj.firstName', ' ', '$vendorObj.lastName'] },
                },
              ],
              default: '$vendorObj.vendorDetails.vendorCompany',
            },
          },
          vendorId: '$vendorObj._id',
          amountPaid: { $toString: '$amountPaid' },
          adjustmentTotal: { $toString: '$adjustmentTotal' },
          adjustmentBalance: { $toString: '$adjustmentBalance' },
        },
      },
    ]);
    const extraQueryParameters = ['ID', 'isSyncedText', 'vendorName', 'vendorId'];
    return {
      query,
      pipeline,
      extraQueryParameters,
    };
  }

  /** Returns a csv file
   * @param {Object} filters to filter the bill adjustment names returned.
   */
  async billAdjustmentExport(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the bill adjustment list export file`);
    try {
      const { query, pipeline, extraQueryParameters } = this._getQueryFilters(filters);

      this.logger.debug(`Making main requests query for user: (${this.user.email}`);
      const beforeMatchPipeline = this._getBeforeMatchPipeline();
      const cursor = await exportFactory(
        this.schema.BillAdjustment,
        query,
        pipeline,
        extraQueryParameters,
        filters.__tz,
        beforeMatchPipeline,
      );
      const list = [];

      await cursor.eachAsync(async (doc) => {
        const row = createRow(doc);

        list.push(row);
      });
      const csvExporter = new CsvExport(list, {
        schema: this.schema.BillAdjustment,
        lspId: this.lspId,
        logger: this.logger,
        configuration: this.configuration,
        filters: query,
      });
      return csvExporter.export();
    } catch (e) {
      if (e instanceof RestError) {
        throw e;
      }
      this.logger.error(`Error populating and filtering bill adjustment records. Error: ${e}`);
      throw new RestError(500, { message: 'Error retrieving bill adjustment records', stack: e.stack });
    }
  }

  /**
   * Returns the bill adjustment list
   * @param {Object} filters to filter the bill adjustment returned.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the bill adjustment list`);
    let list = [];

    try {
      const { query, pipeline, extraQueryParameters } = this._getQueryFilters(
        filters,
      );
      const beforeMatchPipeline = this._getBeforeMatchPipeline();

      query.sort = _.get(filters, 'sort', SORT_BILL_ADJUSTMENT_FIELDS);
      list = await searchFactory({
        model: this.schema.BillAdjustment,
        filters: query,
        extraPipelines: pipeline,
        extraQueryParams: extraQueryParameters,
        beforeMatchPipeline,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing bill adjustment aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list,
      total: list.length,
    };
  }

  async create(billAdjustment, flags) {
    let shouldMock = this.isTestingUser() || (this.environmentName !== 'PROD' && this.syncEntityOnCreation === true);
    if (!this.mock) {
      shouldMock = false;
    }
    const mockCreationErrorFlag = _.get(flags, 'shouldMockCreationError', false);

    if (this.mock && mockCreationErrorFlag) {
      throw new RestError(500, { message: 'Mock Error: Adjustment could not be created' });
    }
    if (billAdjustment.type === TYPE_DEBIT_MEMO) {
      billAdjustment.appliedTo = 'N/A';
    }
    const defaultBillAdjustmentData = {
      lspId: this.lspId,
      amountPaid: 0,
      siConnector: {
        isMocked: shouldMock,
        isSynced: false,
        error: null,
      },
    };

    Object.assign(billAdjustment, defaultBillAdjustmentData);
    let documents = [];
    const billAdjustmentDefined = {
      lspId: this.lspId,
      createdBy: this.user.email,
    };

    if (billAdjustment.documents.length > 0) {
      this.logger.debug('Validating documents');
      documents = await this._checkDocuments(
        this.user,
        billAdjustment.documents,
        null,
        true,
      );
      billAdjustment.documents = documents;
    }
    let billAdjustmentCreated;
    let newBillAdjustment;

    if (!_.isEmpty(billAdjustment.lineItems)) {
      await provideTransaction(async (session) => {
        billAdjustmentDefined.vendor = _.pick(billAdjustmentDefined.vendor, [
          '_id',
        ]);
        newBillAdjustment = new this.schema.BillAdjustment(billAdjustmentDefined);
        const adjustmentTotal = billAdjustment.lineItems.reduce((total, item) => total + _.round(item.amount, 2), 0);
        const adjustmentBalance = _.round(billAdjustment.adjustmentTotal - billAdjustment.amountPaid, 2);

        newBillAdjustment.safeAssign(billAdjustment);
        Object.assign(newBillAdjustment, {
          adjustmentTotal,
          adjustmentBalance,
        });
        billAdjustmentCreated = await this._save(newBillAdjustment, session);
        billAdjustmentCreated = await billAdjustmentCreated.populate([
          {
            path: 'bill',
            select: BILL_ADJUSTMENT_BILL_POPULATE_PROJECTION,
            populate: [],
          },
          {
            path: 'lineItems.glAccountNo',
            options: { strictPopulate: false },
          },
          {
            path: 'lineItems.departmentId',
            select: 'accountingDepartmentId',
            options: { strictPopulate: false },
          },
        ]);
        await this.schema.User.lockDocument({ _id: newBillAdjustment.vendor }, session);
        await this.schema.User.consolidateVendorBalance(newBillAdjustment.vendor, session);
        const mockUpdateErrorFlag = _.get(flags, 'shouldMockUpdateError', false);

        if (this.mock && mockUpdateErrorFlag) {
          throw new RestError(500, { message: 'Mock Error: Adjustment could not be updated' });
        }
      });
    }
    this.logger.info('Successfully created new bill adjustment');
    if (documents.length > 0) {
      this.logger.debug('About to move documents to their final destination');
      await this._moveDocumentsToFinalDestination(newBillAdjustment, documents);
    }
    return billAdjustmentCreated;
  }

  async edit(data) {
    let billAdjustment;

    await provideTransaction(async (session) => {
      billAdjustment = await this.schema.BillAdjustment.findOne({ _id: data._id }).session(session);
      if (_.isEmpty(billAdjustment)) {
        throw new RestError(404, { message: 'AP Adjustment not found' });
      }
      if (_.isEmpty(_.get(billAdjustment, 'siConnector.error'))) {
        throw new RestError(500, { message: 'AP Adjustment cannot be updated' });
      }
      if (this.mock) {
        _.set(data, 'siConnector.isMocked', true);
      }
      billAdjustment.safeAssign(data);
      if (!_.isEmpty(billAdjustment.lineItems)) {
        billAdjustment.adjustmentTotal = billAdjustment.lineItems.reduce((total, item) => total + _.round(item.amount, 2), 0);
        billAdjustment.adjustmentBalance = _.round(billAdjustment.adjustmentTotal - billAdjustment.amountPaid, 2);
      }
      await billAdjustment.save({ session });
      await this.schema.User.lockDocument({ _id: billAdjustment.vendor }, session);
      await this.schema.User.consolidateVendorBalance(billAdjustment.vendor, session);
      await billAdjustment
        .populate([
          { path: 'bill', select: BILL_ADJUSTMENT_BILL_POPULATE_PROJECTION },
          { path: 'lineItems.glAccountNo' },
          { path: 'lineItems.departmentId', select: 'accountingDepartmentId' },
          {
            path: 'vendor',
            options: { withDeleted: true },
            select: '_id email vendorDetails.vendorCompany firstName lastName',
          },
        ]);
    });
    return billAdjustment;
  }

  find(query) {
    return this.schema.BillAdjustment.find(query);
  }

  async findOne(billAdjustmentId) {
    const POPULATE_FIELDS = [
      {
        path: 'bill',
        select: BILL_ADJUSTMENT_BILL_POPULATE_PROJECTION,
        populate: [],
      },
      {
        path: 'lineItems.glAccountNo',
        options: { strictPopulate: false },
      },
      {
        path: 'lineItems.departmentId',
        select: 'accountingDepartmentId',
        populate: [],
      },
      {
        path: 'vendor',
        options: { withDeleted: true },
        select: '_id email vendorDetails.vendorCompany firstName lastName',
      },
    ];
    const projection = this.user.has('BILL-ADJUSTMENT_READ_ALL') ? {} : {
      glPostingDate: 0,
      'lineItems[$].glAccountNo': 0,
      'lineItems[$].departmentId': 0,
    };
    const billAdjustment = await this.schema.BillAdjustment.findOneWithDeleted({
      _id: billAdjustmentId,
      lspId: this.lspId,
    }, projection)
      .populate(POPULATE_FIELDS);

    if (_.isNil(billAdjustment)) return;
    this.logger.debug(
      `User ${this.user.email} retrieved bill adjustment name ${billAdjustmentId}`,
    );
    return billAdjustment.toObject();
  }

  async update(billAdjustment) {
    const isValidId = validObjectId(billAdjustment._id);

    if (!isValidId) {
      this.logger.debug(`Invalid ObjectId ${billAdjustment._id} for bill adjustment entity when trying to update`);
      throw new RestError(500, { message: `Error updating bill adjustment. Invalid ObjectId ${billAdjustment._id} for bill adjustment entity` });
    }
    let documents = [];

    billAdjustment.documents = _.get(billAdjustment, 'documents', []);
    const billAdjustmentInDb = await this.schema.BillAdjustment.findOneWithDeleted({
      _id: billAdjustment._id,
      lspId: this.lspId,
    });

    if (_.isNil(billAdjustmentInDb)) {
      throw new RestError(400, { message: `Bill adjustment ${billAdjustment._id} does not exist` });
    }
    const newDocuments = billAdjustment.documents.filter((d) => d.isNew);
    const deletedDocuments = billAdjustment.documents.filter((d) => d.removed);

    if (newDocuments.length > 0) {
      this.logger.debug('Validating documents');
      documents = await this._checkDocuments(
        this.user,
        newDocuments,
        null,
        true,
      );
      this.logger.info('Documents were checked');
    }
    billAdjustment.documents = _.filter(billAdjustment.documents, (td) => !td.removed);
    billAdjustmentInDb.safeAssign(billAdjustment);
    const billAdjustmentUpdated = await this._save(billAdjustmentInDb);
    const fileStorageFacade = new this.FileStorageFacade(
      this.lspId,
      this.configuration,
      this.logger,
    );
    const filePathFactory = new FilePathFactory(
      this.lspId,
      this.configuration,
      this.logger,
    );

    this.deletePhysicalFiles(
      billAdjustmentUpdated,
      deletedDocuments,
      fileStorageFacade,
      filePathFactory,
    );
    await this._moveDocumentsToFinalDestination(billAdjustmentUpdated, documents);
    this.logger.debug('Activity: documents moved to the final destination');
    return billAdjustmentUpdated;
  }

  async _save(billAdjustment, session) {
    try {
      const newBillAdjustment = await billAdjustment.save({ session });
      return newBillAdjustment;
    } catch (err) {
      const DUPLICATED_ERR_MESSAGE = `User ${this.user.email} couldn't create the bill adjustment: ${
        billAdjustment.adjustmentNo
      }`;

      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`${DUPLICATED_ERR_MESSAGE} due to err: duplicated key`);
        throw new Error(`Bill Adjustment ${billAdjustment.adjustmentNo} already exists`);
      }
      this.logger.debug(`${DUPLICATED_ERR_MESSAGE} due to err: ${err.message}`);
      throw new Error(err.message);
    }
  }

  async buildFilePath(billAdjustmentId, documentId) {
    const { lspId } = this;
    const fileStorageFacade = new this.FileStorageFacade(
      lspId,
      this.configuration,
      this.logger,
    );
    const billAdjustment = await this.schema.BillAdjustment.findById(billAdjustmentId);
    const document = billAdjustment.documents.find(
      (doc) => doc._id.toString() === documentId,
    );

    if (!document) {
      throw new RestError(404, {
        message: `The document ${documentId} does not exist`,
      });
    } else if (document.deletedByRetentionPolicyAt) {
      throw new RestError(404, {
        message: `The document ${documentId} has been removed by document retention policy`,
      });
    }
    const file = fileStorageFacade.billAdjustmentFile(billAdjustmentId, document);
    return { file, document };
  }

  async _moveDocumentsToFinalDestination(newBillAdjustment, documents) {
    const filePathFactory = new FilePathFactory(
      this.lspId,
      this.configuration,
      this.logger,
    );
    const awsFileKeyFunc = (doc) => filePathFactory.getBillAdjustmentFilesPath(newBillAdjustment, doc);
    return this._moveFiles(newBillAdjustment, documents, awsFileKeyFunc);
  }

  async deletePhysicalFiles(
    billAdjustment,
    deletedDocuments,
    fileStorageFacade,
    filePathFactory,
  ) {
    await Promise.map(deletedDocuments, (d) => {
      const fileStorage = fileStorageFacade.billAdjustmentFile(billAdjustment._id, d);
      return fileStorage.delete();
    });
    await Promise.mapSeries(deletedDocuments, (d) => {
      const bucketFilePath = filePathFactory.getBillAdjustmentFilesPath(
        billAdjustment,
        d,
        true,
      );

      if (typeof bucketFilePath !== 'string' || bucketFilePath.length < 90) {
        this.logger.debug(
          `Cloud Storage: failed to remove, invalid file path Key: ${bucketFilePath}`,
        );
        // incorrect path, skip
        return Promise.resolve();
      }
      this.logger.debug(`Cloud Storage: Deleting path Key: ${bucketFilePath}`);
      return this.cloudStorage.deleteFile(bucketFilePath);
    });
  }

  async zipFilesStream(billAdjustmentId, res) {
    const billAdjustment = await this.findOne(billAdjustmentId);

    if (!billAdjustment) {
      this.logger.info(`No bill adjustment with id ${billAdjustmentId} `);
      throw new RestError(404, {
        message: `bill adjustment ${billAdjustmentId} does not exist`,
      });
    }
    let allDocuments = [];

    if (billAdjustment.documents) {
      allDocuments = billAdjustment.documents.filter((d) => !d.deleted);
    }
    if (_.isEmpty(allDocuments)) {
      this.logger.info(`bill adjustment ${billAdjustmentId} has no documents`);
      throw new RestError(400, {
        message: 'No documents available to download',
      });
    }

    const fileStorageFacade = new this.FileStorageFacade(
      this.lspId,
      this.configuration,
      this.logger,
    );
    const fileStorageGenerator = (t, f) => fileStorageFacade.billAdjustmentFile(t._id, f);
    const fileFilter = (d) => !d.deleted;
    const files = this.fileList(billAdjustment, fileFilter, fileStorageGenerator);

    try {
      await this.cloudStorage.streamZipFile({ res, files, zipFileName: `${billAdjustment.adjustmentNo}-${billAdjustment.type}.zip` });
    } catch (err) {
      const message = _.get(err, 'message', err);

      this.logger.error(`Error writing zip file. Error: ${message}`);
      throw new RestError(500, { message: 'Error generating zip file', stack: err.stack });
    }
  }

  fileList(billAdjustment, filter, fileStorageGenerator) {
    const files = billAdjustment.documents.filter(filter);

    if (!files.length) {
      this.logger.info(`Bill Adjustment ${billAdjustment._id} has no files`);
      throw new RestError(400, {
        message: 'No documents available to download',
      });
    }
    return files.map((f) => {
      const fsf = fileStorageGenerator(billAdjustment, f);

      fsf.__file__name__ = f.name;
      return fsf;
    });
  }
}

module.exports = BillAdjustmentApi;
