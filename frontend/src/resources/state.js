import Vue from 'vue';

export default () => Vue.resource('/api/country/{countryId}/state');
