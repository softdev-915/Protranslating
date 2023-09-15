const _ = require('lodash');
const { Types: { ObjectId } } = require('mongoose');
const Promise = require('bluebird');
const { RestError } = require('../../../components/api-response');
const SchemaAwareApi = require('../../schema-aware-api');
const { searchFactory } = require('../../../utils/pagination');
const CheckBuilder = require('./check-builder');
const { parsePaginationFilter } = require('../../../utils/request');
const { areObjectIdsEqual } = require('../../../utils/schema');

const CHECK_STATUS_PRINTED = 'Printed';

class CheckApi extends SchemaAwareApi {
  constructor(logger, options) {
    super(logger, options);
    this.checkBuilder = new CheckBuilder();
  }

  _getQueryFilters(filters) {
    const query = { lspId: this.lspId, ..._.get(filters, 'paginationParams', {}) };
    const pipeline = [
      {
        $lookup: {
          from: 'bankAccounts',
          localField: 'bankAccount',
          foreignField: '_id',
          as: 'bankAccountObj',
        },
      },
      {
        $addFields: {
          bankAccountName: '$bankAccountObj.name',
          amount: { $toString: '$amount' },
        },
      },
    ];
    const extraQueryParams = ['bankAccountName'];
    return { query, pipeline, extraQueryParams };
  }

  async list(filters) {
    let list = [];
    const { query, pipeline: extraPipelines, extraQueryParams } = this._getQueryFilters(filters);
    const filter = parsePaginationFilter(query.filter);
    const bankAccountFilter = _.get(filter, 'bankAccount', 'na');

    try {
      list = await searchFactory({
        model: this.schema.Check,
        filters: query,
        extraPipelines,
        extraQueryParams,
        utcOffsetInMinutes: filters.__tz,
      }).exec();
      const nextCheckNo = await this._calculateNextCheckNo(bankAccountFilter);
      return {
        nextCheckNo,
        list,
        total: list.length,
      };
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error retrieving checks list. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
  }

  async updateMemo(id, body) {
    const { memo } = body;
    const check = await this.findOne({ lspId: this.lspId, _id: new ObjectId(id) });

    check.memo = memo;
    await check.save();
  }

  async findOne(query) {
    const check = await this.schema.Check.findOne(query);

    if (_.isNil(check)) {
      throw new RestError(404, { message: 'Check is not found' });
    }
    return check;
  }

  async getChecksPdf({ account, nextCheckNo, selectedChecksIdsArray = [] }) {
    let checks = await this.schema.Check.find({
      _id: { $in: selectedChecksIdsArray },
    }).populate('apPaymentId');
    const apPaymentsNumbers = {};

    checks.forEach((check) => {
      _.get(check, 'apPaymentId.details', []).some((data) => {
        const found = areObjectIdsEqual(check.accountPayableId, data.appliedTo);

        if (found) {
          apPaymentsNumbers[check.accountPayableId] = data.appliedToNo;
        }
        return found;
      });
    });
    checks = await this._markChecksPrinted({ checks, nextCheckNo, account });
    const pdf = await this.checkBuilder.buildChecksPdf(checks, apPaymentsNumbers);
    const checkPromises = checks.map((check) => check.save());

    await Promise.all(checkPromises);
    return pdf;
  }

  async _markChecksPrinted({ checks, nextCheckNo, account }) {
    const existingChecks = [];

    checks = await Promise.mapSeries(checks, async (check) => {
      check.status = CHECK_STATUS_PRINTED;
      if (_.isNil(check.checkNo)) {
        try {
          const existingCheck = await this.findOne({
            bankAccount: new ObjectId(account), checkNo: nextCheckNo,
          });

          existingChecks.push(existingCheck);
        } catch (e) {
          if (e.code === 404) {
            const nextCheckNoNumber = _.toNumber(nextCheckNo);

            if (_.isNaN(nextCheckNoNumber)) {
              throw new RestError(400, { message: 'Incorrect Next Check No' });
            }
            check.checkNo = nextCheckNo;
            nextCheckNo = _.padStart(nextCheckNoNumber + 1, check.checkNo.length, '0');
          } else {
            throw e;
          }
        }
      }
      return check;
    });
    if (!_.isEmpty(existingChecks)) {
      const existingChecksNumbers = existingChecks.map((check) => check.checkNo);

      throw new RestError(400, { message: `Checks with numbers ${existingChecksNumbers} already exist` });
    }
    return checks;
  }

  async _calculateNextCheckNo(bankAccountId) {
    if (bankAccountId !== 'na') {
      const [firstCheck] = await this.schema.Check.aggregate([
        {
          $match: {
            lspId: this.lspId,
            bankAccount: new ObjectId(bankAccountId),
            checkNo: { $exists: true },
          },
        },
        {
          $sort: { checkNo: -1 },
        },
        {
          $group: {
            _id: null,
            check: { $first: '$$ROOT' },
          },
        },
        {
          $replaceRoot: { newRoot: '$check' },
        },
      ]);

      if (!_.isNil(firstCheck)) {
        return _.padStart(
          _.toNumber(firstCheck.checkNo) + 1,
          firstCheck.checkNo.length,
          '0',
        );
      }
    }
  }
}

module.exports = CheckApi;
