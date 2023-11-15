import Vue from 'vue';
import _ from 'lodash';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';

export default class PortalMTService {
  constructor() {
    this.endpointBuilder = lspAwareUrl;
  }

  getSegmentationRules(companyId) {
    let url = this.endpointBuilder('mt-translator/segmentation-rules-list');
    if (!_.isNil(companyId)) {
      url = this.endpointBuilder(`mt-translator/company/${companyId}/segmentation-rules-list`);
    }
    return resourceWrapper(Vue.http.get(url));
  }

  getSettings() {
    const url = this.endpointBuilder('mt-translator/settings');
    return resourceWrapper(Vue.http.get(url));
  }

  saveSettings(settings) {
    const url = this.endpointBuilder('mt-translator/settings');
    return resourceWrapper(Vue.http.post(url, settings));
  }

  segmentText(params) {
    const { langCode, srId, companyId, text } = params;
    const body = { data: { text, langCode } };
    let url = this.endpointBuilder(`mt-translator/sr/${srId}/segment`);
    if (!_.isNil(companyId)) {
      url = this.endpointBuilder(`mt-translator/company/${companyId}/sr/${srId}/segment`);
    }
    return resourceWrapper(Vue.http.post(url, body));
  }

  translateSegments(params) {
    const { source, sourceLang, targetLang, model } = params;
    const url = this.endpointBuilder('mt-translator/translate-segments');
    const body = {
      source,
      sourceLang,
      targetLang,
      model,
    };
    return resourceWrapper(Vue.http.post(url, body));
  }

  getSuggestions(params) {
    const { source, sourceLang, targetLang, models, prefix } = params;
    const url = this.endpointBuilder('mt-translator/translate-suggestions');
    const body = {
      source,
      prefix,
      sourceLang,
      targetLang,
      models,
    };
    return resourceWrapper(Vue.http.post(url, body), false);
  }
}
