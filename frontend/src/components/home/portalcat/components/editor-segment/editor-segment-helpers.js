/* global document */
import _ from 'lodash';
import { escapeRegexp } from '../../../../../utils/strings';

const HTML_START_END_TAGS_AND_ATTRIBUTES_REGEXP =
  // eslint-disable-next-line no-useless-escape
  /<\/?\w+(\s*[^\s]*="[a-zA-Z0-9:;\.\s\(\)\-\,#\/_&=]*")*>/gi;
const HTML_PLACEHOLDER_TAG_REGEXP = /(<\w+(\s*[^\s]*="[a-zA-Z0-9:;.\s\\\-,#]*")*\/>)|(\{\})/gi;
// eslint-disable-next-line no-useless-escape
const HTML_ATTRIBUTES_REGEXP = /(\s+|[^\s]*="[a-zA-Z0-9:;\.\s\(\)\-\,#]*")/gi;
const TAG_FUNCTION_CLOSING = 'CLOSING';
const TAG_FUNCTION_OPENING = 'OPENING';
const TAG_FUNCTION_PLACEHOLDER = 'PLACEHOLDER';
const TASK_ABILITY_TRANSLATION = 'Translation';
const TASK_ABILITY_EDITING = 'Editing';
const TASK_ABILITY_PEMT = 'PEMT';
const TASK_ABILITY_QA = 'QA';
const SEGMENT_STATUS_CONFIRMED_BY_TRANSLATOR = 'CONFIRMED_BY_TRANSLATOR';
const SEGMENT_STATUS_CONFIRMED_BY_EDITOR = 'CONFIRMED_BY_EDITOR';
const SEGMENT_STATUS_CONFIRMED_BY_QA_EDITOR = 'CONFIRMED_BY_QA_EDITOR';
const SEGMENT_STATUS_UNCONFIRMED = 'UNCONFIRMED';
const SEGMENT_ORIGIN_MT = 'MT';
const TRANSLATION_ALLOWED_STATUSES = [
  SEGMENT_STATUS_UNCONFIRMED,
  SEGMENT_STATUS_CONFIRMED_BY_TRANSLATOR,
];
const EDITING_ALLOWED_STATUSES =
  TRANSLATION_ALLOWED_STATUSES.concat(SEGMENT_STATUS_CONFIRMED_BY_EDITOR);
const QA_ALLOWED_STATUSES =
  EDITING_ALLOWED_STATUSES.concat(SEGMENT_STATUS_CONFIRMED_BY_QA_EDITOR);
const testRegexpClear = (regexp, value) => {
  regexp.lastIndex = 0;
  return regexp.test(value);
};

const highlightTerm = (text, terminologyInfo, inputName, tags) => {
  const source = _.get(terminologyInfo, '[0].term.source', '');
  if (inputName === 'target' || terminologyInfo.length === 0 || source === '') {
    return text;
  }
  let { start, end } = terminologyInfo[0].sourcePositions[0];
  const term = text.substring(start, end);
  if (_.isEmpty(tags)) {
    return text.replace(term, `<span class="highlight" data-e2e-type='term' data-popover-trigger>${term}</span>`);
  }
  start = text.indexOf('<a');
  end = text.lastIndexOf('</a>');
  const initialString = text.substring(-1, start);
  const subStringWithTags = text.substring(start, end);
  const remainingString = text.substring(end);
  const newText = `${initialString} <span class='highlight' data-e2e-type='term' data-popover-trigger>${subStringWithTags}</span>${remainingString}`;
  return newText;
};

const wrapTagsAndFormatText = (text = '', tags = [], wrapColor = '', formatTagFn = tag => tag.data, formatTextFn = txt => txt, inputName = '', terminologyInfo = []) => {
  if (_.isEmpty(tags)) {
    const formattedText = formatTextFn(text, inputName).replace(/\n/g, '<br>');
    return highlightTerm(formattedText, terminologyInfo, inputName);
  }
  const sortedTags = _.clone(tags).sort((tagA, tagB) => {
    if (tagA.position === tagB.position && tagA.function === tagB.function) {
      if (tagA.function === 'CLOSING') {
        return tagB.id - tagA.id;
      }
      return tagA.id - tagB.id;
    }
    return tagA.position - tagB.position;
  });
  let result = '';
  let lastTagPosition = 0;
  sortedTags.forEach((tag) => {
    const formattedTag = formatTagFn(tag);
    result += formatTextFn(text.substring(lastTagPosition, tag.position), inputName).replace(/\n/g, '<br>');
    result += `<a href="#" onclick="return false;" draggable="true" data-tag-id="${tag.id}" data-tag-function="${tag.function}" style="color: ${wrapColor};" class="tag draggable-source">${_.escape(formattedTag)}</a>`;
    lastTagPosition = tag.position;
  });
  result += text.substring(lastTagPosition).replace(/\n/g, '<br>');
  return highlightTerm(result, terminologyInfo, inputName, tags);
};

const calculateCaretOffsetWithTags = (htmlElement) => {
  const selection = document.getSelection();
  if (selection.rangeCount === 0) {
    return;
  }
  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  selection.removeRange(range);
  selection.addRange(preCaretRange);
  preCaretRange.selectNodeContents(htmlElement);
  preCaretRange.setEnd(range.startContainer, range.startOffset);
  const startOffset = selection.toString().length;
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  const endOffset = selection.toString().length;
  selection.removeRange(preCaretRange);
  selection.addRange(range);
  return { startOffset, endOffset };
};

const getCaretOffsetAndSelection = (htmlElement, clearSegmentText = '') => {
  const selection = document.getSelection();
  const results = {
    withoutTags: {
      startOffset: -1,
      endOffset: -1,
    },
    withTags: {
      startOffset: -1,
      endOffset: -1,
    },
    selectedText: '',
    isCollapsed: selection.isCollapsed,
  };
  if (selection.rangeCount === 0) {
    return results;
  }
  results.selectedText = selection.toString();
  const range = selection.getRangeAt(0);
  results.range = range;
  results.isStartTagIncluded =
    testRegexpClear(HTML_START_END_TAGS_AND_ATTRIBUTES_REGEXP, range.startContainer.textContent);
  results.isEndTagIncluded =
    testRegexpClear(HTML_START_END_TAGS_AND_ATTRIBUTES_REGEXP, range.endContainer.textContent);
  results.isPlaceholderTagIncluded = (
    HTML_PLACEHOLDER_TAG_REGEXP.test(range.startContainer.textContent) ||
    HTML_PLACEHOLDER_TAG_REGEXP.test(range.endContainer.textContent)
  );
  results.withTags = calculateCaretOffsetWithTags(htmlElement);
  results.withoutTags = _.clone(results.withTags);
  const displayedText = htmlElement.innerText;
  Object.keys(results.withoutTags).forEach((offsetKey) => {
    const rangeContainer = offsetKey === 'startOffset' ? range.startContainer : range.endContainer;
    const rangeTextContent = rangeContainer.textContent;
    const displayedTextUpToCaret = displayedText.substring(0, results.withoutTags[offsetKey]);
    if (!testRegexpClear(HTML_START_END_TAGS_AND_ATTRIBUTES_REGEXP, rangeTextContent) &&
      !testRegexpClear(HTML_PLACEHOLDER_TAG_REGEXP, rangeTextContent)) {
      const startAndEndTagsArr =
        displayedTextUpToCaret.match(HTML_START_END_TAGS_AND_ATTRIBUTES_REGEXP) || [];
      const placeholderTagsArr = displayedTextUpToCaret.match(HTML_PLACEHOLDER_TAG_REGEXP) || [];
      const tagsArr = [...startAndEndTagsArr, ...placeholderTagsArr];
      if (!_.isEmpty(tagsArr)) {
        const tags = tagsArr.join('');
        results.withoutTags[offsetKey] -= tags.length;
      }
    } else {
      let sanitizedDisplayedTextUpToCaret = displayedTextUpToCaret.replace(HTML_START_END_TAGS_AND_ATTRIBUTES_REGEXP, '');
      sanitizedDisplayedTextUpToCaret = sanitizedDisplayedTextUpToCaret.replace(HTML_PLACEHOLDER_TAG_REGEXP, '');
      if (_.isEmpty(sanitizedDisplayedTextUpToCaret)) {
        results.withoutTags[offsetKey] = 0;
      } else {
        const isEndOfText = results.withTags.endOffset === displayedText.length;
        const regexp = new RegExp(`^${escapeRegexp(sanitizedDisplayedTextUpToCaret.trimEnd())}`);
        if (regexp.test(clearSegmentText) || isEndOfText) {
          results.withoutTags[offsetKey] = sanitizedDisplayedTextUpToCaret.length;
        } else {
          results.withoutTags[offsetKey] = -1;
        }
      }
    }
  });
  return results;
};
const getTagFunctionByText = (text = '') => {
  if (text.endsWith('/>')) {
    return TAG_FUNCTION_PLACEHOLDER;
  }
  if (text.startsWith('</')) {
    return TAG_FUNCTION_CLOSING;
  }
  return TAG_FUNCTION_OPENING;
};
const isTag = (htmlElement) => {
  const tagId = _.get(htmlElement, 'dataset.tagId');
  return !_.isNil(tagId) && htmlElement.classList.contains('tag');
};
const areSameTags = (tag1, tag2) => tag1.id === tag2.id && tag1.function === tag2.function;
const findTagByHtmlElement = (htmlElement, tags = [], findFn = _.find) => {
  const { tagId, tagFunction } = htmlElement.dataset;
  return findFn(tags, t => t.id === +tagId && t.function === tagFunction);
};
const getNextTagId = (existingTags, startFrom = 1) => {
  if (_.isNil(existingTags)) {
    return;
  }
  return existingTags.reduce((id, tag) => {
    if (tag.id >= id) {
      return tag.id + 1;
    }
    return id;
  }, startFrom);
};
const buildTag = (data, existingTags) => {
  const id = getNextTagId(existingTags);
  return {
    id,
    data,
    function: getTagFunctionByText(data),
    position: 0,
  };
};
const buildOppositeTag = (tag) => {
  let tagData = tag.data.replace(HTML_ATTRIBUTES_REGEXP, '');
  let oppositeTag;
  if (tagData === '{}') {
    oppositeTag = buildTag(tagData);
    if (tag.function === TAG_FUNCTION_CLOSING) {
      oppositeTag.function = TAG_FUNCTION_OPENING;
    } else {
      oppositeTag.function = TAG_FUNCTION_CLOSING;
    }
  } else {
    if (tag.function === TAG_FUNCTION_CLOSING) {
      tagData = tagData.replace('/', '');
    } else {
      tagData = tagData.split('<');
      tagData.unshift('<', '/');
      tagData = tagData.join('');
    }
    oppositeTag = buildTag(tagData);
  }
  oppositeTag.id = tag.id;
  return oppositeTag;
};
const buildTagPair = (name, existingTags) => {
  const openingTag = buildTag(`<${name}>`, existingTags);
  const closingTag = buildTag(`</${name}>`, existingTags);
  closingTag.id = openingTag.id;
  return [openingTag, closingTag];
};
const getOppositeTag = (tag, allTags = [], createIfMissing = false) => {
  let oppositeTag = allTags.find(t => t.id === tag.id && t.function !== tag.function);
  if (createIfMissing) {
    oppositeTag = buildOppositeTag(tag);
  }
  return oppositeTag;
};
const wrapSearchResult = text => `<span style="background-color: green; color: #fff;">${text}</span>`;
const getCanUpdateBasedOnStatus = (taskAbility, segmentStatus) => {
  let allowedStatuses = [];
  if (taskAbility === TASK_ABILITY_TRANSLATION) {
    allowedStatuses = TRANSLATION_ALLOWED_STATUSES;
  } else if (taskAbility === TASK_ABILITY_EDITING || taskAbility === TASK_ABILITY_PEMT) {
    allowedStatuses = EDITING_ALLOWED_STATUSES;
  } else if (taskAbility === TASK_ABILITY_QA) {
    allowedStatuses = QA_ALLOWED_STATUSES;
  }
  return allowedStatuses.includes(segmentStatus);
};
const getIsSegmentAssigned = (userId, segment) => [
  _.get(segment, 'assignedToTranslator', ''),
  _.get(segment, 'assignedToEditor', ''),
  _.get(segment, 'assignedToQaEditor', ''),
].includes(userId);
const calculateIndexToInsertTag = (inputElement, newTag, tags = [], _indexToInsert) => {
  const range = document.getSelection().getRangeAt(0);
  const isEndOfInput = range.startContainer === inputElement &&
    range.startOffset === inputElement.childNodes.length;
  const isTagUnderCaret = isTag(range.startContainer.parentElement);
  const isCaretAtNodeEnd = range.startContainer.textContent.length === range.startOffset;
  if (_.isNil(_indexToInsert)) {
    _indexToInsert = _.sortedLastIndexBy(tags, newTag, t => t.position);
  }
  const _tagBeforeIndexToInsert = tags[_indexToInsert - 1];
  if (
    !_.isNil(_tagBeforeIndexToInsert) &&
    _indexToInsert !== 0 &&
    newTag.position === _tagBeforeIndexToInsert.position &&
    !(isEndOfInput || (isTagUnderCaret && isCaretAtNodeEnd))
  ) {
    return calculateIndexToInsertTag(inputElement, newTag, tags, --_indexToInsert);
  }
  return _indexToInsert;
};
const isMt = segment => _.get(segment, 'origin') === SEGMENT_ORIGIN_MT;
const recentActionsTypes = {
  EDIT_SEGMENT: 'EDIT_SEGMENT',
  JOIN_SEGMENTS: 'JOIN_SEGMENTS',
  SPLIT_SEGMENT: 'SPLIT_SEGMENT',
  LOCK_SEGMENTS: 'LOCK_SEGMENTS',
  CONFIRM_SEGMENTS: 'CONFIRM_SEGMENTS',
  UNCONFIRM_SEGMENTS: 'UNCONFIRM_SEGMENTS',
};

export {
  wrapTagsAndFormatText,
  calculateCaretOffsetWithTags,
  getCaretOffsetAndSelection,
  getTagFunctionByText,
  isTag,
  areSameTags,
  findTagByHtmlElement,
  buildTag,
  buildTagPair,
  getNextTagId,
  getOppositeTag,
  buildOppositeTag,
  wrapSearchResult,
  getCanUpdateBasedOnStatus,
  getIsSegmentAssigned,
  calculateIndexToInsertTag,
  recentActionsTypes,
  isMt,
  HTML_START_END_TAGS_AND_ATTRIBUTES_REGEXP,
  HTML_PLACEHOLDER_TAG_REGEXP,
  HTML_ATTRIBUTES_REGEXP,
  TAG_FUNCTION_PLACEHOLDER,
};
