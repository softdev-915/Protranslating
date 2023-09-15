/* eslint-disable semi */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable indent */
/* eslint-disable quote-props */
const Promise = require('bluebird');
const moment = require('moment');
const _ = require('lodash');
const logger = require('../../log/logger');
const mongooseSchema = require('../../database/mongo').models;
const { provideTransaction } = require('../../database/mongo/utils');
const configuration = require('../../configuration');
const { sum, decimal128ToNumber } = require('../../../utils/bigjs');

const IN_PROGRESS_STATUS = 'In Progress';
const DRAFTED_STATUS = 'Drafted';
const POSTED_STATUS = 'Posted';
const READY_TO_BE_POSTED_STATUS = 'Ready';
const INVOICED_STATUS = 'Invoiced';
const INVOICES_TO_PROCEED_PER_RUN = 50;

class InvoicePosterScheduler {
  constructor() {
    this.logger = logger;
    const { AR_INVOICE_TOTAL_NUMBER_OF_BATCH_ENTRIES } = configuration.environment;
    this.numberOfBatchEntries = AR_INVOICE_TOTAL_NUMBER_OF_BATCH_ENTRIES;
  }

  handleDraftedInvoice(invoice) {
    this.logger.debug(`Invoice-poster: Processing "Drafted" invoice ${invoice._id}`);
    return provideTransaction(async (session) => {
      await mongooseSchema.Company.lockCompanyHierarchy(invoice.company, session);
      await mongooseSchema.ArInvoice.findOneAndUpdate(
        { _id: invoice._id, status: DRAFTED_STATUS },
        {
          $set: {
            status: IN_PROGRESS_STATUS,
          },
        },
        { session, new: true },
);
      this.logger.debug(`Invoice-poster: Finished Processing "Drafted" invoice ${invoice._id}`);
    });
  }

  async setRequestTaskStatuses(requestsList, session) {
    return Promise.map(requestsList, async (requestItem) => {
      const { requestId } = requestItem._id;
      const request = await mongooseSchema.Request.aggregate([
        {
          $match: {
            _id: requestId,
          },
        },
        {
          $addFields: {
            workflows: {
              $map: {
                input: '$workflows',
                as: 'workflow',
                in: {
                  $mergeObjects: [
                    '$$workflow',
                    {
                      tasks: {
                        $map: {
                          input: '$$workflow.tasks',
                          as: 'task',
                          in: {
                            $mergeObjects: ['$$task', {
                              status: {
                                $switch: {
                                  branches: [
                                    {
                                      case: {
                                        $reduce: {
                                          input: '$$task.invoiceDetails',
                                          initialValue: true,
                                          in: { $and: ['$$value', '$$this.invoice.isInvoiced'] },
                                        },
                                      },
                                      then: 'Invoiced',
                                    },
                                    {
                                      case: {
                                        $reduce: {
                                          input: '$$task.invoiceDetails',
                                          initialValue: false,
                                          in: { $or: ['$$value', '$$this.invoice.isInvoiced'] },
                                        },
                                      },
                                      then: 'Partially Invoiced',
                                    },
                                    {
                                      case: {
                                        $eq: [
                                          { $ifNull: ['$task.status', ''] },
                                          'Not Invoiced',
                                        ],
                                      },
                                      then: 'Not Invoiced',
                                    },
                                  ],
                                  default: '$task.status',
                                },
                              },
                            },
                          ],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        }, { $project: { workflows: 1 } }]).session(session);
      if (_.isEmpty(request)) {
        throw new Error(`Invoice-poster: Error: Request with _id ${requestId} was not found`);
      }
      return mongooseSchema.Request.findOneAndUpdate(
        { _id: requestId },
        {
 $set: {
          workflows: request[0].workflows,
        },
      },
        { session },
      );
    });
  }

  async setRequestInvoiceStatus(requestsList, session) {
    return Promise.map(requestsList, async (requestItem) => {
      const { requestId } = requestItem._id;
      const request = await mongooseSchema.Request.aggregate([
        { $match: { _id: requestId } },
        { $unwind: '$workflows' },
        {
          $group: {
            _id: '$_id',
            tasks: { $push: '$workflows.tasks' },
          },
        },
        {
          $project: {
            allTasks: {
              $reduce: {
                input: '$tasks',
                initialValue: [],
                in: { $concatArrays: ['$$value', '$$this'] },
              },
            },
          },
        },
        {
          $addFields: {
            invoicedTasks: {
              $filter: {
                input: '$allTasks',
                as: 'task',
                cond: {
                  $eq: ['$$task.status', INVOICED_STATUS],
                },
              },
            },
          },
        },
        {
          $addFields: {
            invoicedTasksCount: {
              $size: '$invoicedTasks',
            },
            allTasksCount: {
              $size: '$allTasks',
            },
          },
        },
        {
          $addFields: {
            requestInvoiceStatus: {
              $cond: [
                { $eq: ['$invoicedTasksCount', '$allTasksCount'] },
                'Invoiced',
                {
                  $cond: [
                    { $gt: ['$invoicedTasksCount', 0] },
                    'Partially Invoiced',
                    'Not Invoiced',
                  ],
                },
              ],
            },
          },
        },
        {
          $project: { requestInvoiceStatus: 1 },
        },
      ]).session(session);
      if (_.isEmpty(request)) {
        throw new Error(`Invoice-poster: Error: Request with _id ${requestId} was not found`);
      }
      return mongooseSchema.Request.findOneAndUpdate(
        { _id: requestId },
        {
          $set: {
            requestInvoiceStatus: request[0].requestInvoiceStatus,
          },
        },
        { session },
      );
    });
  }

  async handleInProgressInvoice(invoice) {
    this.logger.debug(`Invoice-poster: Processing In Progress invoice ${invoice._id}`);
    await provideTransaction(async (session) => {
      await mongooseSchema.Company.lockCompanyHierarchy(invoice.company, session);
      const requestUpdates = [];
      const invoiceUpdates = [];
      const cursor = await mongooseSchema.ArInvoice.aggregate([
        {
          $match: {
            _id: invoice._id,
            status: IN_PROGRESS_STATUS,
          },
        },
        {
          $addFields: {
            draftedEntries: {
              $filter: {
                input: '$entries',
                as: 'invoiceEntry',
                cond: {
                  $eq: ['$$invoiceEntry.status', DRAFTED_STATUS],
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            company: 1,
            'draftedEntries.taskName': 1,
            'draftedEntries._id': 1,
            'draftedEntries.taskId': 1,
            'draftedEntries.workflowId': 1,
            'draftedEntries.requestId': 1,
          },
        },
        {
          $unwind: '$draftedEntries',
        },
        {
          $limit: this.numberOfBatchEntries,
        },
      ])
        .cursor({ batchSize: this.numberOfBatchEntries });
      await cursor.eachAsync(async (populatedInvoice) => {
        const {
 _id, taskId, workflowId, requestId, taskName,
} = populatedInvoice.draftedEntries;
        let set;
        let arrayFilters;
        if (taskName.match(/Min. charge/)) {
          set = {
            'workflows.$[workflow].tasks.$[task].invoiceDetails.$[].invoice.isInvoiced': true,
          };
          arrayFilters = [
            { 'workflow._id': workflowId },
            { 'task._id': taskId },
          ];
        } else {
          set = {
            'workflows.$[workflow].tasks.$[task].invoiceDetails.$[invoiceDetail].invoice.isInvoiced': true,
          };
          arrayFilters = [
            { 'workflow._id': workflowId },
            { 'task._id': taskId },
            { 'invoiceDetail.invoice._id': _id },
          ];
        }
        requestUpdates.push({
          updateOne: {
            filter: { _id: requestId, status: { $ne: 'Invoiced' } },
            update: {
              $set: set,
            },
            session,
            upsert: false,
            arrayFilters,
          },
        });
        invoiceUpdates.push({
          updateOne: {
            filter: { _id: populatedInvoice._id, status: IN_PROGRESS_STATUS },
            update: {
              $set: {
                'entries.$[invoiceEntry].status': IN_PROGRESS_STATUS,
              },
            },
            session,
            upsert: false,
            arrayFilters: [{ 'invoiceEntry._id': _id }],
          },
        });
      });
      if (requestUpdates.length > 0 && invoiceUpdates.length > 0) {
        await Promise.all([
          mongooseSchema.Request.bulkWrite(requestUpdates, { session }),
          mongooseSchema.ArInvoice.bulkWrite(invoiceUpdates, { session }),
        ]).then(() => {
          this.logger.debug(`Invoice-poster: Processed "In Progress" invoice ${invoice._id}: Updated ${requestUpdates.length} requests/${invoiceUpdates.length} invoices`);
        }).catch((err) => {
          this.logger.error(`Invoice-poster: Failed to process "In Progress" invoice ${invoice._id}. Err: ${err}`);
          throw err;
        });
      }
    });
    this.logger.debug(`Invoice-poster: Finished Processed "In Progress" invoice ${invoice._id}`);
  }

  async handleReadyToBePostedInvoice(invoice) {
    this.logger.debug(`Invoice-poster: Processing "Ready to be posted" invoice ${invoice._id}`);
    await provideTransaction(async (session) => {
      try {
        const groupedEntries = await mongooseSchema.ArInvoice.aggregate([
          {
            $match: {
              _id: invoice._id,
              status: IN_PROGRESS_STATUS,
            },
          },
          {
            $unwind: '$entries',
          },
          {
            $match: {
              'entries.status': IN_PROGRESS_STATUS,
            },
          },
          {
            $group: {
              _id: {
                requestId: '$entries.requestId',
              },
              groupedEntries: { $push: '$entries._id' },
            },
          },
          {
            $limit: this.numberOfBatchEntries,
          },
        ]).session(session);
        await this.setRequestTaskStatuses(groupedEntries, session);
        await mongooseSchema.ArInvoice.findOneAndUpdate(
          { _id: invoice._id, status: IN_PROGRESS_STATUS },
          {
            $set: {
              'entries.$[invoiceEntry].status': POSTED_STATUS,
            },
          },
          {
            session,
            upsert: false,
            arrayFilters: [
              { 'invoiceEntry._id': { $in: _.flatten(groupedEntries.map((entry) => entry.groupedEntries)) } },
            ],
          },
        );
        this.logger.debug(`Invoice-poster: Finished processing "Pre Posted" invoice ${invoice._id}`);
      } catch (err) {
        if (err.toString().match('MongoError: Cursor is closed')) {
          // Not an error, cursor has finished processing the records
          return Promise.resolve();
        }
        this.logger.error(`Invoice-poster: Failed processing "Pre Posted" invoice ${invoice._id}. Err ${err}`);
        throw err;
      }
    });
  }

  async markInvoiceAsPosted(invoice, session) {
    const updatedInvoice = await mongooseSchema.ArInvoice.findOneAndUpdate(
      { _id: invoice._id, status: IN_PROGRESS_STATUS },
      {
        $set: {
          status: POSTED_STATUS,
        },
      },

{
        session,
      },
);
    const invoiceAmount = updatedInvoice.entries.reduce((agg, entry) => sum(decimal128ToNumber(entry.amount), agg), 0).toFixed(2);
    updatedInvoice.accounting.amount = invoiceAmount;
    updatedInvoice.setAccountingDetails();
    await mongooseSchema.ArInvoice.findOneAndUpdate(
      { _id: invoice._id },
      {
        $set: {
          accounting: updatedInvoice.accounting,
        },
      },

{
        session,
      },
);
    return mongooseSchema.Company.consolidateBalance(invoice.company, session);
  }

  async handlePostedInvoice(invoice) {
    this.logger.debug(`Invoice-poster: Processing "Posted" invoice ${invoice._id}`);
    await provideTransaction(async (session) => {
      try {
        const groupedEntries = await mongooseSchema.ArInvoice.aggregate([
          {
            $match: {
              _id: invoice._id,
              status: IN_PROGRESS_STATUS,
            },
          },
          {
            $unwind: '$entries',
          },
          {
            $match: {
              'entries.processed': false,
            },
          },
          {
            $group: {
              _id: {
                requestId: '$entries.requestId',
              },
              groupedEntries: { $push: '$entries._id' },
            },
          },
          {
            $limit: this.numberOfBatchEntries,
          },
        ]).session(session);

        if (groupedEntries.length === 0) {
          return this.markInvoiceAsPosted(invoice, session);
        }
        await this.setRequestInvoiceStatus(groupedEntries, session);
        await mongooseSchema.ArInvoice.findOneAndUpdate(
          { _id: invoice._id, status: IN_PROGRESS_STATUS },
          {
            $set: {
              'entries.$[invoiceEntry].processed': true,
            },
          },
          {
            session,
            upsert: false,
            arrayFilters: [
              { 'invoiceEntry._id': { $in: _.flatten(groupedEntries.map((entry) => entry.groupedEntries)) } },
            ],
          },
        );
        this.logger.debug(`Invoice-poster: Finished processing "Posted" invoice ${invoice._id}`);
      } catch (err) {
        if (err.toString().match('MongoError: Cursor is closed')) {
          // Not an error, cursor has finished processing the records
          return Promise.resolve();
        }
        this.logger.error(`Invoice-poster: Failed processing "Posted" invoice ${invoice._id}. Err ${err}`);
        throw err;
      }
    });
  }

  async handleInvoice(invoice) {
    try {
      if (invoice.processingStatus === DRAFTED_STATUS) {
        await this.handleDraftedInvoice(invoice);
        return await this.handleInProgressInvoice(invoice);
      }
      if (invoice.processingStatus === IN_PROGRESS_STATUS) {
        return await this.handleInProgressInvoice(invoice);
      }
      if (invoice.processingStatus === READY_TO_BE_POSTED_STATUS) {
        return await this.handleReadyToBePostedInvoice(invoice);
      }
      return await this.handlePostedInvoice(invoice);
    } catch (error) {
      this.logger.error(`Failed to handle invoice with _id ${invoice._id}. Invoice-poster scheduler for lspId:${this.lspId}. Error: ${error}`);
    }
  }

  getUnprocessedInvoices() {
    return mongooseSchema.ArInvoice.aggregate([
      {
        $match: {
          lspId: this.lspId,
          status: { $in: [DRAFTED_STATUS, IN_PROGRESS_STATUS] },
        },
      },
      {
        $sort: { createdAt: 1 },
      },
      {
        $limit: INVOICES_TO_PROCEED_PER_RUN,
      },
      {
        $addFields: {
          draftedEntriesNumber: {
            $size: {
              $filter: {
                input: '$entries',
                as: 'entry',
                cond: {
                  $eq: ['$$entry.status', DRAFTED_STATUS],
                },
              },
            },
          },
          inProgressEntriesNumber: {
            $size: {
              $filter: {
                input: '$entries',
                as: 'entry',
                cond: {
                  $eq: ['$$entry.status', IN_PROGRESS_STATUS],
                },
              },
            },
          },
          postedEntriesNumber: {
            $size: {
              $filter: {
                input: '$entries',
                as: 'entry',
                cond: {
                  $eq: ['$$entry.status', POSTED_STATUS],
                },
              },
            },
          },
          totalEntriesNumber: {
            $size: '$entries',
          },
        },
      },
      {
        $addFields: {
          processingStatus: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ['$postedEntriesNumber', '$totalEntriesNumber'],
                  },
                  then: POSTED_STATUS,
                },
                {
                  case: {
                     $and: [
                       { $eq: ['$status', IN_PROGRESS_STATUS] },
                       { $lt: ['$postedEntriesNumber', '$totalEntriesNumber'] },
                       {
                         $or: [
                           { $eq: ['$inProgressEntriesNumber', '$totalEntriesNumber'] },
                           { $gt: ['$postedEntriesNumber', 0] },
                        ],
                       },
                     ],
                   },
                   then: READY_TO_BE_POSTED_STATUS,
                 },
                {
                  case: {
                    $and: [
                      { $eq: ['$status', IN_PROGRESS_STATUS] },
                      { $gt: ['$inProgressEntriesNumber', 0] },
                      { $eq: ['$draftedEntriesNumber', 0] },
                      {
                        $or: [
                          { $eq: ['$draftedEntriesNumber', '$totalEntriesNumber'] },
                          { $gt: ['$inProgressEntriesNumber', 0] },
                        ],
                      },
                    ],
                  },
                  then: IN_PROGRESS_STATUS,
                },
              ],
              default: '$status',
            },
          },
        },
      },
      {
        $addFields: {
          entries: {
            $cond: [
              { $eq: ['$status', DRAFTED_STATUS] },
              '$entries',
              [],
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          status: 1,
          processingStatus: 1,
          entries: 1,
          accounting: 1,
          company: 1,
        },
      },
    ]);
  }

  async isSchedulerStuck() {
    const schedulerInDb = await mongooseSchema.Scheduler.findOne(
      { name: 'invoice-poster', lspId: this.lspId, isRunning: true },
    );
    if (_.isNil(schedulerInDb)) {
      return false;
    }
    const lastExecutionDate = moment(schedulerInDb.lastExecutionDate);
    return moment().diff(lastExecutionDate, 'minutes') > 5;
  }

  async shouldRunScheduler() {
    const scheduler = await mongooseSchema.Scheduler.findOneAndUpdate(
      { name: 'invoice-poster', lspId: this.lspId, isRunning: false },
      { $set: { isRunning: true, lastExecutionDate: moment().toDate() } },
);
    const lockAcquired = !_.isNil(scheduler);
    if (lockAcquired) {
      return true;
    }
    const isSchedulerStuck = await this.isSchedulerStuck();
    if (isSchedulerStuck) {
      await mongooseSchema.Scheduler.findOneAndUpdate(
        {
 name: 'invoice-poster', lspId: this.lspId, isRunning: true, lastExecutionDate: moment().toDate(),
},
        { $set: { isRunning: false } },
);
      return true;
    }
    return false;
  }

  async run(job, done) {
    this.lspId = _.get(job, 'attrs.data.lspId');
    try {
      if (this.numberOfBatchEntries <= 0 || !_.isNumber(this.numberOfBatchEntries)) {
        throw new Error('AR_INVOICE_TOTAL_NUMBER_OF_BATCH_ENTRIES has not been configured correctly');
      }
      const shouldRun = await this.shouldRunScheduler();
      if (!shouldRun) {
        return done();
      }
      const invoices = await this.getUnprocessedInvoices();
      this.logger.debug(`Invoice-poster scheduler is running for lspId:${this.lspId}`);
      if (invoices.length === 0) {
        this.logger.debug(`Invoice-poster scheduler has not found any invoice to be processed for lspId: ${this.lspId}`);
        await mongooseSchema.Scheduler.findOneAndUpdate(
          { name: 'invoice-poster', lspId: this.lspId, isRunning: true },
          { $set: { isRunning: false, lastExecutionDate: moment().toDate() } },
);
        return done();
      }
      await Promise.map(invoices, async (invoice) => {
        this.logger.debug(`Invoice-poster scheduler will process invoice ${invoice._id} for lspId: ${this.lspId}`);
        await this.handleInvoice(invoice);
        this.logger.debug(`Invoice-poster: Finished executing processing of invoice ${invoice._id} invoice-poster scheduler for lspId:${this.lspId}`);
      });
      await mongooseSchema.Scheduler.findOneAndUpdate(
        { name: 'invoice-poster', lspId: this.lspId, isRunning: true },
        {
          $set: { isRunning: false },
        },
);
      done();
    } catch (error) {
      this.logger.error(`Invoice-poster: Error executing scheduler for lspId:${this.lspId}. Error: ${error}`);
      done(error);
    }
  }
}

module.exports = InvoicePosterScheduler;
