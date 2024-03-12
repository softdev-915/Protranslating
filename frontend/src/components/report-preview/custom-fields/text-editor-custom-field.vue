<template>
  <div class="row align-items-center mt-3">
    <div class="col-6">
      <label class="custom-field-label">
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
    <div
      :class="dangerClass"
      class="col-12 text-editor-custom-field"
      :data-e2e-type="e2eType"
    >
      <rich-text-editor
        :name="templateKey"
        v-model.trim="valueModel"
        v-validate="validateRules"
        :placeholder="placeholderText"
        :options="editorOptions"
        :toolbar="editorToolbar"
        :disabled="isDisable"
        data-e2e-type="rich-text-editor"
      />
    </div>
  </div>
</template>
<script src="./text-editor-custom-field.js"></script>
<style lang="scss" src="./rich-text-editor.scss"></style>
