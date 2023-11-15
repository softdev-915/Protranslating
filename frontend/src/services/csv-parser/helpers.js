import _ from 'lodash';

export const isValidNumber = number => !/[^0-9]/.test(number);

export const filterEmptyRows = (parsedData, initialFileRowIndex, breakdownsLength) => parsedData
  .filter((parsedRow, index) => index < initialFileRowIndex ||
    (index >= initialFileRowIndex &&
      _.isArray(parsedRow) &&
      breakdownsLength <= parsedRow.length
    )
  );
