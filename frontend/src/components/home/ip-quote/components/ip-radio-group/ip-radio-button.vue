<template>
  <label class="radio" :data-e2e-type="label">
    <input
      type="radio"
      :value="label"
      :name="name"
      v-model="radioButtonValue"
    />
    <span>{{ label }}</span>
  </label>
</template>
<style src="./ip-radio-button.scss" lang="scss" scoped></style>
<script src="./ip-radio-button.js"></script>
