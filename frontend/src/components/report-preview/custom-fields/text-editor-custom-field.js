import _ from 'lodash';
import AbstractCustomField from './abstract-custom-field.vue';
import RichTextEditor from '../../rich-text-editor/rich-text-editor.vue';

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
  computed: {
    isValid() {
      const hasError = this.errors.has(this.templateKey);
      const isEmptyRequired = this.isRequired && (_.isEmpty(this.valueModel.value) || this.valueModel.value === '<p><br></p>');
      return !isEmptyRequired && !hasError;
    },
    editorToolbar() {
      return _.get(this.componentOptions, 'toolbar', [
        ['fontname', ['fontname']],
        ['font', ['italic', 'underline']],
        ['para', ['ul', 'ol']],
        ['view', ['codeview']],
      ]);
    },
    editorOptions() {
      const editorOptions = _.get(this.componentOptions, 'editorOptions', {});
      const height = _.get(this.componentOptions, 'editorOptions.height', 100);
      const defaultFont = _.get(this.componentOptions, 'editorOptions.defaultFont', 'Barlow Regular');
      const customFonts = _.get(
        this.componentOptions,
        'editorOptions.customFonts',
        ['Barlow Regular', 'Barlow Medium', 'Barlow Semibold'],
      );
      return { height, defaultFont, customFonts, ...editorOptions };
    },
  },
};
