<template>
  <div class="ip-popup" :tabindex="tabindex" @blur="close">
    <div class="ip-popup__title" @click="toggle">
      <span>Actions</span>
      <i class="fas fa-sort-down" />
    </div>
    <transition name="fade-anim">
      <div v-show="opened" class="ip-popup__items">
        <slot />
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'IpPopup',
  props: {
    tabindex: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      opened: false,
    };
  },
  methods: {
    toggle() {
      this.opened = !this.opened;
    },
    close() {
      this.opened = false;
    },
  },
};
</script>

<style lang="scss" src='./ip-popup.scss'></style>
