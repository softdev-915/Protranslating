const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema;

module.exports = (schema) => {
  schema.add({
    lspId: {
      type: ObjectId,
      ref: 'Lsp',
    },
  });
};
