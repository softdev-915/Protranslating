import { mapActions } from 'vuex';
import _ from 'lodash';
import SimpleBasicSelect from '../../../../form/simple-basic-select.vue';
import CompanySelect from '../../../company/company-ajax-basic-select.vue';
import { toOption } from '../../../../../utils/select2';
import PortalMTService from '../../../../../services/portalmt-service';
import { errorNotification } from '../../../../../utils/notifications';

export default {
  components: {
    SimpleBasicSelect,
    CompanySelect,
  },
  props: {
    settingsChange: {
      type: Function,
    },
    activeSrChange: {
      type: Function,
    },
    isSegmentsActive: {
      type: Boolean,
    },
    segmentsActiveToggle: {
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
  },
  data() {
    return {
      segmentationTypes: ['LSP', 'Client'],
      segmentationRules: [],
      segmentationRule: null,
      inited: false,
    };
  },
  created() {
    this.portalMTService = new PortalMTService();
    this.init();
  },
  watch: {
    'settings.sourceLanguage': 'changeSegmentationFile',
    'settings.segmentationCompany': {
      async handler(newSegmentationCompany) {
        if (!_.isEmpty(newSegmentationCompany)) {
          await this.retrieveSegmentationRules(_.get(newSegmentationCompany, '_id'));
        }
        this.changeSegmentationFile();
      },
    },
  },
  computed: {
    isSegmentationTypeDisabled() {
      return _.isEmpty(this.settings.sourceLanguage);
    },
    isCompanySelectVisible() {
      return _.get(this.settings, 'segmentationType') === 'Client';
    },
    selectedCompany() {
      return toOption(this.settings.segmentationCompany, 'hierarchy');
    },
    companyFilter() {
      return { srFileLanguage: _.get(this.settings, 'sourceLanguage') };
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    async retrieveSegmentationRules(companyId) {
      try {
        const response = await this.portalMTService.getSegmentationRules(companyId);
        const segmentationRules = _.get(response, 'data.segmentationRulesList.descriptors', []);
        this.segmentationRules = segmentationRules;
        this.$emit('segmentation-rules-received', segmentationRules);
      } catch (err) {
        const message = _.get(err, 'status.message', '');
        this.pushNotification(errorNotification(`Error loading segmentation rules. ${message}`));
      }
    },
    changeSegmentationType(value) {
      const settings = _.clone(this.settings);
      settings.segmentationType = value;
      if (value === 'LSP') {
        settings.segmentationCompany = null;
      }
      this.$emit('settings-change', settings);
      this.retrieveSegmentationRules().then(this.changeSegmentationFile);
    },
    changeCompany(value) {
      const settings = _.clone(this.settings);
      settings.segmentationCompany = _.isEmpty(value) ? {} : _.pick(value, ['_id', 'name', 'hierarchy']);
      this.$emit('settings-change', settings);
    },
    changeSegmentationFile() {
      const sourceLanguage = _.get(this.settings, 'sourceLanguage');
      const segmentationCompany = _.get(this.settings, 'segmentationCompany');
      const segmentationRule = this.segmentationRules.find(file =>
        file.language.isoCode === sourceLanguage
        && file.companyId === _.get(segmentationCompany, '_id', null));
      if (!_.isNil(segmentationRule)) {
        this.$emit('active-sr-change', segmentationRule._id);
      }
    },
    changeMaxSuggestions(event) {
      const maxSuggestions = Number(_.get(event, 'target.value', 0));
      const settings = _.clone(this.settings);
      settings.maxSuggestions = maxSuggestions;
      this.$emit('settings-change', settings);
    },
    init() {
      const segmentationType = _.get(this.settings, 'segmentationType', 'LSP');
      const segmentationCompany = _.get(this.settings, 'segmentationCompany._id', null);
      this.selectedSegmentationType = segmentationType;
      if (!_.isNil(segmentationCompany)) {
        this.company = { _id: segmentationCompany };
      }
      this.retrieveSegmentationRules(segmentationCompany).then(this.changeSegmentationFile);
      this.inited = true;
    },
    onSegmentsClick() {
      this.$emit('segments-active-toggle', !this.isSegmentsActive);
    },
  },
};
