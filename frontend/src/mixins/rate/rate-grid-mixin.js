import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import UrlBasedBreadcrumb from '../../components/home/url-based-breadcrumb/url-based-breadcrumb.vue';
import AbilitySelector from '../../components/ability-select/ability-selector.vue';
import CompetenceLevelBasicSelector from '../../components/competence-level-basic-select/competence-level-basic-selector.vue';
import LanguageSelector from '../../components/language-select/language-select.vue';
import InternalDepartmentSelector from '../../components/internal-department-select/internal-department-selector.vue';
import CatToolSelect from '../../components/cat-tool-select/cat-tool-select.vue';
import UserService from '../../services/user-service';
import { transformRate } from '../../components/home/user/rate/helpers';
import { successNotification } from '../../utils/notifications';

const userService = new UserService();
const RATES_PER_PAGE = 10;
const START_PAGE_INDEX = 1;
const buildInitialState = () => ({
  uncollapsedRate: '',
  loading: false,
  filtersExpanded: false,
  ratesExpanded: false,
  ratesPerPage: RATES_PER_PAGE,
  currentPageIndex: START_PAGE_INDEX,
  selectedRates: [],
  allRatesSelected: false,
  sort: {
    key: {
      text: '',
      value: '',
    },
    order: {
      text: 'Descending',
      value: 'dsc',
    },
  },
  duplicateRates: [],
});
const applyFilter = (prop, value) => {
  if (value === 'Empty' && _.isNil(prop)) return true;
  if (_.isObject(prop)) {
    return value === (prop.name || prop.text);
  }
  return prop === value;
};
const applySort = (rates, key = 'createdAt', order = 'dsc') => {
  rates = _.sortBy(rates, (r) => {
    if (_.isObject(r[key])) {
      return r[key].name || r[key].text;
    }
    return r[key];
  });
  return order === 'dsc' ? rates.reverse() : rates;
};

export default {
  props: {
    canEdit: {
      type: Boolean,
      required: true,
    },
    shouldCollapseAllRates: Boolean,
    abilities: {
      type: Array,
      default: () => [],
    },
  },
  components: {
    UrlBasedBreadcrumb,
    AbilitySelector,
    CompetenceLevelBasicSelector,
    LanguageSelector,
    InternalDepartmentSelector,
    CatToolSelect,
  },
  data() {
    return buildInitialState();
  },
  watch: {
    currentPageIndex() {
      this.selectedRates = [];
    },
    shouldCollapseAllRates(should) {
      if (!this.canEdit) return;
      if (should) {
        this.uncollapsedRate = '';
      }
    },
    isValid() {
      this.$emit('rates-validation', this.isValid);
    },
    allRatesSelected(value) {
      this.selectAllRates(value);
    },
  },
  created() {
    this.value.forEach((r) => (r.vueKey = _.uniqueId(new Date().getTime())));
  },
  computed: {
    ...mapGetters('rates', ['ratesClipboard']),
    isValid() {
      return !this.hasDuplicatedRates;
    },
    rates: {
      get: function () {
        const filters = _.get(this, 'filters', []);
        this.value.forEach((r) => {
          if (r.vueKey) return;
          r.vueKey = _.uniqueId(new Date().getTime());
        });
        let rates = _.get(this, 'value', []);
        filters.forEach((f) => (rates = rates.filter((r) => applyFilter(r[f.name], f.value))));
        if (this.$options.name === 'CompanyRateGrid') {
          const { key, order } = this.sort;
          rates = applySort(rates, key.value || 'createdAt', order.value || 'dsc');
        }
        return rates;
      },
      set: function (value) {
        value.forEach((r) => (r.vueKey = _.uniqueId(new Date().getTime())));
        if (!_.isNil(value)) {
          if (this.$options.name === 'CompanyRateGrid') {
            this.$emit('input', value);
          } else {
            this.value = value;
          }
          this.$emit('rates-validation', this.isValid);
        }
      },
    },
    ratesPage() {
      const startIndex = (this.currentPageIndex - 1) * this.ratesPerPage;
      return this.rates.slice(startIndex, startIndex + this.ratesPerPage);
    },
    abilityFilterOptions() {
      const abilities = this.value.map((r) => _.get(r, 'ability', {}));
      if (_.isString(abilities[0])) {
        const filtered = abilities.filter((a) => a);
        return _.uniq(filtered).map((a) => ({ name: a }));
      }
      const filtered = abilities.filter((ability) => ability.name);
      return _.uniqBy(filtered, 'name');
    },
    sourceLanguageFilterOptions() {
      const sourceLanguages = this.value.map((r) => _.get(r, 'sourceLanguage', {})).filter((l) => l.isoCode);
      const uniqueSourceLanguages = _.uniqBy(sourceLanguages, 'isoCode');
      return [{ isoCode: 'Empty', name: 'Empty' }, ...uniqueSourceLanguages];
    },
    targetLanguageFilterOptions() {
      const targetLanguages = this.value.map((r) => _.get(r, 'targetLanguage', {})).filter((l) => l.isoCode);
      const uniqueTargetLanguages = _.uniqBy(targetLanguages, 'isoCode');
      return [{ isoCode: 'Empty', name: 'Empty' }, ...uniqueTargetLanguages];
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('rates', ['copyRates']),
    onCollapseAllRates(vueKey) {
      if (!this.canEdit) return;
      this.uncollapsedRate = vueKey;
    },
    manageEntity(entity) {
      this.$emit(`manage-${entity}`);
    },
    selectRate(rate) {
      const position = this.selectedRates.indexOf(rate);
      if (position === -1) {
        this.selectedRates.push(rate);
      } else {
        this.selectedRates.splice(position, 1);
      }
    },
    selectAllRates(shouldSelect) {
      this.selectedRates = shouldSelect ? [...this.rates] : [];
    },
    copySelectedRates() {
      const ratesToCopy = [];
      this.selectedRates.forEach((rate) => {
        const rateToCopy = _.omit(_.cloneDeep(rate), 'vueKey');
        rateToCopy.rateDetails = rateToCopy.rateDetails.map((rd) => _.omit(rd, 'key'));
        rateToCopy.vueKey = _.uniqueId(new Date().getTime());
        ratesToCopy.push(rateToCopy);
      });
      this.copyRates(ratesToCopy);
    },
    getVendorRates() {
      return userService.getVendorRatesWithDrafts(this.userId)
        .then((response) => {
          this.value = _.get(response, 'data.rates', []);
          this.getDuplicatedVendorRates();
        });
    },
    async onRateSaving(rate) {
      try {
        await userService.saveVendorRate(this.userId, transformRate(rate));
        this.getVendorRates().then(() => {
          this.onCollapseActiveRate();
        });
      } catch (error) {
        this.pushNotification({
          title: 'Error',
          message: 'Rate cannot be saved',
          state: 'danger',
          response: error,
        });
      }
    },
    async onRateDrafting(rate) {
      try {
        if (!_.isNil(rate._id)) {
          return this.getVendorRates().then(() => this.onCollapseActiveRate());
        }
        await userService.draftVendorRate(this.userId, transformRate(rate));
        this.getVendorRates().then(() => {
          this.onCollapseActiveRate();
        });
      } catch (error) {
        this.pushNotification({
          title: 'Error',
          message: 'Rate cannot be drafted',
          state: 'danger',
          response: error,
        });
      }
    },
    manage(entityEventName) {
      this.$emit('rates-manage-entity', entityEventName);
    },
    onSortKeyChange(key) {
      this.sort.key = key;
    },
    onSortOrderChange(order) {
      this.sort.order = order;
    },
    isRateSelected(rate) {
      return this.selectedRates.includes(rate);
    },
    onCollapseActiveRate() {
      this.uncollapsedRate = '';
    },
    async onRateChanged({ rate, isValid }) {
      if (!isValid || !rate) return;
      const isDuplicate = await userService.testRateIsDuplicate(
        this.userId,
        transformRate(rate),
      ).then((response) => _.get(response, 'data.isDuplicate', false));
      const rateId = rate._id || 'no-id';
      const wasDuplicateAt = this.duplicateRates.findIndex((_id) => _id === rateId);
      if (wasDuplicateAt >= 0) this.duplicateRates.splice(wasDuplicateAt, 1);
      if (isDuplicate) this.duplicateRates.push(rateId);
    },
    async getDuplicatedVendorRates() {
      const duplicates = await userService.getDuplicatedVendorRates(this.userId)
        .then((response) => _.get(response, 'data.rates', []));
      this.duplicateRates = duplicates;
    },
    isRateDuplicate(rate) {
      if (rate._id) {
        return this.duplicateRates.includes(rate._id);
      }
      return this.duplicateRates.includes('no-id');
    },
    ratesDeletionHandler(dialogResult) {
      if (!dialogResult.confirm) {
        this.selectedRates = [];
        this.allRatesSelected = false;
        return;
      }
      const rates = this.selectedRates.map((rate) => rate._id).filter((_id) => !_.isNil(_id));
      userService.deleteVendorRates(this.userId, rates)
        .then(() => {
          this.rates = [];
          this.getVendorRates().then(() => {
            this.selectedRates = [];
            this.onCollapseActiveRate();
            this.pushNotification(successNotification('Rates were deleted successfully'));
          });
        }).catch((error) => {
          this.pushNotification({
            title: 'Error',
            message: 'Rates cannot be deleted',
            state: 'danger',
            response: error,
          });
        });
    },
  },
};
