import Vue from 'vue';
import ppoResource from '../resources/provider-pooling-offer';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';

export default class ProviderOffersService {
  constructor(resource = ppoResource) {
    this.resource = resource;
  }

  get name() {
    return 'provider-offers-service';
  }

  retrieve(providerId) {
    const url = lspAwareUrl(`provider-pooling-offer/provider-offers/${providerId}`);
    return resourceWrapper(Vue.http.get(url));
  }

  acceptOffers(offers, providerId) {
    const url = lspAwareUrl('provider-pooling-offer/accept');
    return resourceWrapper(Vue.http.put(url, { offers, providerId }));
  }

  declineOffers(offers, providerId, decliningReason) {
    const url = lspAwareUrl('provider-pooling-offer/decline');
    return resourceWrapper(Vue.http.put(url, { offers, providerId, decliningReason }));
  }
  undoOffersOperation(offers, providerId, accepted) {
    const url = lspAwareUrl('provider-pooling-offer/undo-operation');
    return resourceWrapper(Vue.http.put(url, { offers, providerId, accepted }));
  }
}
