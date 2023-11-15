export const eachDocument = function (documents, options) {
  let result = '';
  documents.filter((d) => !d.isReference).forEach((item, index) => {
    result += options.fn({ item, index });
  });
  return result;
};

export const eachReference = function (documents, options) {
  let result = '';
  documents.filter((d) => d.isReference).forEach((item, index) => {
    result += options.fn({ item, index });
  });
  return result;
};

export const documentsNames = function (documents) {
  return documents.filter((d) => !d.isReference).map((d) => d.name).join(', ');
};

export const referencesNames = function (documents) {
  return documents.filter((d) => d.isReference).map((d) => d.name).join(', ');
};

export const allDocumentsNames = function (documents) {
  return documents.map((d) => d.name).join(', ');
};
