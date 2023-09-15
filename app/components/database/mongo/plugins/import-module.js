const _ = require('lodash');

const POSSIBLE_LSP_REFS = ['lspId', 'lsp'];

module.exports = exports = (schema) => {
  schema.add({ externalId: String });
  const index = {};
  const lspRef = POSSIBLE_LSP_REFS.find(ref => _.has(schema.paths, ref));
  if (!_.isEmpty(lspRef)) {
    index[lspRef] = 1;
  }
  index.externalId = 1;
  schema.index(index, {
    unique: true,
    partialFilterExpression: {
      externalId: { $exists: true },
    },
  });
};
