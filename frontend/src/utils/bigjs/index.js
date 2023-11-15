import _ from 'lodash';
import bigjs from 'big.js';

export const ensureNumber = (value) => {
  if (value instanceof bigjs) {
    return value.toNumber();
  }
  return _.defaultTo(_.toNumber(value), 0);
};

export const toBigJs = (number) => {
  if (_.isNaN(Number(number)) || _.isNil(number)) {
    return bigjs(0);
  }
  return bigjs(number);
};

export const bigJsToNumber = (number) => {
  if (number instanceof bigjs) {
    return number.toNumber();
  }
  if (_.isNaN(number) || _.isNil(number)) {
    return 0;
  }
  return number;
};

export const multiply = (number1, number2) => {
  if (number1 === 0 || number2 === 0 || !_.isNumber(number1) || !_.isNumber(number2)) {
    return 0;
  }
  const bigJsNumber1 = toBigJs(number1);
  const bigJsNumber2 = toBigJs(number2);
  return bigJsNumber1.times(bigJsNumber2);
};

export const div = (number1, number2) => {
  if (number1 === 0 || number2 === 0) {
    return 0;
  }
  const bigJsNumber1 = toBigJs(number1);
  const bigJsNumber2 = toBigJs(number2);
  return bigJsNumber1.div(bigJsNumber2);
};

export const minus = (number1, number2) => {
  const bigJsNumber1 = toBigJs(number1);
  const bigJsNumber2 = toBigJs(number2);
  return bigJsNumber1.minus(bigJsNumber2);
};

export const sum = (number1, number2) => {
  if (number1 === 0) {
    return number2;
  }
  const bigJsNumber1 = toBigJs(number1);
  const bigJsNumber2 = toBigJs(number2);
  return bigJsNumber1.plus(bigJsNumber2);
};
