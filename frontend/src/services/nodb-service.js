import Vue from 'vue';
import nodbResource from '../resources/nodb';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';

export default class NoDBService {
  constructor(resource = nodbResource) {
    this.resource = resource;
  }

  get name() {
    return 'nodb';
  }

  get(patentNumber) {
    return resourceWrapper(Vue.resource(lspAwareUrl(`nodb/${patentNumber}`)).get());
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  listCountries() {
    return resourceWrapper(Vue.resource(lspAwareUrl('nodb/countries')).get());
  }

  listCurrencies({ database }) {
    return resourceWrapper(
      Vue.resource(lspAwareUrl('nodb/currencies')).get({ database }),
    );
  }

  listDisclaimers() {
    return resourceWrapper(Vue.resource(lspAwareUrl('nodb/disclaimers')).get());
  }

  retrieveTemplate(translationOnly = false) {
    return resourceWrapper(
      Vue.resource(lspAwareUrl('nodb/template')).get({ translationOnly }),
    );
  }

  listInstantQuoteTranslationFee({
    companyId,
    countries,
    specificationWordCount,
    drawingsWordCount,
    numberOfDrawings,
    drawingsPageCount,
  }) {
    return resourceWrapper(
      Vue.resource(lspAwareUrl('nodb/translation-fee')).get({
        companyId,
        countries,
        specificationWordCount,
        drawingsWordCount,
        numberOfDrawings,
        drawingsPageCount,
      }),
    );
  }

  listInstantQuoteTranslationFeeFiling({
    companyId,
    countries,
    specificationWordCount,
    drawingsWordCount,
    numberOfDrawings,
    drawingsPageCount,
    numberOfIndependentClaims,
    totalNumberOfPages,
    applicantsLength,
    numberOfClaims,
    entities,
  }) {
    return resourceWrapper(
      Vue.resource(lspAwareUrl('nodb/translation-fee-filing')).get({
        companyId,
        countries,
        specificationWordCount,
        drawingsWordCount,
        numberOfDrawings,
        drawingsPageCount,
        numberOfIndependentClaims,
        totalNumberOfPages,
        applicantsLength,
        numberOfClaims,
        entities,
      }),
    );
  }

  createRequest(request, translationOnly) {
    const url = lspAwareUrl(`nodb-request?translationOnly=${translationOnly}`);
    return resourceWrapper(Vue.http.post(url, request));
  }
  updateRequest(request, translationOnly) {
    const entityId = request._id;
    const url = lspAwareUrl(`nodb-request/${entityId}?translationOnly=${translationOnly}`);
    return resourceWrapper(Vue.http.put(url, request));
  }
}
