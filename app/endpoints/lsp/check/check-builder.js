const _ = require('lodash');
const moment = require('moment');
const { PDFDocument, StandardFonts } = require('pdf-lib');

class CheckBuilder {
  async buildChecksPdf(checks = [], apPaymentsNumbers) {
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const size = 13;
    const fontOptions = { font: helveticaFont, size };
    const pageWidth = 1240;
    const pageHeight = 1754;

    checks.forEach((check) => {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawText(_.get(check, 'vendor.fullName'), Object.assign(fontOptions, { x: 200, y: pageHeight - size - 225 }));
      page.drawText(moment(check.paymentDate).format('MM/DD/YYYY'), Object.assign(fontOptions, { x: 1e3, y: pageHeight - size - 150 }));
      page.drawText(`** ${check.amount}`, Object.assign(fontOptions, { x: 1100, y: pageHeight - size - 225 }));
      page.drawText(_.get(check, 'vendor.fullName'), Object.assign(fontOptions, { x: 100, y: pageHeight - size - 350 }));
      const address = _.get(check, 'vendor.address', {});
      page.drawText(address.line1,
        Object.assign(fontOptions, { x: 100, y: pageHeight - size - 365 }));
      if (!_.isEmpty(_.trim(address.line2))) {
        page.drawText(address.line2,
          Object.assign(fontOptions, { x: 100, y: pageHeight - size - 380 }));
      }
      page.drawText(`${address.city} ${_.get(address, 'country.code', '')} ${address.zip}`,
        Object.assign(fontOptions, { x: 100, y: pageHeight - size - 395 }));
      if (!_.isEmpty(_.trim(check.memo))) {
        page.drawText(check.memo,
          Object.assign(fontOptions, { x: 60, y: pageHeight - size - 420 }));
      }
      [500, 1e3].forEach((offset) => {
        page.drawText(
          `${apPaymentsNumbers[check.accountPayableId]}${' '.repeat(250)}$${check.amount}`,
          Object.assign(fontOptions, { x: 100, y: pageHeight - size - offset }),
        );
      });
    });
    return Buffer.from(await pdfDoc.save());
  }
}

module.exports = CheckBuilder;
