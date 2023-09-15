const MASK_CHARACTER = '*';
const maskPattern = /^\**[a-zA-Z\d$&+,:;=?@#|'<>.^()%!-]{4}$/;
const maskValue = value => value.split('')
  .map((v, i) => (value.length - i > 4 ? MASK_CHARACTER : v)).join('');

module.exports = { maskValue, maskPattern };
