import Vue from 'vue';
import epoResource from '../resources/epo';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';

export default class EPOService {
  constructor(resource = epoResource) {
    this.resource = resource;
  }

  get name() {
    return 'epo';
  }

  get(patentNumber) {
    return resourceWrapper(Vue.resource(lspAwareUrl(`epo?epoPatentNumber=${patentNumber}`)).get());
  }

  createRequest(request, translationOnly) {
    const url = lspAwareUrl(`epo/request?translationOnly=${translationOnly}`);
    return resourceWrapper(Vue.http.post(url, request));
  }
  updateRequest(request, translationOnly) {
    const url = lspAwareUrl(`epo/${request._id}?translationOnly=${translationOnly}`);
    return resourceWrapper(Vue.http.put(url, request));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  listCountries() {
    return resourceWrapper(Vue.resource(lspAwareUrl('epo/countries')).get());
  }

  listCurrencies() {
    return resourceWrapper(
      Vue.resource(lspAwareUrl('epo/currencies')).get(),
    );
  }

  retrieveTemplate(translationOnly = false) {
    return resourceWrapper(
      Vue.resource(lspAwareUrl('epo/template')).get({ translationOnly }),
    );
  }

  listTranslationFee({
    epoId,
    countries,
    descriptionWordCount,
    claimWordCount,
    drawingsWordCount,
    drawingsPageCount,
    descriptionPageCount,
    claimsPageCount,
    numberOfClaims,
    applicantCount,
    translationOnly,
    hasClaimsTranslationOccurred,
    claimsTranslationFeesTotal,
  }) {
    return resourceWrapper(
      Vue.resource(lspAwareUrl('epo/translation-fee')).get({
        epoId,
        countries,
        descriptionWordCount,
        claimWordCount,
        drawingsWordCount,
        drawingsPageCount,
        descriptionPageCount,
        claimsPageCount,
        translationOnly,
        applicantCount,
        numberOfClaims,
        hasClaimsTranslationOccurred,
        claimsTranslationFeesTotal,
      }),
    );
  }

  listClaimsTranslationFees({
    epoId,
    claimsWordCount,
    otherLanguages,
  }) {
    return resourceWrapper(
      Vue.resource(lspAwareUrl('epo/claims-translation-fee')).get({
        epoId,
        claimsWordCount,
        otherLanguages,
      }),
    );
  }

  listDisclaimers({ countries, translationOnly }) {
    return resourceWrapper(
      Vue.resource(lspAwareUrl('epo/disclaimer')).get({ countries, translationOnly }),
    );
  }
}
