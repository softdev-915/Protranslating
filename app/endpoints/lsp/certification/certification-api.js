const _ = require('lodash');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { validObjectId } = require('../../../utils/schema');
const { RestError } = require('../../../components/api-response');

class CertificationApi extends SchemaAwareAPI {
  async certificationExport(filters) {
    let csvStream;
    const { query } = this._getQueryFilters(filters);

    try {
      csvStream = this.schema.Certification
        .gridAggregation().csvStream({
          filters: query,
          utcOffsetInMinutes: filters.__tz,
          shouldPaginate: false,
        });
    } catch (e) {
      const message = e.message || e;

      this.logger.error(`Error transforming to csv. Error: ${message}`);
      throw new RestError(500, { message: e, stack: e.stack });
    }
    return csvStream;
  }

  async list(filters) {
    let list = [];
    const queryFilters = this._getQueryFilters(filters);

    try {
      list = await this.schema.Certification.gridAggregation().exec({
        filters: queryFilters.query,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (e) {
      const message = e.message || e;

      this.logger.error(`Error while performing Certification aggregation. Error: ${message}`);
      throw new RestError(500, { message: e, stack: e.stack });
    }
    return {
      list,
      total: list.length,
    };
  }

  async findOne(_id) {
    let certification;
    const query = {
      _id,
      lspId: this.lspId,
    };

    if (validObjectId(query._id)) {
      certification = await this.schema.Certification.findOneWithDeleted(query);
    }

    if (!certification) {
      throw new RestError(404, { message: `Certification with id: ${_id} was not found` });
    }
    return certification;
  }

  async create(certification) {
    const defaultCertification = {
      name: '',
      lspId: this.lspId,
    };
    const newCertification = new this.schema.Certification(defaultCertification);

    newCertification.safeAssign(certification);
    const query = {
      name: certification.name,
      lspId: this.lspId,
    };
    const certificationInDb = await this.schema.Certification.findOneWithDeleted(query);

    if (!_.isNil(certificationInDb)) {
      throw new RestError(409, { message: 'Certification already exists' });
    }
    const createdCertification = await newCertification.save();
    return createdCertification;
  }

  async update(certification) {
    let certificationInDb;
    const query = {
      _id: certification._id,
      lspId: this.lspId,
    };

    if (validObjectId(query._id)) {
      certificationInDb = await this.schema.Certification.findOneWithDeleted(query);
    }

    if (!certificationInDb) {
      throw new RestError(404, { message: 'Certification does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(
      this.user,
      this.logger,
      { entityName: 'certification' },
    );
    await concurrencyReadDateChecker.failIfOldEntity(certificationInDb);

    certificationInDb.safeAssign(certification);
    try {
      const updatedCertification = await certificationInDb.save(certification);
      return updatedCertification;
    } catch (e) {
      if (e.name === 'MongoError' && e.code === 11000) {
        this.logger.error(e.message);
        throw new RestError(409, { message: 'Certification already exists' });
      } else {
        throw e;
      }
    }
  }

  _getQueryFilters(filters) {
    const query = {

      lspId: this.lspId,
      ..._.get(filters, 'paginationParams', {}),
    };
    return {
      query,
    };
  }
}

module.exports = CertificationApi;
