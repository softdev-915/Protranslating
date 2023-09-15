/* eslint-disable semi */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable indent */
/* eslint-disable quote-props */
const Promise = require('bluebird');
const moment = require('moment');
const _ = require('lodash');
const { Types: { ObjectId } } = require('mongoose');
const logger = require('../../log/scheduler-logger');
const mongooseSchema = require('../../database/mongo').models;
const { provideTransaction } = require('../../database/mongo/utils');
const { sum, bigJsToNumber, ensureNumber } = require('../../../utils/bigjs');
const configuration = require('../../configuration');

const IN_PROGRESS_STATUS = 'inProgress';
const DRAFTED_STATUS = 'drafted';
const POSTED_STATUS = 'posted';
const READY_TO_BE_POSTED_STATUS = 'ready';
const ACCOUNT_PAYABLE_TYPE_BILL_ADJUSTMENT = 'billAdjustment';
const ACCOUNT_PAYABLE_TYPE_BILL = 'bill';
const ID_PREFIX_BILL_ADJUSTMENT = 'BA_';
const ID_PREFIX_BILL = 'B_';

class ApPaymentPosterScheduler {
  constructor() {
    this.logger = logger;
    const { AP_PAYMENT_TOTAL_NUMBER_OF_BATCH_ENTRIES } = configuration.environment;
    this.numberOfBatchEntries = AP_PAYMENT_TOTAL_NUMBER_OF_BATCH_ENTRIES;
  }

  handleDraftedApPayment(apPayment) {
    this.logger.debug('ap-payment-poster: Handling Drafted apPayment started at', moment().format('HH:mm:ss'));
    this.logger.debug(`ap-payment-poster: Processing "Drafted" apPayment ${apPayment._id}`);
    return provideTransaction(async (session) => {
      await mongooseSchema.User.lockDocument({ _id: apPayment.vendor }, session);
      await mongooseSchema.ApPayment.findOneAndUpdate(
        { _id: apPayment._id, status: DRAFTED_STATUS },
        {
          $set: {
            status: IN_PROGRESS_STATUS,
          },
        },
        { session },
);
      this.logger.debug('ap-payment-poster: Handling Drafted apPayment finished at', moment().format('HH:mm:ss'));
    });
  }

  async setBillAndBillAdjustmentStatus(inProgressEntries, session) {
    await Promise.map(inProgressEntries, async (entry) => {
      const { accountPayableId = '' } = entry;
      const isBill = accountPayableId.startsWith(ID_PREFIX_BILL);
      const isAdjustment = accountPayableId.startsWith(ID_PREFIX_BILL_ADJUSTMENT);
      if (isAdjustment) {
        const billAdjustmentId = accountPayableId.replace(ID_PREFIX_BILL_ADJUSTMENT, '');
        const billAdjustmentInDb = await mongooseSchema.BillAdjustment.findOne(
          { _id: new ObjectId(billAdjustmentId) },
);
        await mongooseSchema.BillAdjustment.findOneAndUpdate({ _id: billAdjustmentId }, {
          $set: {
            status: mongooseSchema.BillAdjustment.getStatus(billAdjustmentInDb),
          },
        }, { new: false, session });
      } else if (isBill) {
        const billId = accountPayableId.replace(ID_PREFIX_BILL, '');
        const billInDb = await mongooseSchema.BillAdjustment.findOne(
          { _id: new ObjectId(billId) },
);
        await mongooseSchema.BillAdjustment.findOneAndUpdate({ _id: new ObjectId(billId) }, {
          $set: {
            status: billInDb.balance > 0 ? 'partiallyPaid' : 'paid',
          },
        }, { new: false, session });
      }
    });
  }

  async updateBill(_id, amount, session) {
    const updatedBill = await mongooseSchema.Bill.findOneAndUpdate(
      { _id: new ObjectId(_id) },
      { $inc: { amountPaid: amount, balance: -amount } },
      { session, new: true },
);
    await mongooseSchema.Bill.findOneAndUpdate({ _id: updatedBill._id }, {
      $set: { status: mongooseSchema.Bill.getStatus(updatedBill) },
    }, { session });
    this.logger.debug(`ap-payment-poster: Updated Bill ${_id}`);
    if (_.isNil(updatedBill)) {
      throw new Error(`Not enough credits available in bill ID ${_id} to create the payment`);
    }
    const { vendor, no } = updatedBill;
    return {
      vendorId: vendor,
      appliedToDetails: {
        appliedTo: new ObjectId(_id),
        appliedToNo: no,
        appliedToType: ACCOUNT_PAYABLE_TYPE_BILL,
      },
    };
  }

  async updateBillAdjustment(_id, amount, session) {
    const updatedBillAdjustment = await mongooseSchema.BillAdjustment.findOneAndUpdate(
      {
        _id: new ObjectId(_id),
      },
      {
        $inc: { amountPaid: amount, adjustmentBalance: -amount },
      },
      { session, new: true },
    );
    if (_.isNil(updatedBillAdjustment)) {
      throw new Error(`Failed to adjust balance and amount paid. Bill adjustment _id ${_id} not found`);
    }
    this.logger.debug(`ap-payment-poster: Updated BillAdjustment ${_id}`);
    const { vendor, adjustmentNo } = updatedBillAdjustment;
    return {
      vendorId: vendor,
      appliedToDetails: {
        appliedTo: new ObjectId(_id),
        appliedToNo: adjustmentNo,
        appliedToType: ACCOUNT_PAYABLE_TYPE_BILL_ADJUSTMENT,
      },
    };
  }

  async deductCreditsFromDebitMemos(vendorId, creditsToApply, session) {
    this.logger.debug(`Ap payment: Started deductCreditsFromDebitMemos ${vendorId}`);
    const query = { vendor: vendorId, type: 'Debit Memo', adjustmentBalance: { $gt: 0 } };
    const cursor = mongooseSchema.BillAdjustment.find(query, null, { sort: { createdAt: -1 } })
      .session(session)
      .cursor();
    const result = [];
    await cursor.eachAsync(async (debitMemo) => {
      const { _id, adjustmentNo, adjustmentBalance } = debitMemo;
      if (creditsToApply === 0) {
        this.logger.debug('No credits to apply for vendor with id', vendorId);
        return;
      }
      const appliedCredits = _.min([creditsToApply, adjustmentBalance]);
      const amountPaid = ensureNumber(debitMemo.amountPaid) + ensureNumber(appliedCredits);
      const adjBalance = ensureNumber(debitMemo.adjustmentBalance) - ensureNumber(appliedCredits);
      this.logger.debug(`Ap payment: Updating BillAdjustment balance ${_id}`);
      const updatedDebitMemo = await mongooseSchema.BillAdjustment.findOneAndUpdate({
        _id,
        adjustmentBalance: { $gt: 0 },
      }, {
        $set: {
          adjustmentBalance: _.round(ensureNumber(adjBalance), 2),
          amountPaid: _.round(ensureNumber(amountPaid), 2),
        },
      }, { session, new: true });
      this.logger.debug(`Ap payment: Finished updating BillAdjustment balance ${_id}`);
      await mongooseSchema.BillAdjustment.findOneAndUpdate(
        { _id },
        {
          $set: {
            status: mongooseSchema.BillAdjustment.getStatus(updatedDebitMemo),
          },
        },
        { session, new: true },
      );
      this.logger.debug(`Ap payment: Finished updating BillAdjustment status after balance ${_id}`);
      result.push({ appliedFrom: _id, appliedFromNo: adjustmentNo, appliedCredits });
      creditsToApply -= appliedCredits;
      if (creditsToApply < 0) {
        throw new Error(`Credits to apply cannot be less than 0, failed processing vendor with id: ${vendorId}`);
      }
    });
    return result;
  }

  async updateEntityFromApPaymentEntry(vendorId, entry, session) {
    const { accountPayableId = '' } = entry;
    const isBill = accountPayableId.startsWith(ID_PREFIX_BILL);
    const isAdjustment = accountPayableId.startsWith(ID_PREFIX_BILL_ADJUSTMENT);
    let updatedEntityDetails;
    const summaryPaymentAmount = bigJsToNumber(
      sum(
        _.round(entry.creditsToApply, 2),
        _.round(entry.paymentAmount, 2),
      ),
    );
    if (entry.creditsToApply > 0) {
      entry.appliedFromDetails = await this.deductCreditsFromDebitMemos(vendorId, entry.creditsToApply, session);
    }
    if (isAdjustment) {
      updatedEntityDetails = await this.updateBillAdjustment(
        accountPayableId.replace(ID_PREFIX_BILL_ADJUSTMENT, ''),
        summaryPaymentAmount,
        session,
      );
      Object.assign(entry, updatedEntityDetails);
    } else if (isBill) {
      updatedEntityDetails = await this.updateBill(
        accountPayableId.replace(ID_PREFIX_BILL, ''),
        summaryPaymentAmount,
        session,
      );
      Object.assign(entry, updatedEntityDetails);
    } else {
      throw new Error('Invalid account payable id');
    }
    return Object.assign(entry, updatedEntityDetails, {
      status: IN_PROGRESS_STATUS,
    });
  }

  async handleInProgressApPayment(apPayment) {
    this.logger.debug('ap-payment-poster: Handling In Progress apPayment started at', moment().format('HH:mm:ss'));
    this.logger.debug(`ap-payment-poster: Processing In Progress apPayment ${apPayment._id}`);
    await provideTransaction(async (session) => {
      try {
        await mongooseSchema.User.lockDocument({ _id: apPayment.vendor }, session);
        const apPaymentInDb = await mongooseSchema.ApPayment.findOne(
          {
            _id: apPayment._id,
            status: IN_PROGRESS_STATUS,
          },
        );
        await Promise.mapSeries(apPaymentInDb.entries, async (entry) => {
          const updatedEntry = await this.updateEntityFromApPaymentEntry(
            apPayment.vendor,
            entry,
            session,
          );
          Object.assign(entry, updatedEntry);
        });
        const combinedDetails = apPaymentInDb.entries.map((entry) => {
          const details = [];
          const { paymentAmount, appliedToDetails, appliedFromDetails } = entry;
          if (Number(entry.paymentAmount, 2) > 0) {
            details.push({ ...appliedToDetails, paymentAmount });
          }
          if (!_.isNil(appliedFromDetails)) {
            return details.concat(appliedFromDetails.map((debitMemoDetails) => ({ ...appliedToDetails, ...debitMemoDetails })));
          }
          return details;
        });
        await mongooseSchema.ApPayment.findOneAndUpdate(
          { _id: apPayment._id, status: IN_PROGRESS_STATUS },
          {
            $set: {
              entries: _.flatten(combinedDetails),
            },
          },
          {
            session,
            upsert: false,
          },
        ).session(session);
        this.logger.debug(`ap-payment-poster: Processed "In Progress" apPayment ${apPayment._id}: Updated 250 entities`);
      } catch (err) {
        this.logger.debug(`ap-payment-poster: Failed to process "In Progress" apPayment ${apPayment._id}. Err: ${err}`);
        throw err;
      }
    });
    this.logger.debug(`ap-payment-poster: Finished Processed "In Progress" apPayment ${apPayment._id}`);
  }

  async handleReadyToBePostedApPayment(apPayment) {
    this.logger.debug('ap-payment-poster: Handling Ready to be posted apPayment started at', moment().format('HH:mm:ss'));
    this.logger.debug(`ap-payment-poster: Processing "Ready to be posted" apPayment ${apPayment._id}`);
    return provideTransaction(async (session) => {
      try {
        await mongooseSchema.User.lockDocument({ _id: apPayment.vendor }, session);
        const apPaymentInDb = await mongooseSchema.ApPayment.findOne({
          _id: apPayment._id,
          status: IN_PROGRESS_STATUS,
        }).session(session);
        if (_.isNil(apPaymentInDb)) {
          throw new Error(`Payment with _id ${apPayment._id} has not been found`);
        }
        await this.setBillAndBillAdjustmentStatus(apPaymentInDb.entries, session);
        await mongooseSchema.ApPayment.findOneAndUpdate(
          { _id: apPayment._id, status: IN_PROGRESS_STATUS },
          {
            $set: {
              'entries.$[].status': POSTED_STATUS,
            },
          },
          {
            session,
          },
        );
        this.logger.debug(`ap-payment-poster: Finished processing "Pre Posted" apPayment ${apPayment._id}`);
      } catch (err) {
        this.logger.debug(`ap-payment-poster: Failed processing "Pre Posted" apPayment ${apPayment._id}. Err ${err}`);
        throw err;
      }
    });
  }

  async handlePostedApPayment(apPayment) {
    this.logger.debug('ap-payment-poster: Handling Posted apPayment started at', moment().format('HH:mm:ss'));
    this.logger.debug(`ap-payment-poster: Processing "Posted" apPayment ${apPayment._id}`);
    await provideTransaction(async (session) => {
      try {
        await mongooseSchema.User.lockDocument({ _id: apPayment.vendor }, session);
        await mongooseSchema.ApPayment.findOneAndUpdate(
          {
            _id: apPayment._id,
            status: IN_PROGRESS_STATUS,
          },
          {
            $set: {
              status: POSTED_STATUS,
            },
            $rename: { entries: 'details' },
          },
          {
            session,
          },
        );
        await mongooseSchema.User.consolidateVendorBalance(apPayment.vendor, session);
        this.logger.debug('ap-payment-poster: Handling Posted apPayment finished at', moment().format('HH:mm:ss'));
      } catch (err) {
        this.logger.debug(`ap-payment-poster: Failed processing "Posted" apPayment ${apPayment._id}. Err ${err}`);
        throw err;
      }
    });
  }

  async handleApPayment(apPayment) {
    if (apPayment.processingStatus === DRAFTED_STATUS) {
      await this.handleDraftedApPayment(apPayment);
      await this.handleInProgressApPayment(apPayment);
      await this.handleReadyToBePostedApPayment(apPayment);
      await this.handlePostedApPayment(apPayment);
    }
    if (apPayment.processingStatus === IN_PROGRESS_STATUS) {
      await this.handleInProgressApPayment(apPayment);
      await this.handleReadyToBePostedApPayment(apPayment);
      return this.handlePostedApPayment(apPayment);
    }
    if (apPayment.processingStatus === READY_TO_BE_POSTED_STATUS) {
      await this.handleReadyToBePostedApPayment(apPayment);
      return this.handlePostedApPayment(apPayment);
    }
    return this.handlePostedApPayment(apPayment);
  }

  getUnprocessedApPayments() {
    return mongooseSchema.ApPayment.aggregate([
      {
        $match: {
          lspId: this.lspId,
          status: { $in: [DRAFTED_STATUS, IN_PROGRESS_STATUS] },
        },
      },
      {
        $limit: this.numberOfBatchEntries,
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
        $limit: this.numberOfBatchEntries,
      },
    ]);
  }

  async isSchedulerStuck() {
    const schedulerInDb = await mongooseSchema.Scheduler.findOne(
      { name: 'ap-payment-poster', lspId: this.lspId, isRunning: true },
    );
    if (_.isNil(schedulerInDb)) {
      return false;
    }
    const lastExecutionDate = moment(schedulerInDb.lastExecutionDate);
    return moment().diff(lastExecutionDate, 'minutes') > 5;
  }

  async shouldRunScheduler() {
    const scheduler = await mongooseSchema.Scheduler.findOneAndUpdate(
      { name: 'ap-payment-poster', lspId: this.lspId, isRunning: false },
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
 name: 'ap-payment-poster', lspId: this.lspId, isRunning: true, lastExecutionDate: moment().toDate(),
},
        { $set: { isRunning: false } },
);
      return true;
    }
    return false;
  }

  async markSchedulerAsFinished() {
    await mongooseSchema.Scheduler.findOneAndUpdate(
      { name: 'ap-payment-poster', lspId: this.lspId, isRunning: true },
      { $set: { isRunning: false, lastExecutionDate: moment().toDate() } },
);
  }

  async run(job, done) {
    this.lspId = _.get(job, 'attrs.data.lspId');
    try {
      if (this.numberOfBatchEntries <= 0 || !_.isNumber(this.numberOfBatchEntries)) {
        throw new Error('AP_PAYMENT_TOTAL_NUMBER_OF_BATCH_ENTRIES has not been configured correctly');
      }
      const shouldRun = await this.shouldRunScheduler();
      if (!shouldRun) {
        return done();
      }
      const apPayments = await this.getUnprocessedApPayments();
      this.logger.debug(`ap-payment-poster scheduler is running for lspId:${this.lspId}`);
      if (apPayments.length === 0) {
        this.logger.debug(`ap-payment-poster scheduler has not found any apPayment to be processed for lspId: ${this.lspId}`);
        await this.markSchedulerAsFinished();
        return done();
      }
      await Promise.map(apPayments, (apPayment) => {
        this.logger.debug(`ap-payment-poster scheduler will process apPayment ${apPayment._id} for lspId: ${this.lspId}`);
        this.logger.debug(`ap-payment-poster: Finished executing processing of apPayment ${apPayment._id} ap-payment-poster scheduler for lspId:${this.lspId}`);
        return this.handleApPayment(apPayment);
      });
      await this.markSchedulerAsFinished();
      done();
    } catch (error) {
      this.logger.debug(`ap-payment-poster: Error executing scheduler for lspId:${this.lspId}. Error: ${error}`);
      done(error);
    }
  }
}

module.exports = ApPaymentPosterScheduler;
