import { mapGetters, mapActions } from 'vuex';
import moment from 'moment';
import {
  isNil, isEmpty, uniqueId, get, find, cloneDeep, uniq,
} from 'lodash';
import RateGridMixin from '../../../../mixins/rate/rate-grid-mixin';
import RateDetail from './rate-detail.vue';
import UserService from '../../../../services/user-service';
import CurrencyService from '../../../../services/currency-service';
import ConfirmDialog from '../../../form/confirm-dialog.vue';
import { transformRate } from './helpers';

const userService = new UserService();
const currencyService = new CurrencyService();
const buildInitialState = () => ({
  areValidRates: false,
  uncollapsedRate: '',
  abilityFilter: '',
  srcLanguageFilter: { isoCode: '', name: '' },
  tgtLanguageFilter: { isoCode: '', name: '' },
  catToolFilter: '',
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
    {
      text: 'Internal Department',
      value: 'internalDepartment',
    },
    {
      text: 'Tool',
      value: 'catTool',
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
  value: [],
});

export default {
  name: 'UserRateGrid',
  mixins: [RateGridMixin],
  components: {
    RateDetail,
    ConfirmDialog,
  },
  data: () => buildInitialState(),
  props: {
    userId: {
      type: String,
      default: '',
    },
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
  created() {
    this.getVendorRates();
    currencyService.get().then((response) => {
      this.currencyList = get(response, 'data.list', []);
    });
  },
  computed: {
    ...mapGetters('app', ['lsp']),
    entityValidationErrors() {
      return [];
    },
    hasDuplicatedRates() {
      return !isEmpty(this.duplicateRates);
    },
    isValid() {
      return !this.hasDuplicatedRates;
    },
    filters() {
      const filters = [];
      if (!isEmpty(this.abilityFilter)) {
        filters.push({ name: 'ability', value: this.abilityFilter.name });
      }
      if (!isEmpty(this.srcLanguageFilter.isoCode)) {
        filters.push({ name: 'sourceLanguage', value: this.srcLanguageFilter.name });
      }
      if (!isEmpty(this.tgtLanguageFilter.isoCode)) {
        filters.push({ name: 'targetLanguage', value: this.tgtLanguageFilter.name });
      }
      if (!isEmpty(this.catToolFilter)) {
        filters.push({ name: 'catTool', value: this.catToolFilter });
      }
      return filters;
    },
    toolFilterOptions() {
      const tools = this.value.map((r) => get(r, 'catTool')).filter((a) => a);
      return ['Empty', ...uniq(tools)];
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onRateDetailValidation(areValidRateDetails) {
      this.areValidRates = this.isValid && areValidRateDetails && !this.hasDuplicatedRates;
    },
    addRate() {
      if (this.uncollapsedRate.length > 0) return;
      const vueKey = uniqueId(new Date().getTime());
      this.uncollapsedRate = vueKey;
      const localCurrency = find(this.currencyList, (c) => c._id === get(this, 'lsp.currencyExchangeDetails.0.base', ''));
      const newRate = {
        ability: {
          text: '',
          value: '',
        },
        sourceLanguage: {
          text: '',
          value: '',
        },
        targetLanguage: {
          text: '',
          value: '',
        },
        internalDepartment: {
          text: '',
          value: '',
        },
        catTool: '',
        company: {
          text: '',
          value: '',
        },
        createdAt: moment().toISOString(),
        vueKey,
        minimumCharge: 0,
        rateDetails: [{
          key: uniqueId(),
          breakdown: {
            text: '',
            value: '',
          },
          price: 0,
          translationUnit: {
            text: '',
            value: '',
          },
          currency: {
            text: get(localCurrency, 'isoCode', ''),
            value: get(localCurrency, '_id', ''),
          },
        }],
      };
      this.rates = [newRate, ...this.rates];
    },
    async pasteRates() {
      if (!isEmpty(this.ratesClipboard)) {
        const newRates = [];
        this.ratesClipboard.forEach((r) => newRates.push(cloneDeep(r)));
        try {
          await userService.pasteVendorRates(this.userId, newRates.map(transformRate));
          this.getVendorRates().then(() => {
            this.selectedRates = [];
            this.onCollapseActiveRate();
          });
        } catch (error) {
          this.pushNotification({
            title: 'Error',
            message: 'Rates cannot be pasted',
            state: 'danger',
            response: error,
          });
        }
      }
    },
    async deleteRates() {
      if (isEmpty(this.selectedRates) || isNil(this.$refs.deleteRatesDialog)) {
        this.selectedRates = [];
        this.onCollapseActiveRate();
        return;
      }
      this.$refs.deleteRatesDialog.show({});
    },
    manageVendorMinimumCharge() {
      this.$emit('vendor-minimum-charge-manage');
    },
  },
};
