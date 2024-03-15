import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';

// Mixins
import { requestEntityMixin } from '../../../mixins/request-entity-mixin';
import { entityEditMixin } from '../../../mixins/entity-edit';

// Services
import OpportunityService from '../../../services/opportunity-service';
import DocumentProspectService from '../../../services/document-prospect-service';

// Utils
import { hasRole } from '../../../utils/user';
import { toOptionFormat } from '../../../utils/select2';
import { transformOpportunity } from './opportunity-helper';
import { findOpportunityValidationError } from './opportunity-validator';
import { iframeDownloadError } from '../../../utils/notifications';
import {
  dragover, dragstart, dragend, dropFile,
} from '../../../utils/dragndrop';

// Components
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import dropFilesMixin from '../../../mixins/drop-files-mixin';
import CompanyAjaxBasicSelect from '../company/company-ajax-basic-select.vue';

// Services
const documentProspectService = new DocumentProspectService();
// Constants
const WON_STATUS = 'Won';
const LOST_STATUS = 'Lost';
const DEFAULT_OPPORTUNITY_STATUS = 'Gathering information';
const PROBABILITY_OPTIONS = [20, 50, 80];
const OPPORTUNITY_STATUS_OPTIONS = ['Gathering information', 'Quoting', 'Won', 'Lost'];
const LOST_REASON_OPTIONS = [
  'Price',
  'Quality',
  'No Need',
  'Managing it in-house',
  'Technology needs',
  'No response',
  'Another vendor selected',
];

export default {
  mixins: [entityEditMixin, requestEntityMixin, dropFilesMixin],
  components: {
    UtcFlatpickr,
    SimpleBasicSelect,
    CompanyAjaxBasicSelect,
  },
  data() {
    return {
      companyId: null,
      downloadingSrcFiles: false,
      loadingContacts: false,
      languages: [],
      contacts: [],
      uploadedFilesCount: 0,
      secondaryContacts: [],
      contactSelectedData: {
        _id: '',
        firstName: '',
        lastName: '',
      },
      requestEntity: {
        status: DEFAULT_OPPORTUNITY_STATUS,
        probability: null,
        lostReason: '',
        notes: '',
        expectedCloseDate: null,
        estimatedValue: 0,
        wonOnDate: null,
        secondaryContacts: [],
        company: {
          _id: '',
          name: '',
          hierarchy: '',
        },
      },
    };
  },
  watch: {
    secondaryContacts: function (newSecondaryContacts) {
      if (newSecondaryContacts.length > 0) {
        this.$set(this.requestEntity, 'secondaryContacts', newSecondaryContacts.map((s) => s.value));
      } else {
        this.$set(this.requestEntity, 'secondaryContacts', []);
      }
    },
  },
  created() {
    this.datepickerOptions = {
      onValueUpdate: null,
      disableMobile: 'true',
      allowInput: true,
      enableTime: true,
    };
    this.documentsColumns = [
      'Reference',
      'Filename',
      'Size',
      'Download',
    ];
    const visibleDocumentColumns = this.documentsColumns;
    this.service = new OpportunityService();
    if (this.canReadAll) {
      this.customCompanyFilter = {};
    } else {
      this.customCompanyFilter = {
        salesRep: this.userLogged._id,
      };
    }
    if (this.canCreateOrEdit) {
      visibleDocumentColumns.push('Remove');
    }
    this.visibleDocumentColumns = visibleDocumentColumns;
    this.probabilitySelectOptions = PROBABILITY_OPTIONS;
    this.opportunityStatusSelectOptions = OPPORTUNITY_STATUS_OPTIONS;
    this.lostReasonSelectOptions = LOST_REASON_OPTIONS;
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    loadingPage() {
      return this.httpRequesting || this.loadingContacts;
    },
    documentUrlResolver() {
      return this.service.getDocumentUrl.bind(this.service);
    },
    entityName() {
      return 'opportunityEntity';
    },
    hasUserReadAccess() {
      return hasRole(this.userLogged, 'USER_READ_ALL');
    },
    canCreateOrEditRequests() {
      return ['REQUEST_CREATE_ALL', 'REQUEST_CREATE_OWN'].some((r) => hasRole(this.userLogged, r));
    },
    canReadAll: function () {
      return hasRole(this.userLogged, 'OPPORTUNITY_READ_ALL');
    },
    canReadOwn: function () {
      return hasRole(this.userLogged, 'OPPORTUNITY_READ_OWN');
    },
    canCreateAll: function () {
      return hasRole(this.userLogged, 'OPPORTUNITY_CREATE_ALL');
    },
    canCreateOwn: function () {
      return hasRole(this.userLogged, 'OPPORTUNITY_CREATE_OWN');
    },
    canEdit: function () {
      return ['OPPORTUNITY_UPDATE_ALL', 'OPPORTUNITY_UPDATE_OWN'].some((r) => hasRole(this.userLogged, r));
    },
    canReadAllCompanies() {
      return hasRole(this.userLogged, 'COMPANY_READ_ALL');
    },
    canCreate() {
      return this.canCreateAll || this.canCreateOwn;
    },
    canCreateOrEdit: function () {
      return (this.canEdit
        || (this.isNewRecord && this.canCreate))
        && this.canReadAllCompanies;
    },
    hasWonStatus() {
      return this.requestEntity.status === WON_STATUS;
    },
    hasLostStatus() {
      return this.requestEntity.status === LOST_STATUS;
    },
    hasSourceFiles() {
      return this.requestEntity.documents.filter((d) => !d.isNewRecord && !d.deleted).length > 0;
    },
    opportunityZipSrcFileURL() {
      const companyId = _.get(this, 'requestEntity.company._id', this.requestEntity.company);
      if (this.requestEntity.company && !this.isNewRecord) {
        return this.service.getZipDocumentUrl(
          companyId,
          this.requestEntity._id,
        );
      }
      return '';
    },
    secondaryContactsName() {
      if (this.requestEntity.secondaryContacts.length > 0) {
        return this.requestEntity.secondaryContacts.map((s) => `${s.firstName} ${s.lastName}`).join(', ');
      }
      return '';
    },
    selectedCompany() {
      return {
        text: _.get(this.requestEntity, 'company.hierarchy', ''),
        value: _.get(this.requestEntity, 'company._id', ''),
      };
    },
    companyHierarchy() {
      const company = _.get(this.requestEntity, 'company');
      if (_.isEmpty(company.hierarchy)) {
        return company.name;
      }
      return company.hierarchy;
    },
    documentNames() {
      if (this.requestEntity.documents) {
        return this.requestEntity.documents.map((d) => d.name);
      }
      return [];
    },
    filesUploaded() {
      return !_.isEmpty(this.requestEntity.documents);
    },
    srcLang() {
      return _.get(this, 'requestEntity.srcLang.name', '');
    },
    tgtLangs() {
      if (_.has(this, 'requestEntity.tgtLangs')) {
        return this.requestEntity.tgtLangs.map((language) => language.name).join(', ');
      }
    },
    contactName() {
      if (!this.canCreateOrEdit && this.requestEntity.contact) {
        return `${this.requestEntity.contact.firstName} ${this.requestEntity.contact.lastName}`;
      }
      return '';
    },
    sourceDocuments() {
      if (this.requestEntity.documents) {
        return this.requestEntity.documents.filter((d) => !d.removed && !d.deleted);
      }
      return [];
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isValid() {
      let hasVeeValidateErrors = false;
      if (this.errors.items) {
        hasVeeValidateErrors = this.errors.items.length > 0;
      }
      return this.entityValidationErrors.length === 0 && !hasVeeValidateErrors;
    },
    entityValidationErrors() {
      return findOpportunityValidationError(this.requestEntity);
    },
    moneyInputClass() {
      if (this.canCreateOrEdit) {
        return 'form-control';
      }
      return 'form-control currency-input-read-only p-0 border-0';
    },
    selectedSecondaryContacts() {
      const currentSecondaryContacts = this.secondaryContacts;
      const filteredSecondaryContacts = currentSecondaryContacts.filter((sc) => this.contacts.find((c) => c._id === sc.value));
      if (this.requestEntity.contact) {
        return filteredSecondaryContacts.filter((sc) => sc.value !== this.requestEntity.contact._id);
      }
      return filteredSecondaryContacts;
    },
    availableSecondaryOptions() {
      if (_.has(this.requestEntity.contact, '_id')) {
        return this.contacts.filter((c) => c._id !== this.requestEntity.contact._id).map(toOptionFormat);
      }
      return this.contacts.map(toOptionFormat);
    },
    isValidExpectedCloseDate() {
      return _.isEmpty(this.requestEntity.expectedCloseDate)
        || !this.entityValidationErrors
          .some((e) => _.has(e, 'props.[\'opportunity.expectedCloseDate\']'));
    },
    contactSelected: {
      get() {
        return this.contactSelectedData;
      },
      set(newContact) {
        if (!_.isNil(newContact)) {
          this.contactSelectedData = newContact;
          this.$set(this.requestEntity, 'contact', newContact);
        }
      },
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('sideBar', ['setCollapsed']),
    _service() {
      return new OpportunityService();
    },
    _handleRetrieve(response) {
      this._refreshEntity(response.data.opportunity);
    },
    _handleCreate(response) {
      this._refreshEntity(response.data.opportunity);
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.opportunity.readDate');
      this._refreshEntity(response.data.opportunity);
      if (newReadDate) {
        this.requestEntity.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'requestEntity', { ...this.requestEntity, ...freshEntity });
      this.$set(this, 'secondaryContacts', this.requestEntity.secondaryContacts.map(toOptionFormat));
      this.$set(this.requestEntity, 'documents', freshEntity.documents.filter((d) => !d.deleted));
      this.companyId = _.get(this, 'requestEntity.company._id');
    },
    createRequest() {
      const defaultRequest = {
        opportunityNo: this.requestEntity.no,
        company: this.requestEntity.company,
        contact: this.requestEntity.contact,
        title: this.requestEntity.title,
        languageCombinations: [{
          srcLangs: [this.requestEntity.srcLang],
          tgtLangs: this.requestEntity.tgtLangs,
          documents: [],
        }],
        salesRep: this.requestEntity.salesRep,
      };
      this.$router.push({ name: 'create-request', params: { request: defaultRequest } }).catch((err) => { console.log(err); });
    },
    save() {
      if (this.isValid) {
        const requestEntityToSend = transformOpportunity(this.requestEntity);
        this._save(requestEntityToSend);
      }
    },
    fireUpload(event) {
      event.preventDefault();
      this.$refs.fileUpload.click(event);
    },
    onIframeDownloadError(err) {
      const notification = iframeDownloadError(err);
      this.pushNotification(notification);
    },
    onFileUpload(event) {
      const { files } = event.target;
      if (!files || files.length === 0) {
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
      // check company is selected
      let companyId = this.requestEntity.company;
      if (_.isObject(companyId)) {
        companyId = _.get(companyId, '_id', null);
      }
      if (_.isEmpty(companyId)) {
        const notification = {
          title: 'Select company before uploading',
          message: 'Please select a company first in order to upload documents',
          state: 'warning',
        };
        this.pushNotification(notification);
        return;
      }
      let fileIndex = this.requestEntity.documents.length;
      const documentsClone = this.requestEntity.documents.slice(0);
      const duplicatedFileIndex = this.documentNames.indexOf(file.name);
      const newDocument = {
        isReference: false,
        name: file.name,
        mime: file.type,
        size: file.size,
        uploading: true,
      };
      if (duplicatedFileIndex !== -1) {
        fileIndex = duplicatedFileIndex;
        newDocument.oldId = this.requestEntity.documents[duplicatedFileIndex]._id;
        documentsClone[duplicatedFileIndex] = newDocument;
      } else {
        documentsClone.push(newDocument);
      }
      this.$set(this.requestEntity, 'documents', documentsClone);
      this.uploadedFilesCount++;
      documentProspectService.upload(formData).then((response) => {
        const { documents } = response.data;
        documents.forEach((d) => {
          const docClone = { ...this.requestEntity.documents[fileIndex] };
          docClone._id = d._id;
          docClone.uploading = false;
          docClone.isNew = true;
          this.$set(this.requestEntity.documents, fileIndex, docClone);
        });
      }).catch((err) => {
        const index = this.requestEntity.documents.findIndex((d) => d.name === file.name);
        if (index !== -1) {
          this.requestEntity.documents.splice(index, 1);
        }
        const notification = {
          title: 'Error',
          message: 'Document upload failed',
          state: 'danger',
          response: err,
        };
        notification.response = err;
        this.pushNotification(notification);
      });
    },
    onSecondaryContactSelected(items) {
      if (_.has(this.contactSelected, '_id') && items.length > 0) {
        this.$set(this, 'secondaryContacts', items.filter((i) => i.value !== this.contactSelected._id));
      } else {
        this.$set(this, 'secondaryContacts', items);
      }
    },
    onContactLoaded(loadState) {
      this.loadingContacts = !loadState.loaded;
      if (loadState.loaded) {
        this.$set(this, 'contacts', loadState.contacts);
        this.contactSelected = _.get(this.requestEntity, 'contact');
      }
    },
    downloadSourceFilesZip(event) {
      event.preventDefault();
      this.downloadingSrcFiles = true;
      this.$refs.srcFilesIframeDownload.download(this.opportunityZipSrcFileURL);
    },
    onSrcFilesDownloadFinished() {
      this.downloadingSrcFiles = false;
    },
    onDocumentMarkedReference(event) {
      const { index, isReference } = event;
      this.$set(this.requestEntity.documents[index], 'isReference', isReference);
    },
    deleteProspectDocument(document) {
      const index = this.requestEntity.documents.findIndex((d) => d._id === document._id);
      this.requestEntity.documents.splice(index, 1);
      documentProspectService.delete(document._id).catch((err) => {
        // The old index might be invalid at this point
        if (this.requestEntity.documents.length >= index) {
          this.requestEntity.documents.splice(index, 1, document);
        } else {
          this.requestEntity.documents.push(document);
        }
        const notification = {
          title: 'Error deleting document',
          message: err.status.message,
          state: 'danger',
        };
        notification.response = err;
        this.pushNotification(notification);
      });
    },
    onDocumentDelete(document) {
      if (this.canCreateOrEdit) {
        if (!document.isNew && this.requestEntity._id.length > 0) {
          const index = this.requestEntity.documents.findIndex((d) => d._id === document._id);
          document.removed = true;
          this.$set(this.requestEntity.documents, index, document);
        } else {
          this.deleteProspectDocument(document);
        }
      }
    },
    _addDragDropEvents() {
      if (!_.isNil(this.$refs.dropZone)) {
        this.$refs.dropZone.addEventListener('dragover', dragover.bind(this));
        this.$refs.dropZone.addEventListener('dragstart', dragstart.bind(this));
        this.$refs.dropZone.addEventListener('dragend', dragend.bind(this));
        this.$refs.dropZone.addEventListener('drop', dropFile.bind(this));
      }
      if (!_.isNil(this.$refs.dropZoneTrigger)) {
        this.$refs.dropZoneTrigger.addEventListener('dragover', dragover.bind(this));
        this.$refs.dropZoneTrigger.addEventListener('dragstart', dragstart.bind(this));
        this.$refs.dropZoneTrigger.addEventListener('dragend', dragend.bind(this));
      }
    },
    onFileDropped(file) {
      const formData = new FormData();
      formData.append('files', file, file.name);
      this.uploadFile(formData, file);
    },
    onCompanySelected(company) {
      if (company.value !== this.requestEntity.company._id && this.canCreateOrEdit) {
        this.requestEntity.company = company;
        this.companyId = _.get(company, '_id');
        this.retrieveCompanySalesRep(company.value);
      }
    },
  },
};
