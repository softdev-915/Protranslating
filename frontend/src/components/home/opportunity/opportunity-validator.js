import _ from 'lodash';
import moment from 'moment';

const LOST_STATUS = 'Lost';
const _validateOpportunity = (opportunity, errors) => {
  if (_.isEmpty(opportunity.status)) {
    errors.push({ message: 'Status is mandatory', props: { 'opportunity.status': { val: opportunity.status } } });
  }
  if (_.isEmpty(opportunity.lostReason) && opportunity.status === LOST_STATUS) {
    errors.push({ message: 'Lost reason is mandatory', props: { 'opportunity.lostReason': { val: opportunity.lostReason } } });
  }
  if (opportunity.title === '') {
    errors.push({ message: 'Title is mandatory', props: { 'opportunity.title': { val: opportunity.title } } });
  }
  if (opportunity.estimatedValue === 0.00) {
    errors.push({ message: 'Estimated value is mandatory', props: { 'opportunity.estimatedValue': { val: opportunity.estimatedValue } } });
  }
  if (!opportunity.srcLang) {
    errors.push({ message: 'Source language is mandatory', props: { 'opportunity.srcLang': { val: opportunity.srcLang } } });
  }
  if (!opportunity.company) {
    errors.push({ message: 'Company is mandatory', props: { 'opportunity.company': { val: opportunity.company } } });
  }
  if (!opportunity.contact) {
    errors.push({ message: 'Contact is mandatory', props: { 'opportunity.contact': { val: opportunity.contact } } });
  }
  if (_.isEmpty(opportunity.tgtLangs)) {
    errors.push({ message: 'Target languages are mandatory', props: { 'opportunity.tgtLangs': { val: opportunity.tgtLangs } } });
  }
  if (!opportunity.probability) {
    errors.push({ message: 'Probability is mandatory', props: { 'opportunity.probability': { val: opportunity.probability } } });
  }
  if (!opportunity.expectedCloseDate) {
    errors.push({ message: 'Expected close date is mandatory', props: { 'opportunity.expectedCloseDate': { val: opportunity.expectedCloseDate } } });
  } else {
    const momentDate = moment(opportunity.expectedCloseDate);
    if (momentDate.isBefore(moment())) {
      errors.push({
        message: 'Expected close date must be greater or equal to current date',
        props: { 'opportunity.expectedCloseDate': { val: opportunity.expectedCloseDate } },
      });
    }
  }
};

export const findOpportunityValidationError = function (opportunity) {
  const errors = [];
  _validateOpportunity(opportunity, errors);
  return errors;
};
