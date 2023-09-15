// eslint-disable-next-line global-require

const _ = require('lodash');
const { RestError } = require('../../../components/api-response');

class LspLogosApi {
  /**
   * @param {Object} logger
   * @param {Object} options optional object.
   * @param {Object} options.configuration configuration.
   * @param {Object} options.user user that is user api.
   */
  constructor(logger, options) {
    this.configuration = _.get(options, 'configuration');
    this.logger = logger;
  }
  async list(filters) {
    try {
      let logosList = this._getLogoList();
      const searchTerm = _.defaultTo(filters.searchTerm, '');
      if (searchTerm !== '') {
        const searchRegEx = new RegExp(searchTerm, 'i');
        logosList = _.filter(logosList, option => searchRegEx.test(option.name));
      }
      return {
        list: logosList,
        total: logosList.length,
      };
    } catch (err) {
      this.logger.error(`Error reading logos list from lsp-logos folder. Error: ${err}`);
      throw new RestError(500, {
        message: err,
        stack: err.stack,
      });
    }
  }
  _getLogoList() {
    return [
      {
        name: 'BIG IP',
        path: 'BIG IP_logo.svg',
      },
      {
        name: 'BIG Language Solutions',
        path: 'BIG Language Solutions_logo.svg',
      },
      {
        name: 'DWL',
        path: 'DWL_logo.svg',
      },
      {
        name: 'ISI',
        path: 'ISI_logo.svg',
      },
      {
        name: 'Language Link',
        path: 'Language Link_logo.svg',
      },
      {
        name: 'Law Linguists',
        path: 'Law Linguists_logo.svg',
      },
      {
        name: 'Protranslating',
        path: 'Protranslating_logo.svg',
      },
    ];
  }
}

module.exports = LspLogosApi;
