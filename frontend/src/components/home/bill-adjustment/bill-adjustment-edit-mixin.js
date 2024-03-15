import _ from 'lodash';

import BillAdjustmentService from '../../../services/bill-adjustment-service';

import ConfirmDialog from '../../form/confirm-dialog.vue';
import BillAjaxSelect from '../../bill-select/bill-ajax-select.vue';

import { hasRole, splitName } from '../../../utils/user';

const DEBIT_MEMO_TYPE = 'Debit Memo';
const CREDIT_MEMO_TYPE = 'Credit Memo';
const LINE_ITEM_STRUCTURE = {
  glAccountNo: { number: '', _id: '' },
  departmentId: { accountingDepartmentId: '' },
  ability: '',
  amount: 0,
  memo: '',
};
const billAdjustmentService = new BillAdjustmentService();
const BillAdjustmentEditMixin = {
  components: { BillAjaxSelect, ConfirmDialog },
  data() {
    return {
      billAdjustment: {
        _id: null,
        type: null,
        date: null,
        glPostingDate: null,
        vendor: { _id: '', firstName: '', lastName: '' },
        referenceBillNo: null,
        adjustmentNo: null,
        status: null,
        siConnector: {},
        description: '',
        adjustmentTotal: 0,
        adjustmentBalance: 0,
        amountPaid: 0,
        documents: [],
        lineItems: [],
      },
      serviceDetails: [],
      glAccounts: [],
      referenceBill: null,
    };
  },
  computed: {
    isLoading() {
      return this.httpRequesting;
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    canReadAll() {
      return hasRole(this.userLogged, 'BILL-ADJUSTMENT_READ_ALL');
    },
    canEdit() {
      return ['BILL-ADJUSTMENT_UPDATE_ALL', 'BILL-ADJUSTMENT_UPDATE_OWN'].some((r) => hasRole(this.userLogged, r));
    },
    entityName() {
      return 'billAdjustmentEntity';
    },
    documentUrlResolver() {
      return billAdjustmentService.getDocumentUrl.bind(billAdjustmentService);
    },
    billFilter() {
      return { vendorId: _.get(this.billAdjustment, 'vendor._id'), isSynced: true };
    },
    billSearchTerm() {
      return _.get(this.referenceBill, 'no');
    },
  },
  watch: {
    referenceBill(bill) {
      const {
        _id, no, amountPaid, totalAmount, serviceDetails, vendorId, vendorName = '',
      } = bill;
      const isReferenceBillFilled = !_.isEmpty(_.omit(bill, ['no']));
      if (isReferenceBillFilled) {
        Object.assign(this.billAdjustment, {
          referenceBillNo: no,
          bill: { _id, no },
          amountPaid: Number(amountPaid),
          adjustmentBalance: Number(totalAmount),
        });
        this.serviceDetails = serviceDetails;
        const { firstName, middleName, lastName } = splitName(vendorName);
        this.billAdjustment.vendor = {
          firstName,
          middleName,
          lastName,
          _id: vendorId,
        };
      }
    },
  },
  methods: {
    _service: () => billAdjustmentService,
    _refreshEntity(freshEntity) {
      Object.assign(this.billAdjustment, freshEntity, {
        documents: freshEntity.documents.filter((d) => !d.deleted),
      });
    },
    _handleRetrieve(response) {
      this._refreshEntity(response.data.billAdjustment);
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.billAdjustment.readDate');
      this._refreshEntity(response.data.billAdjustment);
      if (newReadDate) {
        this.billAdjustment.readDate = newReadDate;
      }
    },
    updateTotalAmount() {
      this.billAdjustment.adjustmentTotal = this.billAdjustment.lineItems.reduce(
        (total, item) => total + item.amount, 0,
      );
    },
    formatAmount(amount) {
      if (_.isObject(amount)) {
        return +amount.$numberDecimal;
      }
      return +amount;
    },
    saveGlAccounts(glAccounts) {
      this.glAccounts = glAccounts;
    },
    onEditLineItemAmount(payload) {
      this.billAdjustment.lineItems[payload.index].amount = Number(payload.value);
      this.updateTotalAmount();
    },
    onEditLineItemMemo(payload) {
      this.billAdjustment.lineItems[payload.index].memo = payload.value;
    },
    onEditLineItemGlAccount(payload) {
      this.billAdjustment.lineItems[payload.index].glAccountNo = payload.value;
    },
    onEditDepartment(payload) {
      this.billAdjustment.lineItems[payload.index].departmentId = payload.value;
    },
    onLineItemAdd() {
      this.billAdjustment.lineItems.push(_.cloneDeep(LINE_ITEM_STRUCTURE));
      this.updateTotalAmount();
    },
    onLineItemRemove(payload) {
      this.billAdjustment.lineItems.splice(payload.index, 1);
      this.updateTotalAmount();
    },
    save() {
      if (this.isValid) {
        if (!_.isNil(this.$refs.adjustBillConfirmationDialogue)) {
          this.$refs.adjustBillConfirmationDialogue.show();
        }
      }
    },
  },
};

export {
  DEBIT_MEMO_TYPE, CREDIT_MEMO_TYPE, LINE_ITEM_STRUCTURE, BillAdjustmentEditMixin,
};
