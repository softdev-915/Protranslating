const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const { Types: { ObjectId } } = require('mongoose');
const { generateAllUsersToast } = require('./toast-helpers');
const { searchFactory } = require('../../../utils/pagination');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const SchemaAwareAPI = require('../../schema-aware-api');
const { RestError } = require('../../../components/api-response');
const { CsvExport } = require('../../../utils/csvExporter');

const USER_ATTR = '_id firstName middleName lastName email';

class ToastAPI extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.allUsers = null;
    this.configuration = _.get(options, 'configuration');
  }

  /**
   * Returns the toast notification list as a csv file
   * @param {Object} toastFilters to filter the list returned.
   */
  async toastExport(filters) {
    this.logger.debug(`User ${this.user.email} retrieved a toast notification list export file`);
    const query = _.get(filters, 'paginationParams', {
      lspId: this.lspId,
    });
    const pipeline = this.getPipeline();
    const extraQueryParams = {
      stream: true,
    };

    const queryObj = searchFactory({
      model: this.schema.Toast,
      filters: query,
      extraPipelines: pipeline,
      extraQueryParams,
      utcOffsetInMinutes: filters.__tz,
    });

    const csvExporter = new CsvExport(queryObj, {
      schema: this.schema.Toast,
      lspId: this.lspId,
      configuration: this.configuration,
      logger: this.logger,
      filters: query,
    });
    return csvExporter.export();
  }

  getPipeline() {
    const pipeline = [
      {
        $addFields: {
          usersName: {
            $reduce: {
              input: '$usersCache',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$usersCache', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this.firstName', ' ', '$$this.lastName'] },
                  else: { $concat: ['$$value', ', ', '$$this.firstName', ' ', '$$this.lastName'] },
                },
              },
            },
          },
        },
      },
    ];
    return pipeline;
  }

  async list(filters) {
    if (filters._id) {
      const details = await this.detail(filters._id);
      return details;
    }
    let query = {
      lspId: this.lspId,
    };

    // Search all toasts
    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    const pipeline = this.getPipeline();
    const toasts = await searchFactory({
      model: this.schema.Toast,
      filters: query,
      extraPipelines: pipeline,
    });
    return {
      list: toasts,
      total: toasts.length,
    };
  }

  async detail(toastId) {
    const toast = await this.schema.Toast.findOneWithDeleted({
      lspId: this.lspId,
      _id: toastId,
    });

    if (!toast) {
      throw new RestError(404, { message: `Toast ${toastId} does not exist` });
    }
    return toast;
  }

  async create(toastProspect) {
    const users = await this._checkToastUsers(toastProspect);

    toastProspect.lspId = this.lspId;
    if (toastProspect.from) {
      toastProspect.from = moment(toastProspect.from).toDate();
    }
    if (toastProspect.to) {
      toastProspect.to = moment(toastProspect.to).toDate();
    }
    delete toastProspect._id;
    const toast = new this.schema.Toast(toastProspect);

    try {
      await toast.save();
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error saving toast. Error ${message}`);
      throw new RestError(500, { message: 'Error creating toast', stack: err.stack });
    }
    try {
      await this._createUserToast(toast, users);
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error saving user's toast. Error ${message}`);
      // if user's toast failed to be created, remove the created toast.
      await toast.delete();
      throw new RestError(500, { message: 'Error creating toast' });
    }
    return toast;
  }

  async edit(toastProspect) {
    const query = { lspId: this.lspId, _id: toastProspect._id };
    const toast = await this.schema.Toast.findOneWithDeleted(query);

    if (!toast) {
      throw new RestError(404, { message: `Toast ${toastProspect._id} does not exist` });
    }
    if (toastProspect.deleted) {
      // toast deleted
      const deletedToast = this.deleteToast(toast);
      return deletedToast;
    }
    const users = await this._checkToastUsers(toastProspect);
    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'toast',
    });
    await concurrencyReadDateChecker.failIfOldEntity(toast);
    let missing = [];
    let added = [];
    let toUpdate = [];

    if (toast.users.length === 0) {
      // the toast is visible for all users
      if (toastProspect.usersCache.length === 0) {
        // the new toast is visible for all users
        toUpdate = users.map((u) => u._id.toString());
      } else {
        // the new toast is visible for some users
        // so we have to remove the extra userToast
        const allUsers = await this._retrieveAllUsers();
        const toUpdateId = toastProspect.usersCache.map((u) => u._id);

        toUpdate = toUpdateId.map((u) => u.toString());
        missing = allUsers.filter((u) => !toUpdateId.find((id) => id.equals(u._id)));
      }
    } else if (toastProspect.usersCache.length === 0) {
      // the toast is visible for some users but
      // the new toast is visible for all users
      // so we have to add the missing ones
      const allUsers = await this._retrieveAllUsers();

      toUpdate = toast.users.map((u) => u.toString());
      added = allUsers.filter((u) => !toast.users.find((id) => id.equals(u._id)));
    } else {
      // the toast is visible for some users
      // and the new toast is visible for other users.
      // We must check which user has been added or deleted,
      // and update the existing user toast.
      toast.users.forEach((u) => {
        const index = users.findIndex((upid) => upid._id.equals(u));

        if (index === -1) {
          missing.push(u.toString());
        }
      });
      users.forEach((u) => {
        const index = toast.users.findIndex((uid) => uid.equals(u._id));

        if (index === -1) {
          added.push(u._id);
        } else {
          toUpdate.push(u._id);
        }
      });
    }
    delete toastProspect._id;
    Object.assign(toast, toastProspect);
    if (added.length) {
      try {
        await this._createUserToast(toast, added);
      } catch (err) {
        const message = err.message || err;

        this.logger.error(`Error creating missing user toast. Error ${message}`);
        throw new RestError(500, { message: 'Error updating toast', stack: err.stack });
      }
    }
    if (missing.length) {
      // delete missing UserToast
      try {
        // remove DOES NOT trigger middlewares
        await this.schema.UserToast.delete({
          lspId: this.lspId.toString(),
          user: { $in: missing },
          toast: toast._id.toString(),
        });
      } catch (err) {
        const message = err.message || err;

        this.logger.error(`Error deleting existing user toast. Error ${message}`);
        throw new RestError(500, { message: 'Error updating toast', stack: err.stack });
      }
    }
    if (toUpdate.length) {
      // bulk updating user toast.
      // updateMany will NOT trigger middlewares
      try {
        // when toast is updated, set lastReadTime
        // and dismissedTime to null to force the user
        // to see and/or dismiss the toast
        await this.schema.UserToast.updateMany({
          lspId: this.lspId,
          user: { $in: toUpdate },
          toast: toast._id,
        }, {
          $set: {
            state: toast.state,
            title: toast.title,
            message: toast.message,
            ttl: toast.ttl || null,
            context: toast.context,
            lastReadTime: null,
            dismissedTime: null,
            requireDismiss: toast.requireDismiss,
            from: toast.from || null,
            to: toast.to || null,
          },
        });
      } catch (err) {
        const message = err.message || err;

        this.logger.error(`Error updating existing user toast. Error ${message}`);
        throw new RestError(500, { message: 'Error updating toast', stack: err.stack });
      }
    }
    try {
      const updatedToast = await toast.save(toastProspect);
      return updatedToast;
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error saving toast. Error ${message}`);
      throw new RestError(500, { message: 'Error updating toast', stack: err.stack });
    }
  }

  async deleteToast(toast) {
    let toDeleteToast;

    if (typeof toast === 'string' || toast instanceof ObjectId) {
      toDeleteToast = await this.schema.Toast.findOne({ lspId: this.lspId, _id: toast });
      if (!toDeleteToast) {
        throw new RestError(404, { message: `Toast ${toast.toString()} does not exist` });
      }
    } else {
      // toast is an object
      toDeleteToast = toast;
    }
    try {
      await this.schema.UserToast.delete({ lspId: this.lspId, toast: toDeleteToast._id });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error deleting user's toast for toast ${toDeleteToast._id}. Error ${message}`);
      throw new RestError(500, { message: `Error deleting toast ${toast.toString()}`, stack: err.stack });
    }
    try {
      toDeleteToast.users = [];
      await toDeleteToast.delete();
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error deleting toast${toDeleteToast._id}. Error ${message}`);
      throw new RestError(500, { message: `Error deleting toast ${toast.toString()}`, stack: err.stack });
    }
    return toDeleteToast;
  }

  _createUserToast(toast, added) {
    const users = added || toast.users;
    const userToast = generateAllUsersToast(toast, users);
    return this.schema.UserToast.create(userToast);
  }

  _checkToastUsers(toastProspect) {
    let usersId;
    const query = {
      lsp: this.lspId,
    };

    if (!toastProspect.users || !toastProspect.users.length) {
      throw new RestError(400, { message: 'Toast must have users' });
    }
    const isAllUsers = toastProspect.users.find((id) => id === '*');

    if (!isAllUsers) {
      try {
        usersId = toastProspect.users.map((u) => new ObjectId(u));
      } catch (err) {
        const message = err.message || err;

        this.logger.debug(`Invalid object id given in. Error: ${message}`);
        throw new RestError(400, { message: 'Invalid user id', stack: err.stack });
      }
      query._id = { $in: usersId };
    } else if (toastProspect.users.length > 1) {
      throw new RestError(400, { message: 'Invalid toast user list. Cannot mix all and other users' });
    } else {
      // if all users selected, overwrite toastProspect with empty array
      toastProspect.users = [];
    }
    return this.schema.User.find(query, USER_ATTR).then((users) => {
      if (isAllUsers) {
        toastProspect.usersCache = [];
        return users;
      } if (users.length !== toastProspect.users.length) {
        throw new RestError(400, { message: 'Some users don\'t exist' });
      }
      toastProspect.usersCache = users.map((u) => ({
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
      }));
      return users;
    });
  }

  _retrieveAllUsers() {
    if (this.allUsers) {
      return Promise.resolve(this.allUsers);
    }
    return this.schema.User.findWithDeleted({
      lsp: this.lspId,
    }, '_id firstName middleName lastName email');
  }
}

module.exports = ToastAPI;
