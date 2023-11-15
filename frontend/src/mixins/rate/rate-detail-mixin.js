import _ from 'lodash';
import UrlBasedBreadcrumb from '../../components/home/url-based-breadcrumb/url-based-breadcrumb.vue';

const buildInitialState = () => ({
  isCollapsed: true,
  rateSelected: false,
  isValidRateSubDetail: false,
  selectedSourceLanguage: {
    _id: '',
    name: '',
  },
  selectedTargetLanguage: {
    _id: '',
    name: '',
  },
  ability: {
    name: '',
    languageCombination: false,
    competenceLevelRequired: false,
    companyRequired: false,
    internalDepartmentRequired: false,
    catTool: false,
  },
  selectedAbility: {
    text: '',
    value: '',
  },
  rate: {
    _id: '',
    sourceLanguage: {
      _id: '',
      name: '',
      isoCode: '',
    },
    targetLanguage: {
      _id: '',
      name: '',
      isoCode: '',
    },
    ability: {
      _id: '',
      name: '',
    },
    rateDetails: [],
  },
  hasDetailsErrors: false,
});

export default {
  components: {
    UrlBasedBreadcrumb,
  },
  props: {
    uncollapsedRate: String,
    canEdit: Boolean,
    selected: Boolean,
    rateIndex: Number,
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    value: {
      type: Object,
      required: true,
    },
    abilities: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return buildInitialState();
  },
  created() {
    this._ = _;
    this.rate = this.value;
    if (_.isEmpty(this.rate._id)) {
      this.isCollapsed = false;
    }
    this.rateSelected = this.selected;
    if (_.get(this, 'value.sourceLanguage')) {
      this.selectedSourceLanguage = this.value.sourceLanguage;
    }
    if (_.get(this, 'value.targetLanguage')) {
      this.selectedTargetLanguage = this.value.targetLanguage;
    }
    if (_.get(this, 'value.ability')) {
      this.selectedAbility = this.value.ability;
    }
    this.$emit('rate-detail-validation', this.isValid);
  },
  watch: {
    uncollapsedRate(key) {
      if (!this.canEdit) return;
      if (key === '') {
        this.isCollapsed = true;
      } else if (this.rate.vueKey !== key) {
        this.isCollapsed = true;
      }
    },
    rate: {
      handler: function (newValue) {
        if (this.isCollapsed) return;
        this.$emit('input', newValue);
        this.hasDetailsErrors = this.rate.rateDetails.some((rateDetail) => {
          const unit = _.get(rateDetail, 'translationUnit._id', _.get(rateDetail, 'translationUnit'));
          const currency = _.get(rateDetail, 'currency._id', _.get(rateDetail, 'currency'));
          return (_.isNil(unit) || _.isNil(currency)) || (_.isEmpty(unit) || _.isEmpty(currency));
        });
        this.$emit('rate-detail-validation', this.isValid);
        this.$emit('rate-has-changed', { rate: newValue, isValid: this.isValid });
      },
      immediate: true,
      deep: true,
    },
    value(newValue) {
      this.rate = newValue;
      this.$emit('rate-detail-validation', this.isValid);
    },
    selected(selected) {
      this.rateSelected = selected;
    },
    rateSelected(newValue) {
      if (this.selected !== newValue) {
        this.$emit('select-rate', this.rate);
      }
    },
    selectedSourceLanguage(newValue) {
      if (!this.isCollapsed) {
        this.$set(this.rate, 'sourceLanguage', newValue || { isoCode: '', name: '' });
      }
    },
    selectedTargetLanguage(newValue) {
      if (!this.isCollapsed) {
        this.$set(this.rate, 'targetLanguage', newValue || { isoCode: '', name: '' });
      }
    },
    selectedAbility(newValue) {
      if (!this.isCollapsed) {
        this.$set(this.rate, 'ability', newValue || { _id: '', name: '' });
      }
    },
    isValid(isRateValid) {
      this.$emit('rate-detail-validation', isRateValid);
    },
  },
  computed: {
    isInternalDepartmentRequired() {
      return _.get(this.fullAbility, 'internalDepartmentRequired', false);
    },
    isToolRequired() {
      return _.get(this.fullAbility, 'catTool', false);
    },
    fullAbility() {
      const selectedAbility = _.get(this.selectedAbility, 'name', this.selectedAbility);
      return this.abilities.find((a) => a.name === selectedAbility);
    },
    isValidAbility() {
      const fullAbilityId = _.get(this.fullAbility, '_id');
      return !_.isNil(fullAbilityId);
    },
    isLanguageCombinationRequired() {
      return _.get(this.fullAbility, 'languageCombination', false);
    },
    isValidLanguage() {
      if (this.isLanguageCombinationRequired) {
        if (_.isEmpty(this.selectedSourceLanguage.isoCode)
          || _.isEmpty(this.selectedTargetLanguage.isoCode)) {
          return false;
        }
      }
      return true;
    },
    isValid() {
      return this.isValidLanguage
        && this.isValidAbility
        && !this.hasDetailsErrors
        && this.isValidRateSubDetail;
    },
    abilityReadOnly() {
      if (_.isString(this.selectedAbility)) return this.selectedAbility;
      return _.get(this.selectedAbility, 'name', '');
    },
    sourceLanguageReadOnly() {
      return _.get(this.selectedSourceLanguage, 'name', '');
    },
    targetLanguageReadOnly() {
      return _.get(this.selectedTargetLanguage, 'name', '');
    },
  },
  methods: {
    // Added rate should contain some of the field values from the current row
    onAddRateDetail(index) {
      if (this.rate.rateDetails[index]) {
        const rateToAdd = { key: _.uniqueId(new Date().getTime()), ..._.omit(this.rate.rateDetails[index], 'key') };
        rateToAdd.breakdown = null;
        rateToAdd.price = 0;
        this.rate.rateDetails.splice(index + 1, 0, rateToAdd);
      }
    },
    onDeleteRateDetail(rateDetailIndex) {
      if (rateDetailIndex > 0 || this.rate.rateDetails.length > 1) {
        this.rate.rateDetails.splice(rateDetailIndex, 1);
      }
    },
    toggleCollapse() {
      if (!this.canEdit) return;
      if (this.isCollapsed) {
        this.isCollapsed = !this.isCollapsed;
        this.$emit('collapse-all-rates', this.rate.vueKey);
      }
    },
    onRateSubDetailValidation(isValidRateSubDetail) {
      this.isValidRateSubDetail = isValidRateSubDetail;
    },
  },
};
