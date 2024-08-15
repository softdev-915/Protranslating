import _ from 'lodash';
import TmStoreMixin from '../../../mixins/tm-store-mixin';

export default {
  mixins: [TmStoreMixin],
  computed: {
    tmName() {
      return _.get(this, 'tmInfo.name', '');
    },
    progressBarText() {
      const companyName = _.get(this, 'company.name', '');
      const srcLang = _.get(this, 'tmInfo.srcLang.name', '');
      const tgtLang = _.get(this, 'tmInfo.tgtLang.name', '');
      const segmentsCount = _.get(this, 'tmInfo.tmInfo.numSegments', 0);
      return `${companyName ? `${companyName} | ` : ''}${srcLang} - ${tgtLang} | Segments: ${segmentsCount} | Words: NA`;
    },
  },
};
