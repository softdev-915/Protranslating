/* eslint-disable import/prefer-default-export */
import Vue from 'vue';
import Vuex from 'vuex';
import app from './modules/app';
import authorization from './modules/authorization';
import form from './modules/form';
import features from './modules/features';
import cache from './modules/cache';
import home from './modules/home';
import notifications from './modules/notifications';
import sideBar from './modules/sideBar';
import tasks from './modules/tasks';
import rates from './modules/rates';
import eml from './modules/eml';
import services from './modules/transaction-services';
import template from './modules/template';
import portalCat from './modules/portalcat';
import apPayment from './modules/ap-payment';
import memoryEditor from './modules/memory-editor';
import breadcrumb from './modules/breadcrumb';

Vue.use(Vuex);

export const store = window.store = new Vuex.Store({
  modules: {
    app,
    authorization,
    form,
    features,
    cache,
    home,
    notifications,
    sideBar,
    tasks,
    rates,
    eml,
    services,
    template,
    portalCat,
    apPayment,
    memoryEditor,
    breadcrumb,
  },
  plugins: [],
});
