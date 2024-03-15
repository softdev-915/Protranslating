import _ from 'lodash';
import { mapGetters } from 'vuex';
import IpInput from '../ip-quote/components/ip-input.vue';
import IpFileUpload from '../ip-quote/components/ip-file-upload/ip-file-upload.vue';
import IpContactSelect from './ip-contact-select.vue';
import { isEmail } from '../../../utils/form';

export default {
  props: {
    filesRequired: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    IpInput,
    IpFileUpload,
    IpContactSelect,
  },
  data() {
    return {
      details: {
        alsoDeliverTo: {
          _id: '', firstName: '', lastName: '', email: '',
        },
        otherCC: '',
        instructionsAndComments: '',
        files: [],
      },
    };
  },
  created() {
    this.companyId = _.get(this, 'userLogged.company._id', '');
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    isValidOtherCC() {
      return _.isEmpty(this.details.otherCC)
      || (!_.isEmpty(this.details.otherCC) && isEmail(this.details.otherCC));
    },
    isValid() {
      let isFilesValid = true;
      if (this.filesRequired && this.details.files.length === 0) {
        isFilesValid = false;
      }
      return this.isValidOtherCC && isFilesValid;
    },
  },
  watch: {
    details: {
      deep: true,
      handler() {
        this.$emit('order-details-updated', this.details);
      },
    },
    isValid: {
      immediate: true,
      handler() {
        this.$emit('order-details-validation', this.isValid);
      },
    },
  },
  methods: {
    onFilesUpload(files) {
      this.details.files = files;
    },
    contactFilter(contactUser) {
      return contactUser._id !== this.userLogged._id;
    },
  },
};
