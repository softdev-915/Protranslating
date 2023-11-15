import papa from 'papaparse';
import CsvParserType from './csv-parser-type';
import { filterEmptyRows } from './helpers';

const CSVTypes = {
  Trados: 'trados',
  Memsource: 'memsource',
  PerTypeAllInformation: 'per_file_all_information',
  ReflectingDisplayedResults: 'reflecting_displayed_results',
};
const TRADOS_INITIAL_ROW_INDEX = 1;
const PER_TYPE_ALL_INFORMATION_INITIAL_ROW_INDEX = 2;
const REFLECTING_DISPLAYED_RESULTS_INITIAL_ROW_INDEX = 2;
const MEMSOURCE_INITIAL_ROW_INDEX = 2;

export default class CsvParser {
  constructor() {
    this.csvPerTypeAllInformationParser = new CsvParserType(
      PER_TYPE_ALL_INFORMATION_INITIAL_ROW_INDEX,
      {
        '101%': 11,
        Repetitions: 19,
        '100%': 27,
        '95-99%': 35,
        '85-94%': 43,
        '75-84%': 51,
        '50-74%': 59,
        'No Match': 67,
      },
      (parsedRow, breakdownIndex) => parsedRow[breakdownIndex],
      filterEmptyRows,
    );
    this.csvReflectingDisplayedResults = new CsvParserType(
      REFLECTING_DISPLAYED_RESULTS_INITIAL_ROW_INDEX,
      {
        '101%': 9,
        Repetitions: 8,
        '100%': 10,
        '95-99%': 11,
        '85-94%': 12,
        '75-84%': 13,
        '50-74%': 14,
        'No Match': 16,
      },
      (parsedRow, breakdownIndex) => parsedRow[breakdownIndex][2],
      parsedData => [parsedData],
    );
    this.csvTrados = new CsvParserType(
      TRADOS_INITIAL_ROW_INDEX,
      {
        Repetitions: 0,
        Locked: 0,
        'Perfect Match': 0,
        'Context Match': 0,
        'Cross File Repetitions': 0,
        '100% (TM)': 0,
        '99% - 95% (TM)': 0,
        '94% - 85% (TM)': 0,
        '84% - 75% (TM)': 0,
        '74% - 50% (TM)': 0,
        New: 0,
      },
      (parsedRow, breakdownIndex) => parsedRow[breakdownIndex],
      filterEmptyRows,
      {
        shouldUseBreakdownIndexes: false,
        delimiter: ',',
      }
    );
    this.csvMemsource = new CsvParserType(
      MEMSOURCE_INITIAL_ROW_INDEX,
      {
        'Context Match': 4,
        Repetitions: 8,
        '100% (TM)': 12,
        '99% - 95% (TM)': 16,
        '94% - 85% (TM)': 20,
        '84% - 75% (TM)': 24,
        '74% - 50% (TM)': 28,
        'No Match': 32,
      },
      (parsedRow, breakdownIndex) => parsedRow[breakdownIndex],
      filterEmptyRows,
    );
  }

  getParserType(csvType) {
    let parserType;
    switch (csvType) {
      case CSVTypes.PerTypeAllInformation:
        parserType = this.csvPerTypeAllInformationParser;
        break;
      case CSVTypes.ReflectingDisplayedResults:
        parserType = this.csvReflectingDisplayedResults;
        break;
      case CSVTypes.Trados:
        parserType = this.csvTrados;
        break;
      case CSVTypes.Memsource:
        parserType = this.csvMemsource;
        break;
      default:
        throw new Error(`csv type '${csvType}' is not supported`);
    }
    return parserType;
  }
}

export const parseFile = (file, delimiter = ';') => new Promise((resolve) => {
  papa.parse(file, {
    worker: false,
    complete: (result) => {
      resolve(result.data);
    },
    delimiter,
  });
});

