import _ from 'lodash';
import Draggable from 'vuedraggable';
import { Multipane, MultipaneResizer } from '../multipane';

export default {
  components: {
    Multipane,
    MultipaneResizer,
    Draggable,
  },
  props: {
    widgets: {
      type: Array,
      required: true,
    },
    side: {
      type: String,
      default: 'main',
    },
    isLeftMinimized: Boolean,
  },
  methods: {
    isLast(array, index) {
      return array.length === index + 1;
    },
    onPaneResizeStop(pane, container, size) {
      const index = +_.get(pane, 'dataset.widgetIndex', -1);
      const widget = this.widgets[index];
      this.$emit('paneResizeStop', {
        widgets: this.widgets, widget, index, pane, container, size,
      });
    },
    onPaneResize(pane, container, size, step, direction, offset) {
      const index = +_.get(pane, 'dataset.widgetIndex', -1);
      const widget = this.widgets[index];
      this.$emit('paneResize', { widgets: this.widgets, widget, index, pane, container, size, step, direction, offset });
    },
    onPaneResizeStart(pane, container, size) {
      const index = +_.get(pane, 'dataset.widgetIndex', -1);
      const widget = this.widgets[index];
      this.$emit('paneResizeStart', {
        widgets: this.widgets, widget, index, pane, container, size,
      });
    },
    canGrow(widgets, widget, index) {
      const isMinimized = _.get(widget, 'config.minimized', false);
      const isNextMinimized = _.get(widgets, `[${index + 1}].config.minimized`, false);
      return (this.isLast(widgets, index) || isNextMinimized) && !isMinimized;
    },
    getWidgetHeight(widget) {
      const isMinimized = _.get(widget, 'config.minimized', false);
      if (isMinimized) {
        return 'auto';
      }
      return _.get(widget, 'config.height', 'auto');
    },
    getConfigWithWrappedAttrs(widget) {
      return { ...widget.config, ...this.$attrs };
    },
    onDragEnd({ oldDraggableIndex, newDraggableIndex }) {
      this.$emit('drag', { widgets: this.widgets, index: oldDraggableIndex, newIndex: newDraggableIndex });
    },
    canMove(event) {
      const index = event.draggedContext.index / 3;
      return !_.get(this, `widgets[${index}].config.minimized`, false) && !this.isLeftMinimized;
    },
    onDragEnd({ oldDraggableIndex, newDraggableIndex }) {
      this.$emit('drag', { widgets: this.widgets, index: oldDraggableIndex, newIndex: newDraggableIndex });
    },
    canMove(event) {
      const index = event.draggedContext.index / 3;
      return !_.get(this, `widgets[${index}].config.minimized`, false) && !this.isLeftMinimized;
    },
    onDragEnd({ oldDraggableIndex, newDraggableIndex }) {
      this.$emit('drag', { widgets: this.widgets, index: oldDraggableIndex, newIndex: newDraggableIndex });
    },
    canMove(event) {
      const index = event.draggedContext.index / 3;
      return !_.get(this, `widgets[${index}].config.minimized`, false) && !this.isLeftMinimized;
    },
  },
};
