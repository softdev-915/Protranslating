import IpModal from '../../../ip-quote/components/ip-modal.vue';
import IpButton from '../../../ip-quote/components/ip-button.vue/ip-button.vue';

export default {
  components: {
    IpModal,
    IpButton,
  },
  data() {
    return {
      isOpened: false,
    };
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    dataE2eType: {
      type: String,
      default: 'ip-modal-overlay',
    },
    modalType: {
      type: String,
      default: 'counts',
    },
    width: {
      type: String,
      default: '700',
    },
    height: {
      type: String,
      default: '355',
    },
  },
  watch: {
    value() {
      this.isOpened = this.value;
    },
  },
  methods: {
    confirm() {
      this.$emit('confirm');
    },
    cancel() {
      this.isOpened = false;
      this.$emit('cancel');
    },
  },
};

