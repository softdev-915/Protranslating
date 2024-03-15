<template>
  <div :class="{'has-danger': !isValid}">
    <input
      :disabled="disabled"
      :data-e2e-type="dataE2eType"
      type="text"
      class="form-control"
      v-model="humanIntervalString"
    >
  </div>
</template>

<script src="./human-interval-input.js"></script>
