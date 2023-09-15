const _ = require('lodash');
const SchemaAwareAPI = require('../../schema-aware-api');
const apiResponse = require('../../../components/api-response');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { searchFactory } = require('../../../utils/pagination');
const { exportFactory } = require('../../../utils/pagination');
const { CsvExport } = require('../../../utils/csvExporter');

const { RestError } = apiResponse;

class GroupAPI extends SchemaAwareAPI {
  /**
   * @param {Object} logger
   * @param {Object} options optional object.
   * @param {Object} options.configuration configuration.
   * @param {Object} options.user user that is user api.
   */
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
  }

  getQueryFilters() {
    const pipeline = [
      {
        $addFields: {
          rolesText: {
            $reduce: {
              input: '$roles',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$roles', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this'] },
                  else: { $concat: ['$$value', ', ', '$$this'] },
                },
              },
            },
          },
          inactiveText: {
            $switch: {
              branches: [
                { case: { $eq: ['$deleted', true] }, then: 'true' },
                { case: { $eq: ['$deleted', false] }, then: 'false' },
              ],
              default: '',
            },
          },
        },
      },
    ];
    const extraQueryParams = ['inactiveText'];
    return {
      pipeline,
      extraQueryParams,
    };
  }

  /**
   * Returns the group's list as a csv file
   * @param {Object} groupFilters to filter the groups returned.
   */
  async groupExport(filters) {
    this.logger.debug(`User ${this.user.email} retrieved a group list export file`);

    let query = { lspId: this.lspId };

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));

    const queryFilters = this.getQueryFilters();
    const cursor = await exportFactory(
      this.schema.Group,
      query,
      queryFilters.pipeline,
      queryFilters.extraQueryParams,
      filters.__tz,
    );

    const csvExporter = new CsvExport(cursor, {
      schema: this.schema.Group,
      lspId: this.lspId,
      configuration: this.configuration,
      logger: this.logger,
      filters: query,
    });
    return csvExporter.export();
  }

  /**
   * Returns the group's list
   * @param {Object} user making this request.
   * @param {Object} user.lsp the lsp
   * @param {String} user.lsp the ID of the lsp to operate with.
   * @param {Object} groupFilters to filter the groups returned.
   * @param {String} groupFilters.id the group's id to filter.
   */
  async groupList(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the group list`);

    let list = [];
    let query = { lspId: this.lspId };

    if (filters && filters._id) {
      query._id = filters._id;
    }

    // Search specific group
    if (query._id) {
      list = await this.schema.Group.findWithDeleted(query);
    } else {
      // Search all groups
      const queryFilters = this.getQueryFilters();

      query = Object.assign(query, _.get(filters, 'paginationParams', {}));
      list = await searchFactory({
        model: this.schema.Group,
        filters: query,
        extraPipelines: queryFilters.pipeline,
        extraQueryParams: queryFilters.extraQueryParams,
        utcOffsetInMinutes: filters.__tz,
      });
    }
    return {
      list,
      total: list.length,
    };
  }

  async create(user, group) {
    const query = { lspId: user.lsp, name: group.name };
    const groupInDb = await this.schema.Group.findOneWithDeleted(query);

    if (groupInDb) {
      throw new RestError(409, { message: 'Group already exists' });
    }
    group.createdBy = user.email;
    const newGroup = new this.schema.Group(group);

    await newGroup.save();
    return newGroup;
  }

  async update(user, group) {
    const query = { _id: group._id, lspId: user.lsp._id };
    const groupInDb = await this.schema.Group.findOneWithDeleted(query);

    if (!groupInDb) {
      throw new RestError(404, { message: 'Group does not exist' });
    }
    if (groupInDb.deleted && group.deleted !== false) {
      throw new RestError(400, { message: 'Cannot update a deleted group' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(user, this.logger, {
      entityName: 'group',
    });
    await concurrencyReadDateChecker.failIfOldEntity(groupInDb);

    groupInDb.safeAssign(group);
    try {
      const updatedGroup = await groupInDb.save(group);
      return updatedGroup;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the group: ${group.name} due to err: duplicated key`);
        throw new RestError(409, { message: `Internal department ${group.name} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the group: ${group.name} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = GroupAPI;
