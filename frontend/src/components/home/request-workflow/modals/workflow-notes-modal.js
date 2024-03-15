import _ from 'lodash';
import RichTextEditor from '../../../rich-text-editor/rich-text-editor.vue';
import { emptyWorkflowNote } from '../../../../utils/workflow/workflow-helpers';

const NOTE_MODAL_ID = 'workflowNoteModal';

export default {
  components: {
    RichTextEditor,
  },
  props: {
    value: {
      type: Object,
      default: () => emptyWorkflowNote(),
    },
  },
  created() {
    // We need to update bootstrap-vue ASAP
    const hub = this.$root;
    const self = this;
    this.modalHiddenFunc = (event) => self.onModalHidden(event);
    hub.$on('bv::modal::hidden', this.modalHiddenFunc);
  },
  beforeDestroy() {
    // We need to update bootstrap-vue ASAP
    const hub = this.$root;
    hub.$off('bv::modal::hidden', this.modalHiddenFunc);
    this.modalHiddenFunc = null;
  },
  data() {
    return {
      show: false,
      modalHiddenFunc: null,
      workflowNote: emptyWorkflowNote(),
    };
  },
  watch: {
    value: {
      deep: true,
      immediate: true,
      handler(newValue, oldValue) {
        // if workflow index === -1 it means that it was not showing files
        const newWorkflowIndex = _.get(newValue, 'workflowIndex', -1);
        const oldWorkflowIndex = _.get(oldValue, 'workflowIndex', -1);
        const newTaskIndex = _.get(newValue, 'taskIndex', -1);
        const oldTaskIndex = _.get(oldValue, 'taskIndex', -1);
        const newProviderTaskIndex = _.get(newValue, 'providerTaskIndex', -1);
        const oldProviderTaskIndex = _.get(oldValue, 'providerTaskIndex', -1);
        const isSameIndex = _.isEqual(
          [newWorkflowIndex, newTaskIndex, newProviderTaskIndex],
          [oldWorkflowIndex, oldTaskIndex, oldProviderTaskIndex],
        );
        if (!isSameIndex && newWorkflowIndex >= 0) {
          this.workflowNote = newValue;
          // if newFiles is defined but oldFiles isn't
          // ensure modal open
          this.openNoteModal();
        }
      },
    },
  },
  computed: {
    canEdit() {
      return _.get(this.workflowNote, 'canEdit', false);
    },
    canEditNote() {
      return (this.canEditTask && this.canEditNow) || this.canEditAll;
    },
    canEditTask() {
      return _.get(this.workflowNote, 'canEditTask', false);
    },
    canEditNow() {
      return _.get(this.workflowNote, 'canEditNow', false);
    },
    canEditAll() {
      return _.get(this.workflowNote, 'canEditAll', false);
    },
    lockPreviouslyCompleted() {
      return _.get(this.workflowNote, 'lockPreviouslyCompleted', false);
    },
    noteModalId() {
      return NOTE_MODAL_ID;
    },
    isApprovedOrCancelled() {
      return _.get(this, 'workflowNote.isApprovedOrCancelled', false);
    },
  },
  methods: {
    closeNoteModal() {
      if (this.$refs.noteModal) {
        this.$refs.noteModal.hide();
      }
    },
    exit() {
      this.closeNoteModal();
    },
    openNoteModal() {
      if (this.$refs.noteModal) {
        this.$refs.noteModal.show();
      }
    },
    save() {
      const workflowNoteClone = { ...this.workflowNote };
      this.$emit('workflow-note-updated', workflowNoteClone);
      this.closeNoteModal();
    },
    onModalHidden(event) {
      if (event.componentId === NOTE_MODAL_ID) {
        this.workflowNote = emptyWorkflowNote();
        // avoid emitting the same object that will be allocated as value
        this.$emit('input', _.cloneDeep(this.workflowNote));
      }
    },
  },
};
