import { get, isEmpty } from 'lodash';

export const transformRate = (rate) => {
  if (!rate) return null;
  if (!get(rate, 'targetLanguage.name')) {
    delete rate.targetLanguage;
  }
  if (!get(rate, 'sourceLanguage.name')) {
    delete rate.sourceLanguage;
  }
  if (!get(rate, 'internalDepartment._id')) {
    delete rate.internalDepartment;
  }
  if (!get(rate, 'competenceLevel._id')) {
    delete rate.competenceLevel;
  }
  if (!get(rate, 'company._id')) {
    delete rate.company;
  }
  if (isEmpty(rate.catTool)) {
    delete rate.catTool;
  }
  rate.rateDetails.forEach((rateDetail) => {
    if (!get(rateDetail, 'translationUnit._id')) {
      delete rateDetail.translationUnit;
    }
    if (!get(rateDetail, 'breakdown._id')) {
      delete rateDetail.breakdown;
    }
    if (!get(rateDetail, 'currency._id')) {
      delete rateDetail.currency;
    }
  });
  return rate;
};
