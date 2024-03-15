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
        <basic-select
          :data-e2e-type="e2eType"
          :name="templateKey"
          :options="formattedOptions"
          :selected-option="valueModel"
          :isDisabled="isDisable"
          @select="onOptionSelect">
        </basic-select>
      </div>
    </div>
  </div>
</template>
<script>
import DropdownCustomField from '../../../report-preview/custom-fields/dropdown-custom-field.vue';

export default {
  extends: DropdownCustomField,
};
</script>
