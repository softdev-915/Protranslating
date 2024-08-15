import _ from 'lodash';
import moment from 'moment';
import { mapGetters, mapActions } from 'vuex';

// Mixins
import { entityEditMixin } from '../../../mixins/entity-edit';
import { BillAdjustmentEditMixin, CREDIT_MEMO_TYPE, DEBIT_MEMO_TYPE } from './bill-adjustment-edit-mixin.js';

// Services
import BillAdjustmentService from '../../../services/bill-adjustment-service';

// Utils
import { iframeDownloadError } from '../../../utils/notifications';
import { isActiveDocument } from '../list-request/request-inline-edit-helper';

// Components
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import LineItemsTable from './line-items-table.vue';
import IframeDownload from '../../iframe-download/iframe-download.vue';
import BillAdjustmentFiles from './bill-adjustment-files.vue';
import SiConnectorDetails from '../connector/si-connector-details.vue';

export default {
  mixins: [entityEditMixin, userRoleCheckMixin, BillAdjustmentEditMixin],
  components: {
    UtcFlatpickr,
    SimpleBasicSelect,
    LineItemsTable,
    IframeDownload,
    BillAdjustmentFiles,
    SiConnectorDetails,
  },
  data() {
    return {
      vendorName: '',
      tempInputValue: '',
      downloadingFiles: false,
      downloadingSrcFiles: false,
      uploadedFilesCount: 0,
      visibleDocumentColumns: [],
      billAdjustmentTypeOptions: [DEBIT_MEMO_TYPE, CREDIT_MEMO_TYPE],
      datepickerOptions: {
        onValueUpdate: null,
        disableMobile: 'true',
        allowInput: true,
        enableTime: true,
      },
    };
  },
  created() {
    const visibleDocumentColumns = [
      'Filename',
      'Created At',
      'Size',
      'Download',
    ];
    this.service = new BillAdjustmentService();
    if (this.canEdit) {
      visibleDocumentColumns.push('Remove');
    }
    this.visibleDocumentColumns = visibleDocumentColumns;
    this.billAdjustment.date = moment().toISOString();
    if (this.hasGlPostingDate) {
      this.billAdjustment.glPostingDate = moment().toISOString();
    }
  },
  watch: {
    billAdjustment: {
      handler(newVal) {
        this.vendorName = _.get(newVal.vendor, 'vendorDetails.vendorCompany');
        if (_.isEmpty(this.vendorName)) {
          this.vendorName = `${newVal.vendor.firstName} ${newVal.vendor.lastName}`;
        }
        if (!this.billAdjustment.sync) {
          this.billAdjustment.sync = {
            synced: false,
            error: 'No errors found',
            lastSyncDate: null,
          };
        }
        if (_.isEmpty(_.get(this.referenceBill, 'no'))) {
          this.referenceBill = {
            no: newVal.referenceBillNo,
          };
        }
      },
      deep: true,
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canEditFailedSync() {
      return this.canEdit && !_.isEmpty(this.billAdjustment.siConnector.error);
    },
    hasGlPostingDate() {
      return !_.isEmpty(this.billAdjustment.glPostingDate);
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
    sourceDocuments() {
      if (this.billAdjustment.documents) {
        return this.billAdjustment.documents.filter((d) => !d.removed && !d.deleted);
      }
      return [];
    },
    hasFiles() {
      return _.some(this.billAdjustment.documents, (d) => isActiveDocument(d));
    },
    billAdjustmentZipFileURL() {
      return this.service.getBillAdjustmentFilesZipUrl(this.billAdjustment._id);
    },
    documents() {
      return this.billAdjustment.documents.filter(isActiveDocument);
    },
    isValid() {
      const propsToCheck = _.pick(this.billAdjustment, [
        'referenceBillNo', 'date', 'glPostingDate', 'lineItems',
      ]);
      return !_.some(propsToCheck, _.isEmpty);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('sideBar', ['setCollapsed']),
    fireUpload(event) {
      event.preventDefault();
      this.$refs.fileUpload.click(event);
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
    uploadFile(formData, file) {
      const documentsClone = this.billAdjustment.documents.slice(0);
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
        newDocument.oldId = this.billAdjustment.documents[duplicatedFileIndex]._id;
        documentsClone[duplicatedFileIndex] = newDocument;
      } else {
        documentsClone.push(newDocument);
      }
      this.$set(this.billAdjustment, 'documents', documentsClone);
      this.uploadedFilesCount++;
      this.uploading = true;
      this.service.uploadDocument(formData, { billAdjustmentId: this.billAdjustment._id })
        .then((res) => this._refreshEntity(_.get(res, 'data.billAdjustment')))
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
    onIframeDownloadError(err) {
      const notification = iframeDownloadError(err);
      this.pushNotification(notification);
    },
    downloadSourceFilesZip(event) {
      event.preventDefault();
      this.downloadingSrcFiles = true;
      this.$refs.srcFilesIframeDownload.download(this.billAdjustmentZipSrcFileURL);
    },
    onSrcFilesDownloadFinished() {
      this.downloadingSrcFiles = false;
    },
    onDocumentMarkedReference(event) {
      const { index, isReference } = event;
      this.$set(this.billAdjustment.documents[index], 'isReference', isReference);
    },
    triggerFilesDownload() {
      this.downloadingFiles = true;
      this.$refs.filesIframeDownload.download();
    },
    onDocumentDelete(document) {
      if (this.canEdit) {
        this.httpRequesting = true;
        this.service.deleteDocument(document._id, this.billAdjustment._id)
          .then((res) => this._refreshEntity(_.get(res, 'data.billAdjustment')))
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
    onAdjustBillConfirmation(payload) {
      if (!payload.confirm) {
        return;
      }
      const billAdjustmentToSend = _.pick(this.billAdjustment, [
        '_id', 'referenceBillNo', 'date', 'glPostingDate', 'lineItems', 'description', 'type',
      ]);
      if (!_.isEmpty(billAdjustmentToSend.lineItems)) {
        billAdjustmentToSend.lineItems.forEach((li) => {
          li.glAccountNo = li.glAccountNo._id;
        });
      }
      this._save(billAdjustmentToSend);
    },
  },
};
