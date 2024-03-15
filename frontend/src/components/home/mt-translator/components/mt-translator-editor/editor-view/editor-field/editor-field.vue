<template>
  <div class="editor-field-container">
    <div v-if="isLoading" class="form-control editor-field"><i class="fas fa-spinner fa-pulse fa-fw"></i></div>
    <div
      v-else
      :key="segments.length"
      :data-e2e-type="`mt-translator-${e2eType}-field`"
      class="form-control editor-field"
      ref="editor-field"
      @keydown="onKeyDown"
      @input="onInput"
      @click="updateCaretPos"
      :contenteditable="isActive"
    >
      <span
        v-for="(segmentText, index) in segments"
        :key="index+segmentText"
        :data-index="index"
        @click="selectSegment(index)"
        :data-e2e-type="`${e2eType}-field-segment`"
        :class="{
          'segment-active': activeSegment === index,
        }"
      >{{segmentText}} </span>
    </div>
    <suggestion-dropdown-mounter
      v-if="isDropdownDisplayed"
      :settings="settings"
      :source="sourceSegments[activeSegment]"
      :prefix="prefix"
      :coords="caretCoords"
      @input="onSuggestionInput"
      @close="onDropdownClose"
      @set-mt-node="setMtNode"
      :suggestion-models="suggestionModels"
      render-id="suggestion-dropdown"
    />
  </div>
</template>

<style scoped lang="scss" src="./editor-field.scss"></style>
<script src="./editor-field.js"></script>
