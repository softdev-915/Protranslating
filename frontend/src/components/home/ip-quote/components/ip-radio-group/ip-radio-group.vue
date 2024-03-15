<template>
  <div class="d-flex flex-column">
    <radio-button
      v-for="(option, index) in options"
      :key="`${id}-button-${index}`"
      :name="id.toString()"
      :label="option"
      :value="selectedValue"
      @change="changeValue"
    />
  </div>
</template>
<script src="./ip-radio-group.js"></script>
