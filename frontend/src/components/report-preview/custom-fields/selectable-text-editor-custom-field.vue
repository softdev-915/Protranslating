<template>
  <div class="row align-items-center" :data-e2e-type="e2eType">
    <div class="col-12">
      <div class="row align-items-center">
        <div class="col-6">
          <label>
            <span v-if="isRequired" class="pts-required-field">*</span>
            {{ labelText }} Type
          </label>
        </div>
        <div class="col-6">
          <show-hide-toggle
            v-if="canHideField"
            :is-hidden="isHidden"
            @click.native="toggleIsHidden"
          />
        </div>
        <div :class="{ 'has-danger': !isValidSelect }" class="col-12">
          <basic-select
            data-e2e-type="selectable-text-editor-select"
            :name="`${templateKey}-select`"
            :options="selectorOptions"
            :selected-option="selectedType"
            :isDisabled="isDisable"
            @select="onOptionSelect"
          />
        </div>
      </div>
    </div>
    <div class="col-12">
      <div class="row align-items-center">
        <div class="col-6">
          <label>
            <span v-if="isRequired" class="pts-required-field">*</span>
            {{ labelText }} Text
          </label>
        </div>
        <div
          :class="{ 'has-danger': !isValidText }"
          class="col-12 text-editor-custom-field"
          data-e2e-type="selectable-text-editor-editor"
        >
          <rich-text-editor
            @input="onEditorInput"
            :name="`${templateKey}-text`"
            :value="this.valueModel.value"
            v-validate="validateRules"
            :placeholder="placeholderText"
            :options="editorOptions"
            :toolbar="editorToolbar"
            :disabled="isDisabledTextEditor || isHidden"
            data-e2e-type="rich-text-editor"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script src="./selectable-text-editor-custom-field.js"></script>
<style lang="scss" src="./rich-text-editor.scss"></style>
