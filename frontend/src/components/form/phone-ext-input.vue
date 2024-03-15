<template>
  <div :class="{ 'has-danger': errors.has(name) }">
    <input
      v-bind="customProps"
      v-on="customListeners"
      class="form-control"
      type="text"
      placeholder="+999"
      v-validate="'phone-ext-validator'"
      v-model="phoneExt">
    <span class="form-control-feedback" v-if="errors.has(name)">Phone extension doesn't meet the required format</span>
  </div>
</template>

<script src="./phone-ext-input.js"></script>
