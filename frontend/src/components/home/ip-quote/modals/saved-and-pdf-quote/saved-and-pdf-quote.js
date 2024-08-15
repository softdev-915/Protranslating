import IpModal from '../../components/ip-modal.vue';
import IpButton from '../../components/ip-button.vue/ip-button.vue';

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
  },
  components: {
    IpModal,
    IpButton,
  },
  data: () => ({
    isShow: true,
  }),
  methods: {
    onClose() {
      this.$emit('modal-closed');
    },
  },
};
