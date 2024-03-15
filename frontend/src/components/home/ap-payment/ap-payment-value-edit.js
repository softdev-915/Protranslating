import { mapActions, mapGetters } from 'vuex';
import _ from 'lodash';
import { sum, bigJsToNumber } from '../../../utils/bigjs';

export default {
  props: {
    item: { type: Object, required: true },
    col: { type: Object, required: true },
  },
  data: () => ({
    isEditEnabled: false, accountPayable: {}, paymentValue: 0, isSelected: false,
  }),
  computed: {
    ...mapGetters('apPayment', [
      'remainingBudgetAmount', 'selectedAccountsPayableIdList', 'remainingCreditsByVendor',
    ]),
    error() {
      const result = {};
      const remainingAmount = this.isCreditsPayment
        ? this.remainingCreditsByVendor[this.accountPayable.vendorId]
        : this.remainingBudgetAmount;
      const maxAmount = bigJsToNumber(sum(remainingAmount, this.accountPayable[this.col.prop]));
      if (maxAmount - this.paymentValue < 0) {
        result.paymentValue = 'Amount exceeded';
      }
      if (this.paymentValue < 0) {
        result.paymentValue = 'Payment amount is negative';
      }
      const additionalAmount = this.isCreditsPayment
        ? this.accountPayable.paymentAmount
        : this.accountPayable.creditsToApply;
      const totalAmount = bigJsToNumber(sum(this.paymentValue, additionalAmount));
      if (totalAmount > this.accountPayable.billBalance) {
        result.paymentValue = 'Summary payment amount cannot be greater than bill balance';
      }
      return result;
    },
    hasPaymentValueError() {
      return !_.isEmpty(this.error.paymentValue);
    },
    isValid() {
      return _.isEmpty(this.error);
    },
    isCreditsPayment() {
      return this.col.prop === 'creditsToApply';
    },
    maxValue() {
      return this.isCreditsPayment
        ? _.min([this.accountPayable.creditsAvailable, this.accountPayable.billBalance])
        : this.accountPayable.billBalance;
    },
  },
  watch: {
    item: {
      handler() {
        this.unsetAccountPayable(this.accountPayable);
        this.accountPayable = this.item;
        this.$set(this.accountPayable, 'creditsToApply', 0);
        this.$set(this.accountPayable, 'paymentAmount', 0);
        if (this.isCreditsPayment) {
          this.setVendorCredit(this.accountPayable);
        }
        this.paymentValue = 0;
        this.isSelected = false;
      },
      immediate: true,
    },
    selectedAccountsPayableIdList(list) {
      this.isSelected = list.includes(this.accountPayable._id);
      if (!this.isSelected) {
        this.paymentValue = this.accountPayable[this.col.prop] = 0;
      } else if (!this.isCreditsPayment && this.paymentValue === 0) {
        this.paymentValue = this.accountPayable.billBalance;
        this.accountPayable[this.col.prop] = this.paymentValue;
      }
    },
    paymentValue(paymentValue) {
      this.paymentValue = _.round(paymentValue, 2);
    },
  },
  methods: {
    ...mapActions('apPayment', ['setVendorCredit', 'unsetAccountPayable']),
    save() {
      if (this.isValid) {
        this.accountPayable[this.col.prop] = this.paymentValue;
        this.cancel();
      }
    },
    onEdit() {
      this.isEditEnabled = true;
    },
    cancel() {
      this.paymentValue = this.accountPayable[this.col.prop];
      this.isEditEnabled = false;
    },
  },
};
