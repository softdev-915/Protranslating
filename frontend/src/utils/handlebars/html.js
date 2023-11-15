/**
 * Truncates a string to the specified `length`, and appends
 * it with an elipsis, `…`.
 *
 * ```js
 * {{ellipsis "<span>foo bar baz</span>", 7}}
 * //=> 'foo bar…'
 * ```
 * @name .ellipsis
 * @param {String} `str`
 * @param {Number} `length` The desired length of the returned string.
 * @return {String} The truncated string.
 * @api public
 */

export const ellipsis = function (str, limit) {
  if (str && typeof str === 'string') {
    if (str.length <= limit) {
      return str;
    }
  }
  return '';
};
