import Vue from 'vue';

export default () => Vue.resource('/api/auth{/id}{/code}');
