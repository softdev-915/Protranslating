import IpModal from '../../components/ip-modal.vue';
import IpButton from '../../components/ip-button.vue/ip-button.vue';

export default {
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isOpened: false,
    };
  },
  components: {
    IpModal,
    IpButton,
  },
  watch: {
    value() {
      this.isOpened = this.value;
    },
    isOpened() {
      this.$emit('input', this.isOpened);
    },
  },
  methods: {
    onDiscard() {
      this.$emit('discarded');
    },
  },
};
