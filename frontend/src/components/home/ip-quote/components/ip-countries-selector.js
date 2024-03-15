/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import _ from 'lodash';
import IPCheckbox from './ip-checkbox.vue';
import IpRadioGroup from './ip-radio-group/ip-radio-group.vue';
import WIPOService from '../../../../services/wipo-service';
import NODBService from '../../../../services/nodb-service';

const MAX_CHIPS_COUNT = 3;
const SERVICES = {
  WIPOService: WIPOService,
  NODBService: NODBService,
};

export default {
  name: 'IpCountriesSelector',
  components: {
    'ip-checkbox': IPCheckbox,
    IpRadioGroup,
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
    listSize: {
      type: String,
      default: 'big',
    },
    serviceType: {
      type: String,
      default: 'WIPOService',
    },
    isEntityDisplay: {
      type: Boolean,
      default: false,
    },
    entityKey: {
      type: String,
      default: 'entitySizes',
    },
  },
  data: () => ({
    service: null,
    selectAllValue: false,
    countries: [],
    searchValue: '',
    showDropdown: false,
  }),
  watch: {
    value: {
      handler() {
        this.selectByValue();
      },
      deep: true,
    },
    countries: {
      handler(value) {
        const selected = value.filter((c) => c.checked);
        if (selected.length || (this.value.length && !selected.length)) {
          this.updateCountries();
        }
      },
      deep: true,
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
          const foundCountry = this.countries.find((c) => c.name.toLowerCase().includes(value.toLowerCase()));
          if (foundCountry && !foundCountry.checked) {
            foundCountry.checked = true;
            this.search = '';
          }
        }
      },
    },
    selectAll: {
      get() {
        return this.selectAllValue;
      },
      set(value) {
        this.selectAllValue = value;
        this.countries.forEach((country) => (country.checked = value));
      },
    },
    selectedCountries() {
      const selected = this.countries.filter((c) => c.checked);
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
    selectedValues() {
      return this.countries.filter((country) => country.checked).map((c) => c.name);
    },
  },
  async mounted() {
    await this.init();
  },
  methods: {
    async init() {
      this.service = new SERVICES[this.serviceType]();

      const {
        data: { list },
      } = await this.service.listCountries();
      const checkedCountyNames = this.value.map(v => v.name);
      const countries = list
        .filter((c) => (this.isInstantQuote ? c.iq : !c.iq))
        .map((country) => ({
          _id: country._id,
          checked: checkedCountyNames.includes(country.name.trim()),
          name: country.name.trim(),
          code: country.code,
          flagPic: `countries/${country.name
            .trim()
            .toLowerCase()
            .replaceAll(' ', '-')}.svg`,
          entities: country[this.entityKey],
          activeEntity: _.get(country, `${this.entityKey}[0]`, null), // country[this.entityKey].length ? country[this.entityKey][0] : null,
          deDirectIq: country.deDirectIq,
          frDirectIq: country.frDirectIq,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      this.countries = countries;
      if (this.value.length) {
        this.selectByValue();
        if (this.countries.every((c) => c.checked)) {
          this.selectAllValue = true;
        }
      }
    },
    loadImage(path) {
      if (!path) return '';
      try {
        return new URL(`../../../../assets/images/${path}`, import.meta.url).href;
      } catch (error) {
        return '';
      }
    },
    removeSelectedCountry(code) {
      const index = this.countries.findIndex((c) => c.code === code);
      this.countries[index].checked = false;
    },
    unselectLastCountry() {
      if (!this.search && this.selectedCountries.length) {
        const filtered = this.countries.filter((c) => c.checked);
        const lastSelected = filtered[filtered.length - 1];
        lastSelected.checked = false;
      }
    },
    updateCountries() {
      const selected = _.cloneDeep(
        this.countries.filter((country) => country.checked),
      );
      this.$emit('onUpdate', selected);
    },
    selectByValue() {
      // eslint-disable-next-line arrow-parens
      this.countries.forEach(c => {
        const countryFound = this.value.find((v) => v.code === c.code);
        if (countryFound) {
          c.checked = countryFound.checked;
          c.activeEntity = countryFound.activeEntity;
        }
      });
    },
    selectCountryFromDropdown(index) {
      this.countries[index].checked = !this.countries[index].checked;
    },
    closeDropdown() {
      this.showDropdown = false;
    },
    openDropdown() {
      if (!this.withFlags) {
        this.showDropdown = true;
      }
    },
    updateRadioGroup(index, value) {
      if (!_.isEmpty(this.countries)) {
        this.countries[index].activeEntity = value;
      }
    },
    isRadioGroup(country, countries, index) {
      return this.isEntityDisplay
      && country.entities[0] !== 'N/A'
      && !_.isEmpty(country.entities)
      && countries[index].checked;
    },
  },
};
