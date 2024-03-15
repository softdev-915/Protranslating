<template>
  <div
    class="ip-modal__overlay"
    :data-e2e-type="dataE2eType"
    :class="{ 'ip-modal__overlay_visible': value }"
  >
    <div class="ip-modal__window" :style="styles">
      <div class="window__header">
        <slot name="header"></slot>
        <i
          v-show="closeIcon"
          class="fas fa-times window__close"
          data-e2e-type="ip-modal-close-button"
          @mousedown="close"
        />
      </div>
      <div class="window__body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'IpModal',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    width: {
      type: String,
      default: '',
    },
    height: {
      type: String,
      default: '',
    },
    marginTop: {
      type: String,
      default: '285px',
    },
    closeIcon: {
      type: Boolean,
      default: true,
    },
    dataE2eType: {
      type: String,
      default: 'ip-modal-overlay',
    },
  },
  computed: {
    styles() {
      return [
        { width: this.width },
        { height: this.height },
        { 'margin-top': this.marginTop },
      ];
    },
  },
  methods: {
    close() {
      this.$emit('input', !this.value);
    },
  },
};
</script>

<style lang="scss" scoped src='./ip-modal.scss'></style>
