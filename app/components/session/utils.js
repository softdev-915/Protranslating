const mongoose = require('mongoose');
const { models: mongooseSchema } = require('../database/mongo');

const { Types: { ObjectId } } = mongoose;
const updateUserSessions = async (lspId, userId, userSessions) => {
  if (!lspId || !userId) return;
  return mongooseSchema.User.findOneAndUpdate(
    {
      lsp: new ObjectId(lspId),
      _id: new ObjectId(userId),
    },
    {
      $set: {
        userSessions,
      },
    });
};
const getDbUser = async (...query) => mongooseSchema.User.findOneWithDeleted(...query);
const getDbUsers = async (...query) => mongooseSchema.User.findWithDeleted(...query);
const getDbSessions = async (...query) => mongooseSchema.Session.find(...query);

module.exports = {
  updateUserSessions,
  getDbUser,
  getDbUsers,
  getDbSessions,
};
