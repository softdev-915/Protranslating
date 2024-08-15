import IpInput from '../components/ip-input.vue';
import IpCardSection from '../components/ip-card-section.vue';

export default {
  props: {
    value: {
      type: String,
      value: '',
    },
  },
  components: {
    IpCardSection,
    IpInput,
  },
  data() {
    return {
      patentNumber: '',
    };
  },
  watch: {
    patentNumber() {
      this.$emit('input', this.patentNumber);
    },
  },
};
