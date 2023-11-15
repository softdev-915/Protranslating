import _ from 'lodash';
import CsvParser from './csv-parser';
import { emptyInvoiceDetail } from '../../utils/workflow/workflow-helpers';

export default class InvoiceCsvParser extends CsvParser {
  async parse(file, csvType, translationUnit, breakdowns = []) {
    if (_.isEmpty(translationUnit)) {
      throw new Error("Translation unit 'Word' is required.");
    }
    const unit = {
      _id: _.get(translationUnit, '_id', ''),
      name: _.get(translationUnit, 'name', ''),
    };
    const parserType = this.getParserType(csvType);
    const parsedResponse = await parserType.parse(file, csvType);
    const invoiceDetails = parserType.breakdowns
      .map((matchName) => {
        const foundBreakdown = _.pick(breakdowns.find(breakdown => breakdown.name === matchName), ['_id', 'name']);
        const invoiceDetail = emptyInvoiceDetail();
        if (_.isEmpty(foundBreakdown)) {
          throw new Error(`Breakdown '${matchName}' is not available.`);
        }
        _.set(invoiceDetail, 'invoice.breakdown', foundBreakdown);
        _.set(invoiceDetail, 'invoice.translationUnit', unit);
        _.set(invoiceDetail, 'invoice.quantity', parsedResponse[matchName]);
        return invoiceDetail;
      });
    return invoiceDetails;
  }
}
