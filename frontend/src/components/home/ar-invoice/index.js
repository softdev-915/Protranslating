import InvoiceSection from './ar-invoice-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';

export default {
  mixins: [userRoleCheckMixin],
  components: {
    InvoiceSection,
    SectionContainer,
  },
  computed: {
    canRead() {
      return this.hasRole({ oneOf: ['INVOICE_READ_ALL', 'INVOICE_READ_OWN', 'INVOICE_READ_COMPANY'] });
    },
  },
};
