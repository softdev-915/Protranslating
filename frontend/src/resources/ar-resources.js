import Vue from 'vue';
import LSPAwareResource from './lsp-aware-resource';

export const ArInvoiceResource = new LSPAwareResource(() => Vue.resource('/api/lsp/{lspId}/ar-invoice{/id}'));
export const ArInvoiceEntriesResource = new LSPAwareResource(() => Vue.resource('/api/lsp/{lspId}/ar-invoice-entries'));
export const ArAdvanceResource = new LSPAwareResource(() => Vue.resource('/api/lsp/{lspId}/ar-advance{/id}'));
export const ArAdjustmentResource = new LSPAwareResource(() => Vue.resource('/api/lsp/{lspId}/ar-adjustment{/id}'));
export const ArPaymentResource = new LSPAwareResource(() => Vue.resource('/api/lsp/{lspId}/ar-payment{/id}'));
export const CcPaymentResource = new LSPAwareResource(() => Vue.resource('/api/lsp/{lspId}/cc-payments'));
