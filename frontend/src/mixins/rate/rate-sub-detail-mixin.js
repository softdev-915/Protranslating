import _ from 'lodash';
import UrlBasedBreadcrumb from '../../components/home/url-based-breadcrumb/url-based-breadcrumb.vue';

const TRANSLATION_UNIT_WORDS_TYPE = 'Words';
const buildInitialState = () => ({
  selectedBreakdown: {
    text: '',
    value: '',
  },
  selectedTranslationUnit: {
    text: '',
    value: '',
  },
  selectedCurrency: {
    text: '',
    value: '',
  },
  selectedInternalDepartment: {
    text: '',
    value: '',
  },
  rateDetailEdit: {
    price: 0,
    breakdown: '',
    translationUnit: '',
    currency: '',
    internalDepartment: '',
  },
});

export default {
  components: {
    UrlBasedBreadcrumb,
  },
  props: {
    isCollapsed: {
      type: Boolean,
      default: true,
    },
    value: {
      type: Object,
      required: true,
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
    ability: {
      type: Object,
    },
    rateDetailIndex: Number,
    isDuplicate: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return buildInitialState();
  },
  watch: {
    rateDetailEdit(newValue) {
      if (!this.isCollapsed) {
        this.$emit('input', newValue);
      }
    },
    value(newValue) {
      this.rateDetailEdit = newValue;
      this.$emit('rate-sub-detail-validation', this.isValid);
    },
    isValid(valid) {
      this.$emit('rate-sub-detail-validation', valid);
    },
  },
  created() {
    this._ = _;
    this.selectedBreakdown = _.defaultTo(this.value.breakdown, '');
    this.selectedCurrency = _.defaultTo(this.value.currency, '');
    this.selectedInternalDepartment = _.defaultTo(this.value.internalDepartment, '');
    this.selectedTranslationUnit = _.defaultTo(this.value.translationUnit, '');
    this.rateDetailEdit = this.value;
  },
  computed: {
    isInternalDepartmentRequired() {
      return _.get(this.ability, 'internalDepartmentRequired', false);
    },
    translationUnitFilter() {
      if (_.get(this, 'selectedBreakdown.value')) {
        return TRANSLATION_UNIT_WORDS_TYPE;
      }
      return null;
    },
    isValidInternalDepartment() {
      if (this.isInternalDepartmentRequired && _.isEmpty(this.selectedInternalDepartment)) {
        return false;
      }
      return true;
    },
    isValidTranslationUnit() {
      if (_.isObject(this.selectedTranslationUnit)) {
        return !_.isEmpty(_.get(this.selectedTranslationUnit, 'value', ''));
      }
      return !_.isEmpty(this.selectedTranslationUnit);
    },
    isValidCurrency() {
      if (_.isObject(this.selectedCurrency)) {
        return !_.isEmpty(_.get(this.selectedCurrency, 'value', ''));
      }
      return !_.isEmpty(this.selectedCurrency);
    },
    isValid() {
      return this.isValidTranslationUnit && this.isValidCurrency;
    },
    breakdownUnitPriceDisabled() {
      return !this.canEdit;
    },
  },
  methods: {
    addRateDetail() {
      this.$emit('add-rate-detail', this.rateDetailIndex);
    },
    deleteRateDetail() {
      this.$emit('delete-rate-detail', this.rateDetailIndex);
    },
  },
};

