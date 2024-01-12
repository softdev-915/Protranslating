<template>
  <div class="popover" :style="popoverStyle" v-show="showPopover" ref="popover">
    <slot></slot>
  </div>
</template>

<script src="./popover.js"></script>
<style scoped lang="scss" src="./popover.scss"></style>
