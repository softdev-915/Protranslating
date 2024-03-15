import _ from 'lodash';

const _validateEmptyFields = (ipInstructionsDeadline, errors) => {
  if (_.isEmpty(ipInstructionsDeadline.totalOrClaimsWordCount)) {
    errors.push({
      message: 'IP Instructions Deadline Total Or Claims WordCount field is empty',
      props: { totalOrClaimsWordCount: { val: ipInstructionsDeadline.totalOrClaimsWordCount } },
    });
  }
  if (_.isEmpty(ipInstructionsDeadline.noticePeriod)) {
    errors.push({
      message: 'IP Instructions Deadline Notice Period field is empty',
      props: { noticePeriod: { val: ipInstructionsDeadline.noticePeriod } },
    });
  }
  return errors;
};

const _validateTotalOrClaimsWordCountFormat = (totalOrClaimsWordCount) => {
  const errorMessage = 'Total or Claims Word Count input should follow the format {Number} - {Number}. Example: 0 - 2000';
  const correctFormatRegex = /^\d+ - \d+$/g;
  if (correctFormatRegex.test(totalOrClaimsWordCount)) {
    return {};
  }
  return { message: errorMessage };
};

export const findEmptyFieldsValidationError = (ipInstructionsDeadline) => {
  const errors = [];
  if (!_.isEmpty(ipInstructionsDeadline)) {
    _validateEmptyFields(ipInstructionsDeadline, errors);
  }
  return errors;
};

export const findFieldFormattingError = (ipInstructionsDeadline) => {
  if (!_.isEmpty(ipInstructionsDeadline)) {
    const totalOrClaimsWordCount = _.get(ipInstructionsDeadline, 'totalOrClaimsWordCount', '');
    const totalOrClaimsWordCountError = _validateTotalOrClaimsWordCountFormat(
      totalOrClaimsWordCount
    );
    return totalOrClaimsWordCountError;
  }
};
