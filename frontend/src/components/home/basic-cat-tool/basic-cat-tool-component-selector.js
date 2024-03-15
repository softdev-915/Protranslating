export default {
  props: {
    value: String,
    components: {
      type: Array,
    },
    right: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    selectComponents(c) {
      if (c !== this.value) {
        this.$emit('select-component', c);
      }
    },
  },
};
