import _ from 'lodash';
import { mapActions } from 'vuex';
import PortalMTService from '../../../../../services/portalmt-service';
import EditorView from './editor-view/editor-view.vue';
import SegmentView from './segment-view/segment-view.vue';
import { errorNotification } from '../../../../../utils/notifications';

export default {
  props: {
    settings: {
      type: Object,
    },
    activeModel: {
      type: Object,
    },
    suggestionModels: {
      type: Object,
    },
    segmentationRule: {
      type: String,
    },
    isSegmentsActive: {
      type: Boolean,
    },
    canReadAll: {
      type: Boolean,
    },
    canReadCompany: {
      type: Boolean,
    },
  },
  components: { EditorView, SegmentView },
  data() {
    return {
      text: '',
      isSegmentationLoading: false,
      isSegmentationCompleted: false,
      segmentedText: [],
      isTranslationLoading: false,
      isTranslationCompleted: false,
      translatedText: [],
      activeSegment: null,
    };
  },
  created() {
    this.portalMTService = new PortalMTService();
  },
  computed: {
    isSourceDisabled() {
      return (
        _.isNil(this.activeModel) ||
              _.isNil(this.segmentationRule) ||
              !(this.canReadCompany || this.canReadAll)
      );
    },
  },
  watch: {
    segmentedText(v) {
      if (this.isSegmentationCompleted) {
        this.text = v.join(' ');
      }
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onInput(text) {
      this.text = text;
      if (_.isEmpty(text)) {
        this.segmentedText = [];
        this.isSegmentationCompleted = false;
      }
    },
    async getTranslation() {
      try {
        if (!this.isSegmentationLoading && !this.isTranslationLoading && !_.isEmpty(this.text)) {
          await this.loadSegmentation();
          await this.loadTranslation();
        }
      } catch (err) {
        this.isTranslationLoading = false;
        this.isSegmentationLoading = false;
        const message = _.get(err, 'status.data.detail', '') || _.get(err, 'status.message', '');
        this.pushNotification(errorNotification(`Error loading translation for model ${_.get(this, 'activeModel.code')} and segmentation rule: ${this.segmentationRule}\n${message}`));
      }
    },
    async loadSegmentation() {
      if (!this.isSegmentationLoading && !_.isEmpty(this.text)) {
        this.isSegmentationLoading = true;
        const langCode = _.get(this.settings, 'sourceLanguage');
        const companyId = _.get(this.settings, 'segmentationCompany._id');
        const response = await this.portalMTService.segmentText({
          langCode,
          text: this.text,
          srId: this.segmentationRule,
          companyId,
        });
        this.segmentedText = _.get(response, 'data.segmentedText');
        this.isSegmentationLoading = false;
        this.isSegmentationCompleted = true;
      }
    },
    async loadTranslation() {
      this.isTranslationLoading = true;
      const sourceLang = _.get(this.activeModel, 'sourceLanguage.isoCode');
      const targetLang = _.get(this.activeModel, 'targetLanguage.isoCode');
      const model = _.get(this.activeModel, 'code');
      const response = await this.portalMTService.translateSegments({
        source: this.segmentedText,
        sourceLang,
        targetLang,
        model,
      });
      this.translatedText = _.get(response, 'data.translatedText', []);
      this.$emit('set-mt-node', _.get(response, 'data.mtNode', ''));
      this.isTranslationLoading = false;
      this.isTranslationCompleted = true;
    },
    selectSegment(index) {
      this.activeSegment = index;
    },
    suggestionInput(wordIndex, text) {
      const segment = _.clone(this.translatedText[this.activeSegment]);
      segment.splice(wordIndex, segment.length - wordIndex, ...text.split(' '));
      this._changeCurrentTranslatedSegment(segment);
    },
    changeTranslatedSegment(text) {
      this._changeCurrentTranslatedSegment(text);
    },
    _changeCurrentTranslatedSegment(text) {
      const translatedText = _.clone(this.translatedText);
      translatedText.splice(this.activeSegment, 1, !_.isEmpty(text) ? text : undefined);
      this.translatedText = translatedText;
    },
    sourceInput(text, replaceAll = false) {
      if (replaceAll) {
        this.segmentedText = [text];
        return;
      }
      const segmentedText = _.clone(this.segmentedText);
      segmentedText.splice(this.activeSegment, 1, !_.isEmpty(text) ? text : undefined);
      this.segmentedText = segmentedText;
    },
    setMtNode(mtNode) {
      this.$emit('set-mt-node', mtNode);
    },
  },
};
