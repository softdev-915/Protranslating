import _ from 'lodash';
import { emptyBillDetail } from '../../utils/workflow/workflow-helpers';
import CsvParser from './csv-parser';

export default class BillCsvParser extends CsvParser {
  async parse(file, csvType, breakdowns = []) {
    const parserType = this.getParserType(csvType);
    const parsedResponse = await parserType.parse(file, csvType);
    const billDetails = parserType.breakdowns
      .map((matchName) => {
        const foundBreakdown = _.pick(breakdowns
          .find(breakdown => breakdown.name === matchName), ['_id', 'name']);
        if (_.isEmpty(foundBreakdown)) {
          throw new Error(`Breakdown '${matchName}' is not available.`);
        }
        const billDetail = emptyBillDetail();
        if (!_.isEmpty(foundBreakdown)) {
          _.set(billDetail, 'breakdown', foundBreakdown);
        }
        _.set(billDetail, 'quantity', parsedResponse[matchName]);
        return billDetail;
      });
    return billDetails;
  }
}

