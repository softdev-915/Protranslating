const _ = require('lodash');
const SchemasAwareApi = require('../../schema-aware-api');
const { searchFactory } = require('../../../utils/pagination');

const FIELDS = [
  'sessionId',
  'loggedAt',
  'sessionUpdatedAt',
  'timeZone',
  'userAgent',
  'originIP',
  'cookie',
  'location',
];

class ActiveUserSessionsApi extends SchemasAwareApi {
  constructor(logger, options) {
    const user = _.get(options, 'user');
    super(logger, options);
    this.user = user;
  }

  _getActiveUserSessionsQuery(filters) {
    const query = {
      lsp: this.lspId,
      userSessions: { $ne: null },
    };

    if (filters && filters._id) {
      query._id = filters._id;
    }
    return Object.assign(query, _.get(filters, 'paginationParams', {}));
  }

  _getPostProcessPipeline(filters) {
    const filterObject = JSON.parse(_.get(filters, 'paginationParams.filter', ''));
    const filterFields = Object.keys(filterObject);
    const pipeline = { $match: {} };
    filterFields.forEach((field) => {
      if (FIELDS.includes(field)) {
        pipeline.$match[field] = new RegExp(filterObject[field]);
      }
    });
    return pipeline;
  }

  async activeUserSessionsList(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the active user sessions list`);
    let list = [];
    const extraPipelines = [
      {
        $project: {
          userSessions: 1,
          email: 1,
        },
      },
      {
        $unwind: '$userSessions',
      },
      {
        $addFields: {
          'userSessions._id': '$_id',
          'userSessions.email': '$email',
        },
      },
      {
        $replaceRoot: { newRoot: '$userSessions' },
      },
    ];
    const postProcessPipeline = this._getPostProcessPipeline(filters);
    const query = this._getActiveUserSessionsQuery(filters);

    list = await searchFactory({
      model: this.schema.UserSecondary,
      filters: query,
      extraPipelines,
      postProcessPipeline,
      utcOffsetInMinutes: filters.__tz,
    }).exec();
    return {
      list: list,
      total: list.length,
    };
  }
}

module.exports = ActiveUserSessionsApi;
