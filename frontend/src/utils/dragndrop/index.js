export const clearDragState = function (clearDragging = true) {
  this.dragOver = false;
  this.dragStart = false;
  this.dragEnd = false;
  if (clearDragging) {
    this.dragging = false;
  }
};

export const setDragState = function (dragState, event) {
  clearDragState.call(this);
  switch (dragState) {
    case 'over':
      this.dragOver = true;
      this.dragging = true;
      break;
    case 'start':
      if (event.dataTransfer.items.length === 0) return;
      this.dragStart = true;
      this.dragging = true;
      break;
    case 'end':
      this.dragEnd = true;
      this.dragging = false;
      break;
    default:
      break;
  }
};

export const dragover = function (e) {
  e.stopPropagation();
  e.preventDefault();
  setDragState.call(this, 'over', e);
  e.dataTransfer.dropEffect = 'copy';
};

export const dragstart = function (e) {
  e.stopPropagation();
  e.preventDefault();
  setDragState.call(this, 'start');
};

export const dragend = function (e) {
  e.stopPropagation();
  e.preventDefault();
  setDragState.call(this, 'end');
};

export const drop = function (e) {
  e.stopPropagation();
  e.preventDefault();
  clearDragState.call(this);
  this.dragging = false;
  const { files } = e.dataTransfer;
  const regexpMatchFiles = [];
  const filesLen = files.length;
  for (let i = 0; i < filesLen; i++) {
    const file = files[i];
    if (!this.regexp || this.regexp.test(file.type)) {
      regexpMatchFiles.push(file);
      this.$emit('file-dropped', file);
    }
  }
  this.$emit('files-dropped', regexpMatchFiles);
};

export const clear = function () {
  clearDragState.call(this, true);
};

export const dropFile = function (e) {
  e.stopPropagation();
  e.preventDefault();
  clearDragState.call(this);
  this.dragging = false;
  const { files } = e.dataTransfer;
  const filesLen = files.length;
  for (let i = 0; i < filesLen; i++) {
    const file = files[i];
    this.onFileDropped(file);
  }
};
