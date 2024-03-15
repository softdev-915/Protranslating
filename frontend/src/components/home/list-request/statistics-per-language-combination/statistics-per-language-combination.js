import _ from 'lodash';
import StatisticsTable from '../statistics-table/statistics-table.vue';

const DEFAULT_PROVIDER = 'system';

export default {
  components: {
    StatisticsTable,
  },
  props: {
    isSelected: {
      type: Boolean,
      required: true,
    },
    isExpanded: {
      type: Boolean,
      required: true,
    },
    languageCombination: {
      type: String,
      required: true,
    },
    statisticsPerProvider: {
      type: Array,
      required: true,
    },
    tabName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      selectedProvider: `${DEFAULT_PROVIDER}_0`,
    };
  },
  watch: {
    isSelected: {
      handler(newValue) {
        let exportableData = null;
        if (newValue) {
          exportableData = this.selectedStatisticsByProvider;
        }
        this.$emit('update-exportable-statistics', this.languageCombination, exportableData);
      },
      immediate: true,
    },
    selectedProvider: {
      handler() {
        if (this.isSelected) {
          this.$emit('update-exportable-statistics', this.languageCombination, this.selectedStatisticsByProvider);
        }
      },
      immediate: true,
    },
    providers: {
      handler(newProviders) {
        const providerId = _.get(newProviders, '[0].userId', DEFAULT_PROVIDER);
        this.selectedProvider = `${providerId}_0`;
      },
      immediate: true,
    },
  },
  methods: {
    selectProvider(providerIdWithIndex) {
      this.selectedProvider = providerIdWithIndex;
    },
  },
  computed: {
    providers() {
      if (this.tabName === 'client') {
        return [];
      }
      return this.statisticsPerProvider.map(({ provider }) => provider);
    },
    selectedStatisticsByProvider() {
      return this.statisticsPerProvider
        .find(({ provider }, index) => `${provider.userId}_${index}` === this.selectedProvider);
    },
  },
};
