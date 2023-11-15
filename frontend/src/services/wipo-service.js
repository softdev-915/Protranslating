import Vue from 'vue';
import wipoResource from '../resources/wipo';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';

export default class WIPOService {
  constructor(resource = wipoResource) {
    this.resource = resource;
  }

  get name() {
    return 'wipo';
  }

  get({ pctReference, patentPublicationNumber }) {
    if (pctReference) {
      return resourceWrapper(this.resource.get({ pctReference }));
    }
    if (patentPublicationNumber) {
      return resourceWrapper(this.resource.get({ patentPublicationNumber }));
    }
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  listCountries() {
    return resourceWrapper(Vue.resource(lspAwareUrl('wipo/countries')).get());
  }

  listInstantQuoteTranslationFee(translationFeePayload) {
    return resourceWrapper(
      Vue.resource(lspAwareUrl('wipo/translation-fee')).get(translationFeePayload),
    );
  }

  listCurrencies() {
    return resourceWrapper(
      Vue.resource(lspAwareUrl('wipo/currencies')).get(),
    );
  }

  listDisclaimers() {
    return resourceWrapper(Vue.resource(lspAwareUrl('wipo/disclaimers')).get());
  }

  createRequest(request, translationOnly) {
    const url = lspAwareUrl(`wipo-request?translationOnly=${translationOnly}`);
    return resourceWrapper(Vue.http.post(url, request));
  }

  updateRequest(request, translationOnly = false) {
    const url = lspAwareUrl(`wipo-request/${request._id}?translationOnly=${translationOnly}`);
    return resourceWrapper(Vue.http.put(url, request));
  }

  retrieveTemplate(translationOnly = false) {
    return resourceWrapper(
      Vue.resource(lspAwareUrl('wipo-template')).get({ translationOnly }),
    );
  }
}
