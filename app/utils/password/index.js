// does not support unicode passwords
const _ = require('lodash');

const isLetter = char => char.match(/[a-z]/i);
const symbolsAllowed = /^[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?]*$/;
const isUppercase = char => isLetter(char) && char.toUpperCase() === char;
const isLowercase = char => isLetter(char) && char.toLowerCase() === char;
const isNumber = char => !isNaN(parseInt(char, 10));
const isSymbol = char => char.match(symbolsAllowed);
const hasValidSemantic = (password) => {
  const charArray = password.split('');
  const uppercaseChar = charArray.filter(isUppercase).length > 0;
  const lowercaseChar = charArray.filter(isLowercase).length > 0;
  const numberChar = charArray.filter(isNumber).length > 0;
  const symbolChar = charArray.filter(isSymbol).length > 0;
  return uppercaseChar && lowercaseChar && numberChar && symbolChar;
};
const isValidPasswordLength = password => password.length > 9;
const isValidPassword = password => isValidPasswordLength(password)
  && hasValidSemantic(password);

const shouldShowInvalidPassword = (password, isValid, isDirty) => password.length > 0
  && !isValid && isDirty;
const shouldShowEmptyPassword = (password, isDirty) => password.length === 0 && isDirty;
const uppercaseChar = charArray => charArray.filter(isUppercase).length > 0;
const lowercaseChar = charArray => charArray.filter(isLowercase).length > 0;
const numberChar = charArray => charArray.filter(isNumber).length > 0;
const symbolChar = charArray => charArray.filter(isSymbol).length > 0;
const isValidPasswordLengthSecurityPolicy = (password, passwordLength) =>
  password.length >= passwordLength;
const validateSecurityPolicy = (securityPolicy, password) => {
  const errors = [];
  const charArray = password.split('');
  if (!isValidPasswordLengthSecurityPolicy(password, securityPolicy.minPasswordLength)) {
    errors.push(`at least ${securityPolicy.minPasswordLength} characters`);
  }
  if (securityPolicy.passwordComplexity.upperCaseLetters && !uppercaseChar(charArray)) {
    errors.push('including uppercase letters');
  }
  if (securityPolicy.passwordComplexity.lowerCaseLetters && !lowercaseChar(charArray)) {
    errors.push('lowercase letters');
  }
  if (securityPolicy.passwordComplexity.hasDigitsIncluded && !numberChar(charArray)) {
    errors.push('numbers');
  }
  if (securityPolicy.passwordComplexity.specialCharacters && !symbolChar(charArray)) {
    errors.push('special characters');
  }
  let message = 'The new password must contain ';
  const hasMinLengthError = errors.find(e => !_.isNil(e.match('at least')));
  if (errors.length > 0) {
    errors.forEach((e, index) => {
      const isLastError = index + 1 === errors.length;
      const isMinLengthError = !_.isNil(e.match('at least'));
      if (isLastError) {
        if (errors.length <= 2) {
          message += ` ${e}`;
        } else {
          message += ` and ${e}`;
        }
      } else if (isMinLengthError) {
        if (errors.length > 1) {
          message += ` ${e} including `;
        }
      } else {
        const isPenultimateError = index + 1 < errors.length;
        const shouldIncludeComma = !isPenultimateError ||
          (errors.length >= 2 &&
          (index !== 1 && hasMinLengthError));
        message += `${shouldIncludeComma ? ',' : ''} ${e}`;
      }
    });
    throw new Error(message);
  }
};

module.exports = {
  isValidPassword,
  shouldShowInvalidPassword,
  shouldShowEmptyPassword,
  validateSecurityPolicy,
};
