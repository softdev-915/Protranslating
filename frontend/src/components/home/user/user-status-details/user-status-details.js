import _ from 'lodash';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';

const VENDOR_STATUS_OPTIONS = ['Pending Review', 'Reviewed', 'Approved', 'Not Approved',
  'Relationship ended by LSP', 'Relationship ended by Vendor'];
const CONTACT_STATUS_OPTIONS = ['Lead', 'Prospect', 'Customer', 'Reviewer'];

export default {
  components: { SimpleBasicSelect },

  props: {
    user: Object,
    readOnly: Boolean,
  },

  data() {
    return {
      status: '',
    };
  },

  watch: {
    'user.type': {
      handler() {
        this.status = _.get(this, `user.${this.statusFieldName}`, '');
      },
      immediate: true,
    },
    status: {
      handler(newValue) {
        this.$emit('status-changed', this.statusFieldName, newValue);
      },
    },
  },
  created() {
    this.contactStatusSelectOptions = CONTACT_STATUS_OPTIONS;
    this.vendorStatusSelectOptions = VENDOR_STATUS_OPTIONS;
  },

  computed: {
    isVendor: function () {
      return this.user.type === 'Vendor';
    },

    isContact: function () {
      return this.user.type === 'Contact';
    },

    statusFieldName() {
      return this.isContact ? 'contactDetails.contactStatus'
        : 'vendorDetails.vendorStatus';
    },

    labelText() {
      return `${_.get(this.user, 'type', '')} Status`;
    },
  },
};
