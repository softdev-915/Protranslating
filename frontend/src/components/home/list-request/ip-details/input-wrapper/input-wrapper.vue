<template>
  <div class="d-flex">
    <input
      :data-e2e-type="dataE2eType"
      :disabled="disabled"
      :type="type"
      class="form-control"
      :value="prepareDisplayValue(value)"
      :placeholder="placeholder"
      @input="updateInput"
      @keyup.enter="$emit('enter', $event.target.value)"
    />
  </div>
</template>

<script src="./input-wrapper.js"></script>
