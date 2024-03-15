import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { selectMixin } from '../../../../mixins/select-mixin';
import BasicDeletedAwareSelect from '../../../form/basic-deleted-aware-select.vue';
import ContactService from '../../../../services/contact-service';
import { retrieveFailedNotification } from '../../../../utils/notifications';
import { compareById, properId, toOptionFormat } from '../../../../utils/select2';
import { hasRole } from '../../../../utils/user';

const validRoles = ['CONTACT_READ_COMPANY', 'CONTACT_READ_ALL', 'CONTACT_CC_READ_COMPANY'];
const contactService = new ContactService();

export default {
  mixins: [selectMixin],
  components: {
    BasicDeletedAwareSelect,
  },
  props: {
    value: {
      type: Object,
    },
    companyId: {
      type: String,
    },
    filter: {
      type: Array,
    },
    synced: {
      type: Boolean,
      default: false,
    },
    availableContacts: {
      type: Array,
    },
    onlyHierarchy: {
      type: Boolean,
      default: false,
    },
    showIfNoCompany: {
      type: Boolean,
      default: false,
    },
    fetchOnCreated: {
      type: Boolean,
      default: true,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  created() {
    if (this.value) {
      this.setSelectedContact(this.value);
    }
    if (this.availableContacts) {
      this.loadingContacts = false;
      this.contacts = this.availableContacts;
    }
  },
  data() {
    return {
      loadingContacts: false,
      contacts: [],
      contact: {},
      contactSelected: { value: null, text: '' },
    };
  },
  watch: {
    loadingContacts: function (newVal) {
      const eventData = { loaded: !newVal };
      if (!newVal && this.contacts) {
        eventData.contacts = this.contacts;
      }
      this.$emit('contacts-loaded', eventData);
    },
    value(contact) {
      this.setSelectedContact(contact);
    },
    companyId: function (newCompanyId) {
      this.optionsRetrieved = false;
      if (_.isEmpty(newCompanyId) || _.isNil(newCompanyId)) {
        this.contact = {};
        this.contactSelected = { value: null, text: '' };
        this.contacts = [];
      } else {
        this._retrieve();
      }
    },
    availableContacts: function (newContacts) {
      this.contacts = newContacts;
    },
    contactSelected: function (newContactSelected) {
      if (!_.isEmpty(this.contacts)) {
        const contactsFiltered = this.contacts.filter(compareById(newContactSelected.value));
        this.contact = _.get(contactsFiltered, '[0]', null);
        this.$emit('input', this.contact, null);
      }
    },
    contactOptions: function (newOptions) {
      if (!_.isEmpty(this.contactSelected.value) && !_.isEmpty(newOptions)) {
        const selectedInOptions = newOptions.filter((o) => o.value === this.contactSelected.value);
        if (selectedInOptions.length === 0) {
          this.contactSelected = { value: null, text: '' };
        }
      }
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canQueryContacts() {
      if (this.userLogged) {
        return validRoles.some((role) => hasRole(this.userLogged, role));
      }
      return false;
    },
    filterIds: function () {
      if (this.filter && this.filter.length) {
        return this.filter.map((f) => {
          if (typeof f === 'string') {
            return f;
          }
          // assume it is an object
          return properId(f);
        });
      }
      return null;
    },
    contactOptions: function () {
      let filteredContacts = this.contacts;
      if (_.isEmpty(filteredContacts)) {
        return [];
      }
      if (this.filterIds && this.filterIds.length) {
        filteredContacts = filteredContacts
          .filter((c) => this.filterIds.indexOf(properId(c)) === -1);
      }
      if (this.synced) {
        filteredContacts = filteredContacts.filter((c) => c.siConnector.isSynced === this.synced);
      }
      return filteredContacts.map(toOptionFormat);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    setSelectedContact(contact) {
      if (contact) {
        this.contactSelected = {
          value: contact._id,
          text: `${contact.firstName} ${contact.lastName}`,
          deleted: _.get(contact, 'deleted'),
          terminated: _.get(contact, 'terminated'),
        };
      }
    },
    _retrieve() {
      if (!this.canQueryContacts) {
        return;
      }
      const successHandler = (contactsResponse) => {
        this.contacts = contactsResponse.data.list;
      };
      const errorHandler = (err) => {
        const notification = retrieveFailedNotification('contact', 5);
        notification.response = err;
        this.pushNotification(notification);
      };
      const finallyHandler = () => {
        this.loadingContacts = false;
      };
      this.loadingContacts = true;
      if (this.onlyHierarchy) {
        contactService.retrieveHierarchy(this.companyId)
          .then(successHandler)
          .catch(errorHandler)
          .finally(finallyHandler);
      } else {
        contactService.retrieve(this.companyId)
          .then(successHandler)
          .catch(errorHandler)
          .finally(finallyHandler);
      }
    },
    onContactSelected(contactSelected) {
      this.contactSelected = contactSelected;
    },
  },
};
