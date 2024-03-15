<template>
  <div class="row">
    <div v-if="!isTranslationCompleted || !isSegmentsActive" class="col-12">
      <editor-view
        :text="text"
        :translate="getTranslation"
        :settings="settings"
        :active-segment="activeSegment"
        :is-segmentation-completed="isSegmentationCompleted"
        :is-segmentation-loading="isSegmentationLoading"
        :is-translation-loading="isTranslationLoading"
        :is-translation-completed="isTranslationCompleted"
        :segmented-text="segmentedText"
        :translated-text="translatedText"
        :isDisabled="isSourceDisabled"
        :suggestion-models="suggestionModels"
        @input="onInput"
        @select-segment="selectSegment"
        @translation-input="changeTranslatedSegment"
        @suggestion-input="suggestionInput"
        @source-input="sourceInput"
        @set-mt-node="setMtNode"
      />
    </div>
    <div v-else class="col-12">
      <segment-view
        :text="text"
        :settings="settings"
        :active-segment="activeSegment"
        :segmented-text="segmentedText"
        :is-translation-completed="isTranslationCompleted"
        :translated-text="translatedText"
        :suggestion-models="suggestionModels"
        :translate="getTranslation"
        @translation-input="changeTranslatedSegment"
        @suggestion-input="suggestionInput"
        @select-segment="selectSegment"
        @source-input="sourceInput"
        @set-mt-node="setMtNode"
      />
    </div>
    <div id="suggestion-dropdown" />
  </div>
</template>

<script src="./mt-translator-editor.js"></script>
