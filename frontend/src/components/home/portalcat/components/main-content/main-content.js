import _ from 'lodash';
import { Multipane, MultipaneResizer } from '../multipane';
import PanesBuilder from '../panes-builder/panes-builder.vue';
import { sortWidgets } from '../../helpers';
import PcStoreMixin from '../../mixins/pc-store-mixin';

const MIN_SIDE_WIDTH_PIXELS = 100;
const MIN_SIDE_WIDTH_PERCENTS = 5;

export default {
  mixins: [PcStoreMixin],
  components: {
    Multipane,
    MultipaneResizer,
    PanesBuilder,
  },
  props: {
    value: {
      type: Object,
      default: {},
    },
    defaultConfig: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      isLeftSideMinimized: false,
      paneMinHeight: null,
      paneResizerHeight: null,
    };
  },
  watch: {
    value() {
      this.$nextTick(() => {
        this.isLeftSideMinimized = this.shouldSideMinimize();
      });
    },
  },
  computed: {
    widgets() {
      return _.get(this.value, 'widgets', []);
    },
    leftWidth() {
      return _.get(this.value, 'leftWidth', 'auto');
    },
    leftSideWidgets() {
      return this.widgetsByPosition(this.widgets, 'left-side');
    },
    mainWidgets() {
      return this.widgetsByPosition(this.widgets, 'main');
    },
  },
  methods: {
    emit(widgets, leftWidth) {
      const setConfig = _.clone(this.value);
      if (!_.isNil(widgets)) {
        _.set(setConfig, 'widgets', widgets);
      }
      if (!_.isNil(leftWidth)) {
        _.set(setConfig, 'leftWidth', leftWidth);
      }
      this.$emit('input', setConfig);
    },
    widgetsByPosition(widgets, position) {
      return widgets.filter(widget => _.get(widget, 'config.position') === position);
    },
    getPaneResizerHeight() {
      this.paneResizerHeight = this.paneResizerHeight
        || Number.parseFloat(
          window.getComputedStyle(
            document.querySelector('.multipane.layout-h .multipane-resizer'),
          ).getPropertyValue('height'),
        );
      return this.paneResizerHeight;
    },
    getWidgetHeight(widget, el) {
      const widgetHeightRaw = _.get(widget, 'config.height', 'auto');
      let widgetHeight = Number.parseFloat(widgetHeightRaw);
      if (_.isNaN(widgetHeight) || widgetHeightRaw.includes('%')) {
        widgetHeight = Number.parseFloat(window.getComputedStyle(el).getPropertyValue('height'));
      }
      return widgetHeight;
    },
    onMinimize({ widget, widgets, index, el }) {
      if (_.get(widget, 'config.minimized', false)) {
        return;
      }
      let widgetsLeft = widgets.filter(widgetLeft =>
        widgetLeft.name !== widget.name && !widgetLeft.config.minimized);
      if (_.isEmpty(widgetsLeft)) {
        const nextWidget = widgets[index + 1];
        if (!_.isNil(nextWidget)) {
          widgetsLeft = [nextWidget];
        }
      }
      const widgetHeight = this.getWidgetHeight(widget, el);
      widget.config = Object.assign({}, _.get(widget, 'config', {}), { height: 'auto', minimized: true });
      this.paneMinHeight = this.paneMinHeight ||
          Number.parseFloat(window.getComputedStyle(el).getPropertyValue('min-height'));
      const heightToAdd = (widgetHeight - this.paneMinHeight) / widgetsLeft.length;
      widgetsLeft.forEach((wdigetLeft, widgetLeftIndex) => {
        const adjustedIndex = widgetLeftIndex === index ? widgetLeftIndex + 1 : widgetLeftIndex;
        const widgetLeftEl = el.parentElement.querySelector(`[data-widget-index="${adjustedIndex}"]`);
        const widgetLeftHeight = this.getWidgetHeight(wdigetLeft, widgetLeftEl);
        const newWidgetLeftHeight = `${widgetLeftHeight + heightToAdd}px`;
        wdigetLeft.config = Object.assign({}, _.get(wdigetLeft, 'config', {}), { height: newWidgetLeftHeight, minimized: false });
      });
      this.handleDrag({ widgets, index, newIndex: widgets.length - 1 });
    },
    onMaximize({ widget, widgets, sideName, index }) {
      widget.config = Object.assign({}, _.get(widget, 'config', {}), { height: '100%', minimized: false });
      _.without(widgets, widget).forEach((siblingWidget) => {
        siblingWidget.config = Object.assign({}, _.get(siblingWidget, 'config', {}), { minimized: true, height: 'auto' });
      });
      this.handleDrag({ widgets, index, newIndex: 0 });
      if (sideName === 'leftSide' && this.isLeftSideMinimized) {
        this.isLeftSideMinimized = false;
        this.emit(null, this.defaultConfig.leftWidth);
      }
    },
    handlePaneResize({
      index,
      widgets,
      pane,
      targetWidget,
      targetWidgetEl,
      depth,
      step,
      widget,
      size,
      targetWidgetIndex,
    }) {
      const calcResults =
        this.calculateDimensions({ widget, size, step, targetWidget, targetWidgetEl });
      if (_.isNil(calcResults)) {
        return;
      }
      const { prevHeight, nextWidgetHeight } = calcResults;
      let { newHeight, nextWidgetNewHeight } = calcResults;
      let sourceWidgetIndex = -1;
      if (newHeight === this.paneMinHeight) {
        nextWidgetNewHeight = nextWidgetHeight + (prevHeight - newHeight);
        _.set(targetWidget, 'config.height', `${nextWidgetNewHeight}px`);
        sourceWidgetIndex = index - 1;
        const sourceWidget = widgets[sourceWidgetIndex];
        if (!_.isNil(sourceWidget)) {
          const sourceWidgetEl = pane.parentElement.querySelector(`[data-widget-index="${sourceWidgetIndex}"]`);
          let sourceWidgetSize = _.get(sourceWidget, 'config.height');
          if (_.isNaN(Number.parseFloat(sourceWidgetSize)) || (_.isString(sourceWidgetSize) && sourceWidgetSize.includes('%'))) {
            sourceWidgetSize = window.getComputedStyle(sourceWidgetEl).getPropertyValue('height');
          }
          this.handlePaneResize({
            widget: sourceWidget,
            size: `${Math.floor(Number.parseFloat(sourceWidgetSize))}px`,
            pane: sourceWidgetEl,
            widgets,
            index: sourceWidgetIndex,
            targetWidget,
            targetWidgetEl,
            targetWidgetIndex,
            step,
            depth: depth + 1,
          });
        }
      } else {
        _.set(targetWidget, 'config.height', `${nextWidgetNewHeight}px`);
      }
      let newTargetWidgetIndex = -1;
      if (nextWidgetNewHeight === this.paneMinHeight) {
        newHeight = prevHeight + (nextWidgetHeight - nextWidgetNewHeight);
        _.set(widget, 'config.height', `${newHeight}px`);
        newTargetWidgetIndex = targetWidgetIndex + 1;
        const newTargetWidget = widgets[newTargetWidgetIndex];
        if (!_.isNil(newTargetWidget) && !newTargetWidget.config.minimized) {
          const newTargetWidgetEl = pane.parentElement.querySelector(`[data-widget-index="${newTargetWidgetIndex}"]`);
          this.handlePaneResize({
            widget,
            size,
            pane,
            widgets,
            index,
            targetWidget: newTargetWidget,
            targetWidgetEl: newTargetWidgetEl,
            targetWidgetIndex: newTargetWidgetIndex,
            step,
            depth: depth + 1,
          });
        }
      } else {
        _.set(widget, 'config.height', `${newHeight}px`);
      }
      _.set(targetWidget, 'config.minimized', false);
    },
    calculateDimensions({ widget, size, step, targetWidget, targetWidgetEl }) {
      const prevHeightRaw = _.get(widget, 'config.height', 'auto');
      if (_.isString(prevHeightRaw) && prevHeightRaw.includes('%')) {
        _.set(widget, 'config.height', size);
        return;
      }
      const prevHeight = Number.parseFloat(prevHeightRaw);
      let newHeight = prevHeight + step;
      if (newHeight < this.paneMinHeight) {
        newHeight = this.paneMinHeight;
      }
      const nextWidgetHeight = this.getWidgetHeight(targetWidget, targetWidgetEl);
      let nextWidgetNewHeight = nextWidgetHeight - (newHeight - prevHeight);
      if (nextWidgetNewHeight < this.paneMinHeight) {
        nextWidgetNewHeight = this.paneMinHeight;
      }
      return { newHeight, prevHeight, nextWidgetNewHeight, nextWidgetHeight };
    },
    onPaneResize({ widget, size, pane, widgets, index, step }) {
      if (_.get(widget, 'config.minimized')) {
        return;
      }
      this.paneMinHeight = this.paneMinHeight ||
        Number.parseFloat(window.getComputedStyle(pane).getPropertyValue('min-height'));
      const targetWidgetIndex = index + 1;
      const targetWidget = widgets[targetWidgetIndex];
      const targetWidgetEl = pane.parentElement.querySelector(`[data-widget-index="${targetWidgetIndex}"]`);
      const params = {
        widget,
        size,
        pane,
        widgets,
        targetWidget,
        targetWidgetEl,
        step,
        depth: 1,
        index,
        targetWidgetIndex,
      };
      this.handlePaneResize(params);
    },
    onPaneResizeStop() {
      this.emit(this.widgets);
    },
    onSidePaneResizeStop(pane, size) {
      if (_.isNil(pane)) return;
      if (pane.classList.contains('side')) {
        this.emit(null, size);
      }
    },
    onSidePaneResize(pane, size) {
      if (_.isNil(pane)) return;
      if (pane.classList.contains('side')) {
        this.emit(null, size);
      }
    },
    shouldSideMinimize(rawSize = this.$refs.sidePane.offsetWidth) {
      const sizeNumber = Number.parseFloat(rawSize);
      const minSideWidth = _.isNumber(rawSize) || rawSize.indexOf('%') === -1
        ? MIN_SIDE_WIDTH_PIXELS
        : MIN_SIDE_WIDTH_PERCENTS;
      return sizeNumber < minSideWidth;
    },
    handleDrag({ widgets, index, newIndex }) {
      const widgetDragged = widgets.find(w => w.config.index === index);
      const diff = index - newIndex;
      widgets.forEach((widget) => {
        if (diff > 0 && widget.config.index >= newIndex && widget.config.index < diff + newIndex) {
          widget.config.index++;
        } else if (widget.config.index > index && widget.config.index <= newIndex) {
          widget.config.index--;
        }
      });
      widgetDragged.config.index = newIndex;
      this.emit(sortWidgets(this.widgets));
    },
  },
};
