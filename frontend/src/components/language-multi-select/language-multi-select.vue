<template>
  <div class="col-12" :class="{'blur-loading-row': loading}">
    <multi-select
      ref="multiSelect"
      :options="languageOptions"
      :selected-options="selectedLanguages"
      :placeholder="placeholder"
      :is-disabled="isDisabled"
      :non-removable-values="nonRemovableValues"
      @restricted-option-removal="() => $emit('restricted-option-removal')"
      title="Language list"
      :custom-filtered-options="customFilteredOptions"
      @click.native="retrieveOptions"
      @select="onLanguageSelected">
    </multi-select>
  </div>
</template>

<script src="./language-multi-select.js"></script>
