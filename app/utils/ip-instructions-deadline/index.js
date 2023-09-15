const _ = require('lodash');

const DEFAULT_DEADLINE = '1 or 2 weeks';
const NODB_WOURD_COUNT_FIELDS = ['specificationWordCount', 'drawingsWordCount'];
const EPO_WORD_COUNT_FIELDS = ['claimsWordCount', 'descriptionWordCount', 'drawingsWordCount'];
const WIPO_WORD_COUNT_FIELDS = ['abstractWordCount', ...EPO_WORD_COUNT_FIELDS];
const entityWordCountFieldsMap = {
  wipo: WIPO_WORD_COUNT_FIELDS,
  nodb: NODB_WOURD_COUNT_FIELDS,
};
const getTranslationFeesTotal = (query) => {
  const { entityName, translationFees, defaultCompanyCurrencyCode } = query;
  const translationFeeFieldName = entityName.includes('epo') ? 'calculatedFee' : 'translationFeeCalculated';
  const totalTranslationFees = translationFees
    .reduce((acc, { [translationFeeFieldName]: translationFee }) => acc + _.get(translationFee, `${defaultCompanyCurrencyCode}`), 0);
  return totalTranslationFees;
};

const getWordCount = (query, countsFields) => Object.values(_.pick(query, countsFields))
  .reduce((acc, curr) => Number(acc) + Number(curr), 0);

const getEpoCountriesTranslationWordCount = (query, translationFeesTotal) => {
  const { hasClaimsTranslationOccurred, claimsTranslationFeesTotal } = query;
  if (hasClaimsTranslationOccurred) {
    if (translationFeesTotal > claimsTranslationFeesTotal) {
      return getWordCount(query, EPO_WORD_COUNT_FIELDS);
    } else if (claimsTranslationFeesTotal > translationFeesTotal) {
      return _.get(query, 'claimsWordCount');
    }
  }
  const translationFees = _.get(query, 'translationFees', []);
  const translationFormulaFieldName = _.get(query, 'translationFormulaField');
  const totalWordCountCountries = translationFees.filter(fee =>
    EPO_WORD_COUNT_FIELDS.every(count =>
      fee[translationFormulaFieldName] && fee[translationFormulaFieldName].includes(count),
    ),
  );
  if (totalWordCountCountries.length > 0) {
    return getWordCount(query, EPO_WORD_COUNT_FIELDS);
  }
  return _.get(query, 'claimsWordCount');
};

const getIpInstructionsDeadline = async (query) => {
  const { entityName, dbSchema } = query;
  const isWipoOrNodbTranslation = ['wipo', 'nodb'].includes(entityName);
  const isEpoClaimsTranslation = entityName === 'epoClaimsTranslation';
  const isEpoCountriesTranslation = entityName === 'epoCountriesTranslation';
  const translationFeesTotal = getTranslationFeesTotal(query);

  if (translationFeesTotal === 0) {
    return DEFAULT_DEADLINE;
  }

  let wordCount;
  if (isWipoOrNodbTranslation) {
    wordCount = getWordCount(query, entityWordCountFieldsMap[entityName]);
  } else if (isEpoClaimsTranslation) {
    wordCount = _.get(query, 'claimsWordCount');
  } else if (isEpoCountriesTranslation) {
    wordCount = getEpoCountriesTranslationWordCount(query, translationFeesTotal);
  }
  const ipInstructionDeadline = await dbSchema.IpInstructionsDeadline.findOne({
    $expr: {
      $and: [
        { $gte: [Number(wordCount), { $toInt: { $arrayElemAt: [{ $split: ['$totalOrClaimsWordCount', ' - '] }, 0] } }] },
        { $lte: [Number(wordCount), { $toInt: { $arrayElemAt: [{ $split: ['$totalOrClaimsWordCount', ' - '] }, 1] } }] },
      ],
    },
  }).lean().exec();
  return _.get(ipInstructionDeadline, 'noticePeriod');
};

module.exports = {
  getIpInstructionsDeadline,
};
