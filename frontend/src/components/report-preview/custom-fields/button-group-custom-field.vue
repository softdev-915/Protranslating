<template>
  <div class="row align-items-center">
    <div class="col-6">
      <label>
        <span v-if="isRequired" class="pts-required-field">*</span>
        {{ labelText }}
      </label>
    </div>
    <div class="col-6">
      <show-hide-toggle
        v-if="canHideField"
        :is-hidden="isHidden"
        @click.native="toggleIsHidden"
      />
    </div>
    <div :class="dangerClass" class="col-12">
      <div class="btn-group mb-3" :data-e2e-type="e2eType" :name="templateKey">
        <button
          type="button"
          class="btn btn-group-option"
          v-for="option in formattedOptions"
          :key="option.value"
          :class="{ selected: value === option.value }"
          :disabled="isDisable"
          @click="onOptionSelect(option.value)">{{ option.text }}</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="./button-group-custom-field.scss" scoped></style>
<script src="./button-group-custom-field.js"></script>
