const getProperEvent = function (e) {
  return window.event ? window.event : e;
};

export default class MouseDownMoveUpFinish {
  constructor(element, callbacks) {
    this.element = element;
    this._onMoveStartCallback = callbacks.onStart;
    this._onMoveCallback = callbacks.onResize;
    this._onMoveFinishCallback = callbacks.onFinish;
    this._onClick = callbacks.onClick;
    this.startX = null;
    this.startY = null;
    this._initialize();
  }

  destroy() {
    this.element.removeEventListener('mousedown', this._onMouseDown);
  }

  _initialize() {
    const mouseMove = (e) => {
      const event = getProperEvent(e);
      this._onMoveCallback(this._getRelativeMovement(event));
    };
    const mouseUp = (e) => {
      const event = getProperEvent(e);
      if (this._onMoveFinishCallback) {
        this._onMoveFinishCallback(this._getRelativeMovement(event), event);
      }
      window.document.removeEventListener('mousemove', mouseMove);
      window.document.removeEventListener('touchmove', mouseMove);
      window.document.removeEventListener('mouseup', mouseUp);
      window.document.removeEventListener('touchend', mouseUp);
    };
    this._onMouseDown = (event) => {
      this.startX = this._getPointerX(event);
      this.startY = event.pageY;
      window.document.addEventListener('mousemove', mouseMove);
      window.document.addEventListener('mouseup', mouseUp);
      if (this._onMoveStartCallback) {
        this._onMoveStartCallback(event);
      }
    };
    this.element.addEventListener('mousedown', this._onMouseDown);
    if (this._onClick) {
      this.element.addEventListener('click', this._onClick);
    }
  }

  _getPointerX(event) {
    if (event.type.indexOf('touch') === 0) {
      return (event.originalEvent.touches[0] || event.originalEvent.changedTouches[0]).pageX;
    }
    return event.pageX;
  }

  _getRelativeMovement(event) {
    const x = this._getPointerX(event) - this.startX;
    const y = event.pageY - this.startY;
    return { x, y };
  }
}
