const { Types: { ObjectId } } = require('mongoose');
const _ = require('lodash');
const SchemaAwareAPI = require('../../schema-aware-api');
const { RestError } = require('../../../components/api-response');
const { getRoles, hasRole } = require('../../../utils/roles');
const { validObjectId } = require('../../../utils/schema');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

class LocationAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (filters && filters._id) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  async locationExport(filters) {
    let csvStream;
    const query = this._getQueryFilters(filters);

    try {
      csvStream = this.schema.Location
        .gridAggregation().csvStream({
          filters: query,
          utcOffsetInMinutes: filters.__tz,
          shouldPaginate: false,
        });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error transforming to csv. Error: ${message}`);
      throw new RestError(500, { message, stack: err.stack });
    }
    return csvStream;
  }

  async list(filters) {
    const roles = getRoles(this.user);
    const canReadAll = hasRole('LOCATION_READ_ALL', roles);
    let list = [];
    const query = this._getQueryFilters(filters);

    if (!canReadAll) {
      query.createdBy = this.user.email;
    }
    try {
      list = await this.schema.Location.gridAggregation().exec({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error retrieving locations. Error: ${message}`);
      throw new RestError(500, { message, stack: err.stack });
    }
    return {
      list,
      total: list.length,
    };
  }

  async findOne(_id) {
    const roles = getRoles(this.user);
    const canReadAll = hasRole('LOCATION_READ_ALL', roles);
    const query = { _id, lspId: this.lspId };
    const location = await this.schema.Location.findOneWithDeleted(query);

    if (!canReadAll && location.createdBy !== this.user.email) {
      throw new RestError(403, 'User is no authorized to view this location');
    }
    if (!location) {
      throw new RestError(404, { message: `Location with id: ${_id} was not found` });
    }
    return location;
  }

  async create(location) {
    const { lspId } = this;
    const defLocation = { lspId, createdBy: this.user.email };
    const newLocation = new this.schema.Location(defLocation);
    newLocation.safeAssign(location);
    const locationInDb = await this.schema.Location.findOneWithDeleted({
      _id: new ObjectId(location._id),
      lspId,
    });
    if (!_.isNil(locationInDb)) throw new RestError(409, { message: 'Location already exists' });
    const locationCreated = await newLocation.save();
    return locationCreated;
  }

  async update(location) {
    let locationInDb;
    const roles = getRoles(this.user);
    const canReadAll = hasRole('LOCATION_READ_ALL', roles);
    const query = {
      _id: location._id,
      lspId: this.lspId,
    };

    if (validObjectId(query._id)) {
      locationInDb = await this.schema.Location.findOneWithDeleted(query);
    }

    if (!locationInDb) {
      throw new RestError(404, { message: 'Location does not exist' });
    }

    if (!canReadAll && location.createdBy !== this.user.email) {
      throw new RestError(403, 'User is no authorized to update this location');
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(
      this.user,
      this.logger,
      { entityName: 'location' },
    );
    await concurrencyReadDateChecker.failIfOldEntity(locationInDb);

    locationInDb.safeAssign(location);
    const modifications = locationInDb.getModifications();

    try {
      const updatedLocation = await locationInDb.save(location);

      await this.schema.Location.postSave(location, modifications);
      return updatedLocation;
    } catch (err) {
      this.logger.error(err.message);
      if (err.name === 'MongoError' && err.code === 11000) {
        throw new RestError(409, { message: 'Location already exists' });
      }
      throw new RestError(400, { message: err.message });
    }
  }
}

module.exports = LocationAPI;
