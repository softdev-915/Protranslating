import RichTextEditor from '../../rich-text-editor/rich-text-editor.vue';

export default {
  components: {
    RichTextEditor,
  },
  props: {
    disabled: Boolean,
    request: Object,
    isValidCommentsLength: Boolean,
    maxCommentsLength: Number,
  },
};
