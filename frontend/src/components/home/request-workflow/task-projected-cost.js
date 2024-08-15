import _ from 'lodash';
import { mapGetters } from 'vuex';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import UserService from '../../../services/user-service';

const userService = new UserService();

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
    providerTasks: {
      type: Array,
    },
    workflow: {
      type: Object,
    },
    workflowSubtotals: {
      type: Object,
    },
    canEditAll: {
      type: Boolean,
      default: false,
    },
    ability: {
      type: Object,
    },
    request: {
      type: Object,
    },
    companyRates: {
      type: Array,
      default: () => [],
    },
    projectedCostIndex: {
      type: Number,
    },
    isSectionVisible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      unitPrice: 0,
      loadingAveragePrice: false,
      projectedCost: {
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
        total: 0,
        foreignTotal: 0,
      },
    };
  },
  created() {
    Object.assign(this.projectedCost, this.value);
  },
  watch: {
    isSectionVisible() {
      this.getVendorRateAverage();
    },
    'task.invoiceDetails': {
      handler: function (newValue) {
        const invoice = _.get(newValue, `[${this.projectedCostIndex}].invoice`);
        if (!_.isNil(invoice)) {
          Object.assign(this.projectedCost, {
            breakdown: invoice.breakdown,
            translationUnit: invoice.translationUnit,
            quantity: invoice.quantity,
          });
          this.$emit('input', this.projectedCost);
        }
      },
      deep: true,
      immediate: true,
    },
    unitPriceFilter: {
      deep: true,
      handler: function () {
        this.getVendorRateAverage();
      },
    },
    unitPrice(newValue) {
      this.projectedCost.unitPrice = newValue;
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    unitPriceFilter() {
      const isDepartmentRequired = _.get(this, 'ability.internalDepartmentRequired', false);
      const isLanguageCombinationRequired = _.get(this, 'ability.languageCombination', false);
      const filters = {};
      if (!_.isEmpty(_.get(this, 'ability.value'))) {
        filters.ability = _.get(this, 'ability.value');
      }
      if (!_.isEmpty(_.get(this, 'projectedCost.breakdown._id', ''))) {
        filters.breakdown = _.get(this, 'projectedCost.breakdown._id', '');
      }
      if (!_.isEmpty(_.get(this, 'projectedCost.translationUnit._id', ''))) {
        filters.translationUnit = _.get(this, 'projectedCost.translationUnit._id', '');
      }
      const department = _.get(this, 'request.internalDepartment._id');
      if (isDepartmentRequired) {
        filters.internalDepartment = department;
      }
      const sourceLanguage = _.get(this, 'workflow.srcLang.name');
      const targetLanguage = _.get(this, 'workflow.tgtLang.name');
      if (isLanguageCombinationRequired) {
        Object.assign(filters, { sourceLanguage, targetLanguage });
      }
      return filters;
    },
    breakdownName() {
      return _.get(this.projectedCost, 'breakdown.name', '');
    },
    translationUnitName() {
      return _.get(this.projectedCost, 'translationUnit.name', '');
    },
    total() {
      const total = this.projectedCost.quantity * this.projectedCost.unitPrice;
      return _.defaultTo(total, 0);
    },
  },
  methods: {
    canRead() {
      return this.hasRole({ oneOf: ['TASK-FINANCIAL_READ_ALL', 'PROJECTED-RATE_READ_ALL'] });
    },
    canEdit() {
      return this.hasRole('PROJECTED-RATE_UPDATE_ALL');
    },
    getVendorRateAverage() {
      if (!this.canRead() || !this.isSectionVisible) {
        return false;
      }
      if (!this.loadingAveragePrice) {
        this.loadingAveragePrice = true;
        userService.getVendorRateAverage(this.unitPriceFilter)
          .then((response) => {
            this.unitPrice = _.defaultTo(_.get(response, 'data.averageVendorRate'), 0);
          }).finally(() => {
            this.loadingAveragePrice = false;
          });
      }
    },
  },
};
