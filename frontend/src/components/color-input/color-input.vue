<template>
  <div class="color-input">
    <div class="color-picker">
      <sketch v-model="selectedColor" v-show="colorSelectorWindow === 'advanced'"></sketch>
      <swatches v-model="selectedColor" v-show="colorSelectorWindow === 'simple'"></swatches>
    </div>
  </div>
</template>

<script src="./color-input.js"></script>
<style scoped src="./color-input.scss" lang="scss"></style>
