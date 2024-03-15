import _ from 'lodash';
import MtEngineService from '../../../services/mt-engine-service';
import DocumentTypeService from '../../../services/document-type-service';
import BreakdownService from '../../../services/breakdown-service';
import SrManagement from '../../sr-management/sr-management.vue';
import LspService from '../../../services/lsp-service';

const lspService = new LspService();
const mtEngineService = new MtEngineService();
const documentTypeService = new DocumentTypeService();
const breakDownService = new BreakdownService();
const mtThresholdRule = (value) => _.inRange(value, 0, 101) && Number.isInteger(+value);
const PC_SUPPORTED_EXTENSIONS = ['.mqxliff', '.docx', '.xlsx', '.pptx', '.html', '.xliff', '.idml', '.txt'];

export default {
  inject: ['$validator'],
  components: {
    SrManagement,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
    canRead: {
      type: Boolean,
      default: true,
    },
    canEdit: {
      type: Boolean,
      default: true,
    },
    languages: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      mtEngines: [],
      documentTypes: [],
      breakdowns: [],
    };
  },
  created() {
    this.retrieveAll();
    this.$validator.extend('mtThreshold', mtThresholdRule);
    this.resourcesService = lspService;
  },
  watch: {
    value() {
      this.validateForm();
    },
  },
  computed: {
    mtEngineName() {
      return _.get(this, 'value.mtEngine.mtProvider', '');
    },
    mtEngineId() {
      return _.get(this, 'value.mtEngine._id', '');
    },
    mtThreshold() {
      return _.get(this, 'value.mtThreshold', '');
    },
    mtEngineSelected() {
      return { value: this.mtEngineId, text: this.mtEngineName };
    },
    supportedFileFormats() {
      return _.get(this, 'value.supportedFileFormats', []);
    },
    supportedFileFormatsSelected() {
      return this.supportedFileFormats
        .map(({ _id, name, extensions }) => ({ value: _id, text: name, extensions }));
    },
    isValidSupportedFileFormats() {
      return this.supportedFileFormats
        .every(({ extensions = '' }) => PC_SUPPORTED_EXTENSIONS
          .some((extension) => extensions.includes(extension)));
    },
    lockedSegmentsExists() {
      return !_.isEmpty(this.value.lockedSegments);
    },
    lockedSegmentsSelected() {
      const lockedSegments = _.get(this, 'value.lockedSegments.segmentsToLock', []);
      return lockedSegments
        .map(({ _id, name }) => ({ value: _id, text: name }));
    },
    canUpdateRadioButtons() {
      const lockedSegments = _.get(this, 'value.lockedSegments.segmentsToLock', []);
      if (lockedSegments.length < 1) {
        return false;
      }
      return this.canEdit;
    },
  },
  methods: {
    retrieveAll() {
      this.retrieveMtEngines();
      this.retrieveDocumentTypes();
      this.retrieveBreakdowns();
    },
    async retrieveMtEngines() {
      const response = await mtEngineService.retrieve();
      const mtEngines = _.get(response, 'data.list', [])
        .map(({ _id, mtProvider }) => ({ value: _id, text: mtProvider }));
      this.mtEngines = mtEngines;
    },
    async retrieveDocumentTypes() {
      const response = await documentTypeService.retrieve();
      const docTypes = _.get(response, 'data.list', [])
        .map(({ _id, name, extensions }) => ({ value: _id, text: name, extensions }));
      this.documentTypes = docTypes;
    },
    async retrieveBreakdowns() {
      const response = await breakDownService.retrieve();
      const breakdowns = _.get(response, 'data.list', [])
        .map(({ _id, name }) => ({ value: _id, text: name }));
      this.breakdowns = breakdowns;
    },
    onMtEngineSelect({ value, text }) {
      const newValue = { _id: value, mtProvider: text };
      this.update('mtEngine', newValue);
    },
    onSupportedFileFormatsSelect(selectedValues) {
      const newValues = selectedValues
        .map(({ value, text, extensions }) => ({ _id: value, name: text, extensions }));
      this.update('supportedFileFormats', newValues);
    },
    onLockedSegmentsSelect(selectedValues) {
      const newValues = selectedValues
        .map(({ value, text }) => ({ _id: value, name: text }));
      this.update('lockedSegments.segmentsToLock', newValues);
      if (newValues.length < 1) {
        this.update('lockedSegments.newConfirmedBy', '');
      }
    },
    async update(key, value) {
      if (!_.isNil(_.get(value, 'target'))) {
        value = value.target.value;
      }
      const clone = _.clone(this.value);
      this.$emit('input', _.set(clone, key, value));
    },
    validateForm() {
      this.$nextTick(async () => {
        const isValid = await this.$validator.validateAll();
        this.$emit('validation', isValid && this.isValidSupportedFileFormats);
      });
    },
  },
};
