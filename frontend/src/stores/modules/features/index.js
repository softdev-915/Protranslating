const state = {
  mock: false,
  ns: false,
  mockServerTime: '',
  mockEmailSendingFail: '',
  mockSchedulerInstantSync: false,
  mockTz: '00',
  mockSchedulerInactive: false,
  shouldMockSiAuthFail: false,
  shouldMockSiSyncFail: false,
  mockRequestBilled: null,
  shouldMockSiUserSyncFail: false,
  mockSiConnectorRunNow: false,
  shouldMockSiDisabled: false,
  shouldMockNoResponseFromCs: false,
  siMockSyncFrom: '',
  mockSessionTimeout: null,
  shouldMockCreationError: false,
  shouldMockUpdateError: false,
  shouldMockCsNotReceivedRequest: false,
  mockTrSearchNoResponseFromCs: false,
  mockTrDetailsNoResponseFromCs: false,
  mockTrStatus: null,
  mockVendorPaymentPeriodStartDate: null,
  shouldSyncTerminatedEntity: false,
  mockVersion: '',
  mockBillDueDate: null,
  mockProduction: false,
  mockImportModuleEntities: null,
  mockPayloadXMLType: 'create',
  mockBigFileUploading: false,
  syncEntityOnCreation: true,
  syncEntityOnRetrieval: false,
  mockMonthlyConsumedQuota: false,
  mockReportCache: '',
  arApScriptEntityPrefix: null,
  mockLocation: '',
  mockTimezone: '',
  mockIp: '',
  mockSegmentationRulesEmpty: false,
};

const getters = {
  mock: storeState => storeState.mock,
  mockSchedulerInactive: storeState => storeState.mockSchedulerInactive,
  mockServerTime: storeState => storeState.mockServerTime,
  mockEmailSendingFail: storeState => storeState.mockEmailSendingFail,
  mockSchedulerInstantSync: storeState => storeState.mockSchedulerInstantSync,
  mockTz: storeState => storeState.mockTz,
  mockSiConnectorRunNow: storeState => storeState.mockSiConnectorRunNow,
  shouldMockSiAuthFail: storeState => storeState.shouldMockSiAuthFail,
  shouldMockSiSyncFail: storeState => storeState.shouldMockSiSyncFail,
  shouldMockSiUserSyncFail: storeState => storeState.shouldMockSiUserSyncFail,
  shouldMockSiDisabled: storeState => storeState.shouldMockSiDisabled,
  shouldMockNoResponseFromCs: storeState => storeState.shouldMockNoResponseFromCs,
  siMockSyncFrom: storeState => storeState.siMockSyncFrom,
  mockSessionTimeout: storeState => storeState.mockSessionTimeout,
  shouldMockCreationError: storeState => storeState.shouldMockCreationError,
  shouldMockUpdateError: storeState => storeState.shouldMockUpdateError,
  shouldMockCsNotReceivedRequest: storeState => storeState.shouldMockCsNotReceivedRequest,
  mockTrSearchNoResponseFromCs: storeState => storeState.mockTrSearchNoResponseFromCs,
  mockTrDetailsNoResponseFromCs: storeState => storeState.mockTrDetailsNoResponseFromCs,
  mockTrStatus: storeState => storeState.mockTrStatus,
  mockVendorPaymentPeriodStartDate: storeState => storeState.mockVendorPaymentPeriodStartDate,
  shouldSyncTerminatedEntity: storeState => storeState.shouldSyncTerminatedEntity,
  mockVersion: storeState => storeState.mockVersion,
  mockBillDueDate: storeState => storeState.mockBillDueDate,
  mockProduction: storeState => storeState.mockProduction,
  mockImportModuleEntities: storeState => storeState.mockImportModuleEntities,
  mockPayloadXMLType: storeState => storeState.mockPayloadXMLType,
  mockBigFileUploading: storeState => storeState.mockBigFileUploading,
  syncEntityOnCreation: storeState => storeState.syncEntityOnCreation,
  syncEntityOnRetrieval: storeState => storeState.syncEntityOnRetrieval,
  mockMonthlyConsumedQuota: storeState => storeState.mockMonthlyConsumedQuota,
  mockReportCache: storeState => storeState.mockReportCache,
  mockRequestBilled: storeState => storeState.mockRequestBilled,
  mockLocation: storeState => storeState.mockLocation,
  mockTimezone: storeState => storeState.mockTimezone,
  mockIp: storeState => storeState.mockIp,
  mockSegmentationRulesEmpty: storeState => storeState.mockSegmentationRulesEmpty,
};

const mutations = {
  setMock: (storeState, payload) => {
    storeState.mock = payload;
  },
  setMockServerTime: (storeState, payload) => {
    storeState.mockServerTime = payload;
  },
  setmockEmailSendingFail: (storeState, payload) => {
    storeState.mockEmailSendingFail = payload;
  },
  setMockSchedulerInstantSync: (storeState, payload) => {
    storeState.mockSchedulerInstantSync = payload;
  },
  setMockTz: (storeState, mockTz) => {
    storeState.mockTz = mockTz;
  },
  setshouldMockSiSyncFail: (storeState, payload) => {
    storeState.shouldMockSiSyncFail = payload;
  },
  setshouldMockSiAuthFail: (storeState, payload) => {
    storeState.shouldMockSiAuthFail = payload;
  },
  setshouldMockSiDisabled: (storeState, payload) => {
    storeState.shouldMockSiDisabled = payload;
  },
  setshouldMockNoResponseFromCs: (storeState, payload) => {
    storeState.shouldMockNoResponseFromCs = payload;
  },
  setsiMockSyncFrom: (storeState, payload) => {
    storeState.siMockSyncFrom = payload;
  },
  setmockSessionTimeout: (storeState, payload) => {
    storeState.mockSessionTimeout = payload;
  },
  setshouldMockCreationError: (storeState, payload) => {
    storeState.shouldMockCreationError = payload;
  },
  setshouldMockUpdateError: (storeState, payload) => {
    storeState.shouldMockUpdateError = payload;
  },
  setshouldMockCsNotReceivedRequest: (storeState, payload) => {
    storeState.shouldMockCsNotReceivedRequest = payload;
  },
  setmockTrSearchNoResponseFromCs: (storeState, payload) => {
    storeState.mockTrSearchNoResponseFromCs = payload;
  },
  setmockTrDetailsNoResponseFromCs: (storeState, payload) => {
    storeState.mockTrDetailsNoResponseFromCs = payload;
  },
  setmockTrStatus: (storeState, payload) => {
    storeState.mockTrStatus = payload;
  },
  setmockVendorPaymentPeriodStartDate: (storeState, payload) => {
    storeState.mockVendorPaymentPeriodStartDate = payload;
  },
  setshouldSyncTerminatedEntity: (storeState, payload) => {
    storeState.shouldSyncTerminatedEntity = payload;
  },
  setmockSchedulerInactive: (storeState, payload) => {
    storeState.mockSchedulerInactive = payload;
  },
  setmockVersion: (storeState, payload) => {
    storeState.mockVersion = payload;
  },
  setmockBillDueDate: (storeState, payload) => {
    storeState.mockBillDueDate = payload;
  },
  setmockProduction: (storeState, payload) => {
    storeState.mockProduction = payload;
  },
  setmockPayloadXMLType: (storeState, payload) => {
    storeState.mockPayloadXMLType = payload;
  },
  setmockImportModuleEntities: (storeState, payload) => {
    storeState.mockImportModuleEntities = payload;
  },
  setmockBigFileUploading: (storeState, payload) => {
    storeState.mockBigFileUploading = payload;
  },
  setsyncEntityOnCreation: (storeState, payload) => {
    storeState.syncEntityOnCreation = payload;
  },
  setsyncEntityOnRetrieval: (storeState, payload) => {
    storeState.syncEntityOnRetrieval = payload;
  },
  setmockMonthlyConsumedQuota: (storeState, payload) => {
    storeState.mockMonthlyConsumedQuota = payload;
  },
  setmockReportCache: (storeState, payload) => {
    storeState.mockReportCache = payload;
  },
  setarApScriptEntityPrefix: (storeState, payload) => {
    storeState.setarApScriptEntityPrefix = payload;
  },
  setshouldMockSiUserSyncFail: (storeState, payload) => {
    storeState.setshouldMockSiUserSyncFail = payload;
  },
  setmockSiConnectorRunNow: (storeState, payload) => {
    storeState.mockSiConnectorRunNow = payload;
  },
  setmockRequestBilled: (storeState, payload) => {
    storeState.mockRequestBilled = payload;
  },
  setmockLocation: (storeState, payload) => {
    storeState.mockLocation = payload;
  },
  setmockTimezone: (storeState, payload) => {
    storeState.mockTimezone = payload;
  },
  setmockIp: (storeState, payload) => {
    storeState.mockIp = payload;
  },
  setmockSegmentationRulesEmpty: (storeState, payload) => {
    storeState.mockSegmentationRulesEmpty = payload;
  },
};

// don't change the name of these actions.
// They are coupled with session-flags.js.
// The code is much more simpler this way
const actions = {
  setmock: ({ commit }, payload) => {
    commit('setMock', payload);
  },
  setmockServerTime: ({ commit }, payload) => {
    commit('setMockServerTime', payload);
  },
  setmockEmailSendingFail: ({ commit }, payload) => {
    commit('setmockEmailSendingFail', payload);
  },
  setmockSchedulerInstantSync: ({ commit }, payload) => {
    commit('setMockSchedulerInstantSync', payload);
  },
  setmockTz: ({ commit }, payload) => {
    commit('setMockTz', payload);
  },
  setshouldMockSiSyncFail: ({ commit }, payload) => {
    commit('setshouldMockSiSyncFail', payload);
  },
  setshouldMockSiAuthFail: ({ commit }, payload) => {
    commit('setshouldMockSiSyncFail', payload);
  },
  setshouldMockSiDisabled: ({ commit }, payload) => {
    commit('setshouldMockSiDisabled', payload);
  },
  setshouldMockNoResponseFromCs: ({ commit }, payload) => {
    commit('setshouldMockNoResponseFromCs', payload);
  },
  setsiMockSyncFrom: ({ commit }, payload) => {
    commit('setsiMockSyncFrom', payload);
  },
  setmockSessionTimeout: ({ commit }, payload) => {
    commit('setmockSessionTimeout', payload);
  },
  setshouldMockCreationError: ({ commit }, payload) => {
    commit('setshouldMockCreationError', payload);
  },
  setshouldMockUpdateError: ({ commit }, payload) => {
    commit('setshouldMockUpdateError', payload);
  },
  setshouldMockCsNotReceivedRequest: ({ commit }, payload) => {
    commit('setshouldMockCsNotReceivedRequest', payload);
  },
  setmockTrSearchNoResponseFromCs: ({ commit }, payload) => {
    commit('setmockTrSearchNoResponseFromCs', payload);
  },
  setmockTrDetailsNoResponseFromCs: ({ commit }, payload) => {
    commit('setmockTrDetailsNoResponseFromCs', payload);
  },
  setmockTrStatus: ({ commit }, payload) => {
    commit('setmockTrStatus', payload);
  },
  setmockVendorPaymentPeriodStartDate: ({ commit }, payload) => {
    commit('setmockVendorPaymentPeriodStartDate', payload);
  },
  setshouldSyncTerminatedEntity: ({ commit }, payload) => {
    commit('setshouldSyncTerminatedEntity', payload);
  },
  setmockSchedulerInactive: ({ commit }, payload) => {
    commit('setmockSchedulerInactive', payload);
  },
  setmockVersion: ({ commit }, payload) => {
    commit('setmockVersion', payload);
  },
  setmockBillDueDate: ({ commit }, payload) => {
    commit('setmockBillDueDate', payload);
  },
  setmockProduction: ({ commit }, payload) => {
    commit('setmockProduction', payload);
  },
  setmockPayloadXMLType: ({ commit }, payload) => {
    commit('setmockPayloadXMLType', payload);
  },
  setmockImportModuleEntities: ({ commit }, payload) => {
    commit('setmockImportModuleEntities', payload);
  },
  setmockBigFileUploading: ({ commit }, payload) => {
    commit('setmockBigFileUploading', payload);
  },
  setsyncEntityOnCreation: ({ commit }, payload) => {
    commit('setsyncEntityOnCreation', payload);
  },
  setsyncEntityOnRetrieval: ({ commit }, payload) => {
    commit('setsyncEntityOnRetrieval', payload);
  },
  setmockMonthlyConsumedQuota: ({ commit }, payload) => {
    commit('setmockMonthlyConsumedQuota', payload);
  },
  setmockReportCache: ({ commit }, payload) => {
    commit('setmockReportCache', payload);
  },
  setarApScriptEntityPrefix: ({ commit }, payload) => {
    commit('setarApScriptEntityPrefix', payload);
  },
  setshouldMockSiUserSyncFail: ({ commit }, payload) => {
    commit('setshouldMockSiUserSyncFail', payload);
  },
  setmockSiConnectorRunNow: ({ commit }, payload) => {
    commit('setmockSiConnectorRunNow', payload);
  },
  setmockRequestBilled: ({ commit }, payload) => {
    commit('setmockRequestBilled', payload);
  },
  setmockLocation: ({ commit }, payload) => {
    commit('setmockLocation', payload);
  },
  setmockTimezone: ({ commit }, payload) => {
    commit('setmockTimezone', payload);
  },
  setmockIp: ({ commit }, payload) => {
    commit('setmockIp', payload);
  },
  setmockSegmentationRulesEmpty: ({ commit }, payload) => {
    commit('setmockSegmentationRulesEmpty', payload);
  },
};

export default {
  state,
  getters,
  mutations,
  actions,
  namespaced: true,
};
