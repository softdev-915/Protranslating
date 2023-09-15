const _ = require('lodash');
const Promise = require('bluebird');
const XlsxFile = require('../../../../../components/xlsx/xlsx-file');
const BaseExportEntity = require('./export-entity/base-export-entity');
const { transformBufferToStream } = require('../../../../../utils/file');

class EntityExporter {
  constructor(schemaFields) {
    this.schemaFields = schemaFields;
    this.xlsx = new XlsxFile();
  }

  async export() {
    await Promise.each(this.schemaFields, ({ name, fields }) =>
      this.addFieldsToSheet(name, fields),
    );
    return transformBufferToStream(this.xlsx.saveAsBuffer());
  }

  addFieldsToSheet(entityName, fields, sheetName = entityName) {
    const filteredFields = new BaseExportEntity().filterFields(fields);
    const headers = filteredFields
      .map(field => (_.isEmpty(field.fields) ? field.name : null))
      .filter(_.isString);
    if (sheetName !== entityName) headers.unshift(`${entityName}._id`);
    this.xlsx.createSheet(sheetName).setData([headers]);
    filteredFields.forEach((field) => {
      if (!_.isEmpty(field.fields)) {
        this.addFieldsToSheet(entityName, field.fields, `${sheetName}.${field.name}`);
      }
    });
  }
}

module.exports = EntityExporter;
