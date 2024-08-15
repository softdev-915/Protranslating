/* global document window */
import _ from 'lodash';
import { mapActions } from 'vuex';
import PortalMTService from '../../../../../../services/portalmt-service';
import { errorNotification } from '../../../../../../utils/notifications';

export default {
  data() {
    return {
      isLoading: false,
      isLoaded: false,
      suggestions: [],
      selectedSuggestion: {
        model: null,
        index: null,
      },
    };
  },
  created() {
    this.portalMtService = new PortalMTService();
    this.loadSuggestions();
  },
  mounted() {
    window.addEventListener('keydown', this.keydownListener);
    window.addEventListener('click', this.clickListener);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.keydownListener);
    window.removeEventListener('click', this.clickListener);
  },
  computed: {
    suggestionModelsArray() {
      return _.uniq(Object.keys(this.suggestionModels)
        .map(key => this.suggestionModels[key])
        .filter(model => !_.isNil(model)));
    },
    generalSuggestions() {
      return this.getModelTranslations('general');
    },
    industrySuggestions() {
      return this.getModelTranslations('industry');
    },
    clientSuggestions() {
      return this.getModelTranslations('client');
    },
    allSuggestions() {
      const allSuggestions = [];
      if (this.clientSuggestions.length > 0) {
        allSuggestions.push({
          name: 'Client',
          modelType: 'client',
          suggestions: this.clientSuggestions.map(this.formatSuggestionText),
          e2eType: 'suggestions-client',
        });
      }
      if (this.industrySuggestions.length > 0) {
        allSuggestions.push({
          name: 'Industry',
          modelType: 'industry',
          suggestions: this.industrySuggestions.map(this.formatSuggestionText),
          e2eType: 'suggestions-industry',
        });
      }
      if (this.generalSuggestions.length > 0) {
        allSuggestions.push({
          name: 'General',
          modelType: 'general',
          suggestions: this.generalSuggestions.map(this.formatSuggestionText),
          e2eType: 'suggestions-general',
        });
      }
      return allSuggestions;
    },
  },
  props: {
    settings: {
      type: Object,
    },
    source: {
      type: String,
    },
    prefix: {
      type: String,
    },
    input: {
      type: Function,
    },
    suggestionModels: {
      type: Object,
    },
    coords: {
      type: Object,
    },
  },
  watch: {
    selectedSuggestion(newValue) {
      if (!_.isNil(newValue.model) && !_.isNil(newValue.index)) {
        const modelIndex = _.findIndex(
          this.allSuggestions,
          model => model.modelType === newValue.model
        );
        const element = document.querySelector(
          `.suggestion-group:nth-of-type(${modelIndex + 1}) > .suggestion-text:nth-of-type(${newValue.index + 2})`
        );
        if (!_.isNil(element)) {
          element.scrollIntoView({ block: 'nearest' });
        }
      }
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    async loadSuggestions() {
      this.isLoading = true;
      this.isLoaded = false;
      const request = {
        models: this.suggestionModelsArray,
        source: this.source,
        prefix: this.prefix,
        sourceLang: _.get(this.settings, 'sourceLanguage'),
        targetLang: _.get(this.settings, 'targetLanguage'),
      };
      try {
        const maxSuggestions = _.get(this.settings, 'maxSuggestions', 0);
        const response = await this.portalMtService.getSuggestions(request);
        let suggestions = _.get(response, 'data.suggestions');
        this.$emit('set-mt-node', _.get(response, 'data.mtNode', ''));
        suggestions = suggestions.map((model) => {
          const newModel = _.cloneDeep(model);
          newModel.translation = newModel.translation.map(
            suggestion => suggestion.slice(this.prefix.length, suggestion.length)
          );
          if (maxSuggestions > 0) {
            newModel.translation = newModel.translation.slice(0, maxSuggestions);
          }
          return newModel;
        });
        this.suggestions = suggestions;
        this.isLoading = false;
        this.isLoaded = true;
      } catch (err) {
        this.isLoading = false;
        this.isLoaded = true;
        const message = _.get(err, 'status.data.detail', '') || _.get(err, 'status.message', '');
        this.pushNotification(errorNotification(`Error loading suggestions for models: ${this.suggestionModelsArray.join(', ')}. ${message}`));
        this.$emit('close');
      }
    },
    getModelTranslations(modelType) {
      const model = _.get(this.suggestionModels, modelType);
      return !_.isNil(model)
        ? _.get(this.suggestions.find(suggestion => suggestion.model_name === model), 'translation', [])
        : [];
    },
    selectSuggestion(model, index) {
      this.$emit('input', this.getModelTranslations(model)[index]);
    },
    clickListener(event) {
      if (!_.isNil(this.$refs.dropdown)
        && !this.$refs.dropdown.contains(event.target)
        && this.$refs.dropdown.parentNode !== event.target) {
        this.$emit('close');
      }
    },
    keydownListener(event) {
      switch (event.keyCode) {
        case 40:
          event.preventDefault();
          this.selectNextSuggestion();
          break;
        case 38:
          event.preventDefault();
          this.selectPreviousSuggestion();
          break;
        case 13:
          event.preventDefault();
          this.$emit('input', this.getModelTranslations(this.selectedSuggestion.model)[this.selectedSuggestion.index]);
          break;
        case 27:
          event.preventDefault();
          this.$emit('close');
          break;
        default:
          break;
      }
    },
    selectFirstSuggestion() {
      const firstModel = _.first(this.allSuggestions);
      if (!_.isNil(firstModel)) {
        this.selectedSuggestion = {
          model: firstModel.modelType,
          index: 0,
        };
      }
    },
    selectLastSuggestion() {
      const lastModel = _.last(this.allSuggestions);
      if (!_.isNil(lastModel)) {
        this.selectedSuggestion = {
          model: lastModel.modelType,
          index: lastModel.suggestions.length - 1,
        };
      }
    },
    selectNextSuggestion() {
      if (_.isNil(this.selectedSuggestion.model) || _.isNil(this.selectedSuggestion.index)) {
        this.selectFirstSuggestion();
      } else {
        const currentModel = this.allSuggestions.find(
          model => model.modelType === this.selectedSuggestion.model
        );
        if (currentModel.suggestions.length - 1 > this.selectedSuggestion.index) {
          this.selectedSuggestion = {
            model: this.selectedSuggestion.model,
            index: this.selectedSuggestion.index + 1,
          };
        } else {
          const nextModelIndex = _.findIndex(this.allSuggestions,
            model => model.modelType === this.selectedSuggestion.model) + 1;
          const nextModel = this.allSuggestions[nextModelIndex];
          if (!_.isNil(nextModel)) {
            this.selectedSuggestion = {
              model: nextModel.modelType,
              index: 0,
            };
          } else {
            this.selectFirstSuggestion();
          }
        }
      }
    },
    selectPreviousSuggestion() {
      if (_.isNil(this.selectedSuggestion.model) || _.isNil(this.selectedSuggestion.index)) {
        this.selectLastSuggestion();
      } else if (this.selectedSuggestion.index > 0) {
        this.selectedSuggestion = {
          model: this.selectedSuggestion.model,
          index: this.selectedSuggestion.index - 1,
        };
      } else {
        const previousModelIndex = _.findIndex(this.allSuggestions,
          model => model.modelType === this.selectedSuggestion.model) - 1;
        const previousModel = this.allSuggestions[previousModelIndex];
        if (!_.isNil(previousModel)) {
          this.selectedSuggestion = {
            model: previousModel.modelType,
            index: previousModel.suggestions.length - 1,
          };
        } else {
          this.selectLastSuggestion();
        }
      }
    },
    formatSuggestionText(text) {
      const firstThreeWords = text.split(' ').slice(0, 4);
      return `${firstThreeWords.join(' ')}...`;
    },
  },
};
