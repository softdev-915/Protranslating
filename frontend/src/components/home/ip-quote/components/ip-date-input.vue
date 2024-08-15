<template>
  <div class="date-input" :class="{ 'ip-danger': !isValid }" :data-e2e-type="`${dataE2eType}-container`">
    <utc-flatpickr
      :id="dataE2eType"
      :data-e2e-type="dataE2eType"
      :placeholder="placeholder"
      :value="value"
      @input="onInput"
    />
    <label :for="dataE2eType">{{ placeholder }}</label>
    <i class="date-input__icon fas fa-calendar"></i>
  </div>
</template>

<script src="./ip-date-input.js"></script>
<style src="./ip-date-input.scss" lang="scss" scoped></style>
