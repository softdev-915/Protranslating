const properAccountFactory = lspId => a => a.lsp._id.toString() === lspId.toString();

module.exports = {
  properAccountFactory: properAccountFactory,
};
