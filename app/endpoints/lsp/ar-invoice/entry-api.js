const mongoose = require('mongoose');
const _ = require('lodash');
const Promise = require('bluebird');
const { parse: parseCsv } = require('csv-parse');
const SchemaAwareAPI = require('../../schema-aware-api');
const ArInvoiceEntryApi = require('../ar-invoice-entries/ar-invoice-entry-api');
const ApPaymentApi = require('../ap-payment/ap-payment-api');

const { ObjectId } = mongoose.Types;
const SCHEMAS_MAPPING = {
  'ap-payment-entries': {
    tempCollectionSchema: 'ApPaymentDetailTemp',
    schema: 'ApPayment',
    subSchema: 'details',
    api: ApPaymentApi,
  },
  'ar-invoice-entries': {
    tempCollectionSchema: 'ArInvoiceEntryTemp',
    schema: 'ArInvoice',
    subSchema: 'entries',
    api: ArInvoiceEntryApi,
  },
};
const IMPORTED_ENTRIES_DISPLAY_LIMIT = 1000;

class EntryApi extends SchemaAwareAPI {
  constructor(options) {
    super(options.logger, options);
    const entityStrategy = _.get(SCHEMAS_MAPPING, options.entityName, {});
    const { tempCollectionSchema } = entityStrategy;
    const entitySchemaName = entityStrategy.schema;
    const entitySubSchemaName = entityStrategy.subSchema;

    if (_.isEmpty(entityStrategy)) {
      this.logger.debug('No strategy defined for importing the csv file');
      throw new Error('No strategy defined for importing the csv file');
    }
    if (!_.isEmpty(tempCollectionSchema)) {
      this.tempTableSchema = this.schema[tempCollectionSchema];
      this.dbSchema = this.schema[entitySchemaName];
      this.entryObjectDefinition = _.get(this.schema[tempCollectionSchema], `schema.paths.${entitySubSchemaName}.schema.obj`);
    }
    const Api = entityStrategy.api;

    this.api = new Api(options.logger, options);
    this.csvHeaders = [];
  }

  canImport() {
    return this.api.canImportCsv();
  }

  async importEntriesFromCsv(file) {
    await this.cleanUpEntriesTable();
    return this.writeCsvEntriesToTemporaryTable(file);
  }

  async cleanUpEntriesTable() {
    await this.tempTableSchema.deleteMany({
      userId: new ObjectId(this.user._id),
      lspId: new ObjectId(this.lspId),
    });
  }

  formatRowForSaving(csvRow) {
    const entryRow = {};

    this.csvHeaders.forEach((title, index) => {
      const csvRowSchemaMapping = this.dbSchema.mapCsvRowToEntriesSchemaDefinition();
      const dbFieldName = _.get(csvRowSchemaMapping, title);

      if (!_.isNil(dbFieldName)) {
        _.set(entryRow, dbFieldName, csvRow[index]);
      }
    });
    return {
      userId: new ObjectId(this.user._id),
      lspId: new ObjectId(this.lspId),
      entry: entryRow,
    };
  }

  onRowRead(csvRow) {
    if (!_.isEmpty(this.csvHeaders)) {
      return this.formatRowForSaving(csvRow);
    }
    this.csvHeaders = csvRow;
  }

  writeCsvEntriesToTemporaryTable(fileStream) {
    return new Promise((resolve, reject) => {
      if (_.isNil(this.tempTableSchema)) {
        reject(new Error('Cannot import entries from csv. Schema was not set'));
      }
      try {
        const entries = [];

        fileStream
          .pipe(parseCsv())
          .on('data', (row) => {
            const entry = this.onRowRead(row);

            if (!_.isNil(entry)) {
              entries.push(entry);
            }
          })
          .on('end', async () => {
            let dbEntries = await Promise.map(entries, async (entry) => {
              const dbEntry = await this.tempTableSchema.create(entry);
              return dbEntry.entry;
            });

            if (dbEntries.length > IMPORTED_ENTRIES_DISPLAY_LIMIT) {
              dbEntries = dbEntries.slice(0, IMPORTED_ENTRIES_DISPLAY_LIMIT);
            }
            this.logger.debug(`Finished importing csv entries for entity ${this.entityName}`);
            resolve({ entries: dbEntries, total: entries.length });
          });
      } catch (err) {
        this.logger.debug(`Failed to import entries from csv for entity ${this.entityName}. Error ${err}`);
        reject(err);
      }
    });
  }
}

module.exports = EntryApi;
