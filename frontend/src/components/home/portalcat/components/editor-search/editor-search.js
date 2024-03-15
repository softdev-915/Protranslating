import _ from 'lodash';
import moment from 'moment';
import SimpleBasicSelect from '../../../../form/simple-basic-select.vue';
import RequestMultiSelect from '../../../../request-select/request-ajax-multi-select.vue';

const SEARCH_PARAMS_STRATEGY_AND = 'and';
const SEARCH_PARAMS_STRATEGY_NOT = 'not';

function initSearchParams() {
  return {
    showOnlyMatching: false,
    sourceText: '',
    targetText: '',
    fromDate: '',
    toDate: '',
    replaceWith: '',
    userId: '',
    isCaseSensitive: false,
    requests: [],
    origin: '',
    status: '',
    strategy: SEARCH_PARAMS_STRATEGY_AND,
  };
}

export default {
  components: {
    SimpleBasicSelect,
    RequestMultiSelect,
  },
  props: {
    title: String,
    canEdit: {
      type: Boolean,
      default: true,
    },
    searchResults: {
      type: Array,
    },
    users: {
      type: Array,
      default: () => [],
    },
    omitFields: {
      type: Array,
      default: () => [],
    },
    activeSegment: {
      type: String,
    },
    value: Object,
  },
  data() {
    return {
      isExpanded: false,
      currentResultIndex: null,
      searchParams: initSearchParams(),
    };
  },
  created() {
    this.datepickerOptions = {
      allowInput: false,
      enableTime: true,
    };
  },
  watch: {
    value: {
      handler(value) {
        if (!_.isNil(value)) {
          this.searchParams = Object.assign({}, this.searchParams, value);
        }
      },
      immediate: true,
    },
    searchResults(results) {
      if (_.isEmpty(results)) {
        this.currentResultIndex = null;
      } else if (!_.isNil(this.activeSegment)) {
        const activeSegmentIndex = results.indexOf(this.activeSegment);
        this.currentResultIndex = activeSegmentIndex > -1 ? activeSegmentIndex : 0;
      } else {
        this.currentResultIndex = 0;
      }
      this.$emit('current-result-change', this.currentResultIndex);
    },
    currentResultIndex(currentResultIndex) {
      this.$emit('current-result-change', currentResultIndex);
    },
  },
  computed: {
    canSearch() {
      const sourceText = _.get(this, 'searchParams.sourceText', '');
      const targetText = _.get(this, 'searchParams.targetText', '');
      const userId = _.get(this, 'searchParams.userId', '');
      const fromDate = _.get(this, 'searchParams.fromDate');
      const toDate = _.get(this, 'searchParams.toDate');
      const requests = _.get(this, 'searchParams.requests');
      return !_.isEmpty(sourceText.trim()) ||
        !_.isEmpty(targetText.trim()) ||
        !_.isEmpty(userId.trim()) ||
        !_.isEmpty(fromDate) ||
        !_.isEmpty(toDate) ||
        !_.isEmpty(requests);
    },
    canReplace() {
      const replaceWith = _.get(this, 'searchParams.replaceWith', '');
      const targetText = _.get(this, 'searchParams.targetText', '');
      const strategy = _.get(this, 'searchParams.strategy', '');
      return !_.isEmpty(replaceWith.trim()) &&
        !_.isEmpty(targetText.trim()) &&
        strategy !== SEARCH_PARAMS_STRATEGY_NOT;
    },
    isValidToDate() {
      const fromDate = _.get(this, 'searchParams.fromDate');
      const toDate = _.get(this, 'searchParams.toDate');
      return _.isEmpty(fromDate) || _.isEmpty(toDate) ||
        moment(fromDate).isBefore(moment(toDate));
    },
    isValidSearch() {
      return this.canSearch && this.isValidToDate;
    },
    areResultsAvailable() {
      return !_.isNil(this.searchResults);
    },
    areResultsEmpty() {
      return !this.areResultsAvailable || _.isEmpty(this.searchResults);
    },
    isCurrentLast() {
      return !_.isEmpty(this.searchResults) &&
        this.currentResultIndex === this.searchResults.length - 1;
    },
    isCurrentFirst() {
      return !_.isEmpty(this.searchResults) &&
        this.currentResultIndex === 0;
    },
  },
  methods: {
    toggleExpanded() {
      this.isExpanded = !this.isExpanded;
    },
    onSearchClear() {
      const paramsToSet = initSearchParams();
      Object.keys(this.searchParams).forEach((key) => {
        this.searchParams[key] = paramsToSet[key];
      });
      this.$emit('clear');
    },
    setCurrentResult(newIndex) {
      if (_.isNil(this.searchResults)) {
        return;
      }
      if (newIndex < 0 || newIndex >= this.searchResults.length) {
        return;
      }
      this.currentResultIndex = newIndex;
    },
    formatUserOptions(option) {
      if (typeof option === 'object') {
        return {
          text: `${option.firstName} ${option.lastName}`,
          value: option._id,
        };
      }
      return { text: option, value: option };
    },
    onRequestSelected(requests) {
      this.searchParams.requests = requests;
    },
    onSearch() {
      this.currentResultIndex = null;
      const searchParams = _.omit(this.searchParams, 'requests');
      searchParams.requestIds = this.searchParams.requests.map(({ value }) => value);
      this.$emit('search', searchParams);
    },
    setOrigin(origin) {
      this.searchParams.origin = origin;
    },
    setStatus(status) {
      this.searchParams.status = status;
    },
    setMatchStrategy(strategy) {
      this.searchParams.strategy = strategy;
    },
  },
};
