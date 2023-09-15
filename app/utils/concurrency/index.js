const Promise = require('bluebird');
const moment = require('moment');
const _ = require('lodash');
const { RestError } = require('../../components/api-response');

class ConcurrencyReadDateChecker {
  constructor(user, logger, options) {
    this.user = user;
    this.logger = logger;
    this.entityName = _.get(options, 'entityName', 'entity');
    this.entityPromise = _.get(options, 'entityPromise');
  }

  failIfOldEntity(dbEntity) {
    const sessionEntityReadDate = _.get(this.user, `readDates.${this.entityName}.${dbEntity._id}`);
    const toUpdateEntityReadDate = moment(sessionEntityReadDate);
    const lastEntityUpdateDate = moment(dbEntity.updatedAt);
    const datesDifferenceInMs = toUpdateEntityReadDate.diff(lastEntityUpdateDate);
    if (datesDifferenceInMs < 0) {
      this.logger.info(`Optimistic Locking: User ${this.user.email} tried to edit an old version of the request doc`);
      // sometimes the currentEntity object does not have ALL the necessary data
      // for the frontend to re-build the object's edition, (for example company).
      // You might need populated fields that the edition does not lookup when checking
      // the entity. For that matter you can provide an entityPromise which will be
      // executed to retrieve a "refreshed" entity from the database and send that as a
      // response.
      if (this.entityPromise) {
        return this.entityPromise()
          .catch((err) => {
            const message = err.message || err;
            this.logger.error(`Error reading ${this.entityName} again. Error ${message}`);
            if (err instanceof RestError) {
              throw err;
            }
            throw new RestError(500, { message: `Error reading ${this.entityName} again`, stack: err.stack });
          })
          .then((refreshedEntity) => {
            throw new RestError(409, {
              message: 'You tried to edit an old record. For your convenience we are showing you the most current record below',
              data: refreshedEntity,
            });
          });
      }
      // if entity promise is falsy it will send a 409 as response with the
      // currentEntity parameter.
      return Promise.reject(new RestError(409, {
        message: 'You tried to edit an old record. For your convenience we are showing you the most current record below',
        data: dbEntity,
      }));
    }
    return Promise.resolve();
  }

  async failIfEntityUpdated(entityId, entityUpdatedAt) {
    let newEntity;
    try {
      newEntity = await this.entityPromise(entityId);
    } catch (err) {
      throw new RestError(500, { message: `Error reading ${this.entityName}`, stack: err.stack });
    }
    const toUpdateEntityUpdatedDate = moment(entityUpdatedAt);
    const lastEntityUpdateDate = moment(newEntity.updatedAt);
    const datesDifferenceInMs = toUpdateEntityUpdatedDate.diff(lastEntityUpdateDate);
    if (datesDifferenceInMs !== 0) {
      throw new RestError(409, {
        message: 'You tried to edit an old record. For your convenience we are showing you the most current record below',
        data: newEntity,
      });
    }
  }
}

module.exports = ConcurrencyReadDateChecker;
