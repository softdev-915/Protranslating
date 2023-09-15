const _ = require('lodash');

const SUCCESS_TRANSLATION_MESSAGE = ['Successfully translated text'];
const NOT_ENOUGH_CONFIDENCE_MESSAGE = ['One of the pages has low confidence level'];
const MOCK_DATA = {
  'LSP-271_E2E_TEST_PDF_1.pdf': SUCCESS_TRANSLATION_MESSAGE,
  'LSP-271_E2E_TEST_PDF_2.pdf': SUCCESS_TRANSLATION_MESSAGE,
  'LSP-271_E2E_TEST_PDF_ERROR.pdf': NOT_ENOUGH_CONFIDENCE_MESSAGE,
};

class GoogleTranslationMockService {
  /**
   * Method to translate multiple strings
   * @param {Array} textStrings
   * @param {String} targetLanguage
   * @param {String} fileName
   * @returns {Promise<*>}
   */
  // eslint-disable-next-line no-unused-vars
  async translate(textStrings, targetLanguage = 'eng', fileName) {
    const data = _.get(MOCK_DATA, fileName, SUCCESS_TRANSLATION_MESSAGE);
    return [data];
  }
}

module.exports = GoogleTranslationMockService;
