import _ from 'lodash';
import { mapGetters } from 'vuex';
import moment from 'moment';
import BillService from '../../../services/bill-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import PaymentMethodSelector from '../company/billing-information/payment-method-selector.vue';
import ServiceDetailTable from './service-detail-table.vue';
import BillAdjustmentTable from './bill-adjustment-table/bill-adjustment-table.vue';
import ApPaymentTable from './ap-payment-table/ap-payment-table.vue';
import BillFiles from './bill-files/bill-files.vue';
import { iframeDownloadError } from '../../../utils/notifications';
import IframeDownload from '../../iframe-download/iframe-download.vue';
import { isActiveDocument } from '../list-request/request-inline-edit-helper';
import RichTextEditor from '../../rich-text-editor/rich-text-editor.vue';
import BillingTermSelector from '../company/billing-information/billing-term-selector.vue';
import { toUserFullName } from '../../../utils/user';

const billService = new BillService();
const HUMAN_READABLE_STATUSES = {
  posted: 'Posted',
  partiallyPaid: 'Partially Paid',
  paid: 'Paid',
  inProgress: 'In Progress',
};
const STATUS_VALUES = {
  Posted: 'posted',
  'Partially Paid': 'partiallyPaid',
  Paid: 'paid',
  'In Progress': 'inProgress',
};

export default {
  mixins: [entityEditMixin, userRoleCheckMixin],
  data() {
    return {
      selectedBillingTerm: '',
      uploading: false,
      downloadingFiles: false,
      bill: {
        billPaymentNotes: '',
        wtFeeWaived: false,
        status: '',
        billOnHold: false,
        glPostingDate: null,
        priorityPayment: false,
        vendor: {
          _id: '',
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          vendorDetails: {
            address: {
              line1: '',
              line2: '',
              city: '',
              country: {
                name: '',
                code: '',
              },
              state: {
                name: '',
              },
              zip: '',
            },
            billingInformation: {
              taxId: '',
              paymentMethod: {
                name: '',
              },
              billingTerms: {
                name: '',
              },
              wtFeeWaived: false,
              priorityPayment: false,
              billPaymentNotes: '',
            },
          },
        },
        siConnector: {
          isSynced: false,
          error: '',
          connectorEndedAt: '',
        },
        totalAmount: 0,
        amountPaid: 0,
        date: '',
        dueDate: '',
        paymentScheduleDate: '',
        documents: [],
        has1099EligibleForm: false,
        hasTaxIdForms: false,
      },
      selectedStatus: '',
      selectedPaymentMethod: '',
    };
  },
  components: {
    SimpleBasicSelect,
    ServiceDetailTable,
    BillFiles,
    IframeDownload,
    BillAdjustmentTable,
    PaymentMethodSelector,
    RichTextEditor,
    ApPaymentTable,
    BillingTermSelector,
  },
  created() {
    this._ = _.pick(_, ['get']);
    this.statusOptions = _.values(HUMAN_READABLE_STATUSES);
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    ...mapGetters('features', ['mock']),
    entityName() {
      return 'bill';
    },
    canEditServiceDetails() {
      return this.canEditFinancialFields && !this.bill.siConnector.isSynced;
    },
    canReadAll() {
      return this.hasRole('BILL_READ_ALL');
    },
    canReadOwn() {
      return this.hasRole('BILL_READ_OWN')
        && _.get(this.bill, 'vendor._id', '') === this.userLogged._id;
    },
    canCreate() {
      return this.hasRole('BILL_CREATE_ALL');
    },
    canEdit: function () {
      return ['BILL_UPDATE_ALL', 'BILL_UPDATE_OWN', 'BILL_READ_OWN'].some((r) => this.hasRole(r));
    },
    canEditFinancialFields() {
      return this.hasRole('BILL-ACCT_UPDATE_ALL');
    },
    canEditGLPostingDate() {
      return this.canEditFinancialFields;
    },
    canEditAll: function () {
      return this.hasRole('BILL_UPDATE_ALL');
    },
    billFilesColumns() {
      const columns = [
        'Filename',
        'Created At',
        'Uploaded By',
        'Deleted At',
        'Deleted By',
        'Retention Time',
      ];
      if (this.canUpdateOrDownloadFiles) {
        columns.push('Download', 'Remove');
      }
      return columns;
    },
    canUpdateOrDownloadFiles() {
      if (this.canEditAll) {
        return true;
      }
      const canUpdateOwn = this.hasRole('BILL-FILES_UPDATE_OWN');
      const vendorId = _.get(this, 'bill.vendor._id');
      const isOwner = this.userLogged._id === vendorId;
      return canUpdateOwn && isOwner;
    },
    cancelText: function () {
      return this.canCreateOrEdit ? 'Cancel' : 'Close';
    },
    showBreadcrumb: function () {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return _.isEmpty(_.get(this, 'bill._id', ''));
    },
    isValid() {
      return _.isEmpty(_.get(this, 'errors.items', []));
    },
    vendorDetails() {
      const billVendor = _.get(this, 'bill.vendor');
      const vendorDetails = _.get(billVendor, 'vendorDetails');
      const vendorBillingInformation = _.get(billVendor, 'vendorDetails.billingInformation');
      const vendorCompany = _.get(vendorDetails, 'vendorCompany');
      const vendorName = _.isEmpty(vendorCompany) ? toUserFullName(billVendor) : vendorCompany;
      return {
        vendorId: _.get(billVendor, '_id', ''),
        vendorName,
        email: _.get(billVendor, 'email', ''),
        phoneNumber: _.get(vendorDetails, 'phoneNumber', ''),
        address: {
          line1: _.get(vendorDetails, 'address.line1', ''),
          line2: _.get(vendorDetails, 'address.line2', ''),
          city: _.get(vendorDetails, 'address.city', ''),
          countryName: _.get(vendorDetails, 'address.country.name', ''),
          countryCode: _.get(vendorDetails, 'address.country.code', ''),
          state: _.get(vendorDetails, 'address.state.name', ''),
          zip: _.get(vendorDetails, 'address.zip', ''),
        },
        taxId: _.get(vendorBillingInformation, 'taxId', ''),
        deleted: _.get(billVendor, 'deleted'),
      };
    },
    canReadBillOnHold() {
      return this.hasRole({ oneOf: ['BILL-ON-HOLD_READ_ALL', 'BILL_READ_ALL'] });
    },
    canReadPriorityPay() {
      return this.hasRole({ oneOf: ['BILL-PRIORITY_READ_ALL', 'BILL_READ_ALL'] });
    },
    canEditBill() {
      return ['BILL_UPDATE_ALL', 'BILL_UPDATE_OWN'].some((r) => this.hasRole(r));
    },
    canEditBillOnHold() {
      return this.hasRole('BILL-ON-HOLD_UPDATE_ALL');
    },
    hasFiles() {
      return _.some(this.bill.documents, (d) => isActiveDocument(d));
    },
    documentNames() {
      if (!_.isEmpty(_.get(this, 'bill.documents', []))) {
        return this.bill.documents.map((d) => d.name);
      }
      return [];
    },
    documentUrlResolver() {
      return billService.getDocumentUrl.bind(billService);
    },
    documents() {
      return this.bill.documents;
    },
    billZipFileURL() {
      return billService.getBillFilesZipUrl(this.bill._id);
    },
    billingTermsReadOnly() {
      return _.get(this.bill, 'vendor.vendorDetails.billingInformation.billingTerms.name', '');
    },
  },
  watch: {
    selectedStatus(newStatus) {
      this.bill.status = _.defaultTo(STATUS_VALUES[newStatus], '');
    },
    selectedPaymentMethod(newValue) {
      _.set(this.bill, 'paymentMethod', newValue);
    },
    selectedBillingTerm(newValue) {
      if (this.canEditFinancialFields) {
        _.set(this.bill, 'billingTerms', newValue);
      }
    },
  },
  methods: {
    _service() {
      return billService;
    },
    _handleRetrieve({ data = {} }) {
      Object.assign(this.bill, data.bill);
      const { status, glPostingDate, vendor } = this.bill;
      const { billingInformation } = vendor.vendorDetails;
      const {
        paymentMethod = {}, billingTerms = {}, billPaymentNotes, billsOnHold, priorityPayment,
        wtFeeWaived,
      } = billingInformation;
      const paymentNotes = this.bill.billPaymentNotes;
      Object.assign(this.bill, {
        priorityPayment: this.bill.priorityPayment || priorityPayment,
        billOnHold: this.bill.billOnHold || billsOnHold,
        wtFeeWaived: this.bill.wtFeeWaived || wtFeeWaived,
        glPostingDate: moment(glPostingDate).toDate(),
        billPaymentNotes: _.isEmpty(paymentNotes) ? billPaymentNotes : paymentNotes,
      });
      this.selectedStatus = HUMAN_READABLE_STATUSES[status];
      this.selectedPaymentMethod = _.get(this.bill, 'paymentMethod._id', paymentMethod._id);
      this.selectedBillingTerm = _.get(this.bill, 'billingTerms._id', billingTerms._id);
    },
    _handleCreate(response) {
      this.bill._id = _.get(response, 'data.bill._id', '');
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'bill', freshEntity);
    },
    save() {
      if (this.isValid) {
        const bill = _.cloneDeep(this.bill);
        this._save(bill);
      }
    },
    print() {
      if (this.isValid) {
        this.$emit('bill-preview', this.bill._id);
      }
    },
    cancel() {
      this.close();
    },
    triggerFilesDownload() {
      this.downloadingFiles = true;
      this.$refs.filesIframeDownload.download();
    },
    triggerDownload() {
      this.downloading = true;
      this.$refs.iframeDownload.download();
    },
    onDownloadFinished() {
      this.downloading = false;
    },
    onSrcFilesDownloadFinished() {
      this.downloadingFiles = false;
    },
    onIframeDownloadError(err) {
      const notification = iframeDownloadError(err);
      this.pushNotification(notification);
    },
    onFileUpload(event) {
      const files = _.get(event, 'target.files', []);
      if (_.isEmpty(files)) {
        return;
      }
      for (let i = 0; i < files.length; i++) {
        const f = files.item(i);
        const formData = new FormData();
        formData.append(event.target.name, f, f.name);
        this.uploadFile(formData, f);
      }
    },
    fireUpload(event) {
      event.preventDefault();
      this.$refs.fileUpload.click(event);
    },
    uploadFile(formData, file) {
      const documentsClone = this.bill.documents.slice(0);
      const duplicatedFileIndex = this.documentNames.indexOf(file.name);
      const newDocument = {
        isReference: false,
        isConfidential: false,
        name: file.name,
        mime: file.type,
        size: file.size,
        uploading: true,
      };
      if (duplicatedFileIndex !== -1) {
        newDocument.oldId = this.bill.documents[duplicatedFileIndex]._id;
        documentsClone[duplicatedFileIndex] = newDocument;
      } else {
        documentsClone.push(newDocument);
      }
      this.$set(this.bill, 'documents', documentsClone);
      this.uploadedFilesCount++;
      // check uploading
      this.uploading = true;
      billService.uploadDocument(formData, { billId: this.bill._id })
        .then((res) => this._refreshEntity(_.get(res, 'data.bill')))
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: 'Document upload failed',
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          this.uploading = false;
          this.resetSrcFileInput();
        });
    },
    onDocumentDelete(document) {
      if (this.canEdit) {
        this.httpRequesting = true;
        billService.deleteDocument(document._id, this.bill._id)
          .then((res) => this._refreshEntity(_.get(res, 'data.bill')))
          .catch((err) => {
            const notification = {
              title: 'Error deleting document',
              message: _.get(err, 'status.message'),
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          })
          .finally(() => {
            this.httpRequesting = false;
          });
      }
    },
    resetSrcFileInput() {
      if (this.$refs.fileUpload) {
        this.$refs.fileUpload.value = '';
      }
    },
    formatDate(date) {
      if (!moment(date).isValid()) return '';
      return moment(date).format('MM-DD-YYYY').toString();
    },
    formatSyncDate(date) {
      if (!moment(date).isValid()) return '';
      if (this.mock) {
        return moment(date).format('MM-DD-YYYY HH:mm:ss').toString();
      }
      return moment(date).format('MM-DD-YYYY HH:mm').toString();
    },
    onGlPostingDateChange(newGlPostingDate) {
      this.bill.glPostingDate = newGlPostingDate;
    },
  },
};
