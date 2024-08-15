export default {
  name: 'v-tab',
  props: {
    tabs: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      activeIndex: 0,
    };
  },
  created() {
    this.$emit('input', this.tabs[0]);
  },
  methods: {
    selectTab(index) {
      this.activeIndex = index;
      this.$emit('input', this.tabs[index]);
    },
  },
};
