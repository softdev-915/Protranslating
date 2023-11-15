import _ from 'lodash';

export const RATE = { text: 'Rate', value: 'rate' };
export const COMPLETED_AMOUNT = { text: 'No. of Tasks Completed', value: 'completedForThisCompany' };
export const TOTAL_IN_QUEUE = { text: 'Total Tasks in Queue', value: 'tasksInQueue' };
export const FIELDS_TO_COPY_PASTE = ['startDate', 'dueDate', 'roundsNo', 'providersPerRoundNo', 'quantity', 'sortBy', 'isUrgent', 'translationUnitId', 'breakdownId', 'providerTaskInstructions'];

const isoDateRegExp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
const DATE_FIELDS = ['startDate', 'dueDate'];
const NUMBER_FIELDS = ['roundsNo', 'providersPerRoundNo'];
export const isJsonOfferStringValid = (jsonOfferString) => {
  let jsonOffer = {};
  try {
    jsonOffer = JSON.parse(jsonOfferString);
  } catch (__) {
    return false;
  }
  if (FIELDS_TO_COPY_PASTE.some(key => !_.has(jsonOffer, key))) {
    return false;
  }
  return DATE_FIELDS.every(key => isoDateRegExp.test(jsonOffer[key]))
    && NUMBER_FIELDS.every(key => _.isNumber(jsonOffer[key]))
    && !isNaN(jsonOffer.quantity)
    && _.isBoolean(jsonOffer.isUrgent)
    && [RATE.value, COMPLETED_AMOUNT.value, TOTAL_IN_QUEUE.value].includes(jsonOffer.sortBy);
};
