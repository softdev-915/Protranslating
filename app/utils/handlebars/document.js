module.exports.eachDocument = function (documents, options) {
  let result = '';
  documents.filter(d => !d.isReference).forEach((item, index) => {
    result += options.fn({ item, index });
  });
  return result;
};

module.exports.eachReference = function (documents, options) {
  let result = '';
  documents.filter(d => d.isReference).forEach((item, index) => {
    result += options.fn({ item, index });
  });
  return result;
};

module.exports.documentsNames = function (documents) {
  return documents.filter(d => !d.isReference).map(d => d.name).join(', ');
};

module.exports.referencesNames = function (documents) {
  return documents.filter(d => d.isReference).map(d => d.name).join(', ');
};

module.exports.allDocumentsNames = function (documents) {
  if (Array.isArray(documents)) {
    return documents.map(d => d.name).join(', ');
  }
  return '';
};
