import _ from 'lodash';
import { AjaxBasicSelect } from '../components/search-select';
import ServiceRequestLocker from '../services/service-request-locker';
import notificationMixin from './notification-mixin';

export default {
  mixins: [notificationMixin],
  components: {
    AjaxBasicSelect,
  },
  props: {
    value: Object,
    filter: Object,
    limit: { type: Number, default: 10 },
  },
  data() {
    return {
      selectedOption: {},
    };
  },
  watch: {
    filter(newVal, oldVal) {
      if (this.$refs.abs && this.$refs.abs.resetData && !_.isEqual(newVal, oldVal)) {
        // if the ajax basic select exist and the filter changes
        // reset the initial data to force the component
        // reset the first 10 values upon filter changes.
        this.$refs.abs.resetData();
      }
    },
    value() {
      this.selectedOption = _.isNil(this.value) ? {} : this.value;
    },
  },
  created() {
    this._service = new ServiceRequestLocker(this.service);
  },
  methods: {
    formatOption(option) {
      const { _id } = option;
      const text = _.get(option, this.filterField);
      option = _.pick(option, [
        '_id', this.filterField,
      ]);
      return { ...option, value: _id, text };
    },
    httpClient(term, page) {
      return this._requestList(term, page);
    },
    async _requestList(term, page) {
      if (page === 0) page = 1;
      let records = [];
      const filterClone = _.clone(this.filter);
      filterClone[this.filterField] = term;
      if (term === '') delete filterClone[this.filterField];
      const params = {
        limit: this.limit,
        page,
        filter: JSON.stringify(filterClone),
      };
      try {
        const response = await this.service.retrieve(params);
        records = _.get(response, 'data.list', []).map(this.formatOption);
      } catch (e) {
        this.pushError(e.message, e);
      }
      return records;
    },
    onOptionSelect(value) {
      this.$emit('input', value);
      this.$emit('select', value);
    },
  },
};
