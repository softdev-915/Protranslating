import RateSubDetailMixin from '../../../../../mixins/rate/rate-sub-detail-mixin';
import BreakdownSelector from '../../../../breakdown-select/breakdown-selector.vue';
import TranslationUnitSelector from '../../../../translation-unit-select/translation-unit-selector.vue';
import CurrencySelector from '../../../../currency-select/currency-selector.vue';
import InternalDepartmentSelector from '../../../../internal-department-select/internal-department-selector.vue';

const defaultArrayType = {
  type: Array,
  default: () => [],
};
export default {
  mixins: [RateSubDetailMixin],
  props: {
    currencies: defaultArrayType,
    breakdowns: defaultArrayType,
    translationUnits: defaultArrayType,
    internalDepartments: defaultArrayType,
  },
  components: {
    BreakdownSelector,
    TranslationUnitSelector,
    CurrencySelector,
    InternalDepartmentSelector,
  },
  watch: {
    selectedCurrency(newValue) {
      this.rateDetailEdit.currency = newValue || '';
    },
    selectedBreakdown(newValue) {
      if (typeof newValue === 'string' && newValue !== '') {
        this.rateDetailEdit.breakdown = newValue;
      } else {
        this.rateDetailEdit.breakdown = null;
      }
    },
    selectedInternalDepartment(newValue) {
      this.rateDetailEdit.internalDepartment = newValue || undefined;
    },
    selectedTranslationUnit(newValue) {
      if (typeof newValue === 'string' && newValue !== '') {
        this.rateDetailEdit.translationUnit = newValue;
      } else {
        this.rateDetailEdit.translationUnit = null;
      }
    },
  },
  computed: {
    selectedTranslationUnitName() {
      const translationUnit = this.translationUnits.find((t) => t._id
        === this.selectedTranslationUnit);
      return this._.get(translationUnit, 'name', '');
    },
    selectedCurrencyIsoCode() {
      const currency = this.currencies.find((t) => t._id === this.selectedCurrency);
      return this._.get(currency, 'isoCode', '');
    },
    selectedBreakdownName() {
      const breakdown = this.breakdowns.find((t) => t._id === this.selectedBreakdown);
      return this._.get(breakdown, 'name', '');
    },
    selectedInternalDepartmentName() {
      const internalDepartment = this.internalDepartments.find((t) => t._id
        === this.selectedInternalDepartment);
      return this._.get(internalDepartment, 'name', '');
    },
  },
  methods: {
    formatBreakdownSelectOption: ({ name = '', _id = '' }) => ({ text: name, value: _id }),
    formatCurrencySelectOption: ({ isoCode, _id }) => ({
      text: isoCode,
      value: _id,
    }),
  },
};
