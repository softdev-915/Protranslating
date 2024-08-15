import _ from 'lodash';
import { store } from '../../../stores/store';

const FILE_EXTENSION_REGEX = /\.[\w]+$/;
export const NEW_SEGMENT_ORIGINAL_ID = 'newSegmentOriginalId';

export function sortWidgets(widgets = []) {
  return widgets.sort((a, b) => a.config.index - b.config.index);
}

export function findEntity(source, entitiesName, entityId, errMsg) {
  const entities = _.get(source, entitiesName, []);
  const entity = entities.find((en) => en._id === entityId);
  if (_.isNil(entity)) {
    throw new Error(errMsg);
  }
  return entity;
}

export function emptySegment(srcLang, tgtLang) {
  return {
    originalId: NEW_SEGMENT_ORIGINAL_ID,
    source: {
      text: '',
      inlineTags: [],
      lang: srcLang,
    },
    target: {
      text: '',
      inlineTags: [],
      lang: tgtLang,
    },
  };
}

export function hasChangedSegmentContent(oldSegment, newSegment) {
  const oldTargetText = _.get(oldSegment, 'target.text');
  const newTargetText = _.get(newSegment, 'target.text');
  const oldTargetTags = _.get(oldSegment, 'target.inlineTags');
  const newTargetTags = _.get(newSegment, 'target.inlineTags');
  return !_.isEqual(oldTargetText, newTargetText) ||
    !_.isEqual(oldTargetTags, newTargetTags);
}

export function areAllQaIssuesIgnored(qaIssues = []) {
  return _.isEmpty(qaIssues) || qaIssues.every(issue => issue.locQualityIssueEnabled === 'no');
}

export function isDocumentSupported(document) {
  const lsp = store.getters['app/lsp'];
  const supportedFileFormats = _.get(lsp, 'pcSettings.supportedFileFormats', []);
  const supportedExtensions = _.flatten(
    supportedFileFormats.map(
      fileFormat => fileFormat.extensions.split(',').map(extension => extension.trim())
    )
  );
  const documentExtension = document.name.match(FILE_EXTENSION_REGEX);
  if (_.isNil(documentExtension)) {
    return false;
  }
  return supportedExtensions.includes(documentExtension[0]);
}
