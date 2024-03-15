import { Swatches, Sketch } from 'vue-color';

export default {
  components: {
    Swatches,
    Sketch,
  },
  data() {
    return {
      selectedColor: {
        hex: '',
      },
    };
  },
  props: {
    value: String,
    colorSelectorWindow: String,
  },
  created() {
    this.selectedColor.hex = this.value;
  },
  watch: {
    selectedColor(newValue) {
      this.$emit('input', newValue.hex);
      this.isColorPickerVisible = false;
    },
  },
};
