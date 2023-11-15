import Vue from 'vue';
import LSPAwareResource from './lsp-aware-resource';

export default new LSPAwareResource(() => Vue.resource(
  '/api/lsp/{lspId}/company{/id}{/nameList}{/subcompany}{/salesRep}{/rates}{/allowedUploadingForIp}{/balanceInformation}',
));
