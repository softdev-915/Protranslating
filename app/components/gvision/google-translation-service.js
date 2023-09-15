const _ = require('lodash');
const configuration = require('../configuration');
const { Translate } = require('@google-cloud/translate').v2;

const MAX_PARAGRAPHS_IN_REQUEST = 128;

class GoogleTranslationService {
  constructor(logger) {
    this.logger = logger;
    const environmentConfig = configuration.environment;
    this.translateClient = new Translate({ keyFilename: environmentConfig.GCS_KEY_FILE });
  }

  /**
   * Method to translate multiple strings
   * @param {Array} textStrings
   * @param {String} targetLanguage
   * @param {String} fileName
   * @returns {Promise<*>}
   */
  async translate(textStrings, targetLanguage = 'eng', fileName = '') {
    const splittedTextStrings = [];
    while (textStrings.length) {
      splittedTextStrings.push(textStrings.splice(0, MAX_PARAGRAPHS_IN_REQUEST));
    }
    const translationPromises = splittedTextStrings.map(async (strings) => {
      this.logger.debug(`Google Translate: send to ${targetLanguage} translation paragraphs from ${fileName}`);
      const d = await this.translateClient.translate(strings, { to: targetLanguage });
      this.logger.debug(`Google Translate: received translated to ${targetLanguage} paragraphs from ${fileName}`);
      return d[0];
    });
    const translatedData = await Promise.all(translationPromises);
    return [_.flatten(translatedData)];
  }
}

module.exports = GoogleTranslationService;
