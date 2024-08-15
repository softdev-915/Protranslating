import _ from 'lodash';
import moment from 'moment';
import { mapGetters, mapActions } from 'vuex';

// Mixins
import { entityEditMixin } from '../../../mixins/entity-edit';
import {
  LINE_ITEM_STRUCTURE,
  DEBIT_MEMO_TYPE,
  CREDIT_MEMO_TYPE,
  BillAdjustmentEditMixin,
} from './bill-adjustment-edit-mixin.js';

// Utils
import { hasRole, toUserName } from '../../../utils/user';
import { transformBillAdjustment } from './bill-adjustment-helper';
import { findBillAdjustmentValidationError } from './bill-adjustment-validator';
import { isActiveDocument } from '../list-request/request-inline-edit-helper';

// Components
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import LineItemsTable from './line-items-table.vue';
import IframeDownload from '../../iframe-download/iframe-download.vue';
import BillAdjustmentFiles from './bill-adjustment-files.vue';
import UserAjaxBasicSelect from '../../form/user-ajax-basic-select.vue';

// Constants
const ADJUSTMENT_TYPES = [DEBIT_MEMO_TYPE, CREDIT_MEMO_TYPE];

export default {
  mixins: [entityEditMixin, userRoleCheckMixin, BillAdjustmentEditMixin],
  components: {
    UtcFlatpickr,
    SimpleBasicSelect,
    LineItemsTable,
    IframeDownload,
    BillAdjustmentFiles,
    UserAjaxBasicSelect,
  },
  data() {
    return {
      tempInputValue: '',
      downloadingFiles: false,
      downloadingSrcFiles: false,
      uploadedFilesCount: 0,
      visibleDocumentColumns: [],
    };
  },
  created() {
    this.vendorFilter = { type: 'Vendor', terminated: false };
    this.providerFilterKey = false;
    this.datepickerOptions = {
      onValueUpdate: null,
      disableMobile: 'true',
      allowInput: true,
      enableTime: true,
    };
    const visibleDocumentColumns = [
      'Filename',
      'Created At',
      'Size',
      'Download',
    ];
    if (this.canCreateOrEdit) {
      visibleDocumentColumns.push('Remove');
    }
    this.visibleDocumentColumns = visibleDocumentColumns;
    this.billAdjustmentTypeOptions = ADJUSTMENT_TYPES;
    this.billAdjustment.date = moment().toISOString();
    this.billAdjustment.glPostingDate = moment().toISOString();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canReadOwn() {
      return hasRole(this.userLogged, 'BILL-ADJUSTMENT_READ_OWN');
    },
    canCreateAll() {
      return hasRole(this.userLogged, 'BILL-ADJUSTMENT_CREATE_ALL');
    },
    canCreateOwn() {
      return hasRole(this.userLogged, 'BILL-ADJUSTMENT_CREATE_OWN');
    },
    canCreate() {
      return this.canCreateAll || this.canCreateOwn;
    },
    canCreateOrEdit: function () {
      return (this.canEdit || (this.isNewRecord && this.canCreate));
    },
    isVendorSelected() {
      return !_.isEmpty(this.selectedVendor.value);
    },
    hasSourceFiles() {
      return this.billAdjustment.documents.filter((d) => !d.isNewRecord && !d.deleted).length > 0;
    },
    billAdjustmentZipSrcFileURL() {
      const companyId = _.get(this, 'billAdjustment.company._id', this.billAdjustment.company);
      if (this.billAdjustment.company && !this.isNewRecord) {
        return this.service.getZipDocumentUrl(
          companyId,
          this.billAdjustment._id,
        );
      }
      return '';
    },
    documentNames() {
      if (this.billAdjustment.documents) {
        return this.billAdjustment.documents.map((d) => d.name);
      }
      return [];
    },
    filesUploaded() {
      return !_.isEmpty(this.billAdjustment.documents);
    },
    sourceDocuments() {
      if (this.billAdjustment.documents) {
        return this.billAdjustment.documents.filter((d) => !d.removed && !d.deleted);
      }
      return [];
    },
    isValid() {
      let hasVeeValidateErrors = false;
      if (this.errors.items) {
        hasVeeValidateErrors = this.errors.items.length > 0;
      }
      return this.entityValidationErrors.length === 0
        && !hasVeeValidateErrors
        && !_.isEmpty(this.billAdjustment.lineItems);
    },
    entityValidationErrors() {
      return findBillAdjustmentValidationError(this.billAdjustment);
    },
    moneyInputClass() {
      if (this.canCreate) {
        return 'form-control';
      }
      return 'form-control currency-input-read-only p-0 border-0';
    },
    isValidAdjustmentDate() {
      return _.isEmpty(this.billAdjustment.date)
        || !this.entityValidationErrors
          .some((e) => _.has(e, 'props.[\'billAdjustment.date\']'));
    },
    isValidGLPostingDate() {
      return _.isEmpty(this.billAdjustment.glPostingDate)
        || !this.entityValidationErrors
          .some((e) => _.has(e, 'props.[\'billAdjustment.glPostingDate\']'));
    },
    hasFiles() {
      return _.some(this.billAdjustment.documents, (d) => isActiveDocument(d));
    },
    documents() {
      return this.billAdjustment.documents.filter(isActiveDocument);
    },
    selectedVendor() {
      if (!_.isNil(this.billAdjustment.vendor)) {
        return {
          text: toUserName(this.billAdjustment.vendor),
          value: this.billAdjustment.vendor._id,
        };
      }
      return { text: '', value: '' };
    },
  },
  watch: {
    serviceDetails(newValue) {
      if (this.billAdjustment.type === DEBIT_MEMO_TYPE) {
        const lineItems = _.defaultTo(newValue, []).map((serviceDetail) => {
          const glAccount = this.glAccounts.find((ga) => ga.number === serviceDetail.expenseAccountNo);
          const lineItem = {
            glAccountNo: {
              _id: _.get(glAccount, '_id', ''),
              number: serviceDetail.expenseAccountNo,
            },
            departmentId: {
              accountingDepartmentId: serviceDetail.accountingDepartmentId,
            },
            ability: serviceDetail.taskDescription.split(' ')[1],
            amount: this.formatAmount(serviceDetail.taskAmount),
            memo: '',
          };
          return lineItem;
        });
        this.billAdjustment.lineItems = lineItems;
      } else if (this.billAdjustment.type === CREDIT_MEMO_TYPE) {
        this.billAdjustment.lineItems = [_.cloneDeep(LINE_ITEM_STRUCTURE)];
      }
      this.updateTotalAmount();
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('sideBar', ['setCollapsed']),
    _handleCreate(res) {
      const newBillAdjustmentId = _.get(res, 'data.billAdjustment._id');
      this.billAdjustment._id = newBillAdjustmentId;
      this.$router.replace({ name: 'bill-adjustment-details', params: { entityId: newBillAdjustmentId } });
    },
    onAdjustmentTypeChange() {
      this.billAdjustment.referenceBillNo = null;
      this.billAdjustment.bill = null;
      this.referenceBill = null;
      this.billAdjustment.vendor = null;
      this.billAdjustment.lineItems = [];
    },
    onVendorSelect(vendor) {
      if (!_.isNil(vendor)) {
        const vendorId = vendor.value;
        if (vendorId !== _.get(this.referenceBill, 'vendor._id')) {
          const { value: _id, firstName, lastName } = vendor;
          this.vendor = { _id, firstName, lastName };
          this.billAdjustment.vendor = { _id, firstName, lastName };
          this.billAdjustment.referenceBillNo = null;
          this.billAdjustment.bill = null;
          this.referenceBill = null;
          this.billAdjustment.lineItems = [];
          this.updateTotalAmount();
        }
      }
    },
    onAdjustBillConfirmation(payload) {
      if (_.get(payload, 'confirm')) {
        const billAdjustmentToSend = transformBillAdjustment(this.billAdjustment);
        this._save(billAdjustmentToSend, { successCreateMessage: ' AP Adjustment successfully created' });
      }
    },
  },
};
