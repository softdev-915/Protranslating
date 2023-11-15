import _ from 'lodash';

const arePropertyDescriptorsSupported = function () {
  const obj = {};
  try {
    Object.defineProperty(obj, 'x', { enumerable: false, value: obj });
    // eslint-disable-next-line no-unused-vars, no-restricted-syntax, guard-for-in
    for (const __ in obj) { // jscs:ignore disallowUnusedVariables
      return false;
    }
    return obj.x === obj;
  } catch (e) { /* this is IE 8. */
    return false;
  }
};
const supportsDescriptors = Object.defineProperty && arePropertyDescriptorsSupported();

export const defineProperty = function (object, name, value, predicate) {
  if (object[name] !== undefined && (!_.isFunction(predicate) || !predicate())) {
    return;
  }
  if (supportsDescriptors) {
    Object.defineProperty(object, name, {
      configurable: true,
      enumerable: false,
      value: value,
      writable: true,
    });
  } else {
    object[name] = value;
  }
};

export const createFrame = function (data) {
  if (!_.isObject(data)) {
    throw new TypeError('createFrame expects data to be an object');
  }
  const frame = Object.extend({}, data);
  frame._parent = data;

  defineProperty(frame, 'extend', function (data1) {
    Object.extend(this, data1);
  });

  if (arguments.length > 1) {
    // eslint-disable-next-line prefer-rest-params
    const args = [].slice.call(arguments, 1);
    const len = args.length;
    let i = -1;
    while (++i < len) {
      frame.extend(args[i] || {});
    }
  }
  return frame;
};

export const contains = (array, value, fromIndex) => _.findIndex(array, value, fromIndex) !== -1;

export const isEven = (n) => n % 2 === 0;

export const isOdd = (n) => !isEven(n);

export const chop = function chop(str) {
  if (!_.isString(str)) return '';
  const re = /^[-_.\W\s]+|[-_.\W\s]+$/g;
  return str.trim().replace(re, '');
};

export const formatNumber = (number) => number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
