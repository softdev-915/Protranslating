import {
  clearDragState, dragover, dragstart, dragend, drop,
} from '../../utils/dragndrop';

const clear = function () {
  clearDragState.call(this, true);
};

export default {
  props: {
    match: String,
  },
  created() {
    if (this.match) {
      try {
        this.regexp = new RegExp(this.match, 'i');
      } catch (e) {
        // ignore regexp error.
      }
    }
  },
  mounted() {
    this._addEvents();
  },
  beforeDestroy() {
    this._removeEvents();
  },
  data() {
    return {
      regexp: null,
      dragging: false,
      dragOver: false,
      dragStart: false,
      dragEnd: false,
    };
  },
  computed: {
    classes() {
      return {
        'drop-zone-over': this.dragOver,
        'drop-zone-start': this.dragStart,
        'drop-zone-end': this.dragEnd,
        'drop-zone-dragging': this.dragging,
      };
    },
  },
  methods: {
    _addEvents() {
      this.dragoverFn = dragover.bind(this);
      this.dragstartFn = dragstart.bind(this);
      this.dragendFn = dragend.bind(this);
      this.dropFn = drop.bind(this);
      this.clearFn = clear.bind(this);
      const dropZone = this.$refs.dropzone;
      dropZone.addEventListener('dragover', this.dragoverFn, false);
      dropZone.addEventListener('dragstart', this.dragstartFn, false);
      dropZone.addEventListener('dragend', this.dragendFn, false);
      dropZone.addEventListener('drop', this.dropFn);
      dropZone.addEventListener('dragexit', this.clearFn);
      dropZone.addEventListener('dragleave', this.clearFn);
    },
    _removeEvents() {
      const dropZone = this.$refs.dropzone;
      dropZone.removeEventListener('dragover', this.dragoverFn, false);
      dropZone.removeEventListener('dragstart', this.dragstartFn, false);
      dropZone.removeEventListener('dragend', this.dragendFn, false);
      dropZone.removeEventListener('drop', this.dropFn);
      dropZone.removeEventListener('dragexit', this.clearFn);
      dropZone.removeEventListener('dragleave', this.clearFn);
    },
    onFileDropped(file) {
      this.$emit('on-file-dropped', file);
    },
  },
};
