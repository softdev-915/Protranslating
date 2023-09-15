const _ = require('lodash');
const bigjs = require('big.js');

const ensureNumber = (value) => {
  if (value instanceof bigjs) {
    return value.toNumber();
  }

  return _.defaultTo(_.toNumber(value), 0);
};

const toBigJs = (number, options) => {
  const isBigJsNumber = number instanceof bigjs;

  if ((_.isNaN(number) || _.isNaN(Number(number))) && !isBigJsNumber) {
    return bigjs(0);
  }
  if (!_.isNil(options) && _.isNumber(options.precision)) {
    const formattedNumber = Number(number.toFixed(options.precision));

    if (_.isNaN(formattedNumber)) {
      return bigjs(0);
    }
    if (!_.isNumber(formattedNumber) && !isBigJsNumber) {
      return bigjs(0);
    }

    return bigjs(formattedNumber);
  }

  return bigjs(number);
};

const bigJsToNumber = (number) => {
  if (_.isString(number)) {
    number = Number(number);
  }
  if (number instanceof bigjs) {
    return number.toNumber();
  }
  if (_.isNil(number)) {
    return 0;
  }

  return ensureNumber(number);
};
const bigJsToRoundedNumber = (number, precision = 2) => _.round(bigJsToNumber(number), precision);
const multiply = (number1, number2, options) => {
  if (_.isNaN(number1) || _.isNaN(number2)) {
    return bigjs(0);
  }
  if (number1 === 0 || number2 === 0) {
    return 0;
  }
  const bigJsNumber1 = toBigJs(number1);
  const bigJsNumber2 = toBigJs(number2);
  const product = bigJsNumber1.times(bigJsNumber2);

  if (!_.isNil(options) && _.isNumber(options.precision)) {
    return toBigJs(product.toFixed(options.precision));
  }

  return product;
};

const div = (number1, number2, options) => {
  if (_.isNaN(number1)) {
    number1 = 0;
  }
  if (_.isNaN(number2)) {
    number2 = 0;
  }
  if (number1 === 0 || number2 === 0) {
    return 0;
  }
  const bigJsNumber1 = toBigJs(number1);
  const bigJsNumber2 = toBigJs(number2);
  const precision = _.get(options, 'precision');
  const product = bigJsNumber1.div(bigJsNumber2);

  if (_.isNumber(precision)) {
    return product.toFixed(precision);
  }

  return product;
};

const minus = (number1, number2) => {
  if (_.isNaN(number1)) {
    number1 = 0;
  }
  if (_.isNaN(number2)) {
    number2 = 0;
  }
  const bigJsNumber1 = toBigJs(number1);
  const bigJsNumber2 = toBigJs(number2);

  return bigJsNumber1.minus(bigJsNumber2);
};

const sum = (number1, number2, options) => {
  if (_.isNaN(number1)) {
    number1 = 0;
  }
  if (_.isNaN(number2)) {
    number2 = 0;
  }
  if (number1 === 0) {
    return number2;
  }
  const bigJsNumber1 = toBigJs(number1);
  const bigJsNumber2 = toBigJs(number2);
  const result = bigJsNumber1.plus(bigJsNumber2);

  if (!_.isNil(options) && _.isNumber(options.precision)) {
    return toBigJs(result.toFixed(options.precision));
  }

  return result;
};
const decimal128ToNumber = (field) => {
  if (_.get(field, '_bsontype') === 'Decimal128' && !_.isNil(field)) {
    field = parseFloat(field.toString());
  }

  return field;
};

const transformDecimal128Fields = (doc, obj) => {
  _.keys(obj).forEach((key) => {
    obj[key] = decimal128ToNumber(obj[key]);
  });

  return obj;
};
const transformDecimal128FieldsDeep = (obj) => {
  _.keys(obj).forEach((key) => {
    if (_.get(obj[key], '_bsontype') === 'Decimal128') {
      obj[key] = decimal128ToNumber(obj[key]);
    } else if (_.isObject(obj[key])) {
      obj[key] = transformDecimal128FieldsDeep(obj[key]);
    }
  });
  return obj;
};
const total = (arr, field) => arr.reduce((ac, en) => ac.plus(en[field]), bigjs(0));
const toCommaDecimalFormat = (num, minimumFractionDigits = 4, maximumFractionDigits = 4) => {
  if (!_.isNil(num)) {
    return decimal128ToNumber(num).toLocaleString('en-US', {
      minimumFractionDigits,
      maximumFractionDigits,
    });
  }
};
const roundNumber = (digits) => (value) => _.round(ensureNumber(value), digits);

module.exports = {
  roundNumber,
  ensureNumber,
  decimal128ToNumber,
  toBigJs,
  sum,
  minus,
  div,
  multiply,
  bigJsToNumber,
  transformDecimal128Fields,
  transformDecimal128FieldsDeep,
  total,
  toCommaDecimalFormat,
  bigJsToRoundedNumber,
};
