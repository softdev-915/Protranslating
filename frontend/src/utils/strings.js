const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
const capitalizeFirstLetter = (str) => `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
const escapeRegexp = (str) => {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  }
  return str.replace(matchOperatorsRe, '\\$&');
};
const nbspToSpace = str => str.replace(new RegExp(String.fromCharCode(160), 'g'), ' ');
const spaceToNbsp = str => str.replace(new RegExp(' ', 'g'), String.fromCharCode(160));

export {
  capitalizeFirstLetter,
  escapeRegexp,
  nbspToSpace,
  spaceToNbsp,
};
