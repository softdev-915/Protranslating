import _ from 'lodash';
import FileUpload from '../../file-upload/file-upload.vue';

import userRoleCheck from '../../../mixins/user-role-check';

const IMPORT_ANALYSIS_VIEW = 'import-analysis';
const PORTAL_IMPORT_ANALYSIS_VIEW = 'portal-import-analysis';

export default {
  mixins: [userRoleCheck],
  components: {
    FileUpload,
  },
  props: {
    request: {
      type: Object,
      required: true,
    },
    parseFunc: {
      type: Function,
      required: true,
    },
    isVisible: {
      type: Boolean,
      default: false,
    },
    requestAnalysis: {
      type: Array,
      default: (() => []),
    },
  },
  data() {
    return {
      importAnalysisId: 'import-analysis-container',
      csvType: 'per_file_all_information',
      analysisOption: 'client_analysis',
      activeView: IMPORT_ANALYSIS_VIEW,
      activeLanguageCombination: '',
      shouldImportAllPortalCATFiles: false,
      selectedDocuments: [],
      views: [],
    };
  },
  computed: {
    hasStatisticsRun() {
      return this.canReadStatistics && this.requestAnalysis.length > 0;
    },
    isValid() {
      return !_.isEmpty(this.activeLanguageCombination)
        && !_.isEmpty(this.analysisOption) && (
        this.shouldImportAllPortalCATFiles || this.hasSelectedFiles
      );
    },
    canReadStatistics() {
      return this.hasRole({
        oneOf: [
          'STATISTICS_READ_ALL',
          'STATISTICS_READ_OWN',
          'STATISTICS_READ_COMPANY',
        ],
      });
    },
    isImportalAnalysisModaliew() {
      return this.activeView === IMPORT_ANALYSIS_VIEW;
    },
    languageCombinations() {
      const languageCombinations = [];
      const langCombination = _.get(this.request, 'languageCombinations.0', []);
      langCombination.srcLangs.forEach((srcLang) => {
        langCombination.tgtLangs.forEach((tgtLang) => {
          languageCombinations.push({
            name: `${_.get(srcLang, 'name')} - ${_.get(tgtLang, 'name')}`,
            isoCode: `${_.get(srcLang, 'isoCode')}-${_.get(tgtLang, 'isoCode')}`,
          });
        });
      });
      return languageCombinations;
    },
    hasSelectedFiles() {
      return this.selectedDocuments.length > 0;
    },
    documents() {
      const originalLangCombination = _.get(this.request, 'languageCombinations.0', []);
      return _.get(originalLangCombination, 'documents', []);
    },
    requestId() {
      return _.get(this.request, '_id', '');
    },
  },
  mounted() {
    const vm = this.$root;
    vm.$on('hidden::modal', (id) => id === this.importAnalysisId
    && this.onAnalysisModalHidden());
  },
  watch: {
    isVisible(newValue) {
      if (newValue) {
        return this.$refs.importAnalysisModal.show();
      }
    },
    selectedDocuments(docs) {
      if (docs.length > 0) {
        this.shouldImportAllPortalCATFiles = false;
      }
    },
    activeView: {
      immediate: true,
      handler(view) {
        let newViews = [];
        switch (view) {
          case IMPORT_ANALYSIS_VIEW:
            newViews = [
              { text: 'Import Analysis', name: IMPORT_ANALYSIS_VIEW, isActive: true },
            ];
            break;
          case PORTAL_IMPORT_ANALYSIS_VIEW:
            newViews = [
              { text: 'Import Analysis', name: IMPORT_ANALYSIS_VIEW, isActive: false },
              { text: 'PortalCAT Import Options', name: PORTAL_IMPORT_ANALYSIS_VIEW, isActive: false },
            ];
            break;
          default:
            newViews = [];
        }
        this.views = newViews;
      },
    },
  },
  methods: {
    parseMemoqFile(file) {
      this.parseFunc({
        file,
        csvType: this.csvType,
        shouldImportPortalCat: false,
      });
      this.close();
    },
    close() {
      this.$refs.importAnalysisModal.hide();
      this.onAnalysisModalHidden();
      this.reset();
    },
    reset() {
      this.analysisOption = 'client_analysis';
      this.activeView = IMPORT_ANALYSIS_VIEW;
      this.activeLanguageCombination = '';
      this.shouldImportAllPortalCATFiles = false;
      this.selectedDocuments = [];
      this.views = [];
    },
    onAnalysisModalHidden() {
      this.$emit('on-analysis-modal-hidden');
    },
    enterPortalCatModal() {
      this.activeView = PORTAL_IMPORT_ANALYSIS_VIEW;
    },
    importPortalStatistics() {
      let statistics;
      for (let i = 0; i < this.requestAnalysis.length; i++) {
        const {
          statisticsByFile,
          statistics: statisticsForAllFiles,
        } = this.requestAnalysis[i];
        const srcLang = _.get(statisticsByFile, '[0].srcLang');
        const tgtLang = _.get(statisticsByFile, '[0].tgtLang');
        const languageCombination = `${srcLang}-${tgtLang}`;
        if (this.activeLanguageCombination === languageCombination) {
          if (this.shouldImportAllPortalCATFiles) {
            statistics = statisticsForAllFiles;
          } else {
            const selectedDocumentStatistics = statisticsByFile
              .filter((stFile) => this.selectedDocuments.includes(stFile.fileName));
            statistics = selectedDocumentStatistics.reduce((accStatistic, file) => {
              const fileStatistics = _.get(file, 'statistics');
              if (Object.keys(accStatistic).length === 0) {
                return fileStatistics;
              }
              Object.keys(fileStatistics)
                .forEach((key) => {
                  if (_.isObject(fileStatistics[key])) {
                    Object.keys(fileStatistics[key])
                      .forEach((innerKey) => {
                        accStatistic[key][innerKey] += fileStatistics[key][innerKey];
                      });
                  }
                });
              return accStatistic;
            }, {});
          }
          break;
        }
      }
      this.parseFunc({
        statistics,
        shouldImportPortalCat: true,
      });
      this.close();
    },
  },
};
