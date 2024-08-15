<template>
  <div class="suggestion-dropdown" data-e2e-type="suggestion-dropdown" ref="dropdown" :style="`top: ${coords.y}px;left:${coords.x}px;`">
    <div v-if="isLoading" data-e2e-type="suggestion-dropdown-loader" class="justify-content-center align-items-center d-flex loader-container"><i class="fas fa-spinner fa-pulse fa-fw"></i></div>
    <div v-else
         v-for="(suggestion, i) in allSuggestions"
         :key="`${i}_${suggestion.modelType}`"
         class="suggestion-group"
         :data-e2e-type="suggestion.e2eType"
         :title="suggestion.name">
      <div
        v-for="(suggestionText, k) in suggestion.suggestions"
        :key="`${i}_${k}`"
        :class="['suggestion-text', { 'suggestion-text-selected': selectedSuggestion.model === suggestion.modelType && k === selectedSuggestion.index }]"
        @click="selectSuggestion(suggestion.modelType, k)"
        data-e2e-type="suggestion-variant"
      >
        {{suggestionText}}
      </div>
    </div>
  </div>
</template>

<script src="./suggestion-dropdown.js"></script>
<style scoped lang="scss" src="./suggestion-dropdown.scss"></style>
