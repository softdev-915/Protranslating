<template>
  <div class="row align-items-center">
    <div v-if="subtitle" class="col-12 mt-4 mb-2 subtitle">
      <h6>{{subtitle}}</h6>
    </div>
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
</template>
<script src="./dropdown-custom-field.js"></script>
