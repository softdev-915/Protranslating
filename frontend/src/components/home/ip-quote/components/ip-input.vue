<template>
  <div class="ip-input" :class="{ 'ip-danger': !isValid, disabled }" :data-e2e-type="`${dataE2eType}-container`">
    <input
      :type="type"
      min="0"
      step="1"
      :id="dataE2eType"
      :data-e2e-type="dataE2eType"
      :disabled="disabled"
      :placeholder="placeholder"
      :value="value"
      @input="onInput"
      @change="onChange"
    />
    <label :for="dataE2eType">{{ placeholder }}</label>
  </div>
</template>

<script>
export default {
  name: 'IpInput',
  props: {
    type: {
      type: String,
      default: 'text',
    },
    required: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: '',
    },
    'data-e2e-type': {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    isValueValid: {
      type: Boolean,
      default: true,
    },
    value: {},
  },
  computed: {
    isValid() {
      if (this.required) return this.value && this.value !== 0;
      return this.isValueValid;
    },
  },
  methods: {
    onInput($event) {
      this.$emit('input', this.format($event.target.value));
    },
    onChange() {
      this.$emit('change');
    },
    format(value) {
      if (this.type === 'number') {
        return +value;
      }
      return value;
    },
  },
};
</script>

<style lang="scss" scoped src='./ip-input.scss'></style>
