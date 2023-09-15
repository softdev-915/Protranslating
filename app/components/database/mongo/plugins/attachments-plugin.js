const mongoose = require('mongoose');

const { Schema } = mongoose;
const DocumentSchema = new Schema({
  name: String,
  mime: String,
  encoding: String,
  size: Number,
  url: String,
  cloudKey: String,
  md5Hash: { type: String, default: 'pending' },
}, { timestamps: true });

module.exports = (schema) => schema.add({ attachments: [DocumentSchema] });
