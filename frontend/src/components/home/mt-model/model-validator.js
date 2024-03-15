import _ from 'lodash';

const _validateCode = (model, errors) => {
  if (model && model.code === '') {
    errors.push({ message: 'MT Model code is empty', props: { code: { val: model.code } } });
  }
  return errors;
};

const _validateTargetLanguage = (model, errors) => {
  const isoCode = _.get(model, 'targetLanguage.isoCode');
  if (_.isEmpty(isoCode)) {
    errors.push({ message: 'MT Model target language is empty', props: { targetLanguage: { val: model.targetLanguage } } });
  }
  return errors;
};

const _validateSourceLanguage = (model, errors) => {
  const isoCode = _.get(model, 'sourceLanguage.isoCode');
  if (_.isEmpty(isoCode)) {
    errors.push({ message: 'MT Model source language is empty', props: { sourceLanguage: { val: model.sourceLanguage } } });
  }
  return errors;
};

export const findModelValidationErrors = function (model) {
  const errors = [];
  _validateCode(model, errors);
  _validateTargetLanguage(model, errors);
  _validateSourceLanguage(model, errors);
  return errors;
};
