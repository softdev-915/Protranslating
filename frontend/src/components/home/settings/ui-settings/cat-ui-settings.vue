<template>
  <div>
    <div class="row">
      <div class="col-6">
        <h3 data-e2e-type="cat-ui-setting-title">CAT</h3>
      </div>
      <div class="col-6">
        <h6>Color input selector</h6>
        <input type="radio" v-model="colorInputSelector" value="advanced" id="advanced" />
        <label for="advanced">Advanced</label>
        <input type="radio" v-model="colorInputSelector" value="simple" id="simple" />
        <label for="simple">Simple</label>
      </div>
    </div>
    <div class="row">
      <div data-e2e-type="inline-user-tags-color" class="col-3 d-flex align-items-justify color-section">
        <label class="mr-4">Inline User Tags:</label>
        <div @click="toggleColorPicker('inlineUserTags')" class="selected-color" v-bind:style="{ backgroundColor: value.inlineUserTags.color }"></div>
        <color-input
          v-if="visibleColorPicker === 'inlineUserTags'"
          :colorSelectorWindow="colorInputSelector"
          :value="value.inlineUserTags.color"
          @input="update('inlineUserTags.color', $event)" />
      </div>
      <div data-e2e-type="inline-system-tags-color" class="col-3 d-flex align-items-justify color-section">
        <label class="mr-4">Inline System Tags:</label>
        <div @click="toggleColorPicker('inlineSystemTags')" class="selected-color" v-bind:style="{ backgroundColor: value.inlineSystemTags.color }"></div>
        <color-input
          v-if="visibleColorPicker === 'inlineSystemTags'"
          :colorSelectorWindow="colorInputSelector"
          :value="value.inlineSystemTags.color"
          @input="update('inlineSystemTags.color', $event)" />
      </div>
    </div>
    <div class="row">
      <div data-e2e-type="qa-error-messages-color" class="col-3 d-flex align-items-justify color-section">
        <label class="mr-4">QA Error Messages:</label>
        <div @click="toggleColorPicker('qaErrorMessages')" class="selected-color" v-bind:style="{ backgroundColor: value.qaErrorMessages.color }"></div>
        <color-input
          v-if="visibleColorPicker === 'qaErrorMessages'"
          :colorSelectorWindow="colorInputSelector"
          :value="value.qaErrorMessages.color"
          @input="update('qaErrorMessages.color', $event)" />
      </div>
      <div data-e2e-type="qa-warning-messages-color" class="col-3 d-flex align-items-justify color-section">
        <label class="mr-4">QA Warning Messages:</label>
        <div @click="toggleColorPicker('qaWarningMessages')" class="selected-color" v-bind:style="{ backgroundColor: value.qaWarningMessages.color }"></div>
        <color-input
          v-if="visibleColorPicker === 'qaWarningMessages'"
          :colorSelectorWindow="colorInputSelector"
          :value="value.qaWarningMessages.color"
          @input="update('qaWarningMessages.color', $event)" />
      </div>
    </div>
  </div>
</template>

<script src="./cat-ui-settings.js"></script>
<style scoped src="./cat-ui-settings.scss" lang="scss"></style>