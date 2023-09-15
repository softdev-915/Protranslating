const _ = require('lodash');

module.exports = function (schema) {
  schema.statics.lockDocument = function (query, session) {
    const options = { session, new: true };
    const set = {
      $set: {
        updatedAt: new Date(),
      },
    };

    if (_.isFunction(this.findOneAndUpdateWithDeleted)) {
      return this.findOneAndUpdateWithDeleted(query, set, options);
    }

    return this.findOneAndUpdate(query, set, options);
  };
  schema.statics.lockDocuments = function (query, session) {
    const options = { session, new: true };
    const set = {
      $set: {
        updatedAt: new Date(),
      },
    };

    if (_.isFunction(this.updateManyWithDeleted)) {
      return this.updateManyWithDeleted(query, set, options);
    }

    return this.updateMany(query, set, options);
  };
};
