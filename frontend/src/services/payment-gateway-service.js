// import _ from 'lodash';
// import Vue from 'vue';
// import companyResource from '../resources/company';
import resourceWrapper from './resource-wrapper';
import paymentGatewayResource from '../resources/payment-gateway';

export default class CompanyService {
  constructor(resource = paymentGatewayResource) {
    this.resource = resource;
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }
}
