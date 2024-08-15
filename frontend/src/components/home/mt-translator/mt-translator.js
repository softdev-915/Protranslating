import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import MtTranslatorEditor from './components/mt-translator-editor/mt-translator-editor.vue';
import MtTranslatorSegmentation from './components/mt-translator-segmentation/mt-translator-segmentation.vue';
import MtTranslatorSettings from './components/mt-translator-settings/mt-translator-settings.vue';
import MtTranslatorInfo from './components/mt-translator-info/mt-translator-info.vue';
import MtModelService from '../../../services/mt-model-service';
import PortalMTService from '../../../services/portalmt-service';
import { errorNotification } from '../../../utils/notifications';
import userRoleCheckMixin from '../../../mixins/user-role-check';

export default {
  components: {
    MtTranslatorEditor,
    MtTranslatorSegmentation,
    MtTranslatorSettings,
    MtTranslatorInfo,
  },
  data() {
    return {
      mtModels: [],
      activeSegmentationRule: null,
      segmentationRules: [],
      settings: {
        segmentationType: 'LSP',
        segmentationCompany: null,
      },
      mtNode: '',
      isSettingsLoaded: false,
      isSegmentsActive: false,
    };
  },
  created() {
    this.mtModelService = new MtModelService();
    this.portalMTService = new PortalMTService();
    this.saveSettings = _.debounce(this._saveSettings, 1000);
    this.init();
  },
  mixins: [userRoleCheckMixin],
  watch: {
    settings(newValue) {
      const client = _.get(newValue, 'client', null);
      const userCompany = _.get(this.userLogged, 'company._id');
      if (this.userIsContact && this.canReadOnlyCompany && client !== userCompany) {
        const newSettings = {
          ...newValue,
          client: userCompany,
          isGeneral: true,
          isDisplayGeneral: true,
          isDisplayClient: true,
        };
        this.saveSettings(newSettings);
        this.settings = newSettings;
      }
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    inited() {
      return this.mtModels.length > 0 && this.isSettingsLoaded;
    },
    filteredByLanguage() {
      const sourceLanguage = _.get(this.settings, 'sourceLanguage', null);
      const targetLanguage = _.get(this.settings, 'targetLanguage', null);
      return this.mtModels.filter(model => (
        _.get(model, 'sourceLanguage.isoCode') === sourceLanguage
        && _.get(model, 'targetLanguage.isoCode') === targetLanguage
      ));
    },
    filteredByLanguageAndClient() {
      const industry = _.get(this.settings, 'industry', '');
      return this.filteredByLanguage.filter(model =>
        _.get(model, 'industry', '') === industry);
    },
    generalModel() {
      const isDisplayGeneral = _.get(this.settings, 'isDisplayGeneral', false);
      return isDisplayGeneral
        ? _.get(this.filteredByLanguage.find(model => model.isGeneral), 'code')
        : null;
    },
    industryModel() {
      const isDisplayIndustry = _.get(this.settings, 'isDisplayIndustry', false);
      const industry = _.get(this.settings, 'industry', null);
      return isDisplayIndustry && !_.isNil(industry)
        ? _.get(this.filteredByLanguage.find(model =>
          _.get(model, 'industry', '') === industry
          && _.get(model, 'client._id', null) === null
          && _.get(model, 'isGeneral', false) === false,
        ), 'code')
        : null;
    },
    clientModel() {
      const isDisplayClient = _.get(this.settings, 'isDisplayClient', false);
      const client = _.get(this.settings, 'client', null);
      const industry = _.get(this.settings, 'industry', null);
      return isDisplayClient && !_.isNil(client)
        ? _.get(this.filteredByLanguageAndClient.find(model =>
          _.get(model, 'industry', '') === industry
          && _.get(model, 'client._id', null) === client
          && _.get(model, 'isGeneral', false) === false),
        'code')
        : null;
    },
    suggestionModels() {
      return {
        general: this.generalModel,
        industry: this.industryModel,
        client: this.clientModel,
      };
    },
    canReadAll() {
      return this.hasRole('MT-TRANSLATOR_READ_ALL');
    },
    canReadCompany() {
      return this.hasRole('MT-TRANSLATOR_READ_COMPANY');
    },
    canReadOnlyCompany() {
      return this.canReadCompany && !this.canReadAll;
    },
    userIsContact() {
      return _.get(this.userLogged, 'type') === 'Contact';
    },
    isSourceLanguageSelected() {
      const srcLang = _.get(this.settings, 'sourceLanguage', '');
      return !_.isEmpty(srcLang);
    },
    areLanguagesSelected() {
      const tgtLang = _.get(this.settings, 'targetLanguage', '');
      return this.isSourceLanguageSelected && !_.isEmpty(tgtLang);
    },
    activeModel() {
      const sourceLanguage = _.get(this.settings, 'sourceLanguage', null);
      const targetLanguage = _.get(this.settings, 'targetLanguage', null);
      const isGeneral = _.get(this.settings, 'isGeneral', false);
      const industry = _.get(this.settings, 'industry', '');
      const client = _.get(this.settings, 'client', null);
      const activeModels = this.mtModels.filter(model => (
        _.get(model, 'sourceLanguage.isoCode') === sourceLanguage
                && _.get(model, 'targetLanguage.isoCode') === targetLanguage
                && (this.canReadOnlyCompany || model.isGeneral === isGeneral)
                && (isGeneral || _.get(model, 'industry', '') === industry)
                && (isGeneral || _.get(model, 'client._id', null) === client)
      ));
      let activeModel = activeModels.find(model => !_.isNil(_.get(model, 'client._id')));
      if (_.isNil(activeModel)) {
        activeModel = activeModels.find(model => model.isGeneral);
      }
      return activeModel || null;
    },
    activeModelName() {
      return _.get(this.activeModel, 'code', '');
    },
    hasSupportedSegmentationRules() {
      const selectedSrcLang = _.get(this.settings, 'sourceLanguage', '');
      return this.segmentationRules.some(sr => sr.language.isoCode === selectedSrcLang);
    },
    showSuggestionModelWarning() {
      const isDisplayClient = _.get(this.settings, 'isDisplayClient', false);
      const isDisplayIndustry = _.get(this.settings, 'isDisplayIndustry', false);
      const isDisplayGeneral = _.get(this.settings, 'isDisplayGeneral', false);
      return !(isDisplayClient || isDisplayIndustry || isDisplayGeneral);
    },

  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    async init() {
      try {
        await this.retrieveMtModels();
        await this.retrieveSettings();
      } catch (e) {
        this.pushNotification(errorNotification('Error loading Portal Translator', null, e));
      }
    },
    async retrieveMtModels() {
      const response = await this.mtModelService.retrieve({ filter: { deletedText: 'false' } });
      this.mtModels = response.data.list;
    },
    async retrieveSettings() {
      const response = await this.portalMTService.getSettings();
      const newSettings = _.get(response, 'data.portalMTSettings');
      if (!_.isEmpty(newSettings)) {
        if (this.userIsContact && this.canReadOnlyCompany) {
          const userCompany = _.get(this.userLogged, 'company');
          newSettings.segmentationCompany = userCompany;
        }
        this.$set(this, 'settings', newSettings);
      }
      this.isSettingsLoaded = true;
    },
    async _saveSettings(settings) {
      try {
        settings.client = _.isNil(settings.client) ? '' : settings.client;
        await this.portalMTService.saveSettings(settings);
      } catch (err) {
        this.pushNotification(errorNotification('Error saving Portal Translator settings', null, err));
      }
    },
    onSettingsChange(settings) {
      if (!_.isEqual(settings, this.settings)) {
        this.$set(this, 'settings', settings);
        this.saveSettings(_.clone(this.settings));
      }
    },
    onSegmentsActiveToggle(value) {
      this.isSegmentsActive = value;
    },
    setActiveSegmentationRule(value) {
      this.activeSegmentationRule = value;
    },
    setSegmentationRules(srs) {
      this.segmentationRules = srs;
    },
    setMtNode(mtNode) {
      this.mtNode = mtNode;
    },
  },
};
