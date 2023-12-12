import _ from 'lodash';
import { mapActions } from 'vuex';
import LanguageCombinationModal from './add-language-combination-modal.vue';
import MtEngineService from '../../services/mt-engine-service';
import SimpleBasicSelect from '../form/simple-basic-select.vue';
import MtModelService from '../../services/mt-model-service';
import { warningNotification } from '../../utils/notifications';

const PORTAL_MT_ENGINE = 'Portal MT';

export default {
  components: {
    LanguageCombinationModal,
    SimpleBasicSelect,
  },
  props: {
    value: Object,
    company: String,
    industry: String,
    isUserIpAllowed: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      isLoading: false,
      mtEngines: [],
      mtModels: [],
    };
  },
  created() {
    this.isLoading = true;
    this.mtEngineService = new MtEngineService();
    this.mtModelService = new MtModelService();
    this.init();
  },
  computed: {
    defaultMtEngine() {
      return this.mtEngines.find(engine => engine.mtProvider === 'Google MT');
    },
    defaultMtEngineId() {
      return _.get(this.defaultMtEngine, '_id', '');
    },
    isDefaultEnginePortalMt() {
      return _.get(this.defaultMtEngine, 'mtProvider') === PORTAL_MT_ENGINE;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    async init() {
      this.isLoading = true;
      await this.getMtEngines();
      await this.getMtModels();
      this.isLoading = false;
    },
    onAdd() {
      this.$refs.languageCombinationModal.show();
    },
    onSaveCombinations(data) {
      const { languageCombinations } = data;
      const { languageCombinations: existingLanguageCombinations } = this.value;
      const hasDuplicateLanguageCombination = languageCombinations
        .some(lc => existingLanguageCombinations.some(existingLc => lc.text === existingLc.text));
      if (hasDuplicateLanguageCombination) {
        this.pushNotification(warningNotification('Duplicate combinations in MT settings are not allowed', null, null, 'Warning'));
        return;
      }
      const newLanguageCombinations = existingLanguageCombinations.concat(languageCombinations);
      this.update('languageCombinations', newLanguageCombinations);
    },
    onIsActiveClick(combinationIndex) {
      const { languageCombinations } = this.value;
      const combination = _.clone(languageCombinations[combinationIndex]);
      combination.isActive = !combination.isActive;
      languageCombinations[combinationIndex] = combination;
      this.update('languageCombinations', languageCombinations);
    },
    onCombinationRemove(combinationIndex) {
      const { languageCombinations } = this.value;
      const clone = _.clone(languageCombinations);
      clone.splice(combinationIndex, 1);
      this.update('languageCombinations', clone);
    },
    update(key, value) {
      this.$emit('input', _.set(_.clone(this.value), key, value));
    },
    getClickHandler(handlerName, index) {
      const handler = {};
      if (this.isUserIpAllowed) {
        handler.click = () => this[handlerName](index);
      }
      return handler;
    },
    async getMtEngines() {
      const response = await this.mtEngineService.retrieve();
      this.mtEngines = _.get(response, 'data.list', []);
    },
    async getMtModels() {
      const response = await this.mtModelService.retrieve({ filter: { deletedText: 'false', isProductionReadyText: 'true' } });
      this.mtModels = _.get(response, 'data.list', []);
    },
    getCombinationAvailableEngines(combinationIndex) {
      const isPortalMtAvailable = this.checkIsPortalMtAvailable(combinationIndex);
      if (!isPortalMtAvailable) {
        return this.mtEngines.filter(engine => engine.mtProvider !== PORTAL_MT_ENGINE);
      }
      return this.mtEngines;
    },
    checkIsPortalMtAvailable(combinationIndex) {
      const { languageCombinations } = this.value;
      const combination = _.clone(languageCombinations[combinationIndex]);
      if (_.isNil(combination)) {
        return false;
      }
      const filteredByLanguage = this.mtModels.filter(model => (
        _.get(model, 'sourceLanguage.isoCode') === combination.srcLang
        && _.get(model, 'targetLanguage.isoCode') === combination.tgtLang
      ));
      return filteredByLanguage.length > 0;
    },
    formatEngine(engine) {
      return ({ value: engine._id, text: engine.mtProvider });
    },
    setMtEngine(mtEngine, combinationIndex) {
      const { languageCombinations } = this.value;
      const combination = _.clone(languageCombinations[combinationIndex]);
      combination.mtEngine = mtEngine;
      combination.isPortalMt = _.get(this.mtEngines.find(engine => engine._id === mtEngine), 'mtProvider') === PORTAL_MT_ENGINE;
      languageCombinations[combinationIndex] = combination;
      this.update('languageCombinations', languageCombinations);
    },
    getCombinationEngine(index) {
      const value = _.get(this.value, `languageCombinations[${index}].mtEngine`);
      return value;
    },
  },
};
