import _ from 'lodash';
import * as utils from './helper';

/**
 * camelCase the characters in the given `string`.
 *
 * ```js
 * {{camelcase "foo bar baz"}};
 * //=> 'fooBarBaz'
 * ```
 *
 * @name .camelcase
 * @param  {String} `string` The string to camelcase.
 * @return {String}
 * @api public
 */

export const camelcase = _.camelCase;

/**
 * Capitalize the first word in a sentence.
 *
 * ```handlebars
 * {{capitalize "foo bar baz"}}
 * //=> "Foo bar baz"
 * ```
 * @param  {String} `str`
 * @return {String}
 * @api public
 */

export const { capitalize } = _;

/**
 * Capitalize all words in a string.
 *
 * ```handlebars
 * {{capitalizeAll "foo bar baz"}}
 * //=> "Foo Bar Baz"
 * ```
 * @param  {String} `str`
 * @return {String}
 * @api public
 */

export const capitalizeAll = function (str) {
  if (str && typeof str === 'string') {
    return str.replace(/\w\S*/g, (word) => capitalize(word));
  }
};

/**
 * Like trim, but removes both extraneous whitespace **and
 * non-word characters** from the beginning and end of a string.
 *
 * ```js
 * {{chop "_ABC_"}}
 * //=> 'ABC'
 *
 * {{chop "-ABC-"}}
 * //=> 'ABC'
 *
 * {{chop " ABC "}}
 * //=> 'ABC'
 * ```
 *
 * @name .chop
 * @param  {String} `string` The string to chop.
 * @return {String}
 * @api public
 */

export const chop = function (str) {
  return utils.chop(str);
};

/**
 * Replace spaces in a string with hyphens.
 *
 * ```handlebars
 * {{hyphenate "foo bar baz qux"}}
 * //=> "foo-bar-baz-qux"
 * ```
 * @param  {String} `str`
 * @return {String}
 * @api public
 */

export const hyphenate = function (str) {
  if (str && typeof str === 'string') {
    return str.split(' ').join('-');
  }
};

/**
 * Return true if `value` is a string.
 *
 * ```handlebars
 * {{isString "foo"}}
 * //=> 'true'
 * ```
 * @param  {String} `value`
 * @return {Boolean}
 * @api public
 */

export const isString = (value) => typeof value === 'string' || value instanceof String;

/**
 * Lowercase all characters in the given string.
 *
 * ```handlebars
 * {{lowercase "Foo BAR baZ"}}
 * //=> 'foo bar baz'
 * ```
 * @param  {String} `str`
 * @return {String}
 * @api public
 */

export const lowercase = (string) => string.toLowerCase();

/**
 * Return the number of occurrences of `substring` within the
 * given `string`.
 *
 * ```handlebars
 * {{occurrences "foo bar foo bar baz" "foo"}}
 * //=> 2
 * ```
 * @param  {String} `str`
 * @param  {String} `substring`
 * @return {Number} Number of occurrences
 * @api public
 */

export const occurrences = function (str, substring) {
  if (str && typeof str === 'string') {
    const len = substring.length;
    let pos = 0;
    let n = 0;
    pos = str.indexOf(substring, pos);
    while (pos > -1) {
      n++;
      pos += len;
      pos = str.indexOf(substring, pos);
    }
    return n;
  }
};

/**
 * snake_case the characters in the given `string`.
 *
 * ```js
 * {{snakecase "a-b-c d_e"}}
 * //=> 'a_b_c_d_e'
 * ```
 *
 * @param  {String} `string`
 * @return {String}
 * @api public
 */

export const snakecase = _.snakeCase;

/**
 * Split `string` by the given `character`.
 *
 * ```js
 * {{split "a,b,c" ","}}
 * //=> ['a', 'b', 'c']
 * ```
 *
 * @param  {String} `string` The string to split.
 * @return {String} `character` Default is `,`
 * @api public
 */

export const { split } = _;

/**
 * Tests whether a string begins with the given prefix.
 *
 * ```handlebars
 * {{#startsWith "Goodbye" "Hello, world!"}}
 *   Whoops
 * {{else}}
 *   Bro, do you even hello world?
 * {{/startsWith}}
 * ```
 * @param  {String} `prefix`
 * @param  {String} `testString`
 * @param  {String} `options`
 * @contributor Dan Fox <http://github.com/iamdanfox>
 * @return {String}
 * @block
 * @api public
 */

export const { startsWith } = _;

/**
 * Removes extraneous whitespace from the beginning and end
 * of a string.
 *
 * ```js
 * {{trim " ABC "}}
 * //=> 'ABC'
 * ```
 *
 * @name .trim
 * @param  {String} `string` The string to trim.
 * @return {String}
 * @api public
 */

export const { trim } = _;

/**
 * Uppercase all of the characters in the given string. If used as a
 * block helper it will uppercase the entire block. This helper
 * does not support inverse blocks.
 *
 * @name .uppercase
 * @related capitalize capitalizeAll
 * @param {String} `str` The string to uppercase
 * @param {Object} `options` Handlebars options object
 * @return {String}
 * @block
 * @api public
 */

export const uppercase = _.upperCase;
