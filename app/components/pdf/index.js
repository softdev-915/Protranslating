// node-pdf
const { exec } = require('child_process');

class PDFImageConvert {
  constructor(options) {
    this.options = options;
  }

  /**
   * Converts a PDF page to a png image. It is expected that the given PDF page
   * exist, and the target image path does not exist.
   * @param {string} filePath the pdf file path.
   * @param {number} pageNumber the page number.
   * @param {string} targetImagePath the target file path that will be created.
   */
  convertPDFPage(filePath, pageNumber, targetImagePath) {
    if (pageNumber < 0) {
      throw new Error('Page must greater or equal than zero');
    }
    return this.pdfInfo(filePath).then((pdfInfo) => {
      if (pdfInfo.Pages <= pageNumber) {
        throw new Error(`Page must be below the pdf pages count, in this case it is ${pdfInfo.Pages}`);
      } else {
        return this._convertPDFPage(filePath, pageNumber, targetImagePath);
      }
    });
  }

  pdfInfo(filePath) {
    const getPDFInfoCommand = this._constructGetInfoCommand(filePath);
    return new Promise((resolve, reject) => {
      exec(getPDFInfoCommand, (err, stdout, stderr) => {
        if (err) {
          return reject({
            message: 'Failed to get PDF\'s information',
            error: err,
            stdout: stdout,
            stderr: stderr,
          });
        }
        return resolve(this._parseGetInfoCommandOutput(stdout));
      });
    });
  }

  _convertPDFPage(filePath, pageNumber, targetImagePath) {
    const convertPDFPageCommand =
      this._convertPDFPageCommand(filePath, pageNumber, targetImagePath);
    return new Promise((resolve, reject) => {
      exec(convertPDFPageCommand, (err, stdout, stderr) => {
        if (err) {
          return reject({
            message: 'Failed to convert PDF',
            error: err,
            stdout: stdout,
            stderr: stderr,
          });
        }
        return resolve();
      });
    });
  }

  _convertPDFPageCommand(filePath, pageNumber, targetImagePath) {
    return `convert '${filePath}[${pageNumber}]' '${targetImagePath}'`;
  }

  _constructGetInfoCommand(filePath) {
    return `pdfinfo '${filePath}'`;
  }

  _parseGetInfoCommandOutput(output) {
    const info = {};
    output.split('\n').forEach((line) => {
      if (line.match(/^(.*?):[ \t]*(.*)$/)) {
        info[RegExp.$1] = RegExp.$2;
      }
    });
    return info;
  }
}

module.exports = PDFImageConvert;
