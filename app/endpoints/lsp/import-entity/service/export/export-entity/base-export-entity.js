const _ = require('lodash');

class BaseExportEntity {
  getFieldsToShow() {
    return [];
  }

  getFieldsToHide() {
    return ['__v', 'externalId'];
  }

  filterFields(fields) {
    const fieldsToShow = this.getFieldsToShow();
    const fieldsToHide = this.getFieldsToHide();
    return fields.map((field) => {
      if (!_.isEmpty(fieldsToShow)) {
        return fieldsToShow.includes(field.name) ? field : null;
      }
      return fieldsToHide.includes(field.name) ? null : field;
    }).filter(_.isObject);
  }
}

module.exports = BaseExportEntity;
