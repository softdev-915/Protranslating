import _ from 'lodash';
import SelectableTextEditorCustomField from '../../../report-preview/custom-fields/selectable-text-editor-custom-field.vue';

export default {
  extends: SelectableTextEditorCustomField,
  computed: {
    editorToolbar() {
      return _.get(this.componentOptions, 'toolbar', [
        ['fontname', ['fontname']],
        ['font', ['italic', 'underline']],
        ['para', ['ul', 'ol']],
        ['view', ['codeview']],
      ]);
    },
  },
};
