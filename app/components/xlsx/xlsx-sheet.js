const { getWordsFromCamelCase } = require('../../utils/string');

const MAX_NAME_LENGTH = 31;
const MIN_SHEET_NAME_CHARS_PER_WORD = 4;

class XlsxSheet {
  constructor(name) {
    this.setName(name);
    this.setData([]);
  }

  setName(name) {
    this.name = name;
  }

  getName() {
    return this.name;
  }

  setData(data) {
    this.data = data;
    return this;
  }

  getData() {
    return this.data;
  }

  getNameToSave() {
    let { name } = this;
    let minCharsRule = MIN_SHEET_NAME_CHARS_PER_WORD;
    while (name.length > MAX_NAME_LENGTH) {
      const shortedName = name
        .split('.')
        // eslint-disable-next-line no-loop-func
        .map(field =>
          getWordsFromCamelCase(field)
            .map(word => (word.length > minCharsRule ? word.slice(0, -1) : word))
            .join(''),
        )
        .join('.');
      if (shortedName.length === name.length) {
        --minCharsRule;
      }
      name = shortedName;
    }
    return name;
  }
}

module.exports = XlsxSheet;
