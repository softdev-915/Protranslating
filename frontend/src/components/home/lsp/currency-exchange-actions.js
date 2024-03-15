export default {
  props: {
    index: {
      type: Number,
    },
    shouldDisableCurrency: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    addExchange() {
      this.$emit('exchange-add', this.index);
    },
    deleteExchange() {
      this.$emit('exchange-delete', this.index);
    },
  },
};
