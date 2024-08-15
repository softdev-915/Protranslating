import LanguageSelector from '../../../../language-select/language-select.vue';
import AbilitySelector from '../../../../ability-select/ability-selector.vue';
import RateDetailMixin from '../../../../../mixins/rate/rate-detail-mixin';
import RateSubDetail from './rate-sub-detail.vue';

const defaultArrayType = {
  type: Array,
  default: () => [],
};
export default {
  mixins: [RateDetailMixin],
  props: {
    currencies: defaultArrayType,
    breakdowns: defaultArrayType,
    translationUnits: defaultArrayType,
    internalDepartments: defaultArrayType,
  },
  components: {
    RateSubDetail,
    AbilitySelector,
    LanguageSelector,
  },
};
