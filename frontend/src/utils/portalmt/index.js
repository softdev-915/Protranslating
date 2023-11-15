/* global window */
import _ from 'lodash';

const getCaretCoords = () => {
  const range = window.getSelection().getRangeAt(0);
  const rect = range.getClientRects()[0];
  if (rect) {
    return {
      x: rect.left,
      y: rect.top + 14,
    };
  }
  return {
    x: 0,
    y: 0,
  };
};

const getPrefixIndex = (string, caretPos) => {
  const left = string.slice(0, caretPos).search(/\S+$/);
  return left < 0 ? caretPos : left;
};

const getCaretPosition = (node) => {
  const range = window.getSelection().getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(node);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  return preCaretRange.toString().length;
};

const getSelectionRange = (element) => {
  const selectionPosition = { start: 0, end: 0 };
  if (_.isNil(element)) {
    return selectionPosition;
  }
  const selection = window.getSelection();

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    const start = preCaretRange.toString().length;
    const end = start + range.toString().length;
    selectionPosition.start = start;
    selectionPosition.end = end;
  }
  return selectionPosition;
};

export {
  getCaretCoords,
  getPrefixIndex,
  getCaretPosition,
  getSelectionRange,
};
