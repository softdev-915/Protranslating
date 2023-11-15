import Vue from 'vue';
import LSPAwareResource from './lsp-aware-resource';

export const resource = new LSPAwareResource(
  () => Vue.resource('/api/lsp/{lspId}/workflow-template/{templateId}{/action}')
);
