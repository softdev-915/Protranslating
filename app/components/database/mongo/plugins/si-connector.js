const mongoose = require('mongoose');

module.exports = function (schema) {
  const customFields = {
    siConnector: {
      type: {
        connectorStartedAt: Date,
        connectorEndedAt: Date,
        isSynced: { type: Boolean, default: false },
        isVoided: { type: Boolean, default: false },
        error: String,
        isMocked: Boolean,
        metadata: { type: mongoose.SchemaTypes.Mixed, default: null },
      },
      default: {
        isSynced: false,
        error: null,
        isMocked: false,
      },
      immutable: true,
    },
  };

  schema.add(customFields);
};
