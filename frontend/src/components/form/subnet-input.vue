<template>
  <div class="form-group p-0 m-0" :class="{ 'has-danger': !isValid }">
    <input
      :disabled="disabled"
      data-e2e-type="subnet-input"
      type="text"
      class="form-control"
      v-model.trim="ip"
      placeholder="Subnet Mask"
      aria-label="Subnet description" />
  </div>
</template>

<script src="./subnet-input.js"></script>
