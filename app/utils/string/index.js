const getWordsFromCamelCase = string => string.replace(/([A-Z])/g, '-$1').split('-');

module.exports = { getWordsFromCamelCase };
