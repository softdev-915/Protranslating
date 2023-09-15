const moment = require('moment');
const _ = require('lodash');
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');
const { environment } = require('../../../configuration');

const { Schema } = mongoose;
const Counter = new Schema({
  name: String,
  seq: Number,
  date: String,
}, {
  collection: 'counters',
  timestamps: true,
});

Counter.plugin(mongooseDelete, { overrideMethods: true });
Counter.plugin(metadata, { defaultAuthor: 'SYSTEM' });
Counter.plugin(lspData);
Counter.index({ lspId: 1, name: 1, date: 1, seq: 1 }, { unique: true });

const upsertSequence = function (options) {
  const author = 'SYSTEM';
  const lspId = _.get(options, 'lspId');
  const autoIncrementalKeyName = _.get(options, 'autoIncrementalKeyName');
  const session = _.get(options, 'session');
  const query = {
    lspId,
    name: autoIncrementalKeyName,
    date: moment().utc().startOf('day').format('YYMMDD'),
  };
  const queryOptions = { session, new: true, upsert: true };
  const CounterModel = mongoose.models.Counter;
  const callback = _.get(options, 'cb');
  const update = {
    date: moment().utc().startOf('day').format('YYMMDD'), $inc: { seq: 1 }, updatedBy: author, createdBy: author,
  };

  return CounterModel.findOneAndUpdate(query, update, queryOptions).then((result) => {
    result.seq += environment.ENTITY_NUMBER_STARTS_AT;
    if (callback) {
      return callback(null, result);
    }

    return result;
  }).catch((err) => {
    if (_.isFunction(callback)) {
      return callback(err);
    }
  });
};

Counter.statics.nextRequestNumber = function (lspId, cb) {
  return upsertSequence({
    lspId,
    autoIncrementalKeyName: 'requestNo',
    cb,
  });
};

Counter.statics.nextBillNumber = function (lspId, cb) {
  return upsertSequence({
    lspId,
    autoIncrementalKeyName: 'billNo',
    cb,
  });
};

Counter.statics.nextBillAdjustmentNumber = function (lspId, cb) {
  return upsertSequence({
    lspId,
    autoIncrementalKeyName: 'billAdjustmentNo',
    cb,
  });
};

Counter.statics.nextOpportunityNumber = function (lspId, cb) {
  return upsertSequence({
    lspId,
    autoIncrementalKeyName: 'opportunityNo',
    cb,
  });
};

Counter.statics.nextEntityNumber = function ({ lspId, key, session }, cb) {
  return upsertSequence({
    lspId,
    autoIncrementalKeyName: key,
    session,
    cb,
  });
};

module.exports = Counter;
