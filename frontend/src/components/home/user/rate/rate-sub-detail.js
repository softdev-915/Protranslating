import _ from 'lodash';
import RateSubDetailMixin from '../../../../mixins/rate/rate-sub-detail-mixin';
import CurrencySelector from '../../../currency-select/currency-selector.vue';
import BreakdownSelector from '../../../breakdown-select/breakdown-selector.vue';
import TranslationUnitSelector from '../../../translation-unit-select/translation-unit-selector.vue';
import { toSelectOptionFormat } from '../../../../utils/select2';

export default {
  mixins: [RateSubDetailMixin],
  components: {
    BreakdownSelector,
    TranslationUnitSelector,
    CurrencySelector,
  },
  created() {
    if (_.get(this.value, 'breakdown._id')) {
      this.selectedBreakdown = toSelectOptionFormat(this.value.breakdown, '_id', 'name');
    }
    if (_.get(this.value, 'currency._id')) {
      this.selectedCurrency = toSelectOptionFormat(this.value.currency, '_id', 'name');
    }
    if (_.get(this.value, 'translationUnit._id')) {
      this.selectedTranslationUnit = toSelectOptionFormat(this.value.translationUnit, '_id', 'name');
    }
    // Not applicable for user rates
    delete this.rateDetailEdit.internalDepartment;
  },
  watch: {
    selectedBreakdown(breakdown) {
      this.onSelectSubDetail('breakdown', breakdown);
    },
    selectedCurrency(currency) {
      this.onSelectSubDetail('currency', currency);
    },
    selectedTranslationUnit(translationUnit) {
      this.onSelectSubDetail('translationUnit', translationUnit);
    },
  },
  methods: {
    onSelectSubDetail(subDetail, { value: _id = '', text: name = '' }) {
      if (!this.isCollapsed) {
        this.$set(this.rateDetailEdit, subDetail, { _id, name });
      }
    },
    formatCurrencySelectOption: ({ isoCode, name, _id = '' }) => ({
      text: isoCode,
      value: { text: isoCode, name, value: _id },
    }),
    formatTranslationUnitSelectOption: ({ name = '', _id = '' }) => ({
      text: name,
      value: { text: name, value: _id },
    }),
  },
};
