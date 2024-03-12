import _ from 'lodash';
import AbstractCustomField from './abstract-custom-field.vue';
import RichTextEditor from '../../rich-text-editor/rich-text-editor.vue';
import { toSelectOptionFormat } from '../../../utils/select2';

export default {
  extends: AbstractCustomField,
  components: { RichTextEditor },
  props: {
    componentOptions: {
      type: Object,
      required: false,
      default: () => ({}),
    },
  },
  created() {
    this.initOptions();
  },
  computed: {
    isValid() {
      return this.isValidSelect && this.isValidText;
    },
    isValidSelect() {
      const hasError = this.errors.has(`${this.templateKey}-select`);
      const isEmptyRequired = this.isRequired && _.isEmpty(this.valueModel.type);
      return !isEmptyRequired && !hasError;
    },
    isValidText() {
      const hasError = this.errors.has(`${this.templateKey}-text`);
      const isEmptyRequired = this.isRequired && (_.isEmpty(this.valueModel.value) || this.valueModel.value === '<p><br></p>');
      return !isEmptyRequired && !hasError;
    },
    editorToolbar() {
      return _.get(this.componentOptions, 'toolbar', [
        ['fontname', ['fontname']],
        ['font', ['italic', 'underline']],
        ['para', ['ul', 'ol']],
      ]);
    },
    editorOptions() {
      const editorOptions = _.get(this.componentOptions, 'editorOptions', {});
      const height = _.get(this.componentOptions, 'editorOptions.height', 400);
      const defaultFont = _.get(this.componentOptions, 'editorOptions.defaultFont', 'Barlow Regular');
      const customFonts = _.get(
        this.componentOptions,
        'editorOptions.customFonts',
        ['Barlow Regular', 'Barlow Medium', 'Barlow Semibold'],
      );
      return { height, defaultFont, customFonts, ...editorOptions };
    },
    getDefaultOptionsCallback() {
      return _.get(this.componentOptions, 'getDefaultOptions', () => ([]));
    },
    selectedType() {
      return toSelectOptionFormat(this.valueModel.type);
    },
    isDisabledTextEditor() {
      return _.isEmpty(this.valueModel.type);
    },
    selectorValueMap() {
      const result = {};
      this.valueModel.options.forEach((option) => {
        result[option.type] = option.value;
      });
      return result;
    },
    selectorOptions() {
      return Object.keys(this.selectorValueMap).map(toSelectOptionFormat);
    },
  },
  methods: {
    initOptions() {
      let options = _.get(this.valueModel, 'options', []);
      if (options.length === 0) {
        options = this.getDefaultOptionsCallback();
        this.valueModel.options = options;
      }
    },
    onOptionSelect(selectedType) {
      this.valueModel.type = selectedType.value;
      this.valueModel.value = _.get(this.selectorValueMap, this.valueModel.type, '');
    },
    onEditorInput(editorValue) {
      const value = editorValue.trim();
      const index = _.findIndex(
        this.valueModel.options,
        option => option.type === this.valueModel.type,
      );
      if (index !== -1) {
        this.valueModel.options[index].value = value;
        this.valueModel.value = value;
      }
    },
  },
};
