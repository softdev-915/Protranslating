const _ = require('lodash');
const XLSX = require('xlsx');

class SheetJsXlsxProvider {
  constructor() {
    this.workbook = null;
  }

  createNew() {
    this.workbook = XLSX.utils.book_new();
  }

  createFromBuffer(buffer) {
    this.workbook = XLSX.read(buffer, { type: 'buffer' });
  }

  getSheets() {
    const sheets = {};
    Object.entries(this.workbook.Sheets).forEach(([name, data]) => {
      sheets[name] = XLSX.utils.sheet_to_json(data).map(row => _.omit(row, ['__rowNum__']));
    });
    return sheets;
  }

  appendSheet(sheet) {
    const data = sheet.getData();
    let worksheet;
    if (Array.isArray(data[0])) {
      worksheet = XLSX.utils.aoa_to_sheet(data);
    } else if (_.isObject(data[0])) {
      worksheet = XLSX.utils.json_to_sheet(data);
    }
    XLSX.utils.book_append_sheet(this.workbook, worksheet, sheet.getNameToSave());
    return this;
  }

  saveAsBuffer() {
    return XLSX.write(this.workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

module.exports = SheetJsXlsxProvider;
