import _ from 'lodash';
import papa from 'papaparse';
import { emptyInvoice, emptyBill, ANALYSIS_IMPORT_TYPE_BILL } from '../utils/workflow/workflow-helpers';

const analysisImportParseConfig = {
  initialFileRowIndex: 2,
  matchesWordsIndexes: {
    '101%': 11,
    Repetitions: 19,
    '100%': 27,
    '95-99%': 35,
    '85-94%': 43,
    '75-84%': 51,
    '50-74%': 59,
    'No Match': 67,
  },
};

export default class WorkflowProviderTaskService {
  parseCsvAnalysisImport(analysisFile) {
    if (_.isNil(analysisFile) || !(analysisFile instanceof Blob)) {
      return;
    }
    return new Promise((resolve, reject) => {
      papa.parse(analysisFile, {
        worker: true,
        complete: (result) => {
          if (!_.isEmpty(result.errors)) {
            reject(result.errors);
          }
          resolve(result);
        },
      });
    });
  }

  async generateTransactionDetails(analysisFile, breakdowns = [], analysisType) {
    const parsedData = await this.parseCsvAnalysisImport(analysisFile);
    if (_.isNil(parsedData)) {
      return;
    }
    const transactionDetails = Object.keys(analysisImportParseConfig.matchesWordsIndexes)
      .map((matchName) => {
        const breakdown = _.pick(breakdowns.find((match) => match.name === matchName), ['_id', 'name']);
        const transactionDetail = analysisType === ANALYSIS_IMPORT_TYPE_BILL ? emptyBill() : emptyInvoice();
        if (!_.isEmpty(breakdown)) {
          _.set(transactionDetail, 'breakdown', breakdown);
        }
        let quantity = 0;
        for (let i = analysisImportParseConfig.initialFileRowIndex;
          i < parsedData.data.length; i++) {
          const fileInfo = parsedData.data[i];
          const wordsCount = +fileInfo[analysisImportParseConfig.matchesWordsIndexes[matchName]];
          if (!_.isNaN(wordsCount)) {
            quantity += wordsCount;
          }
        }
        _.set(transactionDetail, 'quantity', quantity);
        return transactionDetail;
      });
    return transactionDetails;
  }
}
