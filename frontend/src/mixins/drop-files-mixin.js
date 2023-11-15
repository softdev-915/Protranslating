export default {
  data() {
    return {
      regexp: null,
      dragging: false,
      dragOver: false,
      dragStart: false,
      dragEnd: false,
    };
  },
  mounted() {
    this._addDragDropEvents();
  },
  computed: {
    dragAndDropClasses() {
      const isInactive = !this.dragging && !this.dragOver && !this.dragStart && !this.dragEnd;
      return {
        'drop-zone-over': this.dragOver,
        'drop-zone-start': this.dragStart,
        'drop-zone-end': this.dragEnd,
        'drop-zone-dragging': this.dragging,
        'drop-zone-inactive': isInactive,
      };
    },
  },
};
