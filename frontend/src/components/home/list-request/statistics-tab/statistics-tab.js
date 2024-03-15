import { mapActions, mapGetters } from 'vuex';
import moment from 'moment';
import _ from 'lodash';
import StatisticsTable from '../statistics-table/statistics-table.vue';
import StatisticsExportModal from '../statistics-export-modal/statistics-export-modal.vue';
import StatisticsPerLanguageCombination from '../statistics-per-language-combination/statistics-per-language-combination.vue';
import PortalCatService from '../../../../services/portalcat-service';
import { hasRole } from '../../../../utils/user';

const portalCatService = new PortalCatService();

export default {
  components: {
    StatisticsTable,
    StatisticsExportModal,
    StatisticsPerLanguageCombination,
  },
  props: {
    tab: {
      type: Object,
      required: true,
    },
    allTabs: {
      type: Array,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    request: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      loading: false,
      selectedLanguageCombinations: new Set(),
      expandedLanguageCombinations: new Set(),
      requestAnalysis: [],
      exportableStatistics: [],
    };
  },
  async created() {
    try {
      const { params: { requestId } } = this.$route;
      const { withFuzzyMatches } = this.tab;
      this.loading = true;
      const { data: { requestAnalysis } } =
        await portalCatService.getRequestAnalysis(requestId, withFuzzyMatches);
      this.requestAnalysis = requestAnalysis;
    } catch (error) {
      this.pushNotification({
        title: 'Error',
        message: _.get(error, 'status.message', 'Something went wrong, please try again later.'),
        state: 'danger',
        response: error,
      });
    }
    this.loading = false;
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    openExportModal() {
      this.$refs.statisticsExportModal.open();
    },
    toggle(collection, element) {
      const newCollection = new Set(collection);
      if (newCollection.has(element)) {
        newCollection.delete(element);
      } else {
        newCollection.add(element);
      }
      return newCollection;
    },
    toggleLanguageCombinationView(lc) {
      this.expandedLanguageCombinations = this.toggle(this.expandedLanguageCombinations, lc);
    },
    toggleLanguageCombination(lc) {
      this.selectedLanguageCombinations = this.toggle(this.selectedLanguageCombinations, lc);
    },
    selectAllLanguageCombinations() {
      const lcs = this.statisticsPerLanguageCombination
        .map(({ languageCombination }) => languageCombination);
      this.selectedLanguageCombinations = new Set(lcs);
    },
    resetSelectedLanguageCombinations() {
      this.selectedLanguageCombinations = new Set();
    },
    updateExportableStatistics(languageCombination, exportData) {
      const foundStatisticsIndex = this.exportableStatistics
        .findIndex(({ languageCombination: lc }) => lc === languageCombination);
      if (_.isNil(exportData)) {
        if (foundStatisticsIndex !== -1) {
          this.exportableStatistics.splice(foundStatisticsIndex, 1);
        }
      } else if (foundStatisticsIndex === -1) {
        this.exportableStatistics.push({
          languageCombination,
          ...exportData,
        });
      } else {
        this.exportableStatistics.splice(foundStatisticsIndex, 1, {
          languageCombination,
          ...exportData,
        });
      }
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    statisticsPerLanguageCombination() {
      const statsPerLc = [];
      this.requestAnalysis.forEach(({
        userId,
        userName,
        statisticsByFile,
        statistics: statisticsForAllFiles,
      }) => {
        const srcLang = _.get(statisticsByFile, '[0].srcLang');
        const tgtLang = _.get(statisticsByFile, '[0].tgtLang');
        const languageCombination = `${srcLang}-${tgtLang}`;
        const statisticsByFileSorted = statisticsByFile
          .sort((a, b) => a.fileName.localeCompare(b.fileName));
        const allFileNames = statisticsByFileSorted.map(({ fileName }) => fileName);
        const foundStat = statsPerLc
          .find(({ languageCombination: lc }) => lc === languageCombination);
        const providerStatistics = {
          provider: {
            userId,
            userName,
          },
          statistics: [
            {
              statistics: statisticsForAllFiles,
              fileName: `All files: ${allFileNames.join(', ')}`,
            },
            ...statisticsByFileSorted,
          ] };
        if (_.isNil(foundStat)) {
          const groupedStatisticsByLC = {
            languageCombination,
            statisticsPerProvider: [providerStatistics],
          };
          statsPerLc.push(groupedStatisticsByLC);
        } else {
          foundStat.statisticsPerProvider.push(providerStatistics);
        }
      });
      return statsPerLc;
    },
    analysisCreatedAt() {
      const createdAt = _.get(_.last(this.requestAnalysis), 'createdAt');
      return _.isEmpty(createdAt) ? '' : moment(createdAt).format('YYYY-MM-DD [at] HH:MM');
    },
    areAllLanguageCombinationsSelected() {
      return (this.statisticsPerLanguageCombination.length &&
        this.selectedLanguageCombinations.size === this.statisticsPerLanguageCombination.length);
    },
    isTabNameVisible() {
      const canReadAll = hasRole(this.userLogged, 'STATISTICS_READ_ALL');
      const canReadCompany = hasRole(this.userLogged, 'STATISTICS_READ_COMPANY');
      return canReadAll || canReadCompany;
    },
  },
};
