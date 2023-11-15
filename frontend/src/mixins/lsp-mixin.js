import { mapGetters } from 'vuex';

export const lspMixin = {
  computed: {
    ...mapGetters('app', ['lsp']),
    isBlsLsp() {
      return this.lsp.name === 'Big Language Solutions';
    },
    isPtiLsp() {
      return this.lsp.name === 'PTI';
    },
  },
};
