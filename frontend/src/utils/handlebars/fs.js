import _ from 'lodash';

/**
 * Converts bytes into a nice representation with unit.
 *
 * **Examples:**
 *
 *   - `13661855 => 13.7 MB`
 *   - `825399 => 825 KB`
 *   - `1396 => 1 KB`
 *
 * @param {String} `value`
 * @return {String}
 * @api public
 */

export const fileSize = function (num) {
  const bytes = parseInt(num, 10);

  if (!_.isNumber(bytes)) {
    return num.toString(); // Graceful degradation
  }

  // KB is technically a Kilobit, but it seems more readable.
  const metric = ['byte', 'bytes', 'KB', 'MB', 'GB'];
  let res;
  if (bytes === 0) {
    return '0 bytes';
  }
  // Base 1000 (rather than 1024) matches Mac OS X
  res = Math.floor(Math.log(bytes) / Math.log(1000));

  // No decimals for anything smaller than 1 MB
  const pow = 1000 ** Math.floor(res);
  num = (bytes / pow).toFixed(res < 2 ? 0 : 1);

  if (bytes === 1) {
    res = -1; // special case: 1 byte (singular)
  }
  return `${num} ${metric[res + 1]}`;
};

