const moment = require('moment');
const SchemaAwareAPI = require('../../../schema-aware-api');
const { RestError } = require('../../../../components/api-response');

class UserToastAPI extends SchemaAwareAPI {
  /**
   * @param {String|ObjectId} userId the user's id to lookup toast.
   */
  async list(userId) {
    const userToasts = await this.listVisible(userId);
    const now = moment.utc().toDate();
    const toastsId = userToasts.map((ut) => ut._id);

    if (toastsId.length) {
      await this.schema.UserToast.updateMany({
        lspId: this.lspId,
        _id: {
          $in: toastsId,
        },
      }, {
        $set: {
          lastReadTime: now,
        },
      });
    }

    return userToasts;
  }

  async listVisible(userId) {
    const now = moment.utc().toDate();
    const visibleUserToasts = await this.schema.UserToast.findVisibleUserToasts(
      this.lspId,
      userId,

      now,
    );

    return visibleUserToasts;
  }

  async edit(user, userToastAction) {
    const userToast = await this.schema.UserToast.findOne({
      _id: userToastAction._id,
      lspId: this.lspId,
    });
    const now = moment.utc().toDate();

    if (!userToast) {
      throw new RestError(404, { message: `User toast ${userToastAction._id} does not exist` });
    }
    if (userToastAction.dismissed) {
      userToast.dismissedTime = now;
    }
    if (userToastAction.read) {
      userToast.lastReadTime = now;
    }
    await userToast.save();

    return userToast;
  }
}

module.exports = UserToastAPI;
