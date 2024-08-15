import _ from 'lodash';
import { mapGetters } from 'vuex';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import { getProviderMatchingRateDetail } from '../../../utils/workflow/workflow-helpers';
import { multiply, ensureNumber } from '../../../utils/bigjs';

const DISCOUNT_ABILITY = 'Discount';
const PROVIDER_TASK_CANCELLED_STATUS = 'cancelled';
const PROVIDER_TASK_APPROVED_STATUS = 'approved';
const buildInitialState = () => ({
  bill: {
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
    task: {
      type: Object,
    },
    ability: {
      type: Object,
    },
    sourceLanguage: String,
    targetLanguage: String,
    request: {
      type: Object,
    },
    provider: {
      type: Object,
    },
    currencies: {
      type: Array,
      default: () => [],
    },
    toggledSections: {
      type: Object,
    },
    billIndex: {
      type: Number,
    },
    providerTaskStatus: {
      type: String,
    },
    providerRates: {
      type: Object,
      required: true,
    },
  },
  data() {
    return buildInitialState();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canEditUnitPrice() {
      return this.hasRole('TASK-FINANCIAL_UPDATE_ALL') && this.canEdit && !_.get(this, 'provider.flatRate', false);
    },
    canEdit() {
      return this.hasRole('TASK-FINANCIAL_UPDATE_ALL')
      && ![
        PROVIDER_TASK_CANCELLED_STATUS,
        PROVIDER_TASK_APPROVED_STATUS,
      ].some((status) => status === this.providerTaskStatus);
    },
    selectedAbility() {
      return _.get(this, 'ability.text', '');
    },
    total() {
      const quantity = ensureNumber(this.bill.quantity);
      const total = ensureNumber(multiply(quantity, _.defaultTo(this.bill.unitPrice, 0)));
      return _.defaultTo(total, 0);
    },
    translationUnitText() {
      return _.get(this, 'bill.translationUnit.name', '');
    },
    breakdownText() {
      return _.get(this, 'bill.breakdown.name', '');
    },
    unitPricePlaceholder() {
      if (_.get(this.ability, 'text', '') === DISCOUNT_ABILITY) {
        return 'ex.-100';
      }
      return 'Unit price';
    },
    isValidUnit() {
      if (_.isNil(_.get(this, 'provider._id', null))) {
        return true;
      }
      return !_.isEmpty(_.get(this.selectedTranslationUnit, 'value'));
    },
    isValidUnitPrice() {
      if (_.isNil(_.get(this, 'provider._id', null))) {
        return true;
      }
      if (_.get(this.ability, 'text', '') === DISCOUNT_ABILITY) {
        return this.bill.unitPrice < 0;
      }
      return !_.isNull(this.bill.unitPrice) && this.bill.unitPrice >= 0;
    },
    isValidBillUnitPrice() {
      return _.isNumber(this.bill.unitPrice);
    },
    selectedBreakdown() {
      return _.get(this.task.invoiceDetails, `${this.billIndex}.invoice.breakdown`);
    },
    selectedUnit() {
      return _.get(this.task.invoiceDetails, `${this.billIndex}.invoice.translationUnit`);
    },
    selectedProviderId() {
      return _.get(this.provider, '_id', '');
    },
  },
  created() {
    Object.assign(this.bill, this.value);
  },
  watch: {
    selectedProviderId(value) {
      if (_.isEmpty(value)) {
        this.bill.unitPrice = 0;
      }
    },
    selectedBreakdown(value, oldValue) {
      this.bill.breakdown = value;
      if (!_.isEqual(value, oldValue)) {
        this.populateBillData();
        this.requestForNewRates();
      }
    },
    selectedUnit(value, oldValue) {
      this.bill.translationUnit = value;
      if (!_.isEqual(value, oldValue)) {
        this.populateBillData();
        this.requestForNewRates();
      }
    },
    providerRates: {
      handler(rates) {
        if (_.isNumber(rates.billIndex) && rates.billIndex !== this.billIndex) {
          return;
        }
        if (rates.provider !== this.selectedProviderId) {
          this.requestForNewRates();
          return;
        }
        this.populateBillData();
      },
      deep: true,
    },
    bill: {
      handler: function (newValue) {
        this.$emit('input', newValue);
      },
      deep: true,
    },
    providerTaskStatus(newStatus) {
      if (newStatus === PROVIDER_TASK_CANCELLED_STATUS) {
        this.bill.unitPrice = 0;
      }
    },
    value(newValue) {
      if (_.get(this, 'provider.flatRate', false)) {
        newValue.unitPrice = 0;
      }
      if (_.isEmpty(this.bill.key)) {
        newValue.key = _.uniqueId(new Date().getTime());
      }
      Object.assign(this.bill, newValue);
    },
    targetLanguage(newTgtLang, oldTgtLang) {
      this.setBillUnitPriceDependingOnTheLanguage(newTgtLang, oldTgtLang);
    },
    sourceLanguage(newSrcLang, oldSrcLang) {
      this.setBillUnitPriceDependingOnTheLanguage(newSrcLang, oldSrcLang);
    },
  },
  methods: {
    setBillUnitPriceDependingOnTheLanguage(newLang, oldLang) {
      if (newLang !== oldLang) {
        const filters = {
          ability: this.ability,
          breakdown: _.get(this, 'bill.breakdown.name'),
          translationUnit: _.get(this, 'bill.translationUnit.name'),
          sourceLanguage: _.get(this, 'sourceLanguage'),
          targetLanguage: _.get(this, 'targetLanguage'),
        };
        const billPopulated = getProviderMatchingRateDetail(filters, this.providerRates.value);
        const payload = { index: this.billIndex, price: _.get(billPopulated, 'price', 0) };
        this.$emit('on-set-bill-unit-price', payload);
      }
    },
    requestForNewRates() {
      if (this.providerRates.provider !== this.selectedProviderId) {
        this.$emit('request-new-rates', this.billIndex);
      }
    },
    populateBillData() {
      if (_.isEmpty(this.selectedProviderId)) {
        this.bill.unitPrice = 0;
        return;
      }
      const filters = {
        ability: this.ability,
        breakdown: _.get(this, 'bill.breakdown.name'),
        translationUnit: _.get(this, 'bill.translationUnit.name'),
        sourceLanguage: _.get(this, 'sourceLanguage'),
        targetLanguage: _.get(this, 'targetLanguage'),
        company: _.get(this, 'request.company'),
        internalDepartment: _.get(this, 'request.internalDepartment'),
        catTool: _.get(this, 'request.catTool'),
      };
      const billPopulated = getProviderMatchingRateDetail(filters, this.providerRates.value);
      if (_.has(billPopulated, 'price')) {
        this.bill.unitPrice = billPopulated.price;
      } else {
        this.bill.unitPrice = 0;
      }
    },
  },
};

