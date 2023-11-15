import _ from 'lodash';
/**
 * Block helper that returns a block if the given collection is
 * empty. If the collection is not empty the inverse block is returned
 * (if supplied).
 *
 * @name .isEmpty
 * @param {Object} `collection`
 * @param {Object} `options`
 * @return {String}
 * @block
 * @api public
 */

export const isEmpty = function (collection, options) {
  if (options == null) {
    options = collection;
    return options.fn(this);
  }

  if (Array.isArray(collection) && !collection.length) {
    return options.fn(this);
  }

  const keys = Object.keys(collection);
  if (typeof collection === 'object' && !keys.length) {
    return options.fn(this);
  }
  return options.inverse(this);
};

/**
 * Returns the length of the given collection. When using a string literal in the
 * template, the string must be value JSON. See the example below. Otherwise pass
 * in an array or object from the context
 *
 * ```handlebars
 * {{length '["a", "b", "c"]'}}
 * //=> 3
 *
 * //=> myArray = ['a', 'b', 'c', 'd', 'e'];
 * {{length myArray}}
 * //=> 5
 *
 * //=> myObject = {'a': 'a', 'b': 'b'};
 * {{length myObject}}
 * //=> 2
 * ```
 * @param  {Array|Object|String} `value`
 * @return {Number} The length of the value.
 * @api public
 */

export const length = function (value) {
  if (_.isUndefined(value)) return '';
  if (_.isObject(value)) {
    value = Object.keys(value);
  }
  return value.length;
};
