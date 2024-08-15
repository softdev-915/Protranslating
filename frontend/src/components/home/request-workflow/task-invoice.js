import _ from 'lodash';
import { mapGetters } from 'vuex';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import CurrencySelector from '../../currency-select/currency-selector.vue';

import BreakdownAjaxBasicSelect from '../../breakdown-ajax-basic-select/breakdown-ajax-basic-select.vue';
import TranslationUnitAjaxBasicSelect from '../../translation-unit-ajax-basic-select/translation-unit-ajax-basic-select.vue';
import { toOption, toIdName } from '../../../utils/select2';
import { div, multiply, bigJsToNumber } from '../../../utils/bigjs';

const PENDING_TASK_STATUS = 'Pending';
const APPROVED_TASK_STATUS = 'Approved';
const DISCOUNT_ABILITY = 'Discount';
const buildInitialState = () => ({
  tgtLangChangedToOriginal: false,
  srcLangChangedToOriginal: false,
  companyRate: 0,
  originalInvoice: {
    _id: '',
    pdfPrintable: false,
    foreignUnitPrice: 0,
    breakdown: {
      _id: '',
      name: '',
    },
    translationUnit: {
      _id: '',
      name: '',
    },
    unitPrice: 0,
    quantity: 0,
  },
  invoice: {
    _id: '',
    pdfPrintable: false,
    foreignUnitPrice: 0,
    breakdown: {
      _id: '',
      name: '',
    },
    translationUnit: {
      _id: '',
      name: '',
    },
    unitPrice: 0,
    quantity: 0,
  },
});

export default {
  mixins: [userRoleCheckMixin],
  props: {
    value: {
      type: Object,
      required: true,
    },
    ability: {
      type: Object,
    },
    request: {
      type: Object,
    },
    originalRequest: {
      type: Object,
    },
    companyRates: {
      type: Array,
      default: () => [],
    },
    language: {
      type: String,
      default: () => '',
    },
    currencies: {
      type: Array,
      default: () => [],
    },
    toggledSections: {
      type: Object,
    },
    workflow: {
      type: Object,
    },
    invoiceIndex: {
      type: Number,
    },
    taskId: {
      type: String,
    },
    taskStatus: {
      type: String,
    },
    canEditTask: {
      type: Boolean,
    },
    hasApprovedCompletedProviderTasks: {
      type: Boolean,
    },
    allApprovedCompletedProviderTasks: { type: Boolean },
    isForeignCurrencyRequest: {
      type: Boolean,
    },
    originalWorkflow: {
      type: Object,
    },
  },
  components: {
    BreakdownAjaxBasicSelect,
    TranslationUnitAjaxBasicSelect,
    CurrencySelector,
  },
  data() {
    return buildInitialState();
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'getExchangeRate']),
    canRead() {
      return this.hasRole('TASK-FINANCIAL_READ_ALL');
    },
    canEdit() {
      return this.hasRole('TASK-FINANCIAL_UPDATE_ALL') && this.canEditTask && !this.hasApprovedCompletedProviderTasks;
    },
    canEditUnitPriceAndQuantity() {
      if (!this.hasRole('TASK-FINANCIAL_UPDATE_ALL')) {
        return false;
      }
      if (this.isRequestCancelled) {
        return false;
      }
      if (this.taskStatus === APPROVED_TASK_STATUS) {
        return false;
      }
      if (!this.canEditTask) {
        return false;
      }
      if (this.taskStatus === PENDING_TASK_STATUS) {
        return true;
      }
      return !this.allApprovedCompletedProviderTasks;
    },
    hasRequestCurrencyChanged() {
      return _.get(this, 'request.quoteCurrency._id')
        !== _.get(this, 'originalRequest.quoteCurrency._id');
    },
    selectedBreakdown: {
      get: function () {
        return toOption(this.invoice.breakdown);
      },
      set: function (newValue) {
        if (!_.isEqual(toIdName(newValue), this.invoice.breakdown)) {
          this.invoice.breakdown = toIdName(newValue);
          this.$emit('input', this.invoice);
        }
      },
    },
    selectedTranslationUnit: {
      get: function () {
        return toOption(this.invoice.translationUnit);
      },
      set: function (newValue) {
        if (!_.isEqual(toIdName(newValue), this.invoice.translationUnit)) {
          this.invoice.translationUnit = toIdName(newValue);
          this.$emit('input', this.invoice);
        }
      },
    },
    matchingRates() {
      return _.filter(this.companyRates, this.rateComparator);
    },
    isValidTranslationUnit() {
      return this.isDiscountAbility || !_.isEmpty(_.get(this, 'selectedTranslationUnit.text', ''));
    },
    isValidQuantity() {
      return _.isNumber(this.invoice.quantity) && this.invoice.quantity >= 0;
    },
    isNew() {
      return _.isEmpty(this.invoice._id);
    },
    selectedAbility() {
      return _.get(this, 'ability.text', '');
    },
    total() {
      const { quantity, unitPrice } = this.invoice;
      return bigJsToNumber(multiply(quantity, unitPrice));
    },
    translationUnitText() {
      return _.get(this, 'selectedTranslationUnit.text', '');
    },
    unitPricePlaceholder() {
      if (this.isDiscountAbility) {
        return 'ex.-100';
      }
      return 'Unit price';
    },
    isDiscountAbility() {
      return _.get(this.ability, 'text', '') === DISCOUNT_ABILITY;
    },
    isValidUnitPrice() {
      if (_.isNil(this.invoice.unitPrice)) {
        return false;
      }
      if (this.isDiscountAbility) {
        return this.invoice.unitPrice < 0;
      }
      return this.invoice.unitPrice >= 0;
    },
    isValidForeignUnitPrice() {
      if (this.isDiscountAbility) {
        return this.invoice.foreignUnitPrice < 0;
      }
      return !_.isNil(this.invoice.foreignUnitPrice);
    },
    isRequestCancelled() {
      return _.get(this, 'request.status', '') === 'Cancelled';
    },
    shouldResetRates() {
      if (_.isEmpty(this.workflow._id) ||
        _.isEmpty(this.invoice._id) ||
        this.srcLangChangedToOriginal) {
        return true;
      }
      const originalWorkflow = _.defaultTo(this.originalWorkflow, {});
      const originalTasks = _.get(originalWorkflow, 'tasks', []);
      const taskIdFilter = t => t._id === this.taskId;
      let isDifferentAbility = false;
      let isDifferentLanguage = false;
      const { tgtLang = {}, srcLang = {} } = _.defaultTo(originalWorkflow, {});
      const { isoCode: originalTgtLang } = tgtLang;
      const { isoCode: originalSrcLang } = srcLang;
      const {
        breakdown: originalBreakdown = {},
        translationUnit: originalUnit = {},
      } = this.originalInvoice;
      const { breakdown = {}, translationUnit = {} } = this.invoice;
      const isDifferentBreakdown = originalBreakdown._id !== breakdown._id;
      const isDifferentUnit = originalUnit._id !== translationUnit._id;
      const wfSrcLang = this.workflow.srcLang.isoCode;
      const wfTgtLang = this.workflow.tgtLang.isoCode;

      if (!_.isNil(originalWorkflow)) {
        isDifferentLanguage = (wfSrcLang !== originalSrcLang || wfTgtLang !== originalTgtLang);
        if (!_.isEmpty(originalTasks)) {
          const originalTask = originalTasks.find(taskIdFilter);
          const originalAbility = _.get(originalTask, 'ability', '');
          const task = this.workflow.tasks.find(taskIdFilter);
          isDifferentAbility = originalAbility !== _.get(task, 'ability', '');
        }
      }
      const isOriginalWorkflowTgtLang = this.tgtLangChangedToOriginal && !_.isEmpty(_.get(this, 'workflow.tgtLang.isoCode'));
      const isNotCopiedWorkflow = _.isBoolean(this.workflow.wasPasted)
        && this.workflow.wasPasted === false;
      const resetRateConditions = [
        isDifferentBreakdown,
        isDifferentUnit,
        isDifferentAbility,
        isDifferentLanguage,
        this.hasRequestCurrencyChanged,
        isOriginalWorkflowTgtLang,
        isNotCopiedWorkflow,
      ];
      return resetRateConditions.some((condition) => condition);
    },
  },
  methods: {
    getMatchingRateDetails() {
      const matchingRateDetails = [];
      if (!_.isEmpty(this.matchingRates)) {
        this.matchingRates.forEach((rate) => {
          const matchingRateDetail = rate.rateDetails.filter(this.rateDetailComparator);
          if (!_.isEmpty(matchingRateDetail)) {
            matchingRateDetails.push(matchingRateDetail[0]);
          }
        });
      }
      return matchingRateDetails;
    },
    updateMatchingRateDetails() {
      if (_.isEmpty(this.invoice.key)) {
        return;
      }
      const matchingRateDetails = this.getMatchingRateDetails();
      if (this.shouldResetRates) {
        if (!_.isEmpty(matchingRateDetails)) {
          const rateDetail = _.get(matchingRateDetails, '[0]');
          if (this.isForeignCurrencyRequest) {
            this.invoice.foreignUnitPrice = rateDetail.price;
            this.updateLocalPrice(rateDetail.currency);
          } else {
            this.invoice.unitPrice = rateDetail.price;
          }
          this.companyRate = this.invoice.unitPrice;
        } else {
          this.invoice.unitPrice = 0;
          this.invoice.foreignUnitPrice = 0;
        }
      }
    },
    updateLocalPrice(currency) {
      if (this.isForeignCurrencyRequest) {
        const foreignUnitPrice = _.get(this, 'invoice.foreignUnitPrice');
        const exchangeRate = this.getExchangeRate(currency);
        const localUnitPrice = div(foreignUnitPrice, exchangeRate);
        this.invoice.unitPrice = parseFloat(localUnitPrice.toFixed(10));
      }
    },
    rateComparator({ sourceLanguage, targetLanguage, ability }) {
      const sourceLanguageIsoCode = _.get(sourceLanguage, 'isoCode', '');
      const workflowSrcLangIsoCode = _.get(this, 'workflow.srcLang.isoCode', '');
      const workflowTgtLangIsoCode = _.get(this, 'workflow.tgtLang.isoCode', '');
      const matchesAbility = ability === this.selectedAbility && !_.isEmpty(this.selectedAbility);
      const matchesSourceLanguage = sourceLanguageIsoCode === workflowSrcLangIsoCode;
      const matchesTargetLanguage = workflowTgtLangIsoCode === _.get(targetLanguage, 'isoCode', '');
      const requiresLanguage = _.get(this, 'ability.languageCombination', false);
      let matchesLanguage = false;
      if (!requiresLanguage) {
        matchesLanguage = true;
      } else {
        matchesLanguage = (matchesSourceLanguage && matchesTargetLanguage);
      }
      return matchesAbility && matchesLanguage;
    },
    rateDetailComparator({
      breakdown, internalDepartment, translationUnit, currency,
    }) {
      const companyRateBreakdown = _.defaultTo(breakdown, '');
      const invoiceBreakdown = _.get(this, 'selectedBreakdown.value');
      const quoteCurrency = _.get(this, 'request.quoteCurrency._id', '');
      const requiresDepartment = _.get(this, 'ability.internalDepartmentRequired', false);
      let matchesDepartment = false;
      if (!requiresDepartment) {
        matchesDepartment = true;
      } else {
        matchesDepartment = internalDepartment === _.get(this, 'request.internalDepartment._id', '');
      }
      const matchesBreakdown = (invoiceBreakdown === companyRateBreakdown)
        || (_.isEmpty(invoiceBreakdown) && _.isEmpty(companyRateBreakdown));
      const matchesTranslationUnit = _.get(this, 'selectedTranslationUnit.value') === translationUnit;
      const matchesCurrency = currency === quoteCurrency;
      return matchesBreakdown && matchesTranslationUnit && matchesCurrency && matchesDepartment;
    },
    onInvoiceDetailAdd() {
      this.$emit('invoice-detail-add', this.invoiceIndex);
    },
    onInvoiceDetailDelete() {
      this.$emit('invoice-detail-delete', this.invoice.key);
    },
    formatSelectOption: ({ name = '', _id = '' }) => ({
      text: name,
      value: { text: name, value: _id },
    }),
    onTranslationUnitSelected(newVale) {
      this.selectedTranslationUnit = newVale;
    },
    onBreakDownSelected(newVale) {
      this.selectedBreakdown = newVale;
    },
  },
  created() {
    Object.assign(this.invoice, this.value);
    this.originalInvoice = _.clone(this.invoice);
    this.updateMatchingRateDetails();
    this.$emit('input', this.invoice);
  },
  watch: {
    value(invoice) {
      this.originalInvoice = _.clone(this.invoice);
      this.invoice._id = invoice._id;
      if (_.isEmpty(this.invoice.key)) {
        this.invoice.key = _.uniqueId(new Date().getTime());
      }
    },
    'request.quoteCurrency': function () {
      this.updateMatchingRateDetails();
    },
    'request.internalDepartment': function () {
      this.updateMatchingRateDetails();
    },
    'workflow.srcLang'(newValue, oldValue) {
      this.srcLangChangedToOriginal = _.get(newValue, 'isoCode', '') === _.get(this.originalWorkflow, 'srcLang.isoCode');
      if (_.get(newValue, 'isoCode', '') !== _.get(oldValue, 'isoCode', '')) {
        this.updateMatchingRateDetails();
      }
    },
    'workflow.tgtLang'(newValue, oldValue) {
      this.tgtLangChangedToOriginal = _.get(newValue, 'isoCode', '') === _.get(this.originalWorkflow, 'tgtLang.isoCode');
      if (this.tgtLangChangedToOriginal) {
        this.invoice = _.clone(this.originalInvoice);
      }
      if (_.get(newValue, 'isoCode', '') !== _.get(oldValue, 'isoCode', '')) {
        this.updateMatchingRateDetails();
      }
    },
    matchingRates: {
      handler: function (newValue, oldValue) {
        if (!_.isEqual(newValue, oldValue)) {
          this.updateMatchingRateDetails();
        }
      },
      immediate: true,
    },
    selectedAbility(newValue) {
      if (newValue === DISCOUNT_ABILITY && this.isNew) {
        Object.assign(this.invoice, {
          quantity: 1,
        });
      }
      this.updateMatchingRateDetails();
    },
    selectedBreakdown(newValue, oldValue) {
      if (!_.isEqual(newValue, oldValue)) {
        this.updateMatchingRateDetails();
      }
    },
    selectedTranslationUnit(newValue, oldValue) {
      if (!_.isEqual(newValue, oldValue)) {
        this.updateMatchingRateDetails();
      }
    },
    'invoice.pdfPrintable': function () {
      this.$emit('input', this.invoice);
    },
    'invoice.unitPrice': function () {
      this.$emit('input', this.invoice);
    },
    'invoice.foreignUnitPrice': function () {
      const quoteCurrency = _.get(this, 'request.quoteCurrency._id', '');
      this.updateLocalPrice(quoteCurrency);
      this.$emit('input', this.invoice);
    },
    'invoice.quantity': function () {
      this.$emit('input', this.invoice);
    },
    invoice: {
      handler: function (newValue, oldValue) {
        if (!_.isEqual(newValue, oldValue)) {
          this.$emit('input', newValue);
        }
      },
      deep: true,
    },
    'invoice.breakdown': {
      handler: function (newValue, oldValue) {
        if (!_.isEqual(newValue, oldValue)) {
          this.updateMatchingRateDetails();
        }
      },
      deep: true,
    },
  },
};
