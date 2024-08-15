<template>
  <label class="ip-radio-button align-items-center" :class="{'checked-borders': checked }" >
    <input type="radio" v-on:click="onChange" :checked="checked" :name="name" :data-e2e-type="dataE2eType">
    <span class="checkmark"></span>
    <span class="ml-3">
      <slot></slot> <!-- labeltext -->
    </span>
  </label>
</template>

<script src="./ip-radio-button.js"></script>
<style src="./ip-radio-button.scss" lang="scss" scoped></style>
