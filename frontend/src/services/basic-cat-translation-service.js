import _ from 'lodash';
import catTranslationResource from '../resources/cat-translation';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Request', type: 'string', prop: 'request', visible: true,
  },
  {
    name: 'Document', type: 'string', prop: 'document', visible: true,
  },
  {
    name: 'Language', type: 'string', prop: 'language', val: (item) => item.language.isoCode, visible: true,
  },
  {
    name: 'Inactive', type: 'boolean', prop: 'deleted', visible: true,
  },
]);

export default class BasicCATTranslationService {
  constructor(resource = catTranslationResource) {
    this.resource = resource;
  }

  get columns() {
    return COLUMNS;
  }

  /**
   * Executes an XHR http request to retrieve the translation object.
   * @param {Object} translation params
   * @param {String} translation.language the translation's language iso code.
   * @param {String} translation.request the translation's request id.
   * @param {String} translation.document the translation's document id.
   * @returns {Promise} resolves to the request's response.
   */
  get(translation) {
    const tr = _.pick(translation, ['request', 'document']);
    tr.language = this._extractLanguage(translation);
    return resourceWrapper(this.resource.get(tr));
  }

  edit(translationData) {
    const params = {
      request: translationData.request,
      document: translationData.document,
    };
    params.language = this._extractLanguage(translationData);
    if (translationData.translation._id) {
      params.translationId = translationData.translation._id;
    }
    const picked = ['translation', 'language', 'request'];
    if (translationData.translation.document) {
      picked.push('document');
    }
    if (translationData.translation.readDate) {
      picked.push('readDate');
    }
    const tr = _.pick(translationData.translation, picked);
    return resourceWrapper(this.resource.update(params, tr));
  }

  _extractLanguage(translation) {
    if (typeof translation.language === 'object') {
      return translation.language.isoCode;
    }
    return translation.language;
  }
}
