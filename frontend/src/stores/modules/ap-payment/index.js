import _ from 'lodash';
import { bigJsToNumber, minus } from '../../../utils/bigjs';

const state = {
  accountsPayable: [],
  selectedAccountsPayableIdList: [],
  budgetAmount: 0,
  creditsByVendor: {},
};
const getters = {
  selectedAccountsPayableIdList: ({ selectedAccountsPayableIdList }) => selectedAccountsPayableIdList,
  selectedAccountsPayable: ({
    accountsPayable, selectedAccountsPayableIdList,
  }) => accountsPayable.filter(({ _id }) => selectedAccountsPayableIdList.includes(_id)),
  remainingBudgetAmount: ({
    budgetAmount,
  }, { selectedAccountsPayable }) => bigJsToNumber(minus(budgetAmount,
    _.sumBy(selectedAccountsPayable, 'paymentAmount'))),
  remainingCreditsByVendor: ({ creditsByVendor }, { selectedAccountsPayable }) => {
    const result = {};
    Object.keys(creditsByVendor).forEach((vendorId) => {
      result[vendorId] = creditsByVendor[vendorId] - _.sumBy(
        selectedAccountsPayable,
        ({ vendorId: apVendorId, creditsToApply }) => {
          if (apVendorId !== vendorId) {
            return 0;
          }
          return creditsToApply;
        },
      );
      result[vendorId] = _.round(result[vendorId], 2);
    });
    return result;
  },
};

const mutations = {
  setAccountsPayable: (storeState, accountsPayable) => {
    storeState.accountsPayable = accountsPayable;
    storeState.selectedAccountsPayableIdList = [];
  },
  unsetAccountPayable(storeState, accountPayable) {
    _.remove(storeState.accountsPayable, ({ _id }) => _id === accountPayable._id);
    _.pull(storeState.selectedAccountsPayableIdList, accountPayable._id);
  },
  setBudgetAmount(storeState, budgetAmount) {
    storeState.budgetAmount = budgetAmount;
  },
  toggleAccountPayable(storeState, { _id, selected }) {
    if (storeState.selectedAccountsPayableIdList.includes(_id) && !selected) {
      storeState.selectedAccountsPayableIdList = storeState.selectedAccountsPayableIdList.filter(
        (id) => id !== _id,
      );
    } else if (!storeState.selectedAccountsPayableIdList.includes(_id) && selected) {
      storeState.selectedAccountsPayableIdList.push(_id);
    }
  },
  toggleAllAccountsPayable(storeState, selected) {
    storeState.selectedAccountsPayableIdList = selected
      ? storeState.accountsPayable.map(({ _id }) => _id)
      : [];
  },
  clearAccountsPayable(storeState) {
    storeState.accountsPayable = [];
    storeState.selectedAccountsPayableIdList = [];
  },
  setVendorCredit(storeState, { vendorId, creditsAvailable }) {
    storeState.creditsByVendor[vendorId] = creditsAvailable;
  },
};

const actions = {
  setAccountsPayable: ({ commit }, payload) => {
    commit('setAccountsPayable', payload);
  },
  unsetAccountPayable: ({ commit }, payload) => {
    commit('unsetAccountPayable', payload);
  },
  setBudgetAmount: ({ commit }, payload) => {
    commit('setBudgetAmount', payload);
  },
  toggleAccountPayable({ commit }, payload) {
    commit('toggleAccountPayable', payload);
  },
  toggleAllAccountsPayable({ commit }, payload) {
    commit('toggleAllAccountsPayable', payload);
  },
  clearAccountsPayable({ commit }) {
    commit('clearAccountsPayable');
  },
  setVendorCredit({ commit }, payload) {
    commit('setVendorCredit', payload);
  },
};

export default {
  state, getters, mutations, actions, namespaced: true,
};
