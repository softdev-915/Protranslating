<template>
  <div class="ip-button" :class="[
    buttonClass, { 'ip-disabled': disabled }
  ]">
    <slot></slot>
  </div>
</template>

<script src="./ip-button.js"></script>
<style src="./ip-button.scss" lang="scss" scoped></style>
