const _ = require('lodash');
const XlsxSheet = require('./xlsx-sheet');
const SheetJsXlsxProvider = require('./providers/sheet-js-xlsx-provider');

class XlsxFile {
  constructor(XlsxProvider = SheetJsXlsxProvider) {
    this.sheets = {};
    this.xlsxProvider = new XlsxProvider();
  }

  getSheets() {
    return this.sheets;
  }

  getSheetsNames() {
    return Object.keys(this.sheets);
  }

  createSheet(name) {
    this.sheets[name] = new XlsxSheet(name);
    return this.sheets[name];
  }

  createFromBuffer(buffer) {
    this.xlsxProvider.createFromBuffer(buffer);
    Object.entries(this.xlsxProvider.getSheets()).forEach(([name, data]) =>
      this.createSheet(name).setData(data),
    );
    return this;
  }

  getNextSheetOf(sheet) {
    const sheetNames = this.getSheetsNames();
    const nextSheetIndex = sheetNames.indexOf(sheet.getName()) + 1;
    return nextSheetIndex > 0 ? _.get(this.sheets, sheetNames[nextSheetIndex], null) : null;
  }

  saveAsBuffer() {
    this.xlsxProvider.createNew();
    Object.values(this.sheets).forEach(sheet => this.xlsxProvider.appendSheet(sheet));
    return this.xlsxProvider.saveAsBuffer();
  }
}

module.exports = XlsxFile;
