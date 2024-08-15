import _ from 'lodash';
import SimpleBasicSelect from '../../../../form/simple-basic-select.vue';
import LanguageSelect from '../../../../language-select/language-select.vue';
import { toLanguageOption } from '../../../../../utils/select2';

export default {
  components: {
    SimpleBasicSelect,
    LanguageSelect,
  },
  props: {
    mtModels: {
      type: Array,
    },
    settingsChange: {
      type: Function,
    },
    settings: {
      type: Object,
    },
    canReadAll: {
      type: Boolean,
    },
    canReadCompany: {
      type: Boolean,
    },
    showRequiredFields: {
      type: Boolean,
    },
  },
  computed: {
    isGeneralDisabled() {
      const sourceLanguage = _.get(this.settings, 'sourceLanguage');
      return _.isEmpty(sourceLanguage);
    },
    isIndustryDisabled() {
      const sourceLanguage = _.get(this.settings, 'sourceLanguage');
      const isGeneral = _.get(this.settings, 'isGeneral');
      return _.isEmpty(sourceLanguage) || isGeneral;
    },
    isClientDisabled() {
      const sourceLanguage = _.get(this.settings, 'sourceLanguage');
      const isGeneral = _.get(this.settings, 'isGeneral');
      return _.isEmpty(sourceLanguage) || isGeneral;
    },
    isLanguageSelectDisabled() {
      return !(this.canReadAll || this.canReadCompany);
    },
    sourceLanguages() {
      return _.uniqBy(this.mtModels, 'sourceLanguage.isoCode').map(model => model.sourceLanguage);
    },
    targetLanguages() {
      const sourceLanguage = _.get(this.settings, 'sourceLanguage');
      return _.uniqBy(this.mtModels, 'targetLanguage.isoCode')
        .filter(model => _.isNil(sourceLanguage) || model.sourceLanguage.isoCode === sourceLanguage)
        .map(model => model.targetLanguage);
    },
    industries() {
      const industries = _.uniqBy(this.modelsFilteredByLanguage, 'industry')
        .map(model => model.industry)
        .filter(industry => !_.isEmpty(industry))
        .map(industry => ({ value: industry, text: industry }));
      return industries;
    },
    clients() {
      const industry = _.get(this.settings, 'industry');
      const filteredByLanguageAndIndustry = this.modelsFilteredByLanguage.filter(model =>
        _.isEmpty(industry) || model.industry === industry);
      const clients = _.uniqBy(filteredByLanguageAndIndustry, 'client._id')
        .map(model => model.client)
        .filter(client => !_.isNil(client));
      return clients;
    },
    currentClient() {
      return _.get(this.settings, 'client', null);
    },
    modelsFilteredByLanguage() {
      const sourceLanguage = _.get(this.settings, 'sourceLanguage');
      const targetLanguage = _.get(this.settings, 'targetLanguage');
      return this.mtModels.filter(model =>
        (_.isEmpty(sourceLanguage) || model.sourceLanguage.isoCode === sourceLanguage)
        && (_.isEmpty(targetLanguage) || model.targetLanguage.isoCode === targetLanguage));
    },
  },
  methods: {
    formatLanguage: toLanguageOption,
    changeSourceLanguage(newLanguage) {
      const settings = _.clone(this.settings);
      settings.sourceLanguage = newLanguage;
      this.$emit('settings-change', settings);
    },

    changeTargetLanguage(newLanguage) {
      const settings = _.clone(this.settings);
      settings.targetLanguage = newLanguage;
      this.$emit('settings-change', settings);
    },

    changeIsGeneral(isGeneral) {
      const settings = _.clone(this.settings);
      settings.isGeneral = _.isNil(isGeneral) ? !settings.isGeneral : isGeneral;
      if (settings.isGeneral) {
        settings.client = null;
        settings.industry = '';
      }
      this.$emit('settings-change', settings);
    },

    changeIndustry(newIndustry) {
      const settings = _.clone(this.settings);
      if (settings.industry !== newIndustry) {
        settings.industry = newIndustry;
        if (!_.isEmpty(newIndustry)) {
          const filteredByLanguageAndIndustry = this.modelsFilteredByLanguage.filter(model =>
            model.industry === newIndustry);
          settings.client = filteredByLanguageAndIndustry.length === 1
            ? filteredByLanguageAndIndustry[0].client
            : null;
        }
        this.$emit('settings-change', settings);
      }
    },
    formatIndustry(industry) {
      return {
        text: industry.text,
        value: industry.value,
      };
    },

    changeClient(newClient) {
      const settings = _.clone(this.settings);
      settings.client = newClient;
      const currentIndustry = _.get(this.settings, 'industry');
      if (!_.isEmpty(newClient) && _.isEmpty(currentIndustry)) {
        const modelWithClient = this.mtModels.find(model => _.get(model, 'client._id') === newClient && !_.isEmpty(model.industry));
        const industry = _.get(modelWithClient, 'industry', null);
        if (!_.isNil(industry)) {
          settings.industry = industry;
        }
      }
      this.$emit('settings-change', settings);
    },
    formatClient(client) {
      return {
        text: client.hierarchy,
        value: client._id,
      };
    },

    changeIsDisplayGeneral() {
      const settings = _.clone(this.settings);
      settings.isDisplayGeneral = !settings.isDisplayGeneral;
      this.$emit('settings-change', settings);
    },

    changeIsDisplayIndustry() {
      const settings = _.clone(this.settings);
      settings.isDisplayIndustry = !settings.isDisplayIndustry;
      this.$emit('settings-change', settings);
    },

    changeIsDisplayClient() {
      const settings = _.clone(this.settings);
      settings.isDisplayClient = !settings.isDisplayClient;
      this.$emit('settings-change', settings);
    },
  },
};
