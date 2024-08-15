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
        class="text-editor-custom-field w-100"
        :data-e2e-type="e2eType">
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
  </div>
</template>
<script>
import TextEditorCustomField from '../../../report-preview/custom-fields/text-editor-custom-field.vue';

export default {
  extends: TextEditorCustomField,
};
</script>
