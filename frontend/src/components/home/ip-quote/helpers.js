import isEmpty from 'lodash/isEmpty';

export const LANG_ISO_CODES_CONVERSION = {
  EN: 'ENG',
  FR: 'FRE',
  DE: 'GER',
  KO: 'KOR',
  AR: 'ARA',
  ES: 'SPA',
  JA: 'JPN',
  RU: 'RUS',
  ZH: 'ZHO',
  PT: 'POR',
};

export const extendLanguageCombinations =
  ({ languages, otherLanguages = [], languageCombinations, patentSrcLang }) => {
    otherLanguages.forEach((lang) => {
      const tgtIsoCode = LANG_ISO_CODES_CONVERSION[lang.isoCode];
      const tgtLang = languages.find(l => l.isoCode === tgtIsoCode);
      if (isEmpty(languageCombinations)) {
        languageCombinations.push({
          srcLangs: [patentSrcLang],
          tgtLangs: [tgtLang],
        });
        return;
      }
      if (languageCombinations[0].tgtLangs.some(tl => tl._id === tgtLang._id)) return;
      languageCombinations[0].tgtLangs.push(tgtLang);
    });
  };
