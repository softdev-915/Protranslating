import _ from 'lodash';
import { mapActions } from 'vuex';

// Components
import IframeDownload from '../components/iframe-download/iframe-download.vue';
import RequestFiles from '../components/request-files/request-files.vue';
import ContactSelect from '../components/home/user/contact/contact-select.vue';
import LanguageSelect from '../components/language-select/language-select.vue';
import LanguageMultiSelect from '../components/language-multi-select/language-multi-select.vue';
import RichTextEditor from '../components/rich-text-editor/rich-text-editor.vue';

// Utils
import { retrieveFailedNotification } from '../utils/notifications';

// Services
import CompanyService from '../services/company-service';
import ContactService from '../services/contact-service';
import { hotkeySaveMixin } from './hotkey-save-mixin';
import userRoleCheckMixin from '../mixins/user-role-check';

const companyService = new CompanyService();
const contactService = new ContactService();
const REQUEST_DEFAULT_LANGUAGE = {
  name: 'English',
  isoCode: 'ENG',
};
export const requestEntityMixin = {
  props: {
    entityId: {
      type: String,
    },
  },
  mixins: [hotkeySaveMixin, userRoleCheckMixin],
  components: {
    RichTextEditor,
    IframeDownload,
    RequestFiles,
    ContactSelect,
    LanguageSelect,
    LanguageMultiSelect,
  },
  data: () => ({
    requestEntity: {
      _id: null,
      no: null,
      company: null,
      srcLang: null,
      tgtLangs: [],
      title: '',
      readDate: null,
      documents: [],
      salesRep: {
        _id: null,
        firstName: '',
        lastName: '',
        deleted: false,
        terminated: false,
      },
    },
  }),
  created() {
    this.defaultSourceLanguage = REQUEST_DEFAULT_LANGUAGE;
  },
  mounted() {
    this.setCollapsed(true);
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    ...mapActions('sideBar', ['setCollapsed']),
    retrieveCompanySalesRep(companyId) {
      if (this.canReadCompanies && !_.isEmpty(companyId)) {
        companyService.retrieveCompanySalesRep(companyId).then((response) => {
          const salesRep = _.get(response, 'data.salesRep', null);
          this.$set(this.requestEntity, 'salesRep', salesRep);
        }).catch((err) => {
          if (err.code >= 500) {
            const notification = retrieveFailedNotification('company', 5);
            notification.response = err;
            this.pushNotification(notification);
          }
        });
      }
    },
    retrieveCompanyAvailableTimeToDeliver(companyId) {
      if (!this.canReadCompanies || _.isEmpty(companyId)) {
        return;
      }
      companyService.getAvailableTimeToDeliver(companyId).then((response) => {
        const availableTimeToDeliver = _.get(response, 'data', null);
        this.$set(this.requestEntity.company, 'availableTimeToDeliver', availableTimeToDeliver);
      }).catch((err) => {
        if (err.code >= 500) {
          const notification = retrieveFailedNotification('company', 5);
          notification.response = err;
          this.pushNotification(notification);
        }
      });
    },
    async retrieveContactSalesRep(contactId) {
      if (_.isEmpty(contactId) || !this.canReadSalesRep) return;
      try {
        const data = await contactService.get(contactId);
        const salesRep = _.get(data, 'data.contact.contactDetails.salesRep');
        this.$set(this.requestEntity, 'salesRep', salesRep);
      } catch (err) {
        if (_.get(err, 'status.code') >= 500) {
          const notification = retrieveFailedNotification('contact', 5);
          notification.response = err;
          this.pushNotification(notification);
        }
      }
    },
  },
  computed: {
    canReadCompanies() {
      return ['COMPANY_READ_ALL', 'COMPANY_READ_OWN'].some((role) => this.hasRole(role));
    },
    canReadSalesRep() {
      return ['REQUEST_READ_ALL', 'REQUEST_READ_COMPANY', 'REQUEST_READ_OWN'].some((r) => this.hasRole(r));
    },
    salesRepName() {
      if (!_.isEmpty(_.get(this, 'requestEntity.salesRep.firstName'))) {
        return `${this.requestEntity.salesRep.firstName} ${this.requestEntity.salesRep.lastName}`;
      }
      return '';
    },
    isNewRecord() {
      return this.requestEntity._id === null;
    },
  },
};
