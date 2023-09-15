const _ = require('lodash');

const validateTotalOrClaimsWordCountFormat = (totalOrClaimsWordCount) => {
  const errorMessage = 'Total or Claims Word Count input should follow the format {Number} - {Number}. Example: 0 - 2000';
  const correctFormatRegex = /^\d+ - \d+$/g;
  if (!correctFormatRegex.test(totalOrClaimsWordCount)) {
    throw new Error(errorMessage);
  }
};

const validateIpInstructionsDeadline = (ipInstructionsDeadline) => {
  const totalOrClaimsWordCount = _.get(ipInstructionsDeadline, 'totalOrClaimsWordCount', '');
  validateTotalOrClaimsWordCountFormat(totalOrClaimsWordCount);
};

module.exports = {
  validateIpInstructionsDeadline,
};
