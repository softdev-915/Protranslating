import _ from 'lodash';
import moment from 'moment';
import { mapActions, mapGetters } from 'vuex';
import RequestService from '../../../../services/request-service';
import EpoService from '../../../../services/epo-service';
import WipoService from '../../../../services/wipo-service';
import InputWrapper from './input-wrapper/input-wrapper.vue';
import PatentConfirmDialog from './dialogs/patent-confirm-dialog.vue';
import { bigJsToNumber, sum } from '../../../../utils/bigjs';
import IpModal from '../../ip-quote/components/ip-modal.vue';
import userRoleCheckMixin from '../../../../mixins/user-role-check';
import { numberToCurrency } from '../../../../utils/handlebars/number';

const requestService = new RequestService();
const epoService = new EpoService();
const wipoService = new WipoService();
const ORDER_SERVICE_NAME = 'Patent Translation Order';
const ORDER_FILING_SERVICE_NAME = 'Patent Translation and Filing Order';
const TRANSLATION_ONLY_SERVICE = 'Patent Translation Quote';
const FINANCIAL_COLUMN_PROPS = ['translationFee', 'agencyFeeFixed', 'agencyFee', 'officialFee'];
const CURRENCY_FIELDS = ['translationFee', 'agencyFeeFixed', 'agencyFee', 'officialFee', 'total'];
const PATENT_DATA_EXCLUDED_FROM_COUNTRIES_LIST = ['Annuity Payment'];
const FEE_PRECISION = 2;
const WIPO_PROPERTIES_MAP = {
  claimWordCount: 'claimsWordCount',
  drawingsPageCount: 'numberOfDrawingsPages',
  totalNumberOfPages: 'numberTotalPages',
  numberOfPriorityApplications: 'numberOfPriorityClaims',
};
const EPO_PROPERTIES_MAP = {
  claimsWordCount: 'claimWordCount',
};
const COUNTRY_TABLE_IP_ORDER_COLUMNS = [
  {
    name: 'Country',
    prop: 'name',
  },
  {
    name: 'Official Language',
    prop: 'officialLanguage',
  },
];
const COUNTRY_TABLE_COLUMNS = {
  epoTranslationOnly: [
    {
      name: 'Country',
      prop: 'name',
    },
    {
      name: 'Source Language',
      prop: 'sourceLanguage',
    },
    {
      name: 'Official Language',
      prop: 'officialLanguage',
    },
    {
      name: 'Translation Fee',
      prop: 'translationFee',
    },
  ],
  epo: [
    {
      name: 'Country',
      prop: 'name',
    },
    {
      name: 'Source Language',
      prop: 'sourceLanguage',
    },
    {
      name: 'Official Language',
      prop: 'officialLanguage',
    },
    {
      name: 'Agency Fee',
      prop: 'agencyFeeFixed',
    },
    {
      name: 'Official Fee',
      prop: 'officialFee',
    },
    {
      name: 'Translation Fee',
      prop: 'translationFee',
    },
    {
      name: 'Total',
      prop: 'total',
    },
  ],
  nodb: [
    {
      name: 'Country',
      prop: 'name',
    },
    {
      name: 'Source Language',
      prop: 'sourceLanguage',
    },
    {
      name: 'Instant Quote',
      prop: 'instantQuote',
    },
    {
      name: 'Official Language',
      prop: 'officialLanguage',
      val: ({ officialLanguage, instantQuote }) => (instantQuote ? officialLanguage : 'N/A'),
    },
    {
      name: 'Translation Fee',
      prop: 'translationFee',
      val: ({ translationFee, instantQuote }) => {
        const value = _.toNumber(translationFee).toFixed(2);
        return instantQuote || !_.isNil(value) ? value : '0.00';
      },
    },
  ],
  nodbFiling: [
    {
      name: 'Country',
      prop: 'name',
    },
    {
      name: 'Source Language',
      prop: 'sourceLanguage',
    },
    {
      name: 'Instant Quote',
      prop: 'instantQuote',
    },
    {
      name: 'Official Language',
      prop: 'officialLanguage',
      val: ({ officialLanguage, instantQuote }) => (instantQuote ? officialLanguage : 'N/A'),
    },
    {
      name: 'Agency Fee',
      prop: 'agencyFee',
    },
    {
      name: 'Official Fee',
      prop: 'officialFee',
    },
    {
      name: 'Translation Fee',
      prop: 'translationFee',
    },
    {
      name: 'Total',
      prop: 'total',
    },
  ],
  wipo: [
    {
      name: 'Country',
      prop: 'name',
    },
    {
      name: 'Source Language',
      prop: 'sourceLanguage',
    },
    {
      name: 'Instant Quote',
      prop: 'instantQuote',
      val: (item) => (item.instantQuote ? 'Yes' : 'No'),
    },
    {
      name: 'Official Language',
      prop: 'officialLanguage',
    },
    {
      name: 'Translation Fee',
      prop: 'translationFee',
      val: ({ translationFee }) => _.toNumber(translationFee).toFixed(FEE_PRECISION),
    },
  ],
  wipoFiling: [
    {
      name: 'Country',
      prop: 'name',
    },
    {
      name: 'Source Language',
      prop: 'sourceLanguage',
    },
    {
      name: 'Instant Quote',
      prop: 'instantQuote',
      val: (item) => (item.instantQuote ? 'Yes' : 'No'),
    },
    {
      name: 'Official Language',
      prop: 'officialLanguage',
    },
    {
      name: 'Agency Fee',
      prop: 'agencyFee',
      val: ({ agencyFee }) => _.toNumber(agencyFee).toFixed(FEE_PRECISION),
    },
    {
      name: 'Official Fee',
      prop: 'officialFee',
      val: ({ officialFee }) => _.toNumber(officialFee).toFixed(FEE_PRECISION),
    },
    {
      name: 'Translation Fee',
      prop: 'translationFee',
      val: ({ translationFee }) => _.toNumber(translationFee).toFixed(FEE_PRECISION),
    },
    {
      name: 'Total',
      prop: 'total',
      val: ({ total }) => _.toNumber(total).toFixed(FEE_PRECISION),
    },
  ],
};

const getCounts = (patent) => ({
  abstractWordCount: _.get(patent, 'abstractWordCount', 0),
  claimsWordCount: _.get(patent, 'claimsWordCount', 0),
  drawingsWordCount: _.get(patent, 'drawingsWordCount', 0),
  descriptionWordCount: _.get(patent, 'descriptionWordCount', 0),
  numberOfDrawings: _.get(patent, 'numberOfDrawings', 0),
  drawingsPageCount: _.get(patent, 'drawingsPageCount', 0),
  descriptionPageCount: _.get(patent, 'descriptionPageCount', 0),
  numberOfClaims: _.get(patent, 'numberOfClaims', 0),
  totalNumberOfPages: _.get(patent, 'totalNumberOfPages', 0),
  numberOfPriorityApplications: _.get(patent, 'numberOfPriorityApplications', 0),
  numberOfIndependentClaims: _.get(patent, 'numberOfIndependentClaims', 0),
  specificationWordCount: _.get(patent, 'specificationWordCount', 0),
});
export default {
  mixins: [userRoleCheckMixin],
  props: {
    patent: {
      type: Object,
    },
    isIpOrder: {
      type: Boolean,
      default: false,
    },
    quoteCurrencyIsoCode: {
      type: String,
      required: true,
    },
    requestId: {
      type: String,
      required: true,
    },
    canReadAll: {
      type: Boolean,
      required: true,
    },
  },
  components: {
    InputWrapper,
    PatentConfirmDialog,
    IpModal,
  },
  data: () => ({
    isEpo: false,
    nodbType: 'nodb',
    nodbCounts: {
      specificationWordCount: '',
      drawingsWordCount: '',
      numberOfDrawings: '',
      drawingsPageCount: '',
    },
    currentPatent: null,
    sourceLangNodb: '',
    epo: {
      validationDeadline: '',
    },
    countryTableColumns: [],
    isTranslationOnlyService: false,
    editable: false,
    countsEditMode: false,
    countryEditMode: false,
    originalCounts: {},
    patentData: {
      abstractWordCount: 0,
      claimsWordCount: 0,
      drawingsWordCount: 0,
      descriptionWordCount: 0,
      numberOfDrawings: 0,
      drawingsPageCount: 0,
      descriptionPageCount: 0,
      numberOfClaims: 0,
      totalNumberOfPages: 0,
      numberOfPriorityApplications: 0,
      numberOfIndependentClaims: 0,
      countries: [],
    },
    updatedCountryFees: [],
    isCountsDialogOpened: false,
    isCountriesDialogOpened: false,
    loading: false,
    isDisabled: false,
    originalPatent: {
      patentData: {
        abstractWordCount: 0,
        claimsWordCount: 0,
        drawingsWordCount: 0,
        descriptionWordCount: 0,
        numberOfDrawings: 0,
        drawingsPageCount: 0,
        descriptionPageCount: 0,
        numberOfClaims: 0,
        countries: [],
      },
    },
  }),
  async created() {
    this.countriesNames = _.map(this.patent.countries, (c) => c.name).join(', ');
    if (this.patent.patentPublicationNumber) {
      this.isEpo = this.patent.patentPublicationNumber.includes('EP');
    }
    this.setCountryTableColumns();
    this.setNodbType();
    this.sourceLangNodb = _.get(this.patent, 'countries.0.sourceLanguage');
    this.epo.validationDeadline = _.isEmpty(_.defaultTo(this.patent.validationDeadline, ''))
      ? 'N/A' : this.formatDate(this.patent.validationDeadline);
    if (this.isNodb) {
      this.initNodbCounts();
    } else if (this.isWIPO) {
      try {
        const { data: { wipo } } = await wipoService.get({
          patentPublicationNumber: this.patent.patentPublicationNumber,
        });
        this.originalPatent = wipo;
      } catch (e) {
        this.pushNotification({
          title: `Couldn't get WIPO ${this.patent.patentPublicationNumber}`,
          message: _.get(e, 'message'),
          state: 'danger',
          response: e,
        });
      }
    }
    try {
      if (this.isEpo) {
        const { data: { epo } } = await epoService.get(this.patent.patentPublicationNumber);
        this.originalPatent = epo;
      }
    } catch (e) {
      this.pushNotification({
        title: `Couldn't get Epo ${this.patent.patentPublicationNumber}`,
        message: _.get(e, 'message'),
        state: 'danger',
        response: e,
      });
    }
    this.isDisabled = !this.canEdit;
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp']),
    canReadCounts() {
      return this.hasRole('REQUEST_UPDATE_ALL');
    },
    canEdit() {
      return this.hasRole('REQUEST_UPDATE_ALL')
        || (this.hasRole('REQUEST_UPDATE_OWN')
        && this.createdBy === this.userLogged.email);
    },
    isOrder() {
      const service = _.get(this.patent, 'service', '');
      return _.isEqual(service, ORDER_SERVICE_NAME)
        || _.isEqual(service, ORDER_FILING_SERVICE_NAME);
    },
    isWIPO() {
      return _.get(this.patent, 'database', '') === 'PCT National Phase';
    },
    isNodb() {
      return this.patent.database === 'Direct Filing/Paris Convention';
    },
    isNodbOrder() {
      return this.isNodb && (this.patent.service === 'Patent Translation Order' || this.patent.service === 'Patent Translation and Filing');
    },
    thirtyMonthsDeadline() {
      return this.formatDate(_.get(this.patent, 'thirtyMonthsDeadline', ''));
    },
    requestedDeliveryDateForClaimsTranslation() {
      const deliveryDateForClaimsTranslation = _.get(this.patent, 'thirtyMonthsDeadline', '');
      if (_.isEmpty(deliveryDateForClaimsTranslation)) return 'N/A';
      return this.formatDate(deliveryDateForClaimsTranslation);
    },
    patentTotal() {
      const total = _.get(this.patent, 'total', 0);
      if (_.isNumber(total)) {
        return total.toFixed(2);
      }
      return total;
    },
    areCountriesEmpty() {
      return _.isEmpty(this.patentData.countries);
    },
    canSeeClaimsTranslationFees() {
      return !_.isEmpty(this.patent.claimsTranslationFees)
        && this.isEpo
        && !this.isIpOrder
        && this.canEdit;
    },
  },
  watch: {
    patent: {
      immediate: true,
      handler() {
        this.setPatentData();
        this.setCountriesData();
      },
    },
    countsEditMode() {
      this.setPatentData();
    },
    countryEditMode() {
      this.setCountriesData();
    },
    isCountriesDialogOpened(newValue) {
      if (!newValue) this.countryEditMode = false;
    },
    isCountsDialogOpened(newValue) {
      if (!newValue) this.countsEditMode = false;
    },
    quoteCurrencyIsoCode(newValue, oldValue) {
      if (newValue !== oldValue && !this.isNodb) {
        this.calculatePatentFee();
      } else if (newValue !== oldValue) {
        const form = { ...this.currentPatent, countries: this.currentPatent.countries };
        this.$emit('update-counts', { service: this.nodbType, form });
      }
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    formatDate(date) {
      if (!_.isEmpty(_.defaultTo(date, ''))) {
        return moment(date).format('YYYY-MM-DD');
      }
      return '';
    },

    setCountryTableColumns() {
      if (this.isIpOrder) {
        this.countryTableColumns = COUNTRY_TABLE_IP_ORDER_COLUMNS;
        return;
      }

      this.isTranslationOnlyService = this.patent.service === TRANSLATION_ONLY_SERVICE;
      if (this.isEpo) {
        this.countryTableColumns = this.isTranslationOnlyService
          ? COUNTRY_TABLE_COLUMNS.epoTranslationOnly : COUNTRY_TABLE_COLUMNS.epo;
      } else if (this.isNodb) {
        this.countryTableColumns = this.isTranslationOnlyService
          ? COUNTRY_TABLE_COLUMNS.nodb : COUNTRY_TABLE_COLUMNS.nodbFiling;
      } else {
        this.countryTableColumns = this.isTranslationOnlyService
          ? COUNTRY_TABLE_COLUMNS.wipo : COUNTRY_TABLE_COLUMNS.wipoFiling;
      }
    },

    setNodbType() {
      if (this.isIpOrder) {
        this.nodbType = 'nodbOrder';
        return;
      }
      this.nodbType = _.isNil(this.patent.numberOfIndependentClaims) ? 'nodb' : 'nodbFiling';
    },
    countryProperty(item, column) {
      if (typeof column.val === 'function') {
        return column.val(item);
      }
      if (column.prop === 'instantQuote') {
        return _.get(item, column.prop, '') ? 'Yes' : 'No';
      }
      return _.get(item, column.prop, '');
    },
    countryFinancialPropertyValue(item, column) {
      return Number(this.countryProperty(item, column));
    },
    countryFinancialPropertyText(item, column) {
      return numberToCurrency(this.countryProperty(item, column), FEE_PRECISION);
    },
    formatNumber(number) {
      return _.defaultTo(number, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    initNodbCounts() {
      this.currentPatent = _.cloneDeep(this.patent);
      this.nodbCounts.specificationWordCount = this.formatNumber(this.patent.specificationWordCount);
      this.nodbCounts.drawingsWordCount = this.formatNumber(this.patent.drawingsWordCount);
      this.nodbCounts.numberOfDrawings = this.formatNumber(this.patent.numberOfDrawings);
      this.nodbCounts.drawingsPageCount = this.formatNumber(this.patent.drawingsPageCount);
      this.nodbCounts.numberOfClaims = this.formatNumber(this.patent.numberOfClaims);
      this.nodbCounts.numberOfIndependentClaims = this.formatNumber(this.patent.numberOfIndependentClaims);
      this.nodbCounts.totalNumberOfPages = this.formatNumber(this.patent.totalNumberOfPages);
      const { claimPriority } = this.patent;
      if (!_.isNil(claimPriority)) {
        this.nodbCounts.claimPriority = claimPriority ? 'Yes' : 'No';
      }
    },
    isFinancialColumn(columnProp) {
      return FINANCIAL_COLUMN_PROPS.includes(columnProp);
    },
    isCurrencyField(columnProp) {
      return CURRENCY_FIELDS.includes(columnProp);
    },
    setPatentData() {
      const countsObject = getCounts(this.patent);
      _.assign(this.patentData, countsObject);
    },
    setCountriesData() {
      this.patent.countries = this.patent.countries
        .filter((c) => !PATENT_DATA_EXCLUDED_FROM_COUNTRIES_LIST.includes(c.name));
      const countriesCloned = _.cloneDeep(this.patent.countries);
      this.patentData.countries = countriesCloned;
    },
    async calculatePatentFee() {
      try {
        this.loading = true;
        const countSource = this.isNodb ? this.currentPatent : this.patentData;
        const keys = [
          'abstractWordCount',
          'claimWordCount',
          'drawingsWordCount',
          'descriptionWordCount',
          'numberOfDrawings',
          'drawingsPageCount',
          'descriptionPageCount',
          'numberOfClaims',
          'claimsWordCount',
          'totalNumberOfPages',
          'numberOfPriorityApplications',
          'numberOfIndependentClaims',
          'specificationWordCount',
        ];
        const counts = {};
        keys.forEach((key) => {
          counts[key] = _.toNumber(_.get(countSource, key, 0));
        });
        const { patentPublicationNumber, patentApplicationNumber } = this.patent;
        const res = await requestService.calculatePatentFee(this.requestId, {
          patentPublicationNumber,
          patentApplicationNumber,
          ...counts,
        }, this.isTranslationOnlyService);

        this.$emit('patent-updated', res);
      } catch (e) {
        this.pushNotification({
          title: 'Couldn\'t update Counts',
          message: _.get(e, 'message'),
          state: 'danger',
          response: e,
        });
      } finally {
        this.loading = false;
        this.isCountsDialogOpened = false;
        this.countsEditMode = false;
      }
    },
    async forceUpdatePatentFee() {
      try {
        this.loading = true;
        const res = await requestService.forceUpdatePatentFee(
          this.requestId,
          this.updatedCountryFees,
        );
        this.$emit('patent-updated', res);
      } catch (e) {
        this.pushNotification({
          title: 'Couldn\'t update Fee',
          message: _.get(e, 'message'),
          state: 'danger',
          response: e,
        });
      } finally {
        this.loading = false;
        this.isCountriesDialogOpened = false;
        this.countryEditMode = false;
      }
    },
    onCountryFeeUpdate(value, index, prop) {
      const country = this.patentData.countries[index];
      const feeValue = _.get(country, prop, 0).toString();
      if (value !== feeValue && !_.isNil(feeValue)) {
        country[prop] = value;
        if (!this.isTranslationOnlyService) country.total = this.calculateTotal(country);
        const updatedCountry = this.updatedCountryFees.find((c) => c.name === country.name);
        if (_.isNil(updatedCountry)) {
          this.updatedCountryFees.push({ name: country.name, [prop]: value });
        } else updatedCountry[prop] = value;
      }
    },
    calculateTotal(country) {
      let total = 0;
      if (this.isWIPO) {
        total = sum(total, country.agencyFee);
      } else {
        total = sum(total, country.agencyFeeFixed);
      }
      total = sum(total, country.officialFee);
      total = sum(total, country.translationFee);
      return bigJsToNumber(total);
    },
    onCountUpdate(value, countField) {
      this.patentData[countField] = _.toNumber(value);
    },
    submitCountsChanges() {
      this.calculatePatentFee();
    },
    saveCounts() {
      const form = { ...this.currentPatent, countries: this.currentPatent.countries };
      this.$emit('update-counts', { service: this.nodbType, form });
      this.countsEditMode = false;
      this.isCountsDialogOpened = false;
    },
    countsMatchText(countProperty) {
      return this.countsMatch(countProperty) ? 'Yes' : 'No';
    },
    countsMatch(countProperty) {
      const originalDataProp = this.getPatentProperty(countProperty);
      return _.toNumber(this.originalPatent[originalDataProp])
      === _.toNumber(this.patentData[countProperty]);
    },
    getCurrency(country, countryCol) {
      const val = this.countryProperty(country, countryCol);
      return !_.isEmpty(val) ? this.quoteCurrencyIsoCode : '';
    },
    getPatentProperty(property) {
      let propertiesMap = {};
      if (this.isEpo) propertiesMap = EPO_PROPERTIES_MAP;
      else if (this.isWIPO) propertiesMap = WIPO_PROPERTIES_MAP;
      const originalDataProp = _.defaultTo(
        propertiesMap[property],
        property,
      );
      return originalDataProp;
    },
    getOriginalCount(countProperty) {
      return this.originalPatent[this.getPatentProperty(countProperty)];
    },
  },
};
