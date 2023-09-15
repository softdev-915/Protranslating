const _ = require('lodash');
const requestUtils = require('../../utils/request');

const HEADERS_PREFIX = 'lms-';
const flags = [
  'mock',
  'ns',
  'mockTz',
  'mockServerTime',
  'mockSchedulerInactive',
  'shouldMockSiSyncFail',
  'shouldMockSiAuthFail',
  'shouldMockSiUserSyncFail',
  'syncEntityOnCreation',
  'syncEntityOnRetrieval',
  'shouldMockSiDisabled',
  'shouldMockNoResponseFromCs',
  'siMockSyncFrom',
  'shouldMockCreationError',
  'shouldMockUpdateError',
  'shouldMockCsNotReceivedRequest',
  'mockTrSearchNoResponseFromCs',
  'mockTrDetailsNoResponseFromCs',
  'mockTrStatus',
  'mockVendorPaymentPeriodStartDate',
  'shouldSyncTerminatedEntity',
  'mockEmailSendingFail',
  'mockSchedulerInstantSync',
  'mockVersion',
  'mockBillDueDate',
  'mockProduction',
  'mockImportModuleEntities',
  'mockPayloadXMLType',
  'mockMonthlyConsumedQuota',
  'mockReportCache',
  'arApScriptEntityPrefix',
  'mockRequestBilled',
  'mockLocation',
  'mockTimezone',
  'mockIp',
  'mockSegmentationRulesEmpty',
];
const NON_BOOLEAN_FLAGS = [
  'mockTz',
  'mockServerTime',
  'siMockSyncFrom',
  'mockTrStatus',
  'mockEmailSendingFail',
  'mockVendorPaymentPeriodStartDate',
  'mockVersion',
  'mockBillDueDate',
  'mockImportModuleEntities',
  'mockPayloadXMLType',
  'mockMonthlyConsumedQuota',
  'arApScriptEntityPrefix',
  'mockReportCache',
  'mockLocation',
  'mockTimezone',
  'mockIp',
];
const SESSION_FLAGS = ['mockServerTime'];
const setFlagNameValues = function (req, cookies) {
  const user = requestUtils.getUserFromSession(req);
  flags.forEach((flagName) => {
    const flag = HEADERS_PREFIX + flagName;
    const value = cookies
      ? _.get(req, `headers.${flag.toLowerCase()}`, cookies[flagName])
      : req.headers[flag.toLowerCase()];
    if (value) {
      if (NON_BOOLEAN_FLAGS.includes(flagName)) {
        req.flags[flagName] = value;
        if (SESSION_FLAGS.includes(flagName)) {
          if (value === '') {
            req.flags[flagName] = _.get(user, `sessionFlags.${flagName}`, '');
          } else if (value === 'undefined') {
            _.set(user, `sessionFlags.${flagName}`, '');
          } else {
            _.set(user, `sessionFlags.${flagName}`, value);
          }
        }
      } else {
        req.flags[flagName] = (value === 'true');
      }
    }
  });
};

module.exports = () => (req, res, next) => {
  req.flags = req.flags || {};
  if (req.headers) {
    if (req.headers.cookie) {
      const cookies = req.headers.cookie
        .split('; ')
        .map((cookie) => cookie.split('='))
        .reduce((result, [key, val]) => _.set(result, key, val), {});
      setFlagNameValues(req, cookies);
    }
    setFlagNameValues(req);
  }

  next();
};
