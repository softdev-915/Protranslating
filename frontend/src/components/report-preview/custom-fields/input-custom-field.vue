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
      <input
        v-model="valueModel"
        v-validate="validateRules"
        :data-e2e-type="e2eType"
        :name="templateKey"
        :disabled="isDisable"
        :placeholder="placeholderText"
        class="form-control"
      />
    </div>
  </div>
</template>
<script src="./input-custom-field.js"></script>
<style scoped lang="scss" src="./input-custom-field.scss"></style>