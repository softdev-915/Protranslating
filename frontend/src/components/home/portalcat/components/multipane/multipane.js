
import _ from 'lodash';

const LAYOUT_HORIZONTAL = 'horizontal';
const LAYOUT_VERTICAL = 'vertical';

export default {
  props: {
    layout: {
      type: String,
      default: LAYOUT_VERTICAL,
    },
    controlDimensions: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      isResizing: false,
    };
  },
  computed: {
    classnames() {
      return [
        'multipane',
        `layout-${this.layout.slice(0, 1)}`,
        this.isResizing ? 'is-resizing' : '',
      ];
    },
    cursor() {
      if (this.isResizing) {
        return this.layout === LAYOUT_VERTICAL ? 'col-resize' : 'row-resize';
      }
      return '';
    },
    userSelect() {
      return this.isResizing ? 'none' : '';
    },
  },
  methods: {
    onMouseDown({ target: resizer, pageX: initialPageX, pageY: initialPageY }) {
      if (!_.isEmpty(resizer.className) && resizer.className.match('multipane-resizer')) {
        const pane = resizer.previousElementSibling;
        const { addEventListener, removeEventListener } = window;
        const { offsetWidth: initialPaneWidth, offsetHeight: initialPaneHeight } = pane;
        this.isResizing = true;
        const size = this._resize(null, 0, pane);
        this.$emit('paneResizeStart', pane, resizer, size);
        let prevPageX;
        let prevPageY;
        const onMouseMove = ({ pageX, pageY }) => {
          if (_.isNil(prevPageX)) {
            prevPageX = pageX;
            prevPageY = pageY;
          }
          this.onMouseMove({
            resizer,
            pane,
            initialPageX,
            initialPageY,
            initialPaneWidth,
            initialPaneHeight,
            prevPageX,
            prevPageY,
            pageX,
            pageY,
          });
          prevPageX = pageX;
          prevPageY = pageY;
        };
        const onMouseUp = () => {
          this.onMouseUp({ pane, resizer });
          removeEventListener('mousemove', onMouseMove);
          removeEventListener('mouseup', onMouseUp);
        };
        addEventListener('mousemove', onMouseMove);
        addEventListener('mouseup', onMouseUp);
      }
    },
    onMouseUp({ pane, resizer }) {
      const size = this.layout === LAYOUT_VERTICAL
        ? this._resize(pane.clientWidth, 0, pane)
        : this._resize(pane.clientHeight, 0, pane);
      this.isResizing = false;
      this.$emit('paneResizeStop', pane, resizer, size);
    },
    onMouseMove({
      resizer,
      pane,
      initialPageX,
      initialPageY,
      initialPaneWidth,
      initialPaneHeight,
      prevPageX,
      prevPageY,
      pageX,
      pageY,
    }) {
      let step = pageX - prevPageX;
      let direction = '';
      if (step > 0) direction = 'right';
      else if (step < 0) direction = 'left';
      if (this.layout === LAYOUT_HORIZONTAL) {
        step = pageY - prevPageY;
        if (step > 0) direction = 'bottom';
        else if (step < 0) direction = 'top';
      }
      const offset = this.layout === LAYOUT_VERTICAL ?
        pageX - initialPageX :
        pageY - initialPageY;
      const size = this.layout === LAYOUT_VERTICAL ?
        this._resize(initialPaneWidth, offset, pane) :
        this._resize(initialPaneHeight, offset, pane);
      this.$emit('paneResize', pane, resizer, size, step, direction, offset);
    },
    _resize(initialSize, offset = 0, pane) {
      if (_.isNil(initialSize)) {
        return;
      }
      const usePercentage = _.get(pane, 'style.width', '').includes('%');
      const { $el: container } = this;
      if (this.layout === LAYOUT_VERTICAL) {
        const containerWidth = container.clientWidth;
        const paneWidth = initialSize + offset;
        const size = usePercentage ? `${(paneWidth / containerWidth) * 100}%` : `${paneWidth}px`;
        if (this.controlDimensions) {
          pane.style.width = size;
        }
        return size;
      }
      if (this.layout === LAYOUT_HORIZONTAL) {
        const containerHeight = container.clientHeight;
        const paneHeight = initialSize + offset;
        const size = usePercentage ? `${(paneHeight / containerHeight) * 100}%` : `${paneHeight}px`;
        if (this.controlDimensions) {
          pane.style.height = size;
        }
        return size;
      }
    },
  },
};
