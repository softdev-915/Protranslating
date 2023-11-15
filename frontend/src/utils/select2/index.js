import _ from 'lodash';

export const properId = (o) => {
  if (typeof o === 'object') {
    return o._id || o.email;
  }
  return o;
};

export const compareById = (oId) => (o) => oId === properId(o);

export const toOption = (o, textProperty = 'name', valueProperty = '_id') => ({
  text: _.get(o, textProperty, ''),
  value: _.get(o, valueProperty, ''),
});

export const toIdName = (o) => ({
  _id: _.get(o, 'value', ''),
  name: _.get(o, 'text', ''),
});

export const toOptionFormat = (o) => ({
  value: properId(o) || o.email,
  text: o.name || (`${o.firstName} ${o.lastName}`),
  deleted: _.get(o, 'deleted', false),
  terminated: _.get(o, 'terminated', false),
  providerConfirmed: _.get(o, 'providerConfirmed', false),
});

export const toSelectOptionFormat = (dataObject, property, textBuilder) => {
  const selectOption = { value: null, text: null };
  if (!_.isString(property) && _.isString(dataObject)) {
    Object.assign(selectOption, {
      text: dataObject,
      value: dataObject,
    });
    return selectOption;
  }
  if (dataObject && dataObject[property]) {
    selectOption.value = dataObject[property];

    if (textBuilder && typeof textBuilder === 'function') {
      selectOption.text = textBuilder();
    } else if (typeof textBuilder === 'string') {
      selectOption.text = dataObject[textBuilder];
    } else {
      selectOption.text = dataObject[property];
    }
  }
  return selectOption;
};

export const toLanguageOption = (language) => ({
  value: language.isoCode,
  text: language.name,
});

export const toDefaultOption = ({ name = '', _id = '' }) => ({ text: name, value: _id });
export const toTextValueOption = ({ name = '', _id = '' }) => ({ text: name, value: { text: name, value: _id } });
