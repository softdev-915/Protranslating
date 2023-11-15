import _ from 'lodash';
import * as utils from './helper.js';
/**
 * Returns all of the items in an array after the specified index.
 * Opposite of [before](#before).
 *
 * ```handlebars
 * {{after "['a', 'b', 'c']" 1}}
 * //=> '["c"]'
 * ```
 *
 * @param {Array} `array` Collection
 * @param {Number} `n` Starting index (number of items to exclude)
 * @return {Array} Array exluding `n` items.
 * @api public
 */

export const after = function (array, n) {
  if (_.isUndefined(array)) return '';
  return array.slice(n);
};

/**
 * Cast the given `value` to an array.
 *
 * ```handlebars
 * {{arrayify "foo"}}
 * //=> '["foo"]'
 * ```
 * @param {any} `value`
 * @return {Array}
 * @api public
 */

export const arrayify = function (value) {
  if (value) {
    return Array.isArray(value) ? value : [value];
  }
  return [];
};

/**
 * Return all of the items in the collection before the specified
 * count. Opposite of [after](#after).
 *
 * ```handlebars
 * {{before "['a', 'b', 'c']" 2}}
 * //=> '["a", "b"]'
 * ```
 *
 * @param {Array} `array`
 * @param {Number} `n`
 * @return {Array} Array excluding items after the given number.
 * @api public
 */

export const before = function (array, n) {
  if (_.isUndefined(array)) return '';
  return array.slice(0, -n);
};

/**
 * ```handlebars
 * {{#eachIndex collection}}
 *   {{item}} is {{index}}
 * {{/eachIndex}}
 * ```
 * @param {Array} `array`
 * @param {Object} `options`
 * @return {String}
 * @block
 * @api public
 */

export const eachIndex = function (array, options) {
  let result = '';
  for (let i = 0; i < array.length; i++) {
    result += options.fn({ item: array[i], index: i });
  }
  return result;
};

/**
 * Block helper that filters the given array and renders the block for values that
 * evaluate to `true`, otherwise the inverse block is returned.
 *
 * ```handlebars
 * {{#filter array "foo"}}AAA{{else}}BBB{{/filter}}
 * //=> 'BBB
 * ```
 *
 * @name .filter
 * @param {Array} `array`
 * @param {any} `value`
 * @param {Object} `options`
 * @return {String}
 * @block
 * @api public
 */

export const filter = function (array, value, options) {
  let content = '';
  let results = [];
  // filter on a specific property
  const prop = options.hash && options.hash.property;
  if (prop) {
    results = array.filter((val) => _.get(val, prop) === value);
  } else {
    // filter on a string value
    results = array.filter((v) => value === v);
  }

  if (results && results.length > 0) {
    for (let i = 0; i < results.length; i++) {
      content += options.fn(results[i]);
    }
    return content;
  }
  return options.inverse(this);
};

/**
 * Returns the first item, or first `n` items of an array.
 *
 * ```handlebars
 * {{first "['a', 'b', 'c', 'd', 'e']" 2}}
 * //=> '["a", "b"]'
 * ```
 *
 * @param {Array} `array`
 * @param {Number} `n` Number of items to return, starting at `0`.
 * @return {Array}
 * @api public
 */

export const first = function (array, n) {
  if (_.isUndefined(array)) return '';
  if (!_.isNumber(n)) {
    return array[0];
  }
  return array.slice(0, n);
};

/**
 * Iterates over each item in an array and exposes the current item
 * in the array as context to the inner block. In addition to
 * the current array item, the helper exposes the following variables
 * to the inner block:
 *
 * - `index`
 * - `total`
 * - `isFirst`
 * - `isLast`
 *
 * Also, `@index` is exposed as a private variable, and additional
 * private variables may be defined as hash arguments.
 *
 * ```js
 * let accounts = [
 *   {'name': 'John', 'email': 'john@example.com'},
 *   {'name': 'Malcolm', 'email': 'malcolm@example.com'},
 *   {'name': 'David', 'email': 'david@example.com'}
 * ];
 *
 * // example usage
 * // {{#forEach accounts}}
 * //   <a href="mailto:{{ email }}" title="Send an email to {{ name }}">
 * //     {{ name }}
 * //   </a>{{#unless isLast}}, {{/unless}}
 * // {{/forEach}}
 * ```
 * @source <http://stackoverflow.com/questions/13861007>
 * @param {Array} `array`
 * @return {String}
 * @block
 * @api public
 */

export const forEach = function (array, options) {
  const data = utils.createFrame(options, options.hash);
  const len = array.length;
  let buffer = '';
  let i = -1;

  while (++i < len) {
    const item = array[i];
    data.index = i;
    item.index = i + 1;
    item.total = len;
    item.isFirst = i === 0;
    item.isLast = i === (len - 1);
    buffer += options.fn(item, { data });
  }
  return buffer;
};

/**
 * Block helper that renders the block if an array has the
 * given `value`. Optionally specify an inverse block to render
 * when the array does not have the given value.
 *
 * Given the array `['a', 'b', 'c']`:
 *
 * ```handlebars
 * {{#inArray array "d"}}
 *   foo
 * {{else}}
 *   bar
 * {{/inArray}}
 * ```
 *
 * @name .inArray
 * @param {Array} `array`
 * @param {any} `value`
 * @param {Object} `options`
 * @return {String}
 * @block
 * @api public
 */

export const inArray = function (array, value, options) {
  if (array.indexOf(value) > -1) {
    return options.fn(this);
  }
  return options.inverse(this);
};

/**
 * Returns true if `value` is an es5 array.
 *
 * ```handlebars
 * {{isArray "abc"}}
 * //=> 'false'
 * ```
 *
 * @param {any} `value` The value to test.
 * @return {Boolean}
 * @api public
 */

export const isArray = function (value) {
  return Array.isArray(value);
};

/**
 * Join all elements of array into a string, optionally using a
 * given separator.
 *
 * ```handlebars
 * {{join "['a', 'b', 'c']"}}
 * //=> 'a, b, c'
 *
 * {{join "['a', 'b', 'c']" '-'}}
 * //=> 'a-b-c'
 * ```
 *
 * @param {Array} `array`
 * @param {String} `sep` The separator to use.
 * @return {String}
 * @api public
 */

export const join = function (array, sep) {
  if (_.isUndefined(array)) return '';
  sep = typeof sep !== 'string'
    ? ', '
    : sep;
  return array.join(sep);
};

/**
 * Returns the last item, or last `n` items of an array.
 * Opposite of [first](#first).
 *
 * ```handlebars
 * {{last "['a', 'b', 'c', 'd', 'e']" 2}}
 * //=> '["d", "e"]'
 * ```
 * @param {Array} `array`
 * @param {Number} `n` Number of items to return, starting with the last item.
 * @return {Array}
 * @api public
 */

export const last = function (array, n) {
  if (!_.isNumber(n)) {
    return array[array.length - 1];
  }
  return array.slice(-n);
};

/**
 * Block helper that compares the length of the given array to
 * the number passed as the second argument. If the array length
 * is equal to the given `length`, the block is returned,
 * otherwise an inverse block may optionally be returned.
 *
 * @name .lengthEqual
 * @param {Array} `array`
 * @param {Number} `length`
 * @param {Object} `options`
 * @return {String}
 * @block
 * @api public
 */

export const lengthEqual = function (array, length, options) {
  if (array.length === length) {
    return options.fn(this);
  }
  return options.inverse(this);
};

/**
 * Returns a new array, created by calling `function`
 * on each element of the given `array`.
 *
 * ```js
 * // register `double` as a helper
 * function double(str) {
 *   return str + str;
 * }
 * // then used like this:
 * // {{map "['a', 'b', 'c']" double}}
 * //=> '["aa", "bb", "cc"]'
 * ```
 *
 * @param {Array} `array`
 * @param {Function} `fn`
 * @return {String}
 * @api public
 */

export const map = function (array, fn) {
  if (_.isUndefined(array)) return '';
  const len = array.length;
  const res = new Array(len);
  let i = -1;

  while (++i < len) {
    res[i] = fn(array[i], i, array);
  }
  return res;
};

/**
 * Sort the given `array`. If an array of objects is passed,
 * you may optionally pass a `key` to sort on as the second
 * argument. You may alternatively pass a sorting function as
 * the second argument.
 *
 * ```handlebars
 * {{sort "['b', 'a', 'c']"}}
 * //=> 'a,b,c'
 * ```
 *
 * @param {Array} `array` the array to sort.
 * @param {String|Function} `key` The object key to sort by, or sorting function.
 * @api public
 */

export const sort = function (arr, options) {
  if (_.isUndefined(arr)) return '';
  if (_.get(options, 'hash.reverse')) {
    return arr.sort().reverse();
  }
  return arr.sort();
};

/**
 * Use the items in the array _after_ the specified index
 * as context inside a block. Opposite of [withBefore](#withBefore).
 *
 * @param {Array} `array`
 * @param {Number} `idx`
 * @param {Object} `options`
 * @return {Array}
 * @block
 * @api public
 */

export const withAfter = function (array, idx, options) {
  array = array.slice(idx);
  let result = '';
  const len = array.length;
  let i = -1;
  while (++i < len) {
    result += options.fn(array[i]);
  }
  return result;
};

/**
 * Use the items in the array _before_ the specified index
 * as context inside a block.Opposite of [withAfter](#withAfter).
 *
 * ```handlebars
 * {{#withBefore array 3}}
 *   {{this}}
 * {{/withBefore}}
 * ```
 * @param {Array} `array`
 * @param {Number} `idx`
 * @param {Object} `options`
 * @return {Array}
 * @block
 * @api public
 */

export const withBefore = function (array, idx, options) {
  array = array.slice(0, -idx);
  let result = '';
  const len = array.length;
  let i = -1;
  while (++i < len) {
    result += options.fn(array[i]);
  }
  return result;
};

