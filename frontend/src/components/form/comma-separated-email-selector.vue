<template>
  <div :class="{ 'has-danger': !isValid }">
    <input
      class="form-control"
      v-model="inputValue"
      :disabled="readOnly"
      :class="{ 'form-control-danger': !isValid }"
      type="text" >
  </div>
</template>

<script src="./comma-separated-email-selector.js"></script>