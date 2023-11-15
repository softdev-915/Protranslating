import Vue from 'vue';
import LSPAwareResource from './lsp-aware-resource';

export default (options) => new LSPAwareResource(() => Vue.resource('/api/lsp/{lspId}/task{/provider}{/providerId}', null, null, options));
