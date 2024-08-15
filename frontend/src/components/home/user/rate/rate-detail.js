import _ from 'lodash';
import RateSubDetail from './rate-sub-detail.vue';
import RateDetailMixin from '../../../../mixins/rate/rate-detail-mixin';
import AbilitySelector from '../../../ability-select/ability-selector.vue';
import LanguageSelector from '../../../language-select/language-select.vue';
import CompanyAjaxBasicSelect from '../../company/company-ajax-basic-select.vue';
import CatToolSelect from '../../../cat-tool-select/cat-tool-select.vue';
import CompetenceLevelBasicSelector from '../../../competence-level-basic-select/competence-level-basic-selector.vue';
import InternalDepartmentSelector from '../../../internal-department-select/internal-department-selector.vue';

import { toSelectOptionFormat } from '../../../../utils/select2';

const buildInitialState = () => ({
  selectedInternalDepartment: {
    text: '',
    value: '',
  },
  selectedCompany: {
    text: '',
    value: '',
  },
  selectedCatTool: '',
  rate: {
    sourceLanguage: {
      _id: '',
      isoCode: '',
      name: '',
    },
    targetLanguage: {
      _id: '',
      isoCode: '',
      name: '',
    },
    internalDepartment: {
      _id: '',
      name: '',
    },
    catTool: '',
    company: {
      _id: '',
      name: '',
    },
    ability: {
      _id: '',
      name: '',
    },
    rateDetails: [{
      key: _.uniqueId(new Date().getTime()),
      breakdown: {
        name: '',
      },
      currency: {
        name: '',
      },
      translationUnit: {
        name: '',
      },
    }],
  },
});

export default {
  mixins: [RateDetailMixin],
  components: {
    CatToolSelect,
    CompanyAjaxBasicSelect,
    CompetenceLevelBasicSelector,
    InternalDepartmentSelector,
    LanguageSelector,
    AbilitySelector,
    RateSubDetail,
  },
  props: {
    userAbilities: {
      type: Array,
    },
    userInternalDepartments: {
      type: Array,
    },
    userCatTools: {
      type: Array,
    },
    userLanguageCombinations: {
      type: Array,
    },
  },
  data() {
    return buildInitialState();
  },
  created() {
    const internalDepartment = _.get(this.value, 'internalDepartment');
    const company = _.get(this.value, 'company');
    if (internalDepartment) {
      this.selectedInternalDepartment = internalDepartment;
    }
    if (company) {
      this.selectedCompany = toSelectOptionFormat(company, '_id', 'name');
    }
    this.selectedCatTool = _.get(this.value, 'catTool', '');
    let rateDetails = _.get(this.rate, 'rateDetails');
    if (_.isEmpty(rateDetails)) {
      this.rate.rateDetails = [{
        key: _.uniqueId(new Date().getTime()),
        breakdown: {
          name: '',
        },
        currency: {
          name: '',
        },
        translationUnit: {
          name: '',
        },
      }];
    } else {
      rateDetails = rateDetails.map((rd) => {
        rd.key = _.uniqueId(new Date().getTime());
        return rd;
      });
    }
  },
  watch: {
    isValid(valid) {
      this.$emit('rate-detail-validation', valid);
    },
    selectedCatTool(newValue) {
      if (this.isCollapsed) return;
      this.$set(this.rate, 'catTool', newValue || '');
    },
    selectedInternalDepartment(newValue) {
      if (this.isCollapsed) return;
      this.$set(this.rate, 'internalDepartment', newValue || null);
    },
    selectedCompany(newValue) {
      if (this.isCollapsed) return;
      const company = newValue.value ? { _id: newValue.value, name: newValue.text } : null;
      this.$set(this.rate, 'company', company);
    },
  },
  computed: {
    isCompanyRequired() {
      return _.get(this.fullAbility, 'companyRequired', false);
    },
    isValidTool() {
      if (!this.isToolRequired) return true;
      if (this.selectedCatTool) return true;
      return false;
    },
    isValidInternalDepartment() {
      if (!this.isInternalDepartmentRequired) return true;
      if (!_.isEmpty(_.get(this.selectedInternalDepartment, 'name', ''))) return true;
      return false;
    },
    isValid() {
      return this.isValidLanguage
        && this.isValidAbility
        && !this.hasDetailsErrors;
    },
    isValidCompany() {
      if (!this.isCompanyRequired) return true;
      if (this.selectedCompany.value) return true;
      return false;
    },
    userLanguages() {
      const languages = {
        source: [],
        target: [],
      };
      _.forEach(this.userLanguageCombinations, (languageCombination) => {
        const [srcLng, tgtLng] = _.split(languageCombination.text, ' - ');
        languages.source.push(srcLng);
        languages.target.push(tgtLng);
      });
      return languages;
    },
    isDraft() {
      return _.get(this.value, 'isDrafted', false) === true;
    },
    internalDepartmentReadOnly() {
      return _.get(this.selectedInternalDepartment, 'name', '');
    },
    companyReadOnly() {
      return _.get(this.selectedCompany, 'text', '');
    },
  },
  methods: {
    internalDepartmentFilterOption(internalDepartment) {
      return this.userInternalDepartments.find(
        (userInternalDepartment) => _.get(userInternalDepartment, '_id', userInternalDepartment) === internalDepartment._id,
      );
    },
    sourceLanguageFilterOption(language) {
      return this.userLanguages.source.includes(language.name);
    },
    targetLanguageFilterOption(language) {
      return this.userLanguages.target.includes(language.name);
    },
    onCompanySelected(newCompany) {
      this.selectedCompany = {
        text: _.get(newCompany, 'text'),
        value: _.get(newCompany, 'value'),
      };
    },
    formatInternalDepartmentSelectOption: ({ name = '', _id = '' }) => ({
      text: name,
      value: { name, _id },
    }),
    abilityFilter(ability) {
      return _.findIndex(
        this.userAbilities,
        (userAbility) => userAbility.value === ability.name,
      ) > -1;
    },
    catToolFilter(catTool) {
      return _.findIndex(
        this.userCatTools,
        (userCatTool) => userCatTool === catTool.name,
      ) > -1;
    },
    saveRate() {
      this.$emit('on-rate-saving', this.rate);
    },
    cancelRate() {
      this.$emit('on-rate-drafting', this.rate);
    },
  },
};
