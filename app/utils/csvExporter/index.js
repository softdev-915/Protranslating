const _ = require('lodash');
const CsvBuilder = require('csv-builder');
const FileStorageFacade = require('../../components/file-storage');
const { transformExportData } = require('./csv-exporter-helper');

const TRUNCATION_CHARS = 4;
const csvVirtualParser = {
  parseTimeStamps: csvBuilderInstance => csvBuilderInstance
    .virtual('Creator', item => (item.createdBy || ''))
    .virtual('Created', item => (item.createdAt || ''))
    .virtual('Updated', item => (item.updatedAt || ''))
    .virtual('Updater', item => (item.updatedBy || ''))
    .virtual('Restorer', item => (item.restoredBy || ''))
    .virtual('Restored', item => (item.restoredAt || '')),
};

const properJSON = (string) => {
  if (typeof string === 'object') {
    return string;
  }
  try {
    const json = JSON.parse(string);
    if (json && typeof json === 'object') {
      return json;
    }
  } catch (e) {
    return {};
  }
  return {};
};

class CsvExport {
  constructor(dataObj, options) {
    this.schema = options.schema;
    this.logger = options.logger;
    this.dataObj = dataObj;
    this.configuration = options.configuration;
    this.fileStorage = new FileStorageFacade(options.lspId, options.configuration, options.logger);
    const filter = _.get(options, 'filters.filter', _.get(options, 'filters.query.filter', {}));
    this.filters = properJSON(filter);
    let columnOptions = {};
    if (this.schema.getExportOptions) {
      columnOptions = this.schema.getExportOptions();
    } else {
      columnOptions = options.csvOptions.columnHeaders;
    }
    this.csvBuilder = new CsvBuilder(columnOptions);
    if (this.schema.setCsvTransformations) {
      this.schema.setCsvTransformations(this.csvBuilder);
    }

    if (options.csvOptions && options.csvOptions.columnTransformations) {
      options.csvOptions.columnTransformer(this.csvBuilder);
    }
  }
  getReadableStream() {
    let readableStream;
    // Read from existing payload
    if (Array.isArray(this.dataObj)) {
      readableStream = this.csvBuilder.createReadStream(this.dataObj.map(transformExportData));
    } else {
      // Read from stream object
      readableStream = this.dataObj.pipe(this.csvBuilder.createTransformStream());
    }
    return readableStream;
  }

  export() {
    const filename = CsvExport.buildFilename(this.filters, this.schema.collection.collectionName);
    return new Promise((resolve, reject) => {
      try {
        const csvStream = this.getReadableStream();
        resolve({ fileReadStream: csvStream, filename: `${filename}.csv` });
      } catch (err) {
        this.logger.error(`Error while exporting csv file for: ${filename}, Error: ${err}`);
        reject(err);
      }
    });
  }

  static buildProperFilename(filters, modelSchema, collectionName) {
    const colName = !_.isEmpty(collectionName) ?
      collectionName : modelSchema.collection.collectionName;
    if (_.isUndefined(filters)) {
      throw new Error('filters param is mandatory');
    }

    if (_.isUndefined(modelSchema)) {
      throw new Error('modelSchema param is mandatory');
    }

    const filtersOverride = properJSON(filters.filter);
    return CsvExport.buildFilename(filtersOverride, colName);
  }

  static buildFilename(filters, collectionName) {
    return Object.keys(filters).filter(f => f !== '__tz')
      .reduce((filename, key) => `${filename}_${key.slice(0, TRUNCATION_CHARS)}-${filters[key].toString().slice(0, TRUNCATION_CHARS)}`, collectionName);
  }
}

module.exports = {
  CsvExport,
  csvVirtualParser,
};
