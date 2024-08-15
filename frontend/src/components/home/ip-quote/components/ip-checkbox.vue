<template>
  <div class="form-check checkbox" :class="className">
    <input
      class="form-check-input checkbox__input"
      type="checkbox"
      :id="id"
      :checked="value"
      @input="onInput"
    />
    <label class="form-check-label checkbox__label" :data-e2e-type='dataE2eType' :for="id">
      <img v-if="img" :src="img" />
      <span>{{ label }}</span>
    </label>
  </div>
</template>

<script>
export default {
  name: 'IpCheckbox',
  props: {
    id: {
      type: String,
      default: 'ipCheckbox',
    },
    label: {
      type: String,
      default: '',
    },
    img: {},
    value: {
      type: Boolean,
      default: false,
    },
    className: {
      type: String,
      default: '',
    },
    dataE2eType: {
      type: String,
      default: '',
    },
  },
  methods: {
    onInput() {
      this.$emit('input', !this.value);
    },
  },
};
</script>

<style lang="scss" scoped src='./ip-checkbox.scss'></style>
