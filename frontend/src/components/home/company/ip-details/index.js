import _ from 'lodash';
import { mapActions } from 'vuex';
import VTab from './v-tab.vue';
import PatentConfirmDialog from '../../list-request/ip-details/dialogs/patent-confirm-dialog.vue';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';
import CompanyService from '../../../../services/company-service';

const TABS = [{ name: 'PCT NATIONAL PHASE', value: 'wipo' }, { name: 'EP VALIDATION', value: 'epo' }, { name: 'DIRECT FILING', value: 'nodb' }];
const EPO_LANGS = [{ text: 'English', value: 'en' }, { text: 'French', value: 'fr' }, { text: 'German', value: 'de' }];
const WIPO_LANGS = [{ text: 'English', value: 'en' }, { text: 'French', value: 'fr' }, { text: 'German', value: 'de' }];
const NODB_LANGS = [{ text: 'English', value: 'en' }];
const DEFAULT_LANGUAGE = 'en';
const SOURCE_LANGS_MAP = {
  en: { name: 'English', isoCode: 'ENG' },
  fr: { name: 'French', isoCode: 'FRE' },
  de: { name: 'German', isoCode: 'GER' },
};
const DEFAULT_ENTITY = 'wipo';
const CURRENCIES = [{ text: 'USD', value: 'USD' }, { text: 'EUR', value: 'EUR' }, { text: 'GBP', value: 'GBP' }];
const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£' };
const DEFAULT_CURRENCY_SYMBOL = '$';
const buildNewBuffer = () => ({
  wipo: {},
  epo: {},
  nodb: {},
});
const companyService = new CompanyService();

export default {
  name: 'company-ip-details',
  components: {
    VTab,
    SimpleBasicSelect,
    PatentConfirmDialog,
  },
  data() {
    return {
      currentTab: null,
      ipRates: [],
      bufferIpRates: buildNewBuffer(),
      tabs: TABS,
      selectedLanguage: DEFAULT_LANGUAGE,
      langs: {
        wipo: WIPO_LANGS,
        epo: EPO_LANGS,
        nodb: NODB_LANGS,
      },
      currencies: CURRENCIES,
      companyId: null,
      updatedIpRates: false,
      showModal: false,
      defaultCurrencyCode: '',
    };
  },
  filters: {
    currencyIcon(currencyCode) {
      return _.get(CURRENCY_SYMBOLS, currencyCode, DEFAULT_CURRENCY_SYMBOL);
    },
  },
  watch: {
    currentTab() {
      this._checkBuffer();
      this.selectedLanguage = DEFAULT_LANGUAGE;
    },
    selectedLanguage() {
      this._checkBuffer();
    },
    ipRates: {
      handler(newValue, oldValue) {
        if (_.isNil(oldValue) || _.isNil(this.currentTab)) return;
        const {
          rates: bufferIpRates,
        } = this.bufferIpRates[this.currentTab.value][this.selectedLanguage];
        if (_.isNil(bufferIpRates)) return;
        this.updatedIpRates = !_.isEqual(newValue, bufferIpRates);
      },
      deep: true,
    },
  },
  created() {
    this.companyId = this.$route.params.entityId;
    this.getPatentRates(this.companyId, DEFAULT_ENTITY, DEFAULT_LANGUAGE);
    this.$parent.$on('save-company', this.handleSaveCompany);
  },
  computed: {
    shouldDisplayLanguageSelector() {
      const tabValuesAllowed = ['wipo', 'epo'];
      return tabValuesAllowed.includes(this.currentTab.value);
    },
    sourceLanguageName() {
      return _.get(SOURCE_LANGS_MAP[this.selectedLanguage], 'name');
    },
    englishTranslationFieldName() {
      const sourceLanguageIso = _.get(SOURCE_LANGS_MAP[this.selectedLanguage], 'isoCode');
      return `English Translation (${sourceLanguageIso}>ENG)`;
    },
    showIndirectTranslationText() {
      const isIndirectTranslationInvolved = this.selectedLanguage !== 'en' && this.currentTab.value === 'wipo';
      return isIndirectTranslationInvolved;
    },
    directIqField() {
      return `${this.selectedLanguage}DirectIq`;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    populateEntityBufferProperties() {
      this.bufferIpRates[this.currentTab.value][this.selectedLanguage] = { defaultCurrencyCode: '', rates: [] };
    },
    onSave() {
      this.resetEnglishTranslationFieldName();
      const updatedIpRatesFields = this.ipRates.map((rate) => ({
        country: rate.country,
        agencyFee: rate.agencyFee[this.defaultCurrencyCode],
        translationRate: rate.translationRate[this.defaultCurrencyCode],
      }));
      companyService.updatePatentRates({
        id: this.companyId,
        entity: this.currentTab.value,
        language: this.selectedLanguage,
        newRates: updatedIpRatesFields,
        defaultCompanyCurrencyCode: this.defaultCurrencyCode.toLowerCase(),
      }).then((res) => {
        this.pushNotification({
          title: 'Success',
          message: 'IP rates successfully saved',
          state: 'success',
        });
        const { data } = res;
        this.bufferIpRates = buildNewBuffer();
        this.setEnglishTranslationFieldName();
        this.ipRates = data.entityIpRates;
        this.defaultCurrencyCode = data.defaultCompanyCurrencyCode;
        this.bufferIpRates[this.currentTab.value][this.selectedLanguage] = {
          defaultCurrencyCode: data.defaultCompanyCurrencyCode,
          rates: _.cloneDeep(this.ipRates),
        };
      }).catch((error) => this.pushNotification({
        title: 'Error',
        message: 'IP rates could not be saved',
        state: 'danger',
        response: error,
      })).finally(() => {
        this.showModal = false;
        this.updatedIpRates = false;
      });
    },
    setEnglishTranslationFieldName() {
      this.ipRates.forEach((rate) => {
        if (rate.country === 'English Translation') {
          rate.country = this.englishTranslationFieldName;
        }
      });
    },
    resetEnglishTranslationFieldName() {
      this.ipRates.forEach((rate) => {
        if (rate.country.match('English Translation')) {
          rate.country = 'English Translation';
        }
      });
    },
    onReset() {
      companyService
        .resetPatentRates(this.companyId, this.currentTab.value, this.selectedLanguage)
        .then((res) => {
          const { data } = res;
          this.bufferIpRates = buildNewBuffer();
          this.ipRates = data.entityIpRates;
          this.defaultCurrencyCode = data.defaultCompanyCurrencyCode;
          this.bufferIpRates[this.currentTab.value][this.selectedLanguage] = {
            defaultCurrencyCode: data.defaultCompanyCurrencyCode,
            rates: _.cloneDeep(this.ipRates),
          };
          this.setEnglishTranslationFieldName();
          this.pushNotification({
            title: 'Success',
            message: 'IP rates successfully reseted',
            state: 'success',
          });
        })
        .catch((error) => this.pushNotification({
          title: 'Error',
          message: 'IP rates could not be reseted',
          state: 'danger',
          response: error,
        }));
    },
    onCancel() {
      this.ipRates = _.cloneDeep(
        this.bufferIpRates[this.currentTab.value][this.selectedLanguage].rates,
      );
    },
    formatOption(option) {
      return { text: option.text, value: option.value };
    },
    async getPatentRates(companyId, entity, language) {
      const { data } = await companyService
        .getPatentRates(companyId, entity, language)
        .catch((error) => this.pushNotification({
          title: 'Error',
          message: 'IP rates could not be retrieved',
          state: 'danger',
          response: error,
        }));
      this.ipRates = data.entityIpRates;
      this.defaultCurrencyCode = data.defaultCompanyCurrencyCode;
      this.setEnglishTranslationFieldName();
      this.bufferIpRates[entity][language] = {
        defaultCurrencyCode: data.defaultCompanyCurrencyCode,
        rates: _.cloneDeep(this.ipRates),
      };
    },
    async _checkBuffer() {
      const entityBuffer = this.bufferIpRates[this.currentTab.value][this.selectedLanguage];
      if (_.isEmpty(entityBuffer)) {
        this.populateEntityBufferProperties();
      }
      const { defaultCurrencyCode, rates: selectedIpRatesSet } = this.bufferIpRates[this.currentTab.value][this.selectedLanguage];
      if (_.isEmpty(selectedIpRatesSet)) {
        await this.getPatentRates(this.companyId, this.currentTab.value, this.selectedLanguage)
          .catch((error) => this.pushNotification({
            title: 'Error',
            message: 'IP rates could not be retrieved',
            state: 'danger',
            response: error,
          }));
      } else {
        this.ipRates = _.cloneDeep(selectedIpRatesSet);
        this.defaultCurrencyCode = defaultCurrencyCode;
      }
    },

    onRateUpdate(value, index, fieldName) {
      if (!_.isNil(value)) {
        this.ipRates[index][fieldName][this.defaultCurrencyCode] = value.toString();
      }
    },

    formatRate(value) {
      return value ? parseFloat(value) : 0;
    },

    handleSaveCompany() {
      if (this.updatedIpRates) {
        this.showModal = true;
      }
    },

    onClosePopup() {
      this.onCancel();
      this.showModal = false;
    },
  },
};
