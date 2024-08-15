import IpSelect from '../ip-quote/components/ip-select.vue';
import ContactService from '../../../services/contact-service';

const contactService = new ContactService();

export default {
  components: {
    IpSelect,
  },
  data() {
    return {
      selectedContact: {
        _id: '', firstName: '', lastName: '', email: '',
      },
      options: [],
    };
  },
  props: {
    value: {
      type: Object,
    },
    companyId: {
      type: String,
      required: true,
    },
    placeholder: String,
    dataE2eType: String,
    filter: {
      type: Function,
      default: () => {},
    },
  },
  async created() {
    const { data: { list = [] } = {} } = await contactService.retrieve(this.companyId);
    const contactUsers = list.map((contact) => ({ ...contact, name: `${contact.firstName} ${contact.lastName}` }));
    this.options = contactUsers.filter(this.filter);
  },
  watch: {
    value() {
      this.selectedContact = this.value;
    },
    selectedContact() {
      this.$emit('input', this.selectedContact);
    },
  },
};
