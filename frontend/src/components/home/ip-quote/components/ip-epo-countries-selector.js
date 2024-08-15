/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import _, { cloneDeep } from 'lodash';
import IPCheckbox from './ip-checkbox.vue';
import EpoService from '../../../../services/epo-service';

const buildCountryObject = (country) => ({
  _id: country._id,
  checked: false,
  name: country.name.trim(),
  code: country.code,
  flagPic: `countries/${country.name
    .trim()
    .toLowerCase()
    .replaceAll(/\s|\//g, '-').replaceAll(',', '')}.svg`,
});
const buildValidationStateObject = (country) => ({
  _id: country._id,
  checked: false,
  name: country.name.trim().replaceAll(',', '').replaceAll(/\(.+?\)/g, ''),
  code: country.code,
  flagPic: `countries/${country.name
    .trim()
    .toLowerCase()
    .replaceAll(/\s|\//g, '-').replaceAll(',', '')}.svg`,
});
const countriesSelectAllHandler = (countries, value = false) => _.map(countries, (c) => _.assign(c, { checked: value }));
const findCountry = (countries, term, options = { prop: 'name', exactMatch: false }) => countries.validationStates.concat(
  countries.extensionStates,
  countries.memberStates,
).find((c) => {
  if (options.exactMatch) return c[options.prop] === term;
  return c[options.prop].toLowerCase().includes(term.toLowerCase());
});
const countriesSortFunc = (a, b) => {
  const nameA = a.name.toLowerCase();
  const nameB = b.name.toLowerCase();
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  return 0;
};
const MAX_CHIPS_COUNT = 3;
const epoService = new EpoService();
export default {
  name: 'IpEpoCountriesSelector',
  components: {
    'ip-checkbox': IPCheckbox,
  },
  props: {
    placeholder: {
      type: String,
      default: '',
    },
    withFlags: {
      type: Boolean,
      default: false,
    },
    isInstantQuote: {
      type: Boolean,
      deafult: true,
    },
    tabindex: {
      type: Number,
      default: 0,
    },
    value: {
      type: Array,
      default: () => [],
    },
  },
  data: () => ({
    selectAllMemberStates: false,
    selectAllExtensionStates: false,
    selectAllValidationStates: false,
    countries: {
      memberStates: [],
      extensionStates: [],
      validationStates: [],
    },
    searchValue: '',
    showDropdown: false,
  }),
  watch: {
    value: {
      immediate: true,
      handler() {
        this.selectByValue();
      },
      deep: true,
    },
    selectAllMemberStates(value) {
      const { memberStates } = this.countries;
      this.countries.memberStates = countriesSelectAllHandler(memberStates, value);
    },
    selectAllExtensionStates(value) {
      const { extensionStates } = this.countries;
      this.countries.extensionStates = countriesSelectAllHandler(extensionStates, value);
    },
    selectAllValidationStates(value) {
      const { validationStates } = this.countries;
      this.countries.validationStates = countriesSelectAllHandler(validationStates, value);
    },
    selectedCountries(newCountries, oldCountries) {
      if (_.isEqual(newCountries, oldCountries)) return;
      this.updateCountries();
    },
  },
  computed: {
    search: {
      get() {
        return this.searchValue;
      },
      set(value) {
        this.searchValue = value;
        if (value && value.length > 3) {
          const foundCountry = findCountry(this.countries, value);
          if (foundCountry && !foundCountry.checked) {
            foundCountry.checked = true;
            this.search = '';
          }
        }
      },
    },
    selectedCountries() {
      const selected = [].concat(
        this.countries.memberStates,
        this.countries.extensionStates,
        this.countries.validationStates,
      ).filter((c) => c.checked);
      if (selected.length > MAX_CHIPS_COUNT) {
        const sliced = selected.slice(0, MAX_CHIPS_COUNT);
        sliced.push({
          name: `+ ${selected.length - 3} countries`,
          code: 'none',
        });
        return sliced;
      }
      return selected;
    },
  },
  async mounted() {
    await this.init();
  },
  methods: {
    async init() {
      const {
        data: { list },
      } = await epoService.listCountries();
      _.forEach(list, (country) => {
        if (country.memberState) {
          this.countries.memberStates.push(_.assign({}, country, buildCountryObject(country)));
        }
        if (country.extensionState) {
          this.countries.extensionStates.push(_.assign({}, country, buildCountryObject(country)));
        }
        if (country.validationState) {
          this.countries.validationStates.push(
            _.assign({}, country, buildValidationStateObject(country)),
          );
        }
      });
      this.countries.memberStates.sort(countriesSortFunc);
      this.countries.extensionStates.sort(countriesSortFunc);
      this.countries.validationStates.sort(countriesSortFunc);

      if (this.value.length > 0) {
        this.selectByValue();
      }
    },
    img(path) {
      if (!path) return '';
      try {
        return require(`assets/images/${path}`);
      } catch (error) {
        return '';
      }
    },
    removeSelectedCountry(name) {
      const countryToRemove = findCountry(this.countries, name, { prop: 'name', exactMatch: true });
      countryToRemove.checked = false;
    },
    unselectLastCountry() {
      if (!this.search && this.selectedCountries.length) {
        const country = this.selectedCountries[this.selectedCountries.length - 1];
        const countryToUnselect = findCountry(this.countries, country.name, { prop: 'name', exactMatch: true });
        countryToUnselect.checked = false;
      }
    },
    updateCountries() {
      const selected = cloneDeep(
        [].concat(
          this.countries.memberStates,
          this.countries.extensionStates,
          this.countries.validationStates,
        ).filter((country) => country.checked),
      );
      this.$emit('onUpdate', selected);
    },
    selectByValue() {
      const { memberStates, extensionStates, validationStates } = this.countries;
      const countries = _.concat(memberStates, extensionStates, validationStates);
      countries.forEach((c) => {
        const countryFound = this.value.find((v) => v.name === c.name);
        if (countryFound) {
          c.checked = countryFound.checked;
        }
      });
    },
    selectCountryFromDropdown(name) {
      const country = findCountry(this.countries, name, { prop: 'name', exactMatch: true });
      country.checked = !country.checked;
    },
    closeDropdown() {
      this.showDropdown = false;
    },
    openDropdown() {
      if (!this.withFlags) {
        this.showDropdown = true;
      }
    },
  },
};
