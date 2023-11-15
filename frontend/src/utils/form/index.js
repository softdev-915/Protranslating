/* global grecaptcha */
import _ from 'lodash';
import moment from 'moment';

export const executeRecaptcha = (sitekey, action, verifiedCallback,
  expiredCallback) => grecaptcha.ready(() => {
  grecaptcha.execute(sitekey, { action }).then((token) => {
    if (verifiedCallback) {
      verifiedCallback(token);
    }
  }).catch((error) => {
    if (expiredCallback) {
      expiredCallback(error);
    }
  });
});

export const initRecaptcha = (elementId, sitekey, verifiedCallback,
  expiredCallback) => grecaptcha.render(elementId, {
  sitekey,
  callback: verifiedCallback,
  'expired-callback': expiredCallback,
});

export const resetRecaptcha = (widgetId) => {
  grecaptcha.reset(widgetId);
};
// eslint-disable-next-line max-len
const emailRegexp = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
export const isEmail = (str) => emailRegexp.test(str);

// does not support unicode characters
const isLetter = (char) => char.match(/[a-z]/i);
const symbolsAllowed = /^[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?]*$/;
const isUppercase = (char) => isLetter(char) && char.toUpperCase() === char;
const isLowercase = (char) => isLetter(char) && char.toLowerCase() === char;
const isNumber = (char) => _.isNaN(parseInt(char, 10));
const isSymbol = (char) => char.match(symbolsAllowed);
const uppercaseChar = (charArray) => charArray.filter(isUppercase).length > 0;
const lowercaseChar = (charArray) => charArray.filter(isLowercase).length > 0;
const numberChar = (charArray) => charArray.filter(isNumber).length > 0;
const symbolChar = (charArray) => charArray.filter(isSymbol).length > 0;
const isValidPasswordLengthSecurityPolicy = (password, passwordLength) => password.length >= passwordLength;
export const shouldShowInvalidPassword = (password, isValid, isDirty) => password.length > 0
  && !isValid && isDirty;

export const shouldShowEmptyPassword = (password, isDirty) => password.length === 0 && isDirty;

export const isValidDate = (date) => moment(date).isValid();

// TODO: some countries might not have states
export const isValidAddress = address => ['city', 'line1', 'country.name', 'zip'].every(prop => !_.isEmpty(_.get(address, prop)));

const taxIdRegex = /^\d{3}-\d{2}-\d{4}$|^\d{2}-\d{7}$|^\*{6,7}\d{4}$/;

export const isValidTaxId = (taxId) => taxId && taxIdRegex.test(taxId);
const getPasswordErrors = (password, { minPasswordLength, passwordComplexity }) => {
  const errors = [];
  if (_.isEmpty(password)) {
    return [];
  }
  const charArray = password.split('');
  if (!isValidPasswordLengthSecurityPolicy(password, minPasswordLength)) {
    errors.push(`at least ${minPasswordLength} characters `);
  }
  if (passwordComplexity.upperCaseLetters && !uppercaseChar(charArray)) {
    errors.push('uppercase letters');
  }
  if (passwordComplexity.lowerCaseLetters && !lowercaseChar(charArray)) {
    errors.push('lowercase letters');
  }
  if (passwordComplexity.hasDigitsIncluded && !numberChar(charArray)) {
    errors.push('numbers');
  }
  if (passwordComplexity.specialCharacters && !symbolChar(charArray)) {
    errors.push('special characters');
  }
  return errors;
};

export const getPasswordValidationErrorMessage = (password, securityPolicy) => {
  const errors = getPasswordErrors(password, securityPolicy);
  let message = 'The new password must contain ';
  const hasMinLengthError = errors.find((e) => !_.isNil(e.match('at least')));
  errors.forEach((e, index) => {
    const isPenultimeError = index === errors.length - 1;
    const isLastError = index === errors.length;
    if (isPenultimeError && errors.length > 2) {
      message += ' and ';
    }
    if ((errors.length >= 2 && index > 0 && !isLastError) || (errors.length === 1)) {
      message += `${e}`;
      if (errors.length > 2 && !isPenultimeError) {
        if (index + 2 !== errors.length) {
          message += ', ';
        }
      }
    } else if (hasMinLengthError && index === 0 && errors.length >= 2) {
      message += `${e} including `;
    }
  });
  return _.isEmpty(errors) ? '' : message;
};

export const isValidPassword = (password, securityPolicy) => {
  if (_.isNil(securityPolicy)) {
    return false;
  }
  const errors = getPasswordErrors(password, securityPolicy);
  return _.isEmpty(errors);
};
