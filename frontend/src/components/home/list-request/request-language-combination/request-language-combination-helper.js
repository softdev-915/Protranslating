import _ from 'lodash';

export const doLanguagesMatch = (listA, listB) => !_.isEmpty(_.intersectionBy(listA, listB, 'isoCode'));

export const getMatchingLanguageCombinations = (languageCombinations, query, options) => {
  const filterMatchingLanguageCombination = (l, index) => {
    const hasSrcLangsFilter = _.has(query, 'srcLangs');
    const hasTgtLangsFilter = _.has(query, 'tgtLangs');
    const { srcLangs: qSrcLangs, tgtLangs: qTgtLangs } = query;
    const { srcLangs: lSrcLangs, tgtLangs: lTgtLangs } = l;
    if (index === query.index) {
      return false;
    }
    const isMatchingBySrcLangs = doLanguagesMatch(lSrcLangs, qSrcLangs);
    const isMatchingByTgtLangs = doLanguagesMatch(lTgtLangs, qTgtLangs);
    const isSameSrcLangsLength = lSrcLangs.length !== qSrcLangs.length;
    const isSameTgtLangsLength = lTgtLangs.length !== qTgtLangs.length;
    if (options.excludeDifferentLanguagesNumber && hasSrcLangsFilter && hasTgtLangsFilter) {
      if ((qSrcLangs.length > 1 && !isSameSrcLangsLength)
      || (qTgtLangs.length > 1 && !isSameTgtLangsLength)) {
        return false;
      }
      return isMatchingBySrcLangs
        && isMatchingByTgtLangs
        && !isSameTgtLangsLength
        && !isSameSrcLangsLength;
    }
    if (options.shouldMatchBoth) {
      return isMatchingBySrcLangs && isMatchingByTgtLangs;
    }
    return (isMatchingBySrcLangs && hasSrcLangsFilter)
      || (isMatchingByTgtLangs && hasTgtLangsFilter);
  };
  return languageCombinations.filter(filterMatchingLanguageCombination);
};
