// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const _ = require('lodash');
const Promise = require('bluebird');
const csvToJson = require('csvtojson');
const SchemaAwareAPI = require('../../schema-aware-api');
const ArInvoiceEntryApi = require('../ar-invoice-entries/ar-invoice-entry-api');

const { ObjectId } = mongoose.Types;

class EntryApi extends SchemaAwareAPI {
  constructor(options) {
    super(options.logger, options);
    this.entryObjectDefinition = _.get(this.schema.ArInvoiceEntryTemp, 'schema.paths.entries.schema.obj');
    this.api = new ArInvoiceEntryApi(options.logger, options);
    this.csvHeaders = [];
  }

  canImport() {
    return this.api.canImportCsv();
  }

  async importEntriesFromCsv(fileStream) {
    return new Promise((resolve, reject) => {
      if (_.isNil(this.schema.ArInvoiceEntryTemp)) {
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
              await this.schema.ArInvoiceEntryTemp.deleteMany({
                userId: new ObjectId(this.user._id),
                lspId: new ObjectId(this.lspId),
              });
              if (this.schema.ArInvoice.ensureNotProcessedEntries) {
                const entriesIdList = writeOperations.map((operation) => new ObjectId(operation.insertOne.document.entry._id));
                await this.schema.ArInvoice.ensureNotProcessedEntries(entriesIdList);
              }
              await this.schema.ArInvoiceEntryTemp.bulkWrite(writeOperations);
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
      return csvRow;
    }
    const entryRow = {};
    await Promise.map(this.csvHeaders, (title) => {
      const csvRowSchemaMapping = this.schema.ArInvoice.mapCsvRowToEntriesSchemaDefinition();
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
    if (!this.schema.ArInvoice.isValidCsvImportedEntry(csvRow)) {
      throw new Error(`ID ${csvRow._id} is invalid. Please fix the errors...`);
    }
    return this.formatRowForSaving(csvRow);
  }
}

module.exports = EntryApi;
