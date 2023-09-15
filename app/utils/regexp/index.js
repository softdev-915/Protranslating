const safe = require('safe-regex');
const { RestError } = require('../../components/api-response');

const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
const escapeRegexp = (str) => {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  } else if (!safe(str)) {
    throw new RestError(400, { message: 'Regexp is not safe' });
  }
  return str.replace(matchOperatorsRe, '\\$&');
};
const startsWithSafeRegexp = str => new RegExp(`${escapeRegexp(str)}.*`, 'i');

module.exports = {
  escapeRegexp,
  startsWithSafeRegexp,
};
