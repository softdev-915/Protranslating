<template>
  <span ref="segmentContainer">
    <span
      ref="segment"
      contenteditable="true"
      :data-e2e-type="dataE2eType"
      :class="['segment', { 'segment-active': isActive }]"
      @keydown="onKeyDown"
      @focus="onFocus"
      @input="onInput"
      @click="onClick"
    >{{text}} </span>
    <suggestion-dropdown
      v-if="canShowSuggestions"
      :settings="settings"
      :source="sourceSegment"
      :prefix="prefix"
      :coords="caretCoords"
      @input="onSuggestionInput"
      @set-mt-node="setMtNode"
      :suggestion-models="suggestionModels"
    />
  </span>
</template>


<script src="./segment.js"></script>
<style scoped lang="scss" src="./segment.scss"></style>
