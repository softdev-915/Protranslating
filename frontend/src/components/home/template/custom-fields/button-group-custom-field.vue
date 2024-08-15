<template>
  <div class="row align-items-center">
    <div class="col-3">
      <label>
        <span v-if="isRequired" class="pts-required-field">*</span>
        {{ labelText }}
      </label>
    </div>
    <div class="col-9 d-flex align-items-end flex-column">
      <show-hide-toggle
        v-if="canHideField"
        :is-hidden="isHidden"
        @click.native="toggleIsHidden"
      />
      <div
        :class="dangerClass"
        class="btn-group w-100"
        :data-e2e-type="e2eType"
        :name="templateKey"
      >
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
<script>
import ButtonGroupCustomField from '../../../report-preview/custom-fields/button-group-custom-field.vue';

export default {
  extends: ButtonGroupCustomField,
};
</script>
