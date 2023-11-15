import _ from 'lodash';
import { numberToCurrency } from './number';

export const formatFee = (fee, { data: { root } }) => {
  const feeValue = fee[root.quoteCurrency.isoCode];
  const value = (+feeValue).toFixed(2);
  return `${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ${root.quoteCurrency.isoCode}`;
};

export const customQuote = (request, requestCurrencySymbol, customeFee) => {
  if (request.status === 'Waiting for Quote') {
    return 'Our team is working on your customized quote';
  }
  if (!_.isNil(customeFee)) {
    return `${requestCurrencySymbol} ${numberToCurrency(customeFee, 2)}`;
  }
  return `${requestCurrencySymbol} 0.00`;
};

export const itemDescription = (entry) => {
  const customContent = [];
  if (entry.requestNo) {
    customContent.push(entry.requestNo);
  }
  if (entry.purchaseOrder) {
    customContent.push(entry.purchaseOrder);
  }
  if (entry.taskName) {
    customContent.push(entry.taskName);
  }
  return customContent.join(' - ');
};
