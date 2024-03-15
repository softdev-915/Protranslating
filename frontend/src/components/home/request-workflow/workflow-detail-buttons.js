
export default {
  props: {
    isEditDisabled: {
      type: Boolean,
      default: false,
    },
    isSaveDisabled: {
      type: Boolean,
      default: false,
    },
    isCancelDisabled: {
      type: Boolean,
      default: false,
    },
    showMoveBtn: {
      type: Boolean,
      default: true,
    },
    isMoveDisabled: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    cancel() {
      this.$emit('workflow-cancel');
    },
    edit() {
      this.$emit('workflow-edit');
    },
    save() {
      this.$emit('workflow-save');
    },
    move(direction) {
      this.$emit('workflow-move', direction);
    },
  },
};
