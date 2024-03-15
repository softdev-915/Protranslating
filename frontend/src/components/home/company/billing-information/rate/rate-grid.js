import {
  isEmpty, get, uniqueId, cloneDeep, filter,
} from 'lodash';
import { mapGetters } from 'vuex';
import moment from 'moment';
import RateGridMixin from '../../../../../mixins/rate/rate-grid-mixin';
import userRoleCheckMixin from '../../../../../mixins/user-role-check';
import RateDetail from './rate-detail.vue';
import areRatesDuplicated from './rate-data-rules-validator';
import BreakdownService from '../../../../../services/breakdown-service';
import TranslationUnitService from '../../../../../services/translation-unit-service';
import CurrencyService from '../../../../../services/currency-service';
import InternalDepartmentService from '../../../../../services/internal-department-service';

const breakdownService = new BreakdownService();
const translationUnitService = new TranslationUnitService();
const currencyService = new CurrencyService();
const internalDepartmentService = new InternalDepartmentService();
const buildInitialState = () => ({
  currencies: [],
  breakdowns: [],
  translationUnits: [],
  internalDepartments: [],
  abilityFilter: '',
  srcLanguageFilter: { isoCode: '', name: '' },
  tgtLanguageFilter: { isoCode: '', name: '' },
  sortOptions: [
    {
      text: 'Ability',
      value: 'ability',
    },
    {
      text: 'Source Language',
      value: 'sourceLanguage',
    },
    {
      text: 'Target Language',
      value: 'targetLanguage',
    },
  ],
  sortOrderOptions: [
    {
      text: 'Ascending',
      value: 'asc',
    },
    {
      text: 'Descending',
      value: 'dsc',
    },
  ],
});

export default {
  name: 'CompanyRateGrid',
  mixins: [RateGridMixin, userRoleCheckMixin],
  components: {
    RateDetail,
  },
  props: {
    value: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  data: () => buildInitialState(),
  created() {
    this.loadTranslationUnits();
    this.loadBreakdowns();
    this.loadCurrencies();
    this.loadInternalDepartments();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    userId() {
      return get(this, 'userLogged._id', '');
    },
    canReadBreakdown() {
      return this.hasRole('BREAKDOWN_READ_ALL');
    },
    canReadTranslationUnit() {
      return this.hasRole('TRANSLATION-UNIT_READ_ALL');
    },
    canReadInternalDepartments() {
      return this.hasRole('INTERNAL-DEPARTMENT_READ_ALL');
    },
    hasDuplicatedRates() {
      return areRatesDuplicated(this.rates);
    },
    filters() {
      const filters = [];
      if (!isEmpty(this.abilityFilter)) {
        filters.push({ name: 'ability', value: this.abilityFilter.name });
      }
      if (!isEmpty(this.srcLanguageFilter)) {
        filters.push({ name: 'sourceLanguage', value: this.srcLanguageFilter.name });
      }
      if (!isEmpty(this.tgtLanguageFilter)) {
        filters.push({ name: 'targetLanguage', value: this.tgtLanguageFilter.name });
      }
      return filters;
    },
  },
  methods: {
    loadBreakdowns() {
      if (this.canReadBreakdown) {
        return breakdownService.retrieve()
          .then((response) => {
            this.breakdowns = get(response, 'data.list', []);
          })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'Breakdown list could not be retrieved',
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          });
      }
    },
    loadTranslationUnits() {
      if (this.canReadTranslationUnit) {
        return translationUnitService.retrieve()
          .then((response) => {
            this.translationUnits = get(response, 'data.list', []);
          })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'Translation unit list could not be retrieved',
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          });
      }
    },
    loadCurrencies() {
      return currencyService.retrieve()
        .then((response) => {
          this.currencies = get(response, 'data.list', []);
          return this.options;
        })
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: 'Currency list could not be retrieved',
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        });
    },
    loadInternalDepartments() {
      if (this.canReadInternalDepartments) {
        return internalDepartmentService.retrieve()
          .then((response) => {
            this.internalDepartments = get(response, 'data.list', []);
            return this.options;
          })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'Internal department list could not be retrieved',
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          });
      }
    },
    addRate() {
      if (this.uncollapsedRate !== '') {
        return;
      }
      const vueKey = uniqueId();
      if (this.uncollapsedRate === '') {
        this.uncollapsedRate = vueKey;
      }
      const newRate = {
        sourceLanguage: {},
        targetLanguage: {},
        ability: {},
        minimumCharge: 0,
        createdAt: moment().toISOString(),
        vueKey,
        rateDetails: [{
          breakdown: {},
          price: 0,
          translationUnit: {},
          currency: {},
          internalDepartment: {},
        }],
      };
      this.rates = [newRate, ...this.value];
    },
    onRateDetailValidation(valid) {
      this.$emit('rates-validation', valid && !this.hasDuplicatedRates);
    },
    pasteRates() {
      if (this.ratesClipboard.length) {
        const newRates = [];
        this.ratesClipboard.forEach((r) => newRates.push(cloneDeep(r)));
        this.rates = [...newRates, ...this.value];
        this.$emit('rates-validation', this.isValid);
      }
    },
    deleteRates() {
      this.rates = filter(this.value, (r) => !this.selectedRates.includes(r));
      this.selectedRates = [];
      this.uncollapsedRate = '';
      this.allRatesSelected = false;
    },
  },
};
