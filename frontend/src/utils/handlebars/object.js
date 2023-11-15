import _ from 'lodash';

/**
 * Return true if `value` is an object.
 *
 * ```handlebars
 * {{isObject "foo"}}
 * //=> false
 * ```
 * @name .isObject
 * @param  {String} `value`
 * @return {Boolean}
 * @api public
 */

/**
 * Extend the context with the properties of other objects.
 * A shallow merge is performed to avoid mutating the context.
 *
 * @param {Object} `objects` One or more objects to extend.
 * @return {Object}
 * @api public
 */

export const extend = function () {
  /* eslint-disable prefer-rest-params, no-prototype-builtins */
  const args = [].slice.call(arguments);
  let last = args[args.length - 1];

  if (last && _.isObject(last) && last.hash) {
    last = last.hash;
    args.pop(); // remove handlebars options object
    args.push(last);
  }

  const len = args.length;
  const context = {};
  let i = -1;

  while (++i < len) {
    const obj = args[i];
    if (_.isObject(obj)) {
      const keys = Object.keys(obj);
      keys.forEach((key) => {
        if (obj.hasOwnProperty(key)) {
          context[key] = obj[key];
        }
      });
    }
  }
  return context;
};

/**
 * Block helper that iterates over the properties of
 * an object, exposing each key and value on the context.
 *
 * @name .forIn
 * @param {Object} `context`
 * @param {Object} `options`
 * @return {String}
 * @block
 * @api public
 */

/**
 * Use property paths (`a.b.c`) to get a value or nested value from
 * the context. Works as a regular helper or block helper.
 *
 * @name .get
 * @param {String} `prop` The property to get, optionally using dot notation for nested properties.
 * @param {Object} `context` The context object
 * @param {Object} `options` The handlebars options object, if used as a block helper.
 * @return {String}
 * @block
 * @api public
 */

export const get = function (prop, context, options) {
  const val = _.get(context, prop);
  if (options && options.fn) {
    return val ? options.fn(val) : options.inverse(context);
  }
  return val;
};

/**
 * Block helper that parses a string using `JSON.parse`,
 * then passes the parsed object to the block as context.
 *
 * @param {String} `string` The string to parse
 * @param {Object} `options` Handlebars options object
 * @contributor github.com/keeganstreet
 * @block
 * @api public
 */

export const JSONparse = function (str, options) {
  return options.fn(JSON.parse(str));
};

/**
 * Alias for parseJSON. this will be
 * deprecated in a future release
 */

export const parseJSON = JSONparse;

/**
 * Stringify an object using `JSON.stringify`.
 *
 * @param  {Object} `obj` Object to stringify
 * @return {String}
 * @api public
 */

export const JSONstringify = function (obj, indent) {
  if (!_.isNumber(indent)) {
    indent = 0;
  }
  return JSON.stringify(obj, null, indent);
};

/**
 * Alias for JSONstringify. this will be
 * deprecated in a future release
 */

export const stringify = JSONstringify;
