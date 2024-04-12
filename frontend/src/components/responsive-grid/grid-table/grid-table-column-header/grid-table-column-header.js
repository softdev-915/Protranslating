/* eslint-disable no-console */
import MouseDownMoveUpFinish from '../../../../utils/mouse-down-move-up-finish';
import GridHeaderInput from './grid-header-input/grid-header-input.vue';

export default {
  components: {
    GridHeaderInput,
  },
  props: {
    column: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
    },
    sort: {
      type: String,
    },
    canSort: {
      type: Boolean,
      default: true,
    },
    filter: {
      type: Object,
    },
    useHeaderFilter: {
      type: Boolean,
    },
    loading: {
      type: Boolean,
    },
  },
  mounted: function () {
    this.currentWidth = this.column.width ? this.column.width : this.$refs.th.offsetWidth;
    const resizerElement = this.$refs.columnResizer;
    this.columnResizeHandler = new MouseDownMoveUpFinish(resizerElement, {
      onStart: this._onColumnResizeStart,
      onResize: this._onColumnResize,
      onFinish: this._onColumnResizeFinish,
      onClick: (event) => {
        event.stopPropagation();
        return false;
      },
    });
  },
  beforeDestroy: function () {
    this.columnResizeHandler.destroy();
  },
  data() {
    return {
      columnResizeHandler: null,
      widthChanged: false,
      resizing: false,
      resized: 0,
      currentWidth: 0,
      forceShowFilter: false,
    };
  },
  computed: {
    computedStyles: function () {
      if (this.resized) {
        const newWidth = this.currentWidth + this.resized;
        return { width: `${newWidth}px` };
      }
      if (this.widthChanged) {
        return { width: `${this.currentWidth}px` };
      }
      if (this.column.width) {
        return { width: `${this.column.width}px` };
      }
      return {};
    },
    sortDesc() {
      return this.sort === `-${this.column.prop}`;
    },
    sortAsc() {
      return this.sort === this.column.prop;
    },
    thClass() {
      return { 'no-pointer': !this.canSort };
    },
  },
  methods: {
    openSearchBox() {
      this.forceShowFilter = true;
    },
    onGridFilterClear(eventData) {
      this.forceShowFilter = false;
      this.$emit('grid-filter', eventData);
    },
    onGridFilter(eventData) {
      this.$emit('grid-filter', eventData);
    },
    fireSort() {
      if (this.canSort && this.column.sortable !== false) {
        const columnProp = this.column.prop;
        let sortCol = columnProp;
        if (this.sort === columnProp) {
          sortCol = `-${columnProp}`;
        }
        this.$emit('grid-sort', sortCol);
      }
    },
    _onColumnResizeStart() {
      document.body.className = `${document.body.className} pts-no-text-select`;
      if (!this.widthChanged) {
        this.currentWidth = this.column.width ? this.column.width : this.$refs.th.offsetWidth;
      }
      this.widthChanged = true;
    },
    _onColumnResizeFinish(coordinates) {
      document.body.className = document.body.className.replace('pts-no-text-select', '');
      this._onColumnResize(coordinates);
      const newWidth = this.currentWidth + this.resized;
      this.currentWidth = newWidth;
      this.resized = 0;
      const resizeEventData = { ...this.column, width: newWidth };
      this.$emit('grid-column-resize', resizeEventData);
    },
    _onColumnResize(coordinates) {
      this.resized = coordinates.x;
    },
  },
};
