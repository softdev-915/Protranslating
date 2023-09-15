// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const metadata = require('../plugins/metadata');
const lspData = require('../plugins/lsp-data');

const Schema = mongoose.Schema;
const Session = new Schema({
  _id: String,
  session: String,
  expires: Date,
}, {
  collection: 'sessions',
  timestamps: true,
});

Session.plugin(metadata);
Session.plugin(lspData);

module.exports = Session;
