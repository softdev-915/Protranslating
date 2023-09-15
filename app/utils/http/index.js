const _ = require('lodash');
const FormData = require('form-data');

function buildFormDataWithHeaders(data = {}) {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    const value = _.get(data, `[${key}].value`, data[key]);
    const options = _.get(data, `[${key}].options`);
    formData.append(key, value, options);
  });
  return {
    formData,
    headers: Object.assign(
      formData.getHeaders(),
      { 'Content-Length': formData.getLengthSync() },
    ),
  };
}

module.exports = {
  buildFormDataWithHeaders,
};
