import _ from 'lodash';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import PpoProviderService from '../../../services/ppo-provider-service';
import RequestProviderTasksInQueue from './request-provider-tasks-in-queue.vue';

const CUSTOM_PAGINATION_ENTRIES = [10, 25];

export default {
  components: {
    ServerPaginationGrid,
  },
  props: {
    value: Array,
    gridQuery: {
      type: Object,
      required: true,
    },
    rowSelectionDisabled: Boolean,
    isNewOffer: Boolean,
  },
  data() {
    return {
      currentQuery: _.cloneDeep(this.gridQuery),
      providerList: [],
      selectedProviderIds: new Set(this.value),
    };
  },
  created() {
    this.$emit('is-loading', true);
    this.service = new PpoProviderService();
    this.components = { RequestProviderTasksInQueue };
    this.customPaginationEntries = CUSTOM_PAGINATION_ENTRIES;
  },
  computed: {
    query() {
      return _.omitBy(this.currentQuery, _.isNil);
    },
  },
  methods: {
    onPpoSearchGridLoaded({ list = [] }) {
      this.providerList = list;
      this.$emit('is-loading', false);
      this.$emit('provider-rates-loaded', list.map(({ _id, rate }) => ({ _id, rate })));
    },
    onRowSelected(_id, selected) {
      if (selected) {
        this.selectedProviderIds.add(_id);
      } else {
        this.selectedProviderIds.delete(_id);
      }
      this.$emit('input', Array.from(this.selectedProviderIds));
    },
    onAllRowsSelected(selected) {
      if (selected) {
        this.selectedProviderIds = new Set(this.providerList.filter(
          provider => !provider.hasTurnedOffOffers
        ).map(item => item._id));
      } else {
        this.selectedProviderIds = new Set();
      }
      this.$emit('input', Array.from(this.selectedProviderIds));
    },
    fetchTableData() {
      this.$emit('is-loading', true);
      this.currentQuery = _.cloneDeep(this.gridQuery);
    },
    cssRowClass(item) {
      return item.isEcalated && item.hasTurnedOffOffers ? 'highlighted-provider' : '';
    },
  },
};
