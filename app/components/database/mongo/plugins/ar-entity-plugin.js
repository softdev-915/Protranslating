const mongoose = require('mongoose');
const _ = require('lodash');
const Big = require('big.js');
const { ensureNumber, decimal128ToNumber, bigJsToNumber } = require('../../../../utils/bigjs');

const { Schema } = mongoose;
const STATUSES = {
  POSTED: 'Posted',
  PAID: 'Paid',
  PART_PAID: 'Partially Paid',
  VOIDED: 'Voided',
  DRAFTED: 'Drafted',
};
const AccountingDetailsSchema = new Schema({
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    required: true,
  },
  amountInLocal: {
    type: mongoose.Schema.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
  },
  paid: {
    type: mongoose.Schema.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  paidInLocal: {
    type: mongoose.Schema.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    default: 0,
  },
  balance: {
    type: mongoose.Schema.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
  },
  balanceInLocal: {
    type: mongoose.Schema.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
  },
  currency: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Currency',
      required: true,
    },
    isoCode: {
      type: String,
      required: true,
    },
  },
  localCurrency: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Currency',
      required: true,
    },
    isoCode: {
      type: String,
      required: true,
    },
  },
  exchangeRate: {
    type: mongoose.Schema.Types.Decimal128,
    get: decimal128ToNumber,
    set: bigJsToNumber,
    validate: {
      validator(value) {
        return value > 0;
      },
      message: () => 'Incorrect exchange rate',
    },
    required: true,
  },
}, { _id: false, toJSON: { getters: true }, toObject: { getters: true } });

module.exports = (schema) => {
  schema.add({ accounting: AccountingDetailsSchema });
  schema.add({
    status: {
      type: String,
      enum: Object.keys(STATUSES).map((key) => STATUSES[key]),
      default: STATUSES.POSTED,
    },
  });
  schema.methods.setStatus = function () {
    const { accounting } = this;
    const isPartiallyPaid = ensureNumber(accounting.paid) > 0;
    const isFullyPaid = accounting.paid === accounting.amount && ensureNumber(accounting.paid) > 0;
    if (this.status !== STATUSES.DRAFTED && this.status !== STATUSES.VOIDED) {
      if (isFullyPaid) {
        this.status = STATUSES.PAID;
      } else if (isPartiallyPaid) {
        this.status = STATUSES.PART_PAID;
      } else {
        this.status = STATUSES.POSTED;
      }
    }
  };
  schema.methods.setBalance = function () {
    const { accounting } = this;
    const { exchangeRate } = accounting;
    const paid = _.defaultTo(accounting.paid, 0);
    accounting.balance = new Big(accounting.amount).minus(paid).toFixed(2);
    if (accounting.balance === 0) {
      accounting.balanceInLocal = 0;
    } else {
      accounting.balanceInLocal = new Big(accounting.balance).div(exchangeRate).toFixed(2);
      if (ensureNumber(accounting.paidInLocal) > 0) {
        accounting.balanceInLocal = accounting.amountInLocal - accounting.paidInLocal;
      }
    }
  };
  schema.methods.setAmountInLocal = function () {
    const { accounting } = this;
    const { amount, exchangeRate } = accounting;
    accounting.amountInLocal = new Big(amount).div(exchangeRate).toFixed(2);
  };
  schema.methods.setAccountingDetails = function () {
    const { accounting } = this;
    this.setStatus();
    this.setAmountInLocal();
    this.setBalance();
    if (this.status === STATUSES.DRAFTED) {
      return accounting;
    }
    this.validateAccountingDetails();
    return accounting;
  };
  schema.methods.validateAccountingDetails = function () {
    const {
      amount, amountInLocal, balanceInLocal, balance, paid, paidInLocal,
    } = this.accounting;
    const isValidAmount = amount > 0;
    if (!isValidAmount) {
      throw new Error('Incorrect amount');
    }
    const isValidAmountInLocal = amountInLocal > 0;
    if (!isValidAmountInLocal) {
      throw new Error('Incorrect amount in local currency');
    }
    if (this.status === STATUSES.PAID) {
      const isValidPaid = paid > 0 && paid === amount;
      if (!isValidPaid) {
        throw new Error('Incorrect paid amount');
      }
      if (paidInLocal === 0) {
        throw new Error('Incorrect paid in local value');
      }
      const isValidBalanceInLocal = balanceInLocal === 0;
      if (!isValidBalanceInLocal) {
        throw new Error('Incorrect balance in local currency amount');
      }
      const isValidBalance = balance === 0;
      if (!isValidBalance) {
        throw new Error('Incorrect balance amount');
      }
    } else if (this.status === STATUSES.PART_PAID) {
      const isValidPaid = paid > 0 && paid < amount;
      if (!isValidPaid) {
        throw new Error('Incorrect paid amount');
      }
      if (paidInLocal === 0) {
        throw new Error('Incorrect paid in local value');
      }
      const isValidBalanceInLocal = balanceInLocal > 0;
      if (!isValidBalanceInLocal) {
        throw new Error('Incorrect balance in local currency amount');
      }
      const isValidBalance = balance > 0;
      if (!isValidBalance) {
        throw new Error('Incorrect balance amount');
      }
    } else {
      const isValidBalanceInLocal = balanceInLocal > 0;
      if (!isValidBalanceInLocal) {
        throw new Error('Incorrect balance in local currency amount');
      }
      const isValidBalance = balance > 0;
      if (!isValidBalance) {
        throw new Error('Incorrect balance amount');
      }
    }
    return null;
  };
  schema.methods.pay = function (session) {
    if (_.isNil(session)) {
      throw new Error('Session parameter is mandatory for the paying process');
    }
    const { accounting } = this;
    accounting.paid = _.defaultTo(accounting.paid, 0);
    this.setStatus();
    this.accounting.paidInLocal = new Big(this.accounting.paid).div(
      this.accounting.exchangeRate,
    ).toFixed(2);
    this.setBalance();
    this.validateAccountingDetails();
    return this.save({ session });
  };
};
