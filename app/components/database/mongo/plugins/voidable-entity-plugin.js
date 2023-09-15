const _ = require('lodash');

module.exports = exports = (schema) => {
  schema.methods.void = function (session, details) {
    if (_.isNil(session)) {
      throw new Error('Session parameter is mandatory for the void process');
    }
    if (_.lowerCase(this.status) === 'voided') {
      throw new Error(`Entity with _id ${this._id} was already voided`);
    }
    this.status = 'Voided';
    this.accounting.amountInLocal = 0;
    this.accounting.amount = 0;
    this.accounting.paid = 0;
    this.accounting.paidInLocal = 0;
    this.accounting.balance = 0;
    this.accounting.balanceInLocal = 0;
    if (!_.isNil(details)) {
      details.isVoided = true;
      this.voidDetails = details;
    }
    this.siConnector.isVoided = true;
    return this.save({ session });
  };
};
