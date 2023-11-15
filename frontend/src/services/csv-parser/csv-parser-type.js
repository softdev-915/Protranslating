import _ from 'lodash';
import { parseFile } from './csv-parser';
import { isValidNumber } from './helpers';

export default class CsvParserType {
  constructor(
    initialFileRowIndex,
    breakdownIndexes,
    getBreakdownValue,
    preprocess,
    options
  ) {
    this.delimiter = _.get(options, 'delimiter', ';');
    this.shouldUseBreakdownIndexes = _.get(options, 'shouldUseBreakdownIndexes', true);

    this.initialFileRowIndex = initialFileRowIndex || 0;
    this.breakdownIndexes = breakdownIndexes || {};
    this.getBreakdownValue = getBreakdownValue;
    this.preprocess = preprocess;
  }

  get breakdowns() {
    return Object.keys(this.breakdownIndexes);
  }

  getBreakdownIndexes(headerRow) {
    const breakdownIndexes = headerRow.reduce((headerIndexes, header, idx) => {
      headerIndexes[header] = idx;
      return headerIndexes;
    }, {});
    return _.pick(breakdownIndexes, this.breakdowns);
  }

  async parse(file) {
    try {
      let parsedFile = await parseFile(file, this.delimiter);
      if (!_.isNil(this.preprocess)) {
        parsedFile = this.preprocess(
          parsedFile,
          this.initialFileRowIndex,
          this.breakdowns.length);
      }
      const response = {};
      const breakdownIndexes = this.shouldUseBreakdownIndexes ?
        this.breakdownIndexes :
        this.getBreakdownIndexes(parsedFile[0])
      ;
      for (let i = 0; i < _.get(parsedFile, 'length', 0); i++) {
        for (let j = 0; j < this.breakdowns.length; j++) {
          const breakdownName = this.breakdowns[j];
          const breakdownValue = this.getBreakdownValue(_.get(parsedFile, `[${i}]`), breakdownIndexes[breakdownName]);
          if (_.isNil(breakdownValue)) {
            throw new Error(`Parsing csv file at '${breakdownName}' row failed. Check to make sure file does not contain trailing commas or quote`);
          }
          if (_.isNil(response[breakdownName])) {
            response[breakdownName] = 0;
          }
          const wordsCount = parseInt(breakdownValue, 10);
          if (isValidNumber(breakdownValue) && !_.isNaN(wordsCount)) {
            response[breakdownName] += wordsCount;
          }
        }
      }
      return response;
    } catch (error) {
      throw new Error('Incorrect format. Please select the correct format for upload and try again');
    }
  }
}
