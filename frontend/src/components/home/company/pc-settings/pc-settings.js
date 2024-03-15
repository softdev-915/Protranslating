import _ from 'lodash';
import CompanyService from '../../../../services/company-service';
import BreakdownService from '../../../../services/breakdown-service';
import SrManagement from '../../../sr-management/sr-management.vue';
import TbManagement from './tb-management/tb-management.vue';
import TmManagement from './tm-management/tm-management.vue';

const companyService = new CompanyService();
const breakDownService = new BreakdownService();
const mtThresholdRule = (value) => _.inRange(value, 0, 101) && Number.isInteger(+value);

export default {
  inject: ['$validator'],
  components: { SrManagement, TbManagement, TmManagement },
  props: {
    value: {
      type: Object,
      required: true,
    },
    canEdit: {
      type: Boolean,
      default: true,
    },
    languages: Array,
    companyId: String,
  },
  data() {
    return {
      breakdowns: [],
    };
  },
  created() {
    this.retrieveAll();
    this.$validator.extend('mtThreshold', mtThresholdRule);
    this.resourcesService = companyService;
  },
  watch: {
    value() {
      this.validateForm();
    },
  },
  computed: {
    mtThreshold() {
      return _.get(this, 'value.mtThreshold', '');
    },
    lockedSegmentsSelected() {
      const lockedSegments = _.get(this, 'value.lockedSegments.segmentsToLock', []);
      return lockedSegments
        .map(({ _id, name }) => ({ value: _id, text: name }));
    },
    isValidCompanyId() {
      return !_.isEmpty(this.companyId);
    },
    canUpdateRadioButtons() {
      const lockedSegments = _.get(this, 'value.lockedSegments.segmentsToLock', []);
      if (lockedSegments.length < 1) {
        return false;
      }
      return this.canEdit;
    },
  },
  methods: {
    retrieveAll() {
      this.retrieveBreakdowns();
    },
    async retrieveBreakdowns() {
      const response = await breakDownService.retrieve();
      const breakdowns = _.get(response, 'data.list', [])
        .map(({ _id, name }) => ({ value: _id, text: name }));
      this.breakdowns = breakdowns;
    },
    onLockedSegmentsSelect(selectedValues) {
      const newValues = selectedValues
        .map(({ value, text }) => ({ _id: value, name: text }));
      this.update('lockedSegments.segmentsToLock', newValues);
      if (newValues.length < 1) {
        this.update('lockedSegments.newConfirmedBy', '');
      }
    },
    async update(key, value) {
      if (!_.isNil(_.get(value, 'target'))) {
        value = value.target.value;
      }
      const clone = _.clone(this.value);
      this.$emit('input', _.set(clone, key, value));
    },
    validateForm() {
      this.$nextTick(async () => {
        const isValid = await this.$validator.validateAll();
        this.$emit('validation', (!this.canEdit || isValid));
      });
    },
  },
};
