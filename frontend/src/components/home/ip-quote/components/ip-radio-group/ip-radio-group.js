import RadioButton from './ip-radio-button.vue';

export default {
  props: {
    id: {
      type: Number,
      default: 1,
    },
    options: {
      type: Array,
      default: () => [
        'Label',
        'Label 2',
      ],
    },
    selectedValue: {
      type: String,
    },
  },
  components: {
    RadioButton,
  },
  methods: {
    changeValue(newValue) {
      this.$emit('on-change', this.id, newValue);
    },
  },
};
