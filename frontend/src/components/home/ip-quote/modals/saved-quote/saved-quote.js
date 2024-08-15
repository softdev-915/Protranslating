import IpModal from '../../components/ip-modal.vue';

export default {
  props: {
    requestNumber: {
      type: String,
      required: true,
    },
    requestId: {
      type: String,
      required: true,
    },
    ipType: {
      type: String,
      default: 'Quote',
    },
    isNew: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    IpModal,
  },
  data: () => ({
    isShow: true,
  }),
  watch: {
    isShow(val) {
      if (!val) {
        const name = this.ipType === 'Quote' ? 'ip-quote-dashboard' : 'ip-order-dashboard';
        this.$router.push({ name }).catch((err) => { console.log(err); });
      }
    },
  },
  computed: {
    modalTitle() {
      return `${this.ipType} ${this.isNew ? 'Saved' : 'Updated'}!`;
    },
    modalDescription() {
      return `${this.ipType} ${this.isNew ? 'created' : 'updated'} successfully!`;
    },
  },
  methods: {
    onQuoteDetailEnter() {
      const routes = {
        Order: 'request-edition',
        Quote: 'quote-quote-detail',
      };
      this.$router.push({
        name: routes[this.ipType],
        params: { requestId: this.requestId },
      }).catch((err) => { console.log(err); });
    },
  },
};
