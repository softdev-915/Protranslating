import Vue from 'vue';
import LSPAwareResource from './lsp-aware-resource';

export default new LSPAwareResource(() => Vue.resource('/api/lsp/{lspId}/reveal-pii/{collection}/{entityId}'));
