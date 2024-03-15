import _ from 'lodash';
import { mapGetters } from 'vuex';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import ExpenseAccountService from '../../../services/expense-account-service';
import InternalDepartmentService from '../../../services/internal-department-service';

export default {
  components: {
    SimpleBasicSelect,
  },
  props: {
    lineItems: {
      type: Array,
    },
    disabled: {
      type: Boolean,
    },
    canReadDepartmentId: {
      type: Boolean,
      default: true,
    },
    canReadGlAccount: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      expenseAccountService: null,
      internalDepartmentService: null,
      changingAmountFieldIndex: -1,
      newAmount: 0,
      changingMemoFieldIndex: -1,
      newMemo: '',
      changingGlAccountNoFieldIndex: -1,
      newGlAccountNo: '',
      glAccounts: [],
      changingDepartmentFieldIndex: -1,
      newDepartment: '',
      internalDepartments: [],
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    hasScroll() {
      return _.get(this, 'lineItems.length', 0) <= 3 ? 'no-scroll' : 'scroll';
    },
    tableColumns() {
      const columns = ['Amount', 'Memo'];
      if (this.canReadDepartmentId) {
        columns.unshift('Department ID');
      }
      if (this.canReadGlAccount) {
        columns.unshift('GL Account No');
      }
      return this.disabled ? columns : [...columns, ''];
    },
    canEditLineItemList() {
      return this.lineItems.map(({ _id }) => !this.disabled && _.isEmpty(_id));
    },
  },
  watch: {
    lineItems(newVal) {
      this.convertDepartments(newVal);
    },
  },
  created() {
    this.expenseAccountService = new ExpenseAccountService();
    this.internalDepartmentService = new InternalDepartmentService();
    this.init();
  },
  methods: {
    async init() {
      const { data } = await this.expenseAccountService.retrieve();
      this.glAccounts = _.get(data, 'list', []);
      this.$emit('gl-accounts-retrieved', this.glAccounts);
      const departmentsData = await this.internalDepartmentService.retrieve();
      this.internalDepartments = _.get(departmentsData, 'data.list', []).filter(
        ({ accountingDepartmentId }) => !_.isEmpty(accountingDepartmentId),
      );
      this.convertDepartments(this.lineItems);
    },
    editAmount(index) {
      this.changingAmountFieldIndex = index;
      this.newAmount = this.lineItems[index].amount;
    },
    editMemo(index) {
      this.changingMemoFieldIndex = index;
      this.newMemo = this.lineItems[index].memo;
    },
    editGlAccountNo(index) {
      this.changingGlAccountNoFieldIndex = index;
    },
    editDepartment(index) {
      this.changingDepartmentFieldIndex = index;
      if (!_.isEmpty(this.internalDepartments)) {
        this.newDepartment = this.getDepartment(
          _.get(this.lineItems[index], 'departmentId', ''),
        );
      }
    },
    onAmountSave() {
      this.$emit('on-edit-amount', { index: this.changingAmountFieldIndex, value: this.newAmount });
      this.changingAmountFieldIndex = -1;
    },
    onMemoSave() {
      this.$emit('on-edit-memo', { index: this.changingMemoFieldIndex, value: this.newMemo });
      this.changingMemoFieldIndex = -1;
    },
    onGlAccountNoSave() {
      this.$emit('on-edit-gl-account-no', { index: this.changingGlAccountNoFieldIndex, value: this.newGlAccountNo });
      this.changingGlAccountNoFieldIndex = -1;
    },
    onDepartmentSave() {
      this.$emit('on-edit-department', { index: this.changingDepartmentFieldIndex, value: this.newDepartment });
      this.changingDepartmentFieldIndex = -1;
    },
    formatGlAccountOption(gla) {
      return {
        text: gla.number,
        value: { number: gla.number, _id: gla._id },
      };
    },
    formatAmount(amount) {
      if (_.isObject(amount)) {
        return amount.$numberDecimal;
      }
      return amount;
    },
    formatDepartmentOption(option) {
      return {
        text: option.accountingDepartmentId,
        value: option,
      };
    },
    getDepartment(department) {
      return this.internalDepartments.find(
        (dep) => dep.accountingDepartmentId === _.get(department, 'accountingDepartmentId', ''),
      );
    },
    convertDepartments(lineItems) {
      if (_.isEmpty(this.internalDepartments)) {
        return;
      }
      lineItems.forEach((item, index) => {
        const department = _.get(item, 'departmentId', '');
        this.$emit('on-edit-department', {
          index,
          value: this.getDepartment(department),
        });
      });
    },
    addEntry() {
      this.$emit('on-line-item-add');
    },
    removeEntry(index) {
      this.$emit('on-line-item-remove', { index });
    },
  },
};
