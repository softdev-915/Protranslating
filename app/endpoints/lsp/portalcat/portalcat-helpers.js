const _ = require('lodash');
const moment = require('moment');

const SEARCH_BODY_STRATEGY_NOT = 'not';
const SEARCH_BODY_STRATEGY_EXCLUDE = 'EXCLUDE';
const SEARCH_BODY_STRATEGY_INCLUDE = 'INCLUDE';
const FILE_SEGMENT_ORIGIN_MT = 'mt';
const FILE_SEGMENT_ORIGIN_HT = 'ht';
const SEARCH_BODY_STATUS_CONFIRMED_TRANSLATOR = 'confirmed-translator';
const SEARCH_BODY_STATUS_CONFIRMED_EDITOR = 'confirmed-editor';
const SEARCH_BODY_STATUS_CONFIRMED_QA = 'confirmed-qa';
const SEARCH_BODY_STATUS_CONFIRMED_UNLOCKED = 'unlocked';
const SEARCH_BODY_STATUS_CONFIRMED_LOCKED = 'locked';

function buildPcSearchBody(searchParams, tzOffset) {
  const {
    sourceText = '',
    targetText = '',
    fromDate = '',
    toDate = '',
    userId = '',
    origin = '',
    status = '',
    strategy = '',
    isCaseSensitive = false,
  } = searchParams;
  const body = {
    sourceText: _.isEmpty(sourceText.trim()) ? null : sourceText,
    targetText: _.isEmpty(targetText.trim()) ? null : targetText,
    matchCase: isCaseSensitive,
    targetMatchStrategy: strategy === SEARCH_BODY_STRATEGY_NOT ?
      SEARCH_BODY_STRATEGY_EXCLUDE :
      SEARCH_BODY_STRATEGY_INCLUDE,
    originAndMt: origin === FILE_SEGMENT_ORIGIN_MT,
    originAndHt: origin === FILE_SEGMENT_ORIGIN_HT,
    statusAndConfirmedByTranslator: status === SEARCH_BODY_STATUS_CONFIRMED_TRANSLATOR,
    statusAndConfirmedByEditor: status === SEARCH_BODY_STATUS_CONFIRMED_EDITOR,
    statusAndConfirmedByQaEditor: status === SEARCH_BODY_STATUS_CONFIRMED_QA,
    statusAndUnlocked: status === SEARCH_BODY_STATUS_CONFIRMED_UNLOCKED,
    statusAndLocked: status === SEARCH_BODY_STATUS_CONFIRMED_LOCKED,
    fromDate: _.isEmpty(fromDate.trim()) ? null : moment.utc(fromDate).subtract(tzOffset, 'minutes').format(),
    toDate: _.isEmpty(toDate.trim()) ? null : moment.utc(toDate).subtract(tzOffset, 'minutes').format(),
    userId: _.isEmpty(userId.trim()) ? null : userId,
  };
  return _.omitBy(body, _.isNil);
}

function getProgressByTask(progressByTasks, taskAbility) {
  switch (true) {
    case new RegExp('Translation', 'i').test(taskAbility):
      return _.get(progressByTasks, 'translationProgress');
    case new RegExp('Editing', 'i').test(taskAbility):
      return _.get(progressByTasks, 'editingProgress');
    case new RegExp('PEMT', 'i').test(taskAbility):
      return _.get(progressByTasks, 'editingProgress');
    case new RegExp('QA', 'i').test(taskAbility):
      return _.get(progressByTasks, 'qaProgress');
    default: break;
  }
}

module.exports = {
  buildPcSearchBody,
  getProgressByTask,
};
