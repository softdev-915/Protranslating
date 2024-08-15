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
      <div :class="dangerClass" class="w-100">
        <input
          v-model="valueModel"
          v-validate="validateRules"
          :data-e2e-type="e2eType"
          :name="templateKey"
          :placeholder="placeholderText"
          :disabled="isDisable"
          class="form-control"
        />
      </div>
    </div>
  </div>
</template>
<script>
import InputCustomField from '../../../report-preview/custom-fields/input-custom-field.vue';

export default {
  extends: InputCustomField,
};
</script>
