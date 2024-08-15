import _ from 'lodash';
import { mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import CompetenceLevelSelector from '../../competence-level-select/competence-level-selector.vue';
import InternalDepartmentMultiSelector from '../../internal-department-select/internal-department-multi-selector.vue';
import ApprovalMethodSelector from './approval-method-selector.vue';
import OfacSelector from './ofac-selector.vue';
import UtcFlatpickr from '../../form/utc-flatpickr.vue';
import RichTextEditor from '../../rich-text-editor/rich-text-editor.vue';
import FileManagement from './file-management.vue';
import { isValidDate } from '../../../utils/form';
import RateGrid from './rate/rate-grid.vue';

export default {
  components: {
    InternalDepartmentMultiSelector,
    ApprovalMethodSelector,
    OfacSelector,
    CompetenceLevelSelector,
    FileManagement,
    RichTextEditor,
    UtcFlatpickr,
    RateGrid,
  },
  props: {
    value: {
      type: Object,
    },
    readOnly: {
      type: Boolean,
    },
    user: {
      type: Object,
    },
    shouldCollapseAllRates: Boolean,
  },
  data() {
    return {
      isValidRates: true,
      staffDetails: {
        outlier: false,
        internalDepartments: [],
        competenceLevels: [],
        remote: false,
        phoneNumber: '',
        jobTitle: '',
        approvalMethod: '',
        hireDate: null,
        ofac: '',
        comments: '',
        hiringDocuments: [],
      },
    };
  },
  created() {
    this.$emit('validate-staff', this.isValid);
  },
  watch: {
    value: {
      immediate: true,
      handler: function (newValue) {
        this.staffDetails = newValue;
      },
    },
    staffDetails: {
      handler: function (newStaffDetails) {
        this.$emit('input', newStaffDetails);
        this.$emit('validate-staff', this.isValid);
      },
      deep: true,
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canEdit: function () {
      return hasRole(this.userLogged, 'USER_UPDATE_ALL') || hasRole(this.userLogged, 'CONTACT_UPDATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canCreateStaffVendor: function () {
      return this.canCreateStaffType || this.canCreateVendorType;
    },
    canCreateOrEditAll: function () {
      return hasRole(this.userLogged, 'USER_CREATE_ALL') || hasRole(this.userLogged, 'USER_UPDATE_ALL');
    },
    canReadFiles: function () {
      return hasRole(this.userLogged, 'STAFF-FILE-MANAGEMENT_UPDATE_ALL');
    },
    canEditRates() {
      return ['STAFF-RATES_UPDATE_ALL', 'STAFF-RATES_CREATE_ALL'].some((role) => hasRole(this.userLogged, role));
    },
    canReadRates() {
      return hasRole(this.userLogged, 'STAFF-RATES_READ_ALL');
    },
    utcFlatpickrOptions() {
      return {
        onValueUpdate: null,
        enableTime: true,
        allowInput: false,
        disableMobile: 'true',
      };
    },
    isValid() {
      if (!_.get(this.staffDetails, 'approvalMethod', '')) {
        return false;
      }
      if (!isValidDate(this.staffDetails.hireDate)) {
        return false;
      }
      if (!this.isValidRates) {
        return false;
      }
      return true;
    },
  },
  methods: {
    uploadFile: function () {
      this.$emit('upload-file');
    },
    manageCompetenceLevels: function () {
      this.$emit('manage-competence');
    },
    manageInternalDepartments() {
      this.$emit('manage-internal-department');
    },
    manageActivity: function () {
      this.$emit('manage-activity', { filter: `{"users":"${this.user.firstName} ${this.user.lastName}"}` });
    },
    onManageRateEntity(entityEventName) {
      if (entityEventName) {
        this.$emit('manage-rate-entity', entityEventName);
      }
    },
    onRatesValidation(isValid) {
      this.isValidRates = isValid;
    },
  },
};
