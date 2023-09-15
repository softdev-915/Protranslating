// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const _ = require('lodash');
const Promise = require('bluebird');
const csvToJson = require('csvtojson');
const SchemaAwareAPI = require('../../schema-aware-api');
const ApPaymentApi = require('./ap-payment-api');

const { ObjectId } = mongoose.Types;

class EntryApi extends SchemaAwareAPI {
  constructor(options) {
    super(options.logger, options);
    this.entryObjectDefinition = _.get(this.schema.ApPaymentDetailTemp, 'schema.paths.details.schema.obj');
    this.api = new ApPaymentApi(options.logger, options);
    this.csvHeaders = [];
  }

  canImport() {
    return this.api.canImportCsv();
  }

  async importEntriesFromCsv(fileStream) {
    return new Promise((resolve, reject) => {
      if (_.isNil(this.schema.ApPaymentDetailTemp)) {
        reject(new Error('Cannot import entries from csv. Schema was not set'));
      }
      try {
        const writeOperations = [];
        csvToJson()
          .on('header', (header) => {
            this.csvHeaders = header;
          })
          .fromStream(fileStream)
          .subscribe(async (parsedRow) => {
            fileStream.pause();
            const entry = await this.onRowRead(parsedRow);
            if (!_.isNil(entry) && !_.isArray(entry)) {
              writeOperations.push({
                insertOne: {
                  document: entry,
                },
              });
            }
            fileStream.resume();
          }, (err) => {
            this.logger.debug(`Failed to import csv entries ${err}`);
            reject(err);
          }, async () => {
            try {
              await this.schema.ApPaymentDetailTemp.deleteMany({
                userId: new ObjectId(this.user._id),
                lspId: new ObjectId(this.lspId),
              });
              await this.schema.ApPaymentDetailTemp.bulkWrite(writeOperations);
              this.logger.debug(`Finished ${writeOperations.length} rows csv`);
              resolve(writeOperations.length);
            } catch (error) {
              reject(error);
            }
          });
      } catch (err) {
        this.logger.debug(`Failed to import entries from csv for entity ${this.entityName}. Error ${err}`);
        reject(err);
      }
    });
  }

  async formatRowForSaving(csvRow) {
    if (_.isEmpty(this.csvHeaders)) {
      this.csvHeaders = csvRow;
      if (!this.schema.ApPayment.isValidCsvImportedEntry(csvRow)) {
        throw new Error(`ID ${csvRow.ID} is invalid. Please fix the errors...`);
      }
      return csvRow;
    }
    const entryRow = {};
    await Promise.map(this.csvHeaders, (title) => {
      const csvRowSchemaMapping = this.schema.ApPayment.mapCsvRowToEntriesSchemaDefinition();
      const dbFieldName = _.get(csvRowSchemaMapping, title);
      if (!_.isNil(dbFieldName)) {
        _.set(entryRow, dbFieldName, _.get(csvRow, title));
      }
    });
    return {
      userId: new ObjectId(this.user._id),
      lspId: new ObjectId(this.lspId),
      entry: entryRow,
    };
  }

  onRowRead(csvRow) {
    return this.formatRowForSaving(csvRow);
  }
}

module.exports = EntryApi;
